import { Hono } from 'hono'
import { BUSES, DRIVERS, ROUTES, STUDENTS, ALERTS, TRIPS, TENANTS, USERS, PLATFORM_STATS, INVOICES, PLANS } from '../data/mockData'

const api = new Hono()

// ── PLATFORM ──────────────────────────────────────────────────
api.get('/platform/stats', (c) => c.json({ success: true, data: PLATFORM_STATS }))
api.get('/plans', (c) => c.json({ success: true, data: PLANS }))

// ── TENANTS ───────────────────────────────────────────────────
api.get('/tenants', (c) => c.json({ success: true, data: TENANTS }))
api.get('/tenants/:id', (c) => {
  const t = TENANTS.find(x => x.id === c.req.param('id'))
  return t ? c.json({ success: true, data: t }) : c.json({ success: false, error: 'Not found' }, 404)
})

// ── BUSES ─────────────────────────────────────────────────────
api.get('/buses', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? BUSES.filter(b => b.tenantId === tenantId) : BUSES
  return c.json({ success: true, data })
})
api.get('/buses/:id', (c) => {
  const b = BUSES.find(x => x.id === c.req.param('id'))
  return b ? c.json({ success: true, data: b }) : c.json({ success: false, error: 'Not found' }, 404)
})
// Live location endpoint — simulates small movement
api.get('/buses/:id/location', (c) => {
  const b = BUSES.find(x => x.id === c.req.param('id'))
  if (!b) return c.json({ success: false, error: 'Not found' }, 404)
  const drift = () => (Math.random() - 0.5) * 0.002
  return c.json({
    success: true,
    data: {
      busId: b.id, lat: b.lat + drift(), lng: b.lng + drift(),
      speed: b.engineOn ? Math.max(0, b.speed + (Math.random() - 0.5) * 5) : 0,
      timestamp: new Date().toISOString(), fuel: b.fuel, engineOn: b.engineOn
    }
  })
})

// ── DRIVERS ───────────────────────────────────────────────────
api.get('/drivers', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? DRIVERS.filter(d => d.tenantId === tenantId) : DRIVERS
  return c.json({ success: true, data })
})
api.get('/drivers/:id', (c) => {
  const d = DRIVERS.find(x => x.id === c.req.param('id'))
  return d ? c.json({ success: true, data: d }) : c.json({ success: false, error: 'Not found' }, 404)
})

// ── ROUTES ────────────────────────────────────────────────────
api.get('/routes', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? ROUTES.filter(r => r.tenantId === tenantId) : ROUTES
  return c.json({ success: true, data })
})
api.get('/routes/:id', (c) => {
  const r = ROUTES.find(x => x.id === c.req.param('id'))
  return r ? c.json({ success: true, data: r }) : c.json({ success: false, error: 'Not found' }, 404)
})

// ── STUDENTS ─────────────────────────────────────────────────
api.get('/students', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? STUDENTS.filter(s => s.tenantId === tenantId) : STUDENTS
  return c.json({ success: true, data })
})

// ── ALERTS ────────────────────────────────────────────────────
api.get('/alerts', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? ALERTS.filter(a => a.tenantId === tenantId) : ALERTS
  return c.json({ success: true, data: data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)) })
})

// ── TRIPS ─────────────────────────────────────────────────────
api.get('/trips', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? TRIPS.filter(t => t.tenantId === tenantId) : TRIPS
  return c.json({ success: true, data })
})

// ── USERS ─────────────────────────────────────────────────────
api.get('/users', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? USERS.filter(u => u.tenantId === tenantId) : USERS
  return c.json({ success: true, data })
})

// ── INVOICES ─────────────────────────────────────────────────
api.get('/invoices', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? INVOICES.filter(i => i.tenantId === tenantId) : INVOICES
  return c.json({ success: true, data })
})

// ── AUTH (mock) ───────────────────────────────────────────────
api.post('/auth/login', async (c) => {
  const body = await c.req.json()
  const { email, password, role } = body
  // Demo credentials
  const accounts: Record<string, { token: string; role: string; name: string; tenantId?: string }> = {
    'superadmin@trackschool.io': { token: 'sa_demo_token', role: 'super_admin', name: 'Super Admin' },
    'admin@dps.edu.in':          { token: 'ta_dps_token',  role: 'tenant_admin', name: 'Ramesh Kumar', tenantId: 't001' },
    'admin@stmarys.edu.in':      { token: 'ta_smc_token',  role: 'tenant_admin', name: 'Sr. Theresa', tenantId: 't002' },
    'driver@dps.edu.in':         { token: 'dr_dps_token',  role: 'driver', name: 'Rajesh Kumar', tenantId: 't001' },
    'parent@dps.edu.in':         { token: 'pa_dps_token',  role: 'parent', name: 'Ashok Sharma', tenantId: 't001' },
  }
  const acc = accounts[email]
  if (acc && password === 'demo123') {
    return c.json({ success: true, data: acc })
  }
  return c.json({ success: false, error: 'Invalid credentials' }, 401)
})

// ── ERP INTEGRATION ENDPOINTS ─────────────────────────────────
api.get('/erp/students/sync', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const students = STUDENTS.filter(s => s.tenantId === tenantId).map(s => ({
    student_id: s.id, name: s.name, class: s.class,
    bus_number: BUSES.find(b => b.id === s.busId)?.number || '',
    route: ROUTES.find(r => r.id === s.routeId)?.name || '',
    stop: ROUTES.find(r => r.id === s.routeId)?.stops.find(st => st.id === s.stopId)?.name || '',
    status: s.status,
  }))
  return c.json({ success: true, sync_time: new Date().toISOString(), count: students.length, data: students })
})
api.get('/erp/attendance/today', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const students = STUDENTS.filter(s => s.tenantId === tenantId)
  return c.json({
    success: true,
    date: '2025-01-15',
    summary: {
      total: students.length,
      boarded: students.filter(s => s.status === 'boarded').length,
      absent: students.filter(s => s.status === 'absent').length,
    },
    data: students.map(s => ({ student_id: s.id, name: s.name, attendance: s.status === 'absent' ? 'A' : 'P' }))
  })
})
api.get('/erp/buses/status', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const buses = BUSES.filter(b => b.tenantId === tenantId)
  return c.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: buses.map(b => ({ bus_id: b.id, number: b.number, status: b.status, lat: b.lat, lng: b.lng, speed: b.speed, driver: DRIVERS.find(d => d.id === b.driver)?.name || '' }))
  })
})

export default api
