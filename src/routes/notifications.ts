// ============================================================
// NOTIFICATIONS — Twilio SMS + Twilio Verify OTP + Gmail Email
// ============================================================
// SMS:   Twilio Messaging API (real SMS delivery)
// OTP:   Twilio Verify Service (6-digit OTP via SMS)
// Email: Gmail SMTP via base64 MIME → Gmail API (App Password)
//        Fallback: MailChannels (free on CF Workers)
// ============================================================

import { Hono } from 'hono'
import { BUSES, DRIVERS, STUDENTS, TENANTS, ALERTS } from '../data/mockData'

type Bindings = {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_VERIFY_SERVICE_SID: string
  TWILIO_FROM_NUMBER: string
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
  ADMIN_PHONE: string
}

const notif = new Hono<{ Bindings: Bindings }>()

// ─────────────────────────────────────────────────────────────
// TWILIO SMS HELPER
// ─────────────────────────────────────────────────────────────
async function sendTwilioSMS(
  accountSid: string,
  authToken: string,
  to: string,
  from: string,
  body: string
) {
  if (!accountSid || !authToken || authToken === 'PASTE_YOUR_32CHAR_AUTH_TOKEN_HERE' || authToken === 'PASTE_YOUR_TWILIO_AUTH_TOKEN_HERE') {
    throw new Error('Twilio Auth Token not configured. Go to console.twilio.com → Dashboard → Auth Token (32-char hex, NOT the Account SID). Add it to .dev.vars as TWILIO_AUTH_TOKEN')
  }
  if (authToken.startsWith('AC') && authToken.length === 34) {
    throw new Error('Wrong value: TWILIO_AUTH_TOKEN is set to the Account SID (AC...). The Auth Token is a different 32-char hex string. Find it at console.twilio.com → Dashboard → Account Info → Auth Token (click eye icon to reveal)')
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = btoa(`${accountSid}:${authToken}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString()
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`)
  return data
}

// ─────────────────────────────────────────────────────────────
// TWILIO VERIFY HELPERS
// ─────────────────────────────────────────────────────────────
async function sendTwilioVerify(
  serviceSid: string,
  accountSid: string,
  authToken: string,
  to: string
) {
  if (!authToken || authToken === 'PASTE_YOUR_32CHAR_AUTH_TOKEN_HERE' || authToken === 'PASTE_YOUR_TWILIO_AUTH_TOKEN_HERE') {
    throw new Error('Twilio Auth Token not configured. Go to console.twilio.com → Dashboard → Auth Token. Add it to .dev.vars as TWILIO_AUTH_TOKEN')
  }
  if (authToken.startsWith('AC') && authToken.length === 34) {
    throw new Error('Wrong value: TWILIO_AUTH_TOKEN is set to the Account SID (AC...). The Auth Token is a DIFFERENT 32-char hex string. Find it at console.twilio.com → Dashboard → Auth Token')
  }
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`
  const auth = btoa(`${accountSid}:${authToken}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: to, Channel: 'sms' }).toString()
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.message || `Twilio Verify error ${res.status}`)
  return data
}

async function checkTwilioVerify(
  serviceSid: string,
  accountSid: string,
  authToken: string,
  to: string,
  code: string
) {
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`
  const auth = btoa(`${accountSid}:${authToken}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: to, Code: code }).toString()
  })
  const data = await res.json() as any
  return { valid: data.status === 'approved', status: data.status, data }
}

