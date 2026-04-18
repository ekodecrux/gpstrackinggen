import { Hono } from 'hono'
import { BUSES, DRIVERS, ROUTES, STUDENTS, ALERTS, TRIPS, TENANTS, USERS, PLATFORM_STATS, INVOICES, PLANS } from '../data/mockData'

const api = new Hono()

// ── In-memory mutable stores (full CRUD) ──────────────────────
let buses    = [...BUSES]
let drivers  = [...DRIVERS]
let students = [...STUDENTS]
let tenants  = [...TENANTS]
let routes   = [...ROUTES]
let alerts   = [...ALERTS]
let trips    = [...TRIPS]
let invoices = [...INVOICES]
let users    = [...USERS]

const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`

// ── PLATFORM ──────────────────────────────────────────────────
api.get('/platform/stats', (c) => {
  const stats = {
    ...PLATFORM_STATS,
    totalTenants: tenants.length,
    activeBuses: buses.filter(b => b.status !== 'maintenance').length,
    totalStudents: students.length,
    totalDrivers: drivers.length,
  }
  return c.json({ success: true, data: stats })
})
api.get('/plans', (c) => c.json({ success: true, data: PLANS }))

// ── TENANTS ───────────────────────────────────────────────────
api.get('/tenants', (c) => c.json({ success: true, data: tenants, count: tenants.length }))
api.get('/tenants/:id', (c) => {
  const t = tenants.find(x => x.id === c.req.param('id'))
  return t ? c.json({ success: true, data: t }) : c.json({ success: false, error: 'Not found' }, 404)
})
api.post('/tenants', async (c) => {
  const body = await c.req.json()
  const t = {
    id: uid('t'),
    name: body.name || 'New School',
    email: body.email || '',
    phone: body.phone || '',
    plan: body.plan || 'starter',
    status: 'active',
    maxBuses: body.plan === 'enterprise' ? 999 : body.plan === 'growth' ? 20 : 5,
    activeBuses: 0,
    students: 0,
    drivers: 0,
    domain: body.domain || `${(body.name||'school').toLowerCase().replace(/\s+/g,'-')}.trackschool.io`,
    city: body.city || '',
    state: body.state || '',
    joinedAt: new Date().toISOString().slice(0,10),
    mrr: 0,
    ...body
  }
  tenants.push(t)
  return c.json({ success: true, data: t }, 201)
})
api.put('/tenants/:id', async (c) => {
  const idx = tenants.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  const body = await c.req.json()
  tenants[idx] = { ...tenants[idx], ...body }
  return c.json({ success: true, data: tenants[idx] })
})
api.delete('/tenants/:id', (c) => {
  const idx = tenants.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  tenants.splice(idx, 1)
  return c.json({ success: true, message: 'Tenant deleted' })
})

// ── BUSES ─────────────────────────────────────────────────────
api.get('/buses', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? buses.filter(b => b.tenantId === tenantId) : buses
  return c.json({ success: true, data, count: data.length })
})
api.get('/buses/:id', (c) => {
  const b = buses.find(x => x.id === c.req.param('id'))
  return b ? c.json({ success: true, data: b }) : c.json({ success: false, error: 'Not found' }, 404)
})
api.get('/buses/:id/location', (c) => {
  const b = buses.find(x => x.id === c.req.param('id'))
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
api.post('/buses', async (c) => {
  const body = await c.req.json()
  const b = {
    id: uid('b'),
    tenantId: body.tenantId || 't001',
    nickname: body.nickname || 'New Bus',
    number: body.number || '',
    capacity: Number(body.capacity) || 40,
    driver: body.driver || null,
    route: body.route || null,
    status: 'idle',
    speed: 0,
    fuel: 100,
    lat: 28.6139 + (Math.random()-0.5)*0.1,
    lng: 77.2090 + (Math.random()-0.5)*0.1,
    engineOn: false,
    deviceId: body.deviceId || `GPS-${Math.floor(Math.random()*9000+1000)}`,
    ...body
  }
  buses.push(b)
  return c.json({ success: true, data: b }, 201)
})
api.put('/buses/:id', async (c) => {
  const idx = buses.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  buses[idx] = { ...buses[idx], ...await c.req.json() }
  return c.json({ success: true, data: buses[idx] })
})
api.delete('/buses/:id', (c) => {
  const idx = buses.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  buses.splice(idx, 1)
  return c.json({ success: true, message: 'Bus deleted' })
})

// ── DRIVERS ───────────────────────────────────────────────────
api.get('/drivers', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? drivers.filter(d => d.tenantId === tenantId) : drivers
  return c.json({ success: true, data, count: data.length })
})
api.get('/drivers/:id', (c) => {
  const d = drivers.find(x => x.id === c.req.param('id'))
  return d ? c.json({ success: true, data: d }) : c.json({ success: false, error: 'Not found' }, 404)
})
api.post('/drivers', async (c) => {
  const body = await c.req.json()
  const d = {
    id: uid('d'),
    tenantId: body.tenantId || 't001',
    name: body.name || '',
    phone: body.phone || '',
    emergencyContact: body.emergencyContact || '',
    license: body.license || '',
    busId: body.busId || null,
    status: 'off_duty',
    rating: 4.5,
    trips: 0,
    joinedAt: new Date().toISOString().slice(0,7),
    ...body
  }
  drivers.push(d)
  return c.json({ success: true, data: d }, 201)
})
api.put('/drivers/:id', async (c) => {
  const idx = drivers.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  drivers[idx] = { ...drivers[idx], ...await c.req.json() }
  return c.json({ success: true, data: drivers[idx] })
})
api.delete('/drivers/:id', (c) => {
  const idx = drivers.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  drivers.splice(idx, 1)
  return c.json({ success: true, message: 'Driver deleted' })
})

// ── ROUTES ────────────────────────────────────────────────────
api.get('/routes', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? routes.filter(r => r.tenantId === tenantId) : routes
  return c.json({ success: true, data, count: data.length })
})
api.get('/routes/:id', (c) => {
  const r = routes.find(x => x.id === c.req.param('id'))
  return r ? c.json({ success: true, data: r }) : c.json({ success: false, error: 'Not found' }, 404)
})
api.post('/routes', async (c) => {
  const body = await c.req.json()
  const r = {
    id: uid('r'),
    tenantId: body.tenantId || 't001',
    name: body.name || 'New Route',
    color: body.color || '#1a73e8',
    activeBuses: 0,
    totalStudents: 0,
    distance: body.distance || '0 km',
    duration: body.duration || '0 min',
    stops: body.stops || [],
    ...body
  }
  routes.push(r)
  return c.json({ success: true, data: r }, 201)
})
api.put('/routes/:id', async (c) => {
  const idx = routes.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  routes[idx] = { ...routes[idx], ...await c.req.json() }
  return c.json({ success: true, data: routes[idx] })
})
api.delete('/routes/:id', (c) => {
  const idx = routes.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  routes.splice(idx, 1)
  return c.json({ success: true, message: 'Route deleted' })
})

// ── STUDENTS ─────────────────────────────────────────────────
api.get('/students', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? students.filter(s => s.tenantId === tenantId) : students
  return c.json({ success: true, data, count: data.length })
})
api.get('/students/:id', (c) => {
  const s = students.find(x => x.id === c.req.param('id'))
  return s ? c.json({ success: true, data: s }) : c.json({ success: false, error: 'Not found' }, 404)
})
api.post('/students', async (c) => {
  const body = await c.req.json()
  const s = {
    id: uid('s'),
    tenantId: body.tenantId || 't001',
    name: body.name || '',
    class: body.class || '',
    busId: body.busId || null,
    routeId: body.routeId || null,
    stopId: body.stopId || null,
    parentName: body.parentName || '',
    parentPhone: body.parentPhone || '',
    rfidTag: body.rfidTag || `RFID-${Math.floor(Math.random()*900000+100000)}`,
    status: 'waiting',
    ...body
  }
  students.push(s)
  return c.json({ success: true, data: s }, 201)
})
api.put('/students/:id', async (c) => {
  const idx = students.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  students[idx] = { ...students[idx], ...await c.req.json() }
  return c.json({ success: true, data: students[idx] })
})
api.delete('/students/:id', (c) => {
  const idx = students.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  students.splice(idx, 1)
  return c.json({ success: true, message: 'Student deleted' })
})

// ── ALERTS ────────────────────────────────────────────────────
api.get('/alerts', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? alerts.filter(a => a.tenantId === tenantId) : alerts
  return c.json({ success: true, data: data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)), count: data.length })
})
api.put('/alerts/resolve-all', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  alerts = alerts.map(a => a.tenantId === tenantId ? { ...a, resolved: true } : a)
  return c.json({ success: true, message: 'All alerts resolved' })
})
api.put('/alerts/:id/resolve', (c) => {
  const idx = alerts.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  alerts[idx] = { ...alerts[idx], resolved: true, resolvedAt: new Date().toISOString() }
  return c.json({ success: true, data: alerts[idx] })
})

// ── TRIPS ─────────────────────────────────────────────────────
api.get('/trips', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? trips.filter(t => t.tenantId === tenantId) : trips
  return c.json({ success: true, data, count: data.length })
})
api.post('/trips', async (c) => {
  const body = await c.req.json()
  const t = {
    id: uid('tr'),
    tenantId: body.tenantId || 't001',
    busId: body.busId,
    routeId: body.routeId,
    driverId: body.driverId,
    date: new Date().toISOString().slice(0,10),
    startTime: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
    endTime: null,
    studentsBoarded: 0,
    distanceCovered: 0,
    status: 'in_progress',
    ...body
  }
  trips.push(t)
  return c.json({ success: true, data: t }, 201)
})

// ── USERS ─────────────────────────────────────────────────────
api.get('/users', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? users.filter(u => u.tenantId === tenantId) : users
  return c.json({ success: true, data, count: data.length })
})
api.post('/users', async (c) => {
  const body = await c.req.json()
  const u = {
    id: uid('u'),
    tenantId: body.tenantId || 't001',
    name: body.name || '',
    email: body.email || '',
    role: body.role || 'viewer',
    status: 'active',
    createdAt: new Date().toISOString().slice(0,10),
    ...body
  }
  users.push(u)
  return c.json({ success: true, data: u }, 201)
})

// ── INVOICES ─────────────────────────────────────────────────
api.get('/invoices', (c) => {
  const tenantId = c.req.query('tenantId')
  const data = tenantId ? invoices.filter(i => i.tenantId === tenantId) : invoices
  return c.json({ success: true, data, count: data.length })
})
api.put('/invoices/:id/pay', (c) => {
  const idx = invoices.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ success: false, error: 'Not found' }, 404)
  invoices[idx] = { ...invoices[idx], status: 'paid', paidAt: new Date().toISOString() }
  return c.json({ success: true, data: invoices[idx] })
})
api.post('/invoices/generate', async (c) => {
  const { tenantId } = await c.req.json()
  const t = tenants.find(x => x.id === tenantId)
  if (!t) return c.json({ success: false, error: 'Tenant not found' }, 404)
  const busCnt = buses.filter(b => b.tenantId === tenantId).length
  const pricePerBus = t.plan === 'starter' ? 299 : t.plan === 'growth' ? 249 : 199
  const inv = {
    id: uid('inv'),
    tenantId,
    month: new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'}),
    buses: busCnt,
    amount: busCnt * pricePerBus,
    status: 'pending',
    generatedAt: new Date().toISOString(),
  }
  invoices.push(inv)
  return c.json({ success: true, data: inv }, 201)
})

// ── AUTH ─────────────────────────────────────────────────────
api.post('/auth/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body
  const accounts: Record<string, { token: string; role: string; name: string; tenantId?: string }> = {
    'superadmin@trackschool.io': { token: 'sa_demo_token', role: 'super_admin', name: 'Super Admin' },
    'admin@dps.edu.in':          { token: 'ta_dps_token',  role: 'tenant_admin', name: 'Ramesh Kumar', tenantId: 't001' },
    'admin@stmarys.edu.in':      { token: 'ta_smc_token',  role: 'tenant_admin', name: 'Sr. Theresa', tenantId: 't002' },
    'driver@dps.edu.in':         { token: 'dr_dps_token',  role: 'driver', name: 'Rajesh Kumar', tenantId: 't001' },
    'parent@dps.edu.in':         { token: 'pa_dps_token',  role: 'parent', name: 'Ashok Sharma', tenantId: 't001' },
  }
  const acc = accounts[email]
  if (acc && password === 'demo123') return c.json({ success: true, data: acc })
  return c.json({ success: false, error: 'Invalid credentials' }, 401)
})

// ── ERP INTEGRATION ──────────────────────────────────────────
api.get('/erp/students/sync', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const data = students.filter(s => s.tenantId === tenantId).map(s => ({
    student_id: s.id, name: s.name, class: s.class,
    bus_number: buses.find(b => b.id === s.busId)?.number || '',
    route: routes.find(r => r.id === s.routeId)?.name || '',
    stop: routes.find(r => r.id === s.routeId)?.stops?.find((st: any) => st.id === s.stopId)?.name || '',
    status: s.status,
  }))
  return c.json({ success: true, sync_time: new Date().toISOString(), count: data.length, data })
})
api.get('/erp/attendance/today', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const st = students.filter(s => s.tenantId === tenantId)
  return c.json({
    success: true, date: new Date().toISOString().slice(0,10),
    summary: { total: st.length, boarded: st.filter(s => s.status === 'boarded').length, absent: st.filter(s => s.status === 'absent').length },
    data: st.map(s => ({ student_id: s.id, name: s.name, attendance: s.status === 'absent' ? 'A' : 'P' }))
  })
})
api.get('/erp/buses/status', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const bs = buses.filter(b => b.tenantId === tenantId)
  return c.json({
    success: true, timestamp: new Date().toISOString(),
    data: bs.map(b => ({ bus_id: b.id, number: b.number, status: b.status, lat: b.lat, lng: b.lng, speed: b.speed, driver: drivers.find(d => d.id === b.driver)?.name || '' }))
  })
})

// ── SETTINGS (save & retrieve) ───────────────────────────────
const settingsStore: Record<string, any> = {}
api.get('/settings/:tenantId', (c) => {
  return c.json({ success: true, data: settingsStore[c.req.param('tenantId')] || {} })
})
api.post('/settings/:tenantId', async (c) => {
  const body = await c.req.json()
  settingsStore[c.req.param('tenantId')] = { ...settingsStore[c.req.param('tenantId')], ...body, updatedAt: new Date().toISOString() }
  return c.json({ success: true, data: settingsStore[c.req.param('tenantId')] })
})

export default api
