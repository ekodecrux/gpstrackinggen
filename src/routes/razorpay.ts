// ============================================================
// RAZORPAY PAYMENT INTEGRATION — TrackSchool
// ============================================================
// POST /api/pay/order          — create Razorpay order
// POST /api/pay/verify         — verify payment signature
// POST /api/pay/webhook        — Razorpay webhook handler
// GET  /api/pay/plans          — get subscription plans
// POST /api/pay/subscription   — create subscription order
// GET  /api/pay/history/:tenantId — payment history
// ============================================================

import { Hono } from 'hono'

type Bindings = {
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
}

const pay = new Hono<{ Bindings: Bindings }>()

// ── In-memory payment records ─────────────────────────────────
const paymentRecords: any[] = []
const subscriptions: Record<string, any> = {}

// ── HMAC-SHA256 signature verifier (Web Crypto API) ──────────
async function hmacSHA256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Razorpay API helper ───────────────────────────────────────
async function rzpRequest(
  keyId: string, keySecret: string,
  method: string, path: string, body?: any
) {
  const auth = btoa(`${keyId}:${keySecret}`)
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.error?.description || `Razorpay error ${res.status}`)
  return data
}

// ── PLANS ─────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    pricePerBus: 299,
    maxBuses: 5,
    color: '#42a5f5',
    features: ['Up to 5 buses', 'Live GPS tracking', 'Parent SMS alerts', 'Basic reports', 'Email support'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    pricePerBus: 249,
    maxBuses: 20,
    color: '#1a73e8',
    features: ['Up to 20 buses', 'Live GPS tracking', 'Parent SMS & OTP', 'Advanced reports', 'AI route optimizer', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    pricePerBus: 199,
    maxBuses: 999,
    color: '#0d47a1',
    features: ['Unlimited buses', 'All Growth features', 'Custom ERP integration', 'Dedicated account manager', 'SLA 99.9%', 'White-label option'],
    popular: false,
  },
]

pay.get('/plans', (c) => c.json({ success: true, data: PLANS }))

// ── CREATE ORDER ──────────────────────────────────────────────
// POST /api/pay/order
// Body: { amount (paise), currency, invoiceId, tenantId, description }
pay.post('/order', async (c) => {
  const { keyId, keySecret } = { keyId: c.env.RAZORPAY_KEY_ID, keySecret: c.env.RAZORPAY_KEY_SECRET }
  if (!keyId || !keySecret) return c.json({ success: false, error: 'Razorpay credentials not configured' }, 500)

  try {
    const body = await c.req.json()
    const { amount, currency = 'INR', invoiceId, tenantId, description, planId, buses } = body

    if (!amount || amount < 100) return c.json({ success: false, error: 'Amount must be at least ₹1 (100 paise)' }, 400)

    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const order = await rzpRequest(keyId, keySecret, 'POST', '/orders', {
      amount: Math.round(amount),   // amount in paise
      currency,
      receipt: receiptId,
      notes: {
        invoiceId: invoiceId || '',
        tenantId: tenantId || '',
        planId: planId || '',
        description: description || 'TrackSchool subscription',
      },
    })

    // Store pending payment record
    paymentRecords.push({
      orderId: order.id,
      receiptId,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      invoiceId,
      tenantId,
      planId,
      buses,
      description,
      createdAt: new Date().toISOString(),
    })

    return c.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: receiptId,
      },
      keyId,    // safe to return (public key)
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── VERIFY PAYMENT ────────────────────────────────────────────
// POST /api/pay/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, tenantId }
pay.post('/verify', async (c) => {
  const keySecret = c.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return c.json({ success: false, error: 'Razorpay not configured' }, 500)

  try {
    const body = await c.req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, tenantId, planId, buses } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json({ success: false, error: 'Missing payment fields' }, 400)
    }

    // Verify signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSig = await hmacSHA256(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`)

    if (expectedSig !== razorpay_signature) {
      return c.json({ success: false, error: 'Payment signature verification failed. Possible tamper attempt.' }, 400)
    }

    // Update payment record
    const record = paymentRecords.find(p => p.orderId === razorpay_order_id)
    if (record) {
      record.paymentId = razorpay_payment_id
      record.signature = razorpay_signature
      record.status = 'paid'
      record.paidAt = new Date().toISOString()
    } else {
      paymentRecords.push({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: 'paid',
        invoiceId, tenantId, planId, buses,
        paidAt: new Date().toISOString(),
      })
    }

    // Update subscription record
    if (tenantId && planId) {
      subscriptions[tenantId] = {
        plan: planId,
        buses: buses || 1,
        status: 'active',
        paymentId: razorpay_payment_id,
        activatedAt: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }
    }

    return c.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      status: 'paid',
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── WEBHOOK HANDLER ───────────────────────────────────────────
// POST /api/pay/webhook
// Razorpay sends events: payment.captured, payment.failed, subscription.charged etc.
pay.post('/webhook', async (c) => {
  const webhookSecret = c.env.RAZORPAY_KEY_SECRET  // use key secret as webhook secret for test
  const body = await c.req.text()
  const sig = c.req.header('x-razorpay-signature') || ''

  try {
    // Verify webhook signature
    const expectedSig = await hmacSHA256(webhookSecret, body)
    if (sig && expectedSig !== sig) {
      return c.json({ success: false, error: 'Invalid webhook signature' }, 400)
    }

    const event = JSON.parse(body)
    const eventType = event.event

    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity
        const record = paymentRecords.find(p => p.orderId === payment?.order_id)
        if (record) { record.status = 'paid'; record.paymentId = payment?.id; record.capturedAt = new Date().toISOString() }
        console.log(`[Webhook] Payment captured: ${payment?.id} ₹${(payment?.amount || 0) / 100}`)
        break
      }
      case 'payment.failed': {
        const payment = event.payload?.payment?.entity
        const record = paymentRecords.find(p => p.orderId === payment?.order_id)
        if (record) { record.status = 'failed'; record.failReason = payment?.error_description }
        console.log(`[Webhook] Payment failed: ${payment?.id}`)
        break
      }
      case 'order.paid': {
        const order = event.payload?.order?.entity
        console.log(`[Webhook] Order paid: ${order?.id}`)
        break
      }
      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`)
    }

    return c.json({ success: true, received: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── SUBSCRIPTION STATUS ───────────────────────────────────────
pay.get('/subscription/:tenantId', (c) => {
  const sub = subscriptions[c.req.param('tenantId')]
  return c.json({ success: true, data: sub || null })
})

// ── PAYMENT HISTORY ───────────────────────────────────────────
pay.get('/history/:tenantId', (c) => {
  const tenantId = c.req.param('tenantId')
  const history = paymentRecords.filter(p => p.tenantId === tenantId)
  return c.json({ success: true, data: history, count: history.length })
})

// ── ALL PAYMENTS (SuperAdmin) ─────────────────────────────────
pay.get('/all', (c) => {
  return c.json({
    success: true,
    data: paymentRecords,
    count: paymentRecords.length,
    totalCollected: paymentRecords
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0) / 100, 0),
  })
})

// ── FETCH RAZORPAY PAYMENT DETAILS ───────────────────────────
pay.get('/payment/:paymentId', async (c) => {
  const { keyId, keySecret } = { keyId: c.env.RAZORPAY_KEY_ID, keySecret: c.env.RAZORPAY_KEY_SECRET }
  try {
    const data = await rzpRequest(keyId, keySecret, 'GET', `/payments/${c.req.param('paymentId')}`)
    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default pay