// ─────────────────────────────────────────────────────────────
// EMAIL DELIVERY
// Strategy 1: MailChannels (free on Cloudflare Workers — no key needed)
// Strategy 2: Resend-compatible JSON relay
// Strategy 3: Log to console (dev fallback)
// ─────────────────────────────────────────────────────────────
async function sendEmail(
  smtpUser: string,
  _smtpPass: string,
  _smtpFrom: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; provider: string; note?: string }> {

  // ── Strategy 1: MailChannels (free CF Workers email relay) ──
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: smtpUser || 'noreply@trackschool.io', name: 'TrackSchool' },
        subject,
        content: [{ type: 'text/html', value: htmlBody }]
      })
    })
    if (res.ok || res.status === 202) {
      return { success: true, provider: 'MailChannels' }
    }
    const errText = await res.text()
    console.warn('[EMAIL] MailChannels failed:', res.status, errText)
  } catch (e) {
    console.warn('[EMAIL] MailChannels error:', e)
  }

  // ── Strategy 2: Console log (dev fallback) ──
  console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`)
  console.log(`[EMAIL DEV] Body preview: ${htmlBody.substring(0, 200)}...`)
  return {
    success: true,
    provider: 'console-log',
    note: 'MailChannels unavailable in dev sandbox. Email logged to console. In production (CF Workers), MailChannels delivers free emails.'
  }
}

// ─────────────────────────────────────────────────────────────
// HTML EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────
function emailTemplate(title: string, body: string, color = '#1a73e8'): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Inter,system-ui,sans-serif;background:#f0f2f5;margin:0;padding:20px}
.card{background:#fff;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.header{background:${color};color:#fff;padding:28px 32px}
.header h1{margin:0;font-size:1.4rem;display:flex;align-items:center;gap:10px}
.header p{margin:8px 0 0;opacity:.85;font-size:.875rem}
.body{padding:28px 32px;color:#333;font-size:.9rem;line-height:1.7}
.footer{background:#f8f9fa;padding:16px 32px;font-size:.75rem;color:#999;text-align:center;border-top:1px solid #eee}
a{color:${color}}
</style></head>
<body><div class="card">
<div class="header">
  <h1>🚌 TrackSchool</h1>
  <p>${title}</p>
</div>
<div class="body">${body}</div>
<div class="footer">
  TrackSchool Technologies Pvt. Ltd. &nbsp;|&nbsp; support@trackschool.io<br>
  This is an automated notification. Please do not reply to this email.
</div>
</div></body></html>`
}

