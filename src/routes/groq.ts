// ============================================================
// GROQ AI INTEGRATION — Llama 3.3 70B
// Powers: Fleet Intelligence Chat, Route Optimization,
//         Alert Analysis, Driver Behavior Reports, ETA Prediction
// ============================================================

import { Hono } from 'hono'
import { BUSES, DRIVERS, ROUTES, ALERTS, TRIPS, TENANTS } from '../data/mockData'

type Bindings = { GROQ_API_KEY: string; GROQ_MODEL: string }
const groq = new Hono<{ Bindings: Bindings }>()

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(apiKey: string, model: string, messages: any[], temperature = 0.7, maxTokens = 1024) {
  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages, temperature, max_tokens: maxTokens })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }
  const data = await res.json() as any
  return data.choices[0].message.content as string
}

// ── Fleet Intelligence Chat ────────────────────────────────────
groq.post('/chat', async (c) => {
  const { message, history = [], tenantId = 't001' } = await c.req.json()
  const tenant = TENANTS.find(t => t.id === tenantId)
  const buses = BUSES.filter(b => b.tenantId === tenantId)
  const alerts = ALERTS.filter(a => a.tenantId === tenantId && !a.resolved)
  const trips = TRIPS.filter(t => t.tenantId === tenantId)

  const systemPrompt = `You are TrackSchool AI — an expert school transport intelligence assistant for ${tenant?.name || 'a school'}.

Current Fleet Status:
- Total buses: ${buses.length}
- On trip: ${buses.filter(b => b.status === 'on_trip').length}
- Idle: ${buses.filter(b => b.status === 'idle').length}
- Delayed: ${buses.filter(b => b.status === 'delayed').length}
- Active alerts: ${alerts.length} (${alerts.filter(a => a.severity === 'critical').length} critical)

Today's trips: ${trips.length} (${trips.filter(t => t.status === 'completed').length} completed, ${trips.filter(t => t.status === 'in_progress').length} in progress)

Active alerts:
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.type}: ${a.message}`).join('\n')}

You answer questions about fleet management, route optimization, driver performance, student safety, and transport operations. Be concise, actionable, and data-driven. Use Indian context (₹, Indian cities, school timings). Format responses with bullet points and emojis where helpful.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: message }
  ]

  try {
    const reply = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL, messages, 0.7, 800)
    return c.json({ success: true, reply, model: 'llama-3.3-70b-versatile' })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Route Optimization ────────────────────────────────────────