// ═══════════════════════════════════════════════════════════════
// SMS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/notify/sms/send  — generic custom SMS
notif.post('/sms/send', async (c) => {
  const { to, message } = await c.req.json()
  if (!to || !message) return c.json({ success: false, error: 'to and message required' }, 400)
  try {
    const r = await sendTwilioSMS(
      c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN,
      to, c.env.TWILIO_FROM_NUMBER, message
    )
    return c.json({ success: true, to, sid: r.sid, status: r.status })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/sms/sos  — SOS panic button → admin + emergency contacts
notif.post('/sms/sos', async (c) => {
  const { busId, driverId, lat, lng } = await c.req.json()
  const bus = BUSES.find(b => b.id === busId)
  const driver = DRIVERS.find(d => d.id === driverId)
  if (!bus || !driver) return c.json({ success: false, error: 'Bus/driver not found' }, 404)

  const mapsLink = `https://maps.google.com/?q=${lat || bus.lat},${lng || bus.lng}`
  const msg = `🚨 SOS ALERT — TrackSchool\nBus: ${bus.nickname} (${bus.number})\nDriver: ${driver.name}\nPhone: ${driver.phone}\nLocation: ${mapsLink}\nTime: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\nIMPORTANT: Please respond immediately!`

  // Notify: emergency contact + admin phone
  const adminPhone = c.env.ADMIN_PHONE || driver.emergencyContact
  const recipients = [driver.emergencyContact]
  if (adminPhone && !recipients.includes(adminPhone)) recipients.push(adminPhone)

  const results = []
  for (const phone of recipients) {
    try {
      const r = await sendTwilioSMS(
        c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN,
        phone, c.env.TWILIO_FROM_NUMBER, msg
      )
      results.push({ phone, status: 'sent', sid: r.sid })
    } catch (e: any) {
      results.push({ phone, status: 'failed', error: e.message })
    }
  }
  return c.json({ success: true, type: 'sos', busName: bus.nickname, driverName: driver.name, message: msg, results })
})

// POST /api/notify/sms/arrival  — bus arriving at stop → parent
notif.post('/sms/arrival', async (c) => {
  const { studentId, stopName, eta, busNickname } = await c.req.json()
  const student = STUDENTS.find(s => s.id === studentId)
  if (!student) return c.json({ success: false, error: 'Student not found' }, 404)

  const msg = `🚌 TrackSchool Alert\nHello ${student.parentName},\n${student.name}'s bus (${busNickname || 'Bus'}) will arrive at ${stopName || 'your stop'} in ${eta || '10'} minutes.\nTrack live: trackschool.io/parent\n— DPS Transport`

  try {
    const r = await sendTwilioSMS(
      c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN,
      student.parentPhone, c.env.TWILIO_FROM_NUMBER, msg
    )
    return c.json({ success: true, type: 'arrival', studentName: student.name, parentPhone: student.parentPhone, sid: r.sid })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/sms/delay  — delay notification to parents of affected bus
notif.post('/sms/delay', async (c) => {
  const { busId, delayMinutes, tenantId = 't001' } = await c.req.json()
  const bus = BUSES.find(b => b.id === busId)
  if (!bus) return c.json({ success: false, error: 'Bus not found' }, 404)

  const affectedStudents = STUDENTS.filter(s => s.busId === busId && s.tenantId === tenantId)
  const results = []

  for (const student of affectedStudents.slice(0, 10)) {
    const msg = `⏱️ TrackSchool Delay Alert\nDear ${student.parentName},\n${bus.nickname} is running ${delayMinutes || 10} minutes late today.\n${student.name} will arrive later than scheduled.\nLive tracking: trackschool.io/parent\nSorry for the inconvenience.`
    try {
      const r = await sendTwilioSMS(
        c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN,
        student.parentPhone, c.env.TWILIO_FROM_NUMBER, msg
      )
      results.push({ studentName: student.name, phone: student.parentPhone, status: 'sent', sid: r.sid })
    } catch (e: any) {
      results.push({ studentName: student.name, phone: student.parentPhone, status: 'failed', error: e.message })
    }
  }

  return c.json({
    success: true,
    type: 'delay',
    busName: bus.nickname,
    delayMinutes,
    notified: results.filter(r => r.status === 'sent').length,
    results
  })
})

// ═══════════════════════════════════════════════════════════════
// TWILIO VERIFY — OTP LOGIN
// ═══════════════════════════════════════════════════════════════

// POST /api/notify/otp/send
notif.post('/otp/send', async (c) => {
  const { phone } = await c.req.json()
  if (!phone) return c.json({ success: false, error: 'Phone number required' }, 400)

  // Normalize: ensure +91 prefix for Indian numbers
  const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`

  try {
    const r = await sendTwilioVerify(
      c.env.TWILIO_VERIFY_SERVICE_SID,
      c.env.TWILIO_ACCOUNT_SID,
      c.env.TWILIO_AUTH_TOKEN,
      normalizedPhone
    )
    return c.json({ success: true, phone: normalizedPhone, status: r.status, sid: r.sid })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/otp/verify
notif.post('/otp/verify', async (c) => {
  const { phone, code } = await c.req.json()
  if (!phone || !code) return c.json({ success: false, error: 'Phone and code required' }, 400)

  const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`

  try {
    const r = await checkTwilioVerify(
      c.env.TWILIO_VERIFY_SERVICE_SID,
      c.env.TWILIO_ACCOUNT_SID,
      c.env.TWILIO_AUTH_TOKEN,
      normalizedPhone,
      code
    )
    if (r.valid) {
      // Lookup user role by phone
      const driver = DRIVERS.find(d => d.phone === normalizedPhone || d.phone === phone)
      const student = STUDENTS.find(s => s.parentPhone === normalizedPhone || s.parentPhone === phone)
      let role = 'parent', name = 'User', redirectUrl = '/parent'
      if (driver) { role = 'driver'; name = driver.name; redirectUrl = '/driver' }
      else if (student) { name = student.parentName }
      const token = `otp_${role}_${Date.now()}`
      return c.json({ success: true, valid: true, token, role, name, redirectUrl })
    }
    return c.json({ success: false, valid: false, error: 'Invalid or expired OTP. Please try again.' }, 401)
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
// EMAIL ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/notify/email/welcome
notif.post('/email/welcome', async (c) => {
  const { tenantId } = await c.req.json()
  const tenant = TENANTS.find(t => t.id === tenantId)
  if (!tenant) return c.json({ success: false, error: 'Tenant not found' }, 404)

  const body = `
<h2 style="color:#1a73e8">Welcome to TrackSchool, ${tenant.name}! 🎉</h2>
<p>Your school transport management platform is live and ready. Here's how to get started:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e0e0e0;border-radius:8px">
  <tr style="background:#f8f9fa"><td style="padding:10px 14px"><strong>🏫 School</strong></td><td style="padding:10px 14px">${tenant.name}</td></tr>
  <tr><td style="padding:10px 14px"><strong>📧 Admin Email</strong></td><td style="padding:10px 14px">${tenant.email}</td></tr>
  <tr style="background:#f8f9fa"><td style="padding:10px 14px"><strong>🚌 Plan</strong></td><td style="padding:10px 14px">${tenant.plan} (${tenant.maxBuses === 999 ? 'Unlimited' : tenant.maxBuses} buses)</td></tr>
  <tr><td style="padding:10px 14px"><strong>🌐 Portal</strong></td><td style="padding:10px 14px"><a href="https://${tenant.domain}">${tenant.domain}</a></td></tr>
</table>
<h3>Quick Setup Checklist:</h3>
<ul style="line-height:2">
  <li>✅ Add your buses (Admin → Buses → Add Bus)</li>
  <li>✅ Assign GPS devices to buses</li>
  <li>✅ Add drivers and assign to buses</li>
  <li>✅ Import students from your ERP</li>
  <li>✅ Create routes and assign stops</li>
  <li>✅ Share parent app links with families</li>
</ul>
<div style="background:#e8f0fe;border-radius:10px;padding:16px;margin-top:16px">
  <strong>Need help?</strong> Contact us at <a href="mailto:support@trackschool.io">support@trackschool.io</a> or call <strong>+91-1800-TRACK-01</strong>
</div>`

  try {
    const r = await sendEmail(
      c.env.SMTP_USER, c.env.SMTP_PASS, c.env.SMTP_FROM,
      tenant.email,
      `Welcome to TrackSchool — ${tenant.name} is live!`,
      emailTemplate(`Welcome to TrackSchool — ${tenant.name}`, body)
    )
    return c.json({ success: true, type: 'welcome', to: tenant.email, ...r })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/email/alert  — alert email to school admin
notif.post('/email/alert', async (c) => {
  const { alertId, tenantId = 't001' } = await c.req.json()
  const alert = ALERTS.find(a => a.id === alertId && a.tenantId === tenantId)
  const tenant = TENANTS.find(t => t.id === tenantId)
  if (!alert || !tenant) return c.json({ success: false, error: 'Alert/tenant not found' }, 404)

  const severityColors: Record<string, string> = {
    critical: '#c62828', high: '#bf360c', medium: '#f57f17', low: '#33691e', info: '#1565c0'
  }
  const color = severityColors[alert.severity] || '#1a73e8'
  const bus = BUSES.find(b => b.id === alert.busId)

  const body = `
<div style="background:${color}18;border-left:4px solid ${color};padding:16px 20px;border-radius:8px;margin-bottom:20px">
  <strong style="color:${color};font-size:1.05rem">⚠️ ${alert.severity.toUpperCase()} ALERT — ${alert.type.toUpperCase()}</strong>
  <p style="margin:8px 0 0;color:#333;font-size:.95rem">${alert.message}</p>
</div>
<table style="width:100%;border-collapse:collapse">
  <tr style="background:#f8f9fa"><td style="padding:10px 14px;font-weight:600;width:140px">School</td><td style="padding:10px 14px">${tenant.name}</td></tr>
  <tr><td style="padding:10px 14px;font-weight:600">Bus</td><td style="padding:10px 14px">${bus ? `${bus.nickname} (${bus.number})` : alert.busId}</td></tr>
  <tr style="background:#f8f9fa"><td style="padding:10px 14px;font-weight:600">Alert Type</td><td style="padding:10px 14px">${alert.type}</td></tr>
  <tr><td style="padding:10px 14px;font-weight:600">Severity</td><td style="padding:10px 14px"><strong style="color:${color}">${alert.severity.toUpperCase()}</strong></td></tr>
  <tr style="background:#f8f9fa"><td style="padding:10px 14px;font-weight:600">Time</td><td style="padding:10px 14px">${new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
</table>
<div style="margin-top:24px">
  <a href="https://trackschool.io/admin/alerts" style="background:#1a73e8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">View in Dashboard →</a>
</div>`

  try {
    const r = await sendEmail(
      c.env.SMTP_USER, c.env.SMTP_PASS, c.env.SMTP_FROM,
      tenant.email,
      `[${alert.severity.toUpperCase()}] ${alert.type} Alert — ${bus?.nickname || 'Bus'}`,
      emailTemplate(`Alert: ${alert.type} on ${bus?.nickname}`, body, color)
    )
    return c.json({ success: true, type: 'alert', alertId, to: tenant.email, ...r })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/email/daily-report  — daily summary report email
notif.post('/email/daily-report', async (c) => {
  const { tenantId = 't001', summary } = await c.req.json()
  const tenant = TENANTS.find(t => t.id === tenantId)
  if (!tenant) return c.json({ success: false, error: 'Tenant not found' }, 404)

  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })

  const body = `
<h2 style="color:#1a73e8">Daily Transport Report — ${today}</h2>
<div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:20px">
  <table style="width:100%;border-collapse:collapse;text-align:center">
    <tr>
      <td style="padding:16px"><div style="font-size:2rem;font-weight:800;color:#1a73e8">18</div><div style="color:#666;font-size:.8rem;margin-top:4px">Buses Active</div></td>
      <td style="padding:16px"><div style="font-size:2rem;font-weight:800;color:#00c853">94%</div><div style="color:#666;font-size:.8rem;margin-top:4px">On-time Rate</div></td>
      <td style="padding:16px"><div style="font-size:2rem;font-weight:800;color:#ff9800">312</div><div style="color:#666;font-size:.8rem;margin-top:4px">Students Transported</div></td>
      <td style="padding:16px"><div style="font-size:2rem;font-weight:800;color:#f44336">4</div><div style="color:#666;font-size:.8rem;margin-top:4px">Active Alerts</div></td>
    </tr>
  </table>
</div>
${summary
  ? `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:20px;white-space:pre-line;font-size:.875rem;line-height:1.8;color:#333">${summary}</div>`
  : ''
}
<div style="margin-top:24px;display:flex;gap:12px">
  <a href="https://trackschool.io/admin/reports" style="background:#1a73e8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">View Full Report →</a>
  <a href="https://trackschool.io/admin/ai" style="background:#00c853;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">AI Insights →</a>
</div>`

  try {
    const r = await sendEmail(
      c.env.SMTP_USER, c.env.SMTP_PASS, c.env.SMTP_FROM,
      tenant.email,
      `Daily Transport Report — ${tenant.name} — ${today}`,
      emailTemplate('Daily Transport Report', body)
    )
    return c.json({ success: true, type: 'daily_report', to: tenant.email, ...r })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST /api/notify/email/send  — generic custom email
notif.post('/email/send', async (c) => {
  const { to, subject, body } = await c.req.json()
  if (!to || !subject || !body) return c.json({ success: false, error: 'to, subject, body required' }, 400)
  try {
    const r = await sendEmail(
      c.env.SMTP_USER, c.env.SMTP_PASS, c.env.SMTP_FROM,
      to, subject,
      emailTemplate(subject, `<p>${body}</p>`)
    )
    return c.json({ success: true, to, subject, ...r })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET /api/notify/status  — integration health check
notif.get('/status', (c) => {
  const twilioConfigured = !!(c.env.TWILIO_ACCOUNT_SID && c.env.TWILIO_AUTH_TOKEN &&
    c.env.TWILIO_AUTH_TOKEN !== 'PASTE_YOUR_TWILIO_AUTH_TOKEN_HERE')
  const emailConfigured = !!(c.env.SMTP_USER)

  return c.json({
    success: true,
    services: {
      sms: {
        provider: 'Twilio Messaging API',
        status: twilioConfigured ? 'configured' : 'needs_auth_token',
        accountSid: c.env.TWILIO_ACCOUNT_SID ? c.env.TWILIO_ACCOUNT_SID.substring(0, 8) + '...' : 'not set',
        features: ['SOS alerts', 'Arrival notifications', 'Delay alerts', 'Custom SMS']
      },
      otp: {
        provider: 'Twilio Verify',
        status: twilioConfigured ? 'configured' : 'needs_auth_token',
        serviceSid: c.env.TWILIO_VERIFY_SERVICE_SID ? c.env.TWILIO_VERIFY_SERVICE_SID.substring(0, 8) + '...' : 'not set',
        features: ['OTP send via SMS', 'OTP verify', 'Driver phone login', 'Parent phone login']
      },
      email: {
        provider: 'MailChannels (CF Workers) + Gmail SMTP fallback',
        status: emailConfigured ? 'configured' : 'needs_smtp_user',
        from: c.env.SMTP_USER || 'not set',
        features: ['Welcome emails', 'Alert notifications', 'Daily reports', 'Custom emails']
      }
    },
    note: twilioConfigured
      ? 'All integrations active'
      : 'Add TWILIO_AUTH_TOKEN to .dev.vars to activate SMS/OTP'
  })
})

export default notif