groq.post('/optimize-route', async (c) => {
  const { routeId, tenantId = 't001' } = await c.req.json()
  const route = ROUTES.find(r => r.id === routeId && r.tenantId === tenantId)
  if (!route) return c.json({ success: false, error: 'Route not found' }, 404)

  const prompt = `Analyze this school bus route and provide optimization recommendations:

Route: ${route.name}
Current stops (${route.stops.length}): ${route.stops.map(s => `${s.order}. ${s.name} (${s.students} students, ETA ${s.eta})`).join(', ')}
Total students: ${route.totalStudents}
Current distance: ${route.distance}
Current duration: ${route.duration}

Provide:
1. 🔄 Suggested stop reordering for efficiency
2. ⏱️ Estimated time savings
3. 🎯 Clustering recommendations (combine nearby stops)
4. ⚠️ Risk factors (traffic hotspots, road conditions)
5. 💡 2-3 actionable improvements

Keep response practical and specific to Indian school transport context.`

  try {
    const analysis = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL,
      [{ role: 'user', content: prompt }], 0.5, 600)
    return c.json({ success: true, routeId, routeName: route.name, analysis })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Driver Behavior Analysis ──────────────────────────────────
groq.post('/driver-analysis', async (c) => {
  const { driverId, tenantId = 't001' } = await c.req.json()
  const driver = DRIVERS.find(d => d.id === driverId && d.tenantId === tenantId)
  if (!driver) return c.json({ success: false, error: 'Driver not found' }, 404)

  const driverTrips = TRIPS.filter(t => t.driverId === driverId)
  const driverAlerts = ALERTS.filter(a => {
    const bus = BUSES.find(b => b.driver === driverId)
    return bus && a.busId === bus.id
  })

  const prompt = `Analyze this school bus driver's performance:

Driver: ${driver.name}
Rating: ${driver.rating}/5.0
Total trips: ${driver.trips}
Recent trips: ${driverTrips.length}
Alerts against driver: ${driverAlerts.length} (types: ${[...new Set(driverAlerts.map(a => a.type))].join(', ') || 'none'})

Trip stats:
- Completed: ${driverTrips.filter(t => t.status === 'completed').length}
- Average speed: ${driverTrips.length ? Math.round(driverTrips.reduce((s,t) => s+t.avgSpeed, 0)/driverTrips.length) : 0} km/h
- Total students transported: ${driverTrips.reduce((s,t) => s+t.studentsBoarded, 0)}

Provide:
1. ⭐ Performance score (0-100) with breakdown
2. 💪 Key strengths
3. ⚠️ Areas for improvement
4. 🎓 Specific training recommendations
5. 🏆 Recognition or corrective action suggestion

Be specific, fair, and constructive.`

  try {
    const analysis = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL,
      [{ role: 'user', content: prompt }], 0.5, 600)
    return c.json({ success: true, driverId, driverName: driver.name, rating: driver.rating, analysis })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Alert Intelligence ────────────────────────────────────────
groq.post('/analyze-alerts', async (c) => {
  const { tenantId = 't001' } = await c.req.json()
  const alerts = ALERTS.filter(a => a.tenantId === tenantId)
  const tenant = TENANTS.find(t => t.id === tenantId)

  const prompt = `Analyze these school bus alerts for ${tenant?.name} and provide intelligence report:

Alerts (${alerts.length} total, ${alerts.filter(a=>!a.resolved).length} active):
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.type}: "${a.message}" — ${a.resolved ? 'RESOLVED' : 'ACTIVE'}`).join('\n')}

Provide:
1. 🚨 Critical issues requiring immediate action
2. 📊 Alert pattern analysis (what's happening and why)
3. 🔮 Predicted risks if not addressed
4. ✅ Recommended immediate actions (priority order)
5. 🛡️ Prevention strategies for repeat alerts
6. 📱 Parent communication recommendations

Format as an executive briefing for the school transport manager.`

  try {
    const report = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL,
      [{ role: 'user', content: prompt }], 0.4, 800)
    return c.json({ success: true, tenantId, alertCount: alerts.length, activeAlerts: alerts.filter(a=>!a.resolved).length, report })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── ETA Prediction ────────────────────────────────────────────
groq.post('/predict-eta', async (c) => {
  const { busId, stopName } = await c.req.json()
  const bus = BUSES.find(b => b.id === busId)
  if (!bus) return c.json({ success: false, error: 'Bus not found' }, 404)

  const route = ROUTES.find(r => r.id === bus.route)
  const prompt = `Predict ETA for a school bus:

Bus: ${bus.nickname} (${bus.number})
Current speed: ${bus.speed} km/h
Current status: ${bus.status}
Route: ${route?.name || 'Unknown'}
Target stop: ${stopName || 'School'}
Scheduled stops remaining: ${route ? route.stops.filter((s,i) => i > 0).length : 'Unknown'}
Current time: ${new Date().toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata'})}

Factors to consider: Indian traffic patterns, school zone slowdowns, time of day (morning rush hours), bus stops dwell time (~2 min each).

Give a single realistic ETA with confidence level and brief reasoning. Format: "ETA: HH:MM (±X min) — [reason]"`

  try {
    const prediction = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL,
      [{ role: 'user', content: prompt }], 0.3, 200)
    return c.json({ success: true, busId, busName: bus.nickname, prediction, currentSpeed: bus.speed })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Daily Summary Report ──────────────────────────────────────
groq.post('/daily-summary', async (c) => {
  const { tenantId = 't001' } = await c.req.json()
  const tenant = TENANTS.find(t => t.id === tenantId)
  const buses = BUSES.filter(b => b.tenantId === tenantId)
  const trips = TRIPS.filter(t => t.tenantId === tenantId && t.date === '2025-01-15')
  const alerts = ALERTS.filter(a => a.tenantId === tenantId)

  const prompt = `Generate a concise daily transport operations report for ${tenant?.name}:

Date: January 15, 2025
Fleet: ${buses.length} buses
Trips today: ${trips.length}
  - Completed: ${trips.filter(t=>t.status==='completed').length}
  - In progress: ${trips.filter(t=>t.status==='in_progress').length}
  - Delayed: ${trips.filter(t=>t.status==='delayed').length}
Total students transported: ${trips.reduce((s,t)=>s+t.studentsBoarded,0)}
Alerts: ${alerts.length} total (${alerts.filter(a=>!a.resolved).length} unresolved)
  Critical: ${alerts.filter(a=>a.severity==='critical').length}
  High: ${alerts.filter(a=>a.severity==='high').length}

Generate a professional daily summary report with:
1. 📊 Operations Overview (1 paragraph)
2. ✅ What went well
3. ⚠️ Issues & incidents
4. 🎯 Tomorrow's recommendations
5. 📱 Parent communication note

Keep it under 300 words. Professional tone suitable for school management.`

  try {
    const summary = await callGroq(c.env.GROQ_API_KEY, c.env.GROQ_MODEL,
      [{ role: 'user', content: prompt }], 0.6, 500)
    return c.json({ success: true, tenantId, date: '2025-01-15', summary })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default groq
