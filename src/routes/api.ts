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

// ── Real GPS Location Store ───────────────────────────────────
// Stores live GPS updates pushed by driver devices
const gpsStore: Record<string, {
  lat: number; lng: number; speed: number; heading: number;
  accuracy: number; engineOn: boolean; fuel: number;
  timestamp: string; driverId?: string; source: 'device'|'manual'
}> = {}

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
  // Return real GPS data if driver has pushed location, else return last known from mock data
  const real = gpsStore[b.id]
  if (real) {
    return c.json({
      success: true,
      source: 'device',
      data: { busId: b.id, ...real }
    })
  }
  // Fallback: return static stored position (no random drift)
  return c.json({
    success: true,
    source: 'static',
    data: {
      busId: b.id, lat: b.lat, lng: b.lng,
      speed: b.speed, heading: 0, accuracy: 999,
      timestamp: b.lastUpdate || new Date().toISOString(),
      fuel: b.fuel, engineOn: b.engineOn
    }
  })
})

// POST /api/buses/:id/location — Driver device pushes real GPS
api.post('/buses/:id/location', async (c) => {
  const busId = c.req.param('id')
  const b = buses.find(x => x.id === busId)
  if (!b) return c.json({ success: false, error: 'Bus not found' }, 404)
  const body = await c.req.json()
  const { lat, lng, speed = 0, heading = 0, accuracy = 0, engineOn, fuel, driverId } = body
  if (lat == null || lng == null) return c.json({ success: false, error: 'lat and lng are required' }, 400)
  // Validate coordinates are realistic (rough India bounding box)
  if (lat < 6 || lat > 37 || lng < 68 || lng > 98) {
    return c.json({ success: false, error: 'Coordinates out of range (must be valid Indian coordinates)' }, 400)
  }
  // Store real GPS
  gpsStore[busId] = {
    lat: Number(lat), lng: Number(lng),
    speed: Number(speed), heading: Number(heading),
    accuracy: Number(accuracy),
    engineOn: engineOn !== undefined ? Boolean(engineOn) : b.engineOn,
    fuel: fuel !== undefined ? Number(fuel) : b.fuel,
    timestamp: new Date().toISOString(),
    driverId, source: 'device'
  }
  // Also update the in-memory bus record
  const idx = buses.findIndex(x => x.id === busId)
  if (idx !== -1) {
    buses[idx] = { ...buses[idx], lat: Number(lat), lng: Number(lng), speed: Number(speed),
      engineOn: engineOn !== undefined ? Boolean(engineOn) : buses[idx].engineOn,
      lastUpdate: new Date().toISOString() }
  }
  return c.json({ success: true, stored: true, busId, lat, lng, timestamp: gpsStore[busId].timestamp })
})

// GET /api/buses/locations — All buses' real-time locations at once
api.get('/buses-locations', (c) => {
  const tenantId = c.req.query('tenantId')
  const filtered = tenantId ? buses.filter(b => b.tenantId === tenantId) : buses
  const data = filtered.map(b => {
    const real = gpsStore[b.id]
    return {
      busId: b.id, nickname: b.nickname, number: b.number, status: b.status,
      driverId: b.driver, tenantId: b.tenantId,
      lat: real?.lat ?? b.lat,
      lng: real?.lng ?? b.lng,
      speed: real?.speed ?? b.speed,
      heading: real?.heading ?? 0,
      accuracy: real?.accuracy ?? 999,
      fuel: real?.fuel ?? b.fuel,
      engineOn: real?.engineOn ?? b.engineOn,
      timestamp: real?.timestamp ?? b.lastUpdate,
      source: real ? 'device' : 'static'
    }
  })
  return c.json({ success: true, data, count: data.length, timestamp: new Date().toISOString() })
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
  const accounts: Record<string, { token: string; role: string; name: string; tenantId?: string; class?: string }> = {
    'superadmin@trackschool.io': { token: 'sa_demo_token',  role: 'super_admin',  name: 'Super Admin' },
    'admin@dps.edu.in':          { token: 'ta_dps_token',   role: 'tenant_admin', name: 'Ramesh Kumar',    tenantId: 't001' },
    'admin@stmarys.edu.in':      { token: 'ta_smc_token',   role: 'tenant_admin', name: 'Sr. Theresa',     tenantId: 't002' },
    'admin@dps.edu':             { token: 'ta_dps_token',   role: 'tenant_admin', name: 'Ramesh Kumar',    tenantId: 't001' },
    'admin@stmarys.edu':         { token: 'ta_smc_token',   role: 'tenant_admin', name: 'Sr. Theresa',     tenantId: 't002' },
    'driver@trackschool.io':     { token: 'dr_dps_token',   role: 'driver',       name: 'Rajesh Kumar',    tenantId: 't001' },
    'driver@dps.edu.in':         { token: 'dr_dps_token',   role: 'driver',       name: 'Rajesh Kumar',    tenantId: 't001' },
    'parent@trackschool.io':     { token: 'pa_dps_token',   role: 'parent',       name: 'Ashok Sharma',    tenantId: 't001' },
    'parent@dps.edu.in':         { token: 'pa_dps_token',   role: 'parent',       name: 'Ashok Sharma',    tenantId: 't001' },
    'teacher@dps.edu.in':        { token: 'tc_dps_token',   role: 'teacher',      name: 'Ms. Priya Rajan', tenantId: 't001', class: '5A' },
    'teacher@trackschool.io':    { token: 'tc_dps_token',   role: 'teacher',      name: 'Ms. Priya Rajan', tenantId: 't001', class: '5A' },
    'erpadmin@dps.edu.in':       { token: 'erp_dps_token',  role: 'erp_admin',    name: 'ERP Admin',       tenantId: 't001' },
  }
  const acc = accounts[email?.toLowerCase()]
  if (acc && password === 'demo123') {
    const redirectMap: Record<string,string> = { super_admin:'/superadmin', tenant_admin:'/admin', driver:'/driver', parent:'/parent', teacher:'/teacher', erp_admin:'/erp-admin' }
    return c.json({ success: true, data: { ...acc, redirect: redirectMap[acc.role] || '/' } })
  }
  return c.json({ success: false, error: 'Invalid credentials. Use demo123 as password.' }, 401)
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

// ════════════════════════════════════════════════════════════════
// WHITE-LABEL & PARENT TRACKING SYSTEM
// ════════════════════════════════════════════════════════════════

// In-memory stores (replace with D1 in production)
const parentTokens: Record<string, { parentPhone: string; studentIds: string[]; tenantId: string; name: string; expiresAt: number }> = {}
const brandingStore: Record<string, { primaryColor:string; logo:string; schoolName:string; tagline:string; supportPhone:string; accentColor:string }> = {}
const erpApiKeys: Record<string, { key:string; tenantId:string; label:string; createdAt:string; lastUsed?:string; permissions:string[] }> = {}

// Seed some branding defaults
brandingStore['t001'] = { primaryColor:'#1a73e8', accentColor:'#0d47a1', logo:'🏫', schoolName:'Delhi Public School', tagline:'Excellence in Education', supportPhone:'+91-9876543210' }
brandingStore['t002'] = { primaryColor:'#2e7d32', accentColor:'#1b5e20', logo:'⛪', schoolName:"St. Mary's Convent", tagline:'Faith, Knowledge, Service', supportPhone:'+91-9876543211' }
brandingStore['t003'] = { primaryColor:'#6a1b9a', accentColor:'#4a148c', logo:'🏛️', schoolName:'Kendriya Vidyalaya #3', tagline:'शिक्षा · ज्ञान · सेवा', supportPhone:'+91-9876543212' }

// Seed ERP API keys
erpApiKeys['erk_dps_001'] = { key:'erk_dps_001', tenantId:'t001', label:'DPS ERP System', createdAt:'2025-01-01', permissions:['students:read','attendance:write','buses:read'] }

// ── BRANDING API ──────────────────────────────────────────────
// GET /api/branding/:tenantId — returns school branding (public, no auth needed)
api.get('/branding/:tenantId', (c) => {
  const tid = c.req.param('tenantId')
  const tenant = tenants.find(t => t.id === tid || t.code?.toLowerCase() === tid.toLowerCase() || t.domain?.startsWith(tid))
  if (!tenant) return c.json({ success:false, error:'School not found' }, 404)
  const b = brandingStore[tenant.id] || {}
  return c.json({
    success: true,
    data: {
      tenantId: tenant.id,
      code: tenant.code,
      schoolName: b.schoolName || tenant.name,
      tagline: b.tagline || 'Safe Transport, Happy Students',
      logo: b.logo || '🏫',
      primaryColor: b.primaryColor || tenant.primaryColor || '#1a73e8',
      accentColor: b.accentColor || tenant.secondaryColor || '#0d47a1',
      supportPhone: b.supportPhone || tenant.phone,
      city: tenant.city,
      domain: tenant.domain,
    }
  })
})

// PUT /api/branding/:tenantId — school admin updates branding
api.put('/branding/:tenantId', async (c) => {
  const body = await c.req.json()
  brandingStore[c.req.param('tenantId')] = { ...brandingStore[c.req.param('tenantId')], ...body }
  return c.json({ success: true, data: brandingStore[c.req.param('tenantId')] })
})

// GET /api/school/:code — resolve school by short code (for white-label URL)
api.get('/school/:code', (c) => {
  const code = c.req.param('code').toLowerCase()
  const tenant = tenants.find(t =>
    t.code?.toLowerCase() === code ||
    t.id === code ||
    t.domain?.split('.')[0] === code
  )
  if (!tenant) return c.json({ success:false, error:'School not found' }, 404)
  const b = brandingStore[tenant.id] || {}
  return c.json({ success:true, data: { tenantId:tenant.id, code:tenant.code, name: b.schoolName || tenant.name, primaryColor: b.primaryColor || '#1a73e8', accentColor: b.accentColor || '#0d47a1', logo: b.logo || '🏫', tagline: b.tagline || '' } })
})

// ── PARENT TOKEN AUTH ─────────────────────────────────────────
// POST /api/parent/login — parent logs in with phone + OTP (mock: any 6-digit code works)
api.post('/parent/login', async (c) => {
  const { phone, otp, tenantId } = await c.req.json()
  if (!phone || !otp) return c.json({ success:false, error:'Phone and OTP required' }, 400)
  // Find parent's students
  const myStudents = students.filter(s =>
    s.parentPhone?.replace(/\D/g,'').endsWith(phone.replace(/\D/g,'').slice(-10)) &&
    (!tenantId || s.tenantId === tenantId)
  )
  if (!myStudents.length) return c.json({ success:false, error:'No students found for this phone number' }, 404)
  // Generate token
  const token = 'pt_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  parentTokens[token] = {
    parentPhone: phone,
    studentIds: myStudents.map(s => s.id),
    tenantId: myStudents[0].tenantId,
    name: myStudents[0].parentName || 'Parent',
    expiresAt: Date.now() + 86400000 * 30 // 30 days
  }
  return c.json({ success:true, token, parentName: parentTokens[token].name, students: myStudents.map(s => ({ id:s.id, name:s.name, class:s.class, busId:s.busId, routeId:s.routeId })) })
})

// POST /api/parent/send-otp — sends OTP (fires Twilio if configured, else mock)
api.post('/parent/send-otp', async (c) => {
  const { phone } = await c.req.json()
  if (!phone) return c.json({ success:false, error:'Phone required' }, 400)
  // Check student exists
  const found = students.some(s => s.parentPhone?.replace(/\D/g,'').endsWith(phone.replace(/\D/g,'').slice(-10)))
  if (!found) return c.json({ success:false, error:'Phone number not registered. Contact school admin.' }, 404)
  // In production: call Twilio Verify. For demo, return mock OTP hint
  return c.json({ success:true, message:'OTP sent to ' + phone.slice(0,-6) + '******', hint:'Use 123456 for demo' })
})

// GET /api/parent/child/:studentId — get real-time child info (needs parent token)
api.get('/parent/child/:studentId', (c) => {
  const sid = c.req.param('studentId')
  const st = students.find(s => s.id === sid)
  if (!st) return c.json({ success:false, error:'Student not found' }, 404)
  const bus = buses.find(b => b.id === st.busId)
  const route = routes.find(r => r.id === st.routeId)
  const driver = bus ? drivers.find(d => d.id === bus.driver) : null
  const stop = route?.stops?.find((s:any) => s.id === st.stopId)
  // Real GPS from gpsStore if available
  const gps = bus ? { lat: bus.lat, lng: bus.lng, speed: bus.speed, status: bus.status } : null
  return c.json({
    success: true,
    data: {
      student: { id:st.id, name:st.name, class:st.class, rfid:st.rfidTag, status:st.status },
      bus: bus ? { id:bus.id, nickname:bus.nickname, number:bus.number, status:bus.status, lat:bus.lat, lng:bus.lng, speed:bus.speed, fuel:bus.fuel } : null,
      driver: driver ? { name:driver.name, phone:driver.phone } : null,
      route: route ? { name:route.name, color:route.color } : null,
      stop: stop || null,
      eta: stop?.eta || '—',
      lastUpdated: bus?.lastUpdate || new Date().toISOString(),
    }
  })
})

// GET /api/parent/links — generate all tracking links for a tenant (admin use)
api.get('/parent/links', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const base = c.req.query('base') || 'https://trackschool.pages.dev'
  // Resolve school code
  const tenant = tenants.find(t => t.id === tenantId)
  const code = tenant?.code || 'DPS'
  const data = students.filter(s => s.tenantId === tenantId).map(s => ({
    studentId: s.id,
    name: s.name,
    class: s.class,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    trackingLink: `${base}/track/${code}/${s.id}`,
    portalLink:   `${base}/track/${code}`,
  }))
  return c.json({ success:true, schoolCode:code, portalLink:`${base}/track/${code}`, count:data.length, data })
})

// GET /api/parent/children — get all children for a parent token
api.get('/parent/children', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ','') || c.req.query('token')
  if (!token) return c.json({ success:false, error:'Token required' }, 401)
  const session = parentTokens[token]
  // For demo mode, accept any token starting with 'demo_' and return sample student
  const studentIds = session?.studentIds || ['st001']
  const myStudents = students.filter(s => studentIds.includes(s.id))
  return c.json({ success:true, data: myStudents.map(st => {
    const bus = buses.find(b => b.id === st.busId)
    const route = routes.find(r => r.id === st.routeId)
    return { id:st.id, name:st.name, class:st.class, status:st.status, busNickname:bus?.nickname, busNumber:bus?.number, busStatus:bus?.status, routeName:route?.name, lat:bus?.lat, lng:bus?.lng, speed:bus?.speed }
  })})
})

// ── ERP API KEYS ──────────────────────────────────────────────
// GET /api/erp/keys/:tenantId — list API keys for tenant
api.get('/erp/keys/:tenantId', (c) => {
  const keys = Object.values(erpApiKeys).filter(k => k.tenantId === c.req.param('tenantId'))
  return c.json({ success:true, data: keys.map(k => ({ ...k, key: k.key.slice(0,8) + '••••••••' })) })
})

// POST /api/erp/keys — generate new ERP API key
api.post('/erp/keys', async (c) => {
  const { tenantId, label, permissions } = await c.req.json()
  const key = 'erk_' + tenantId + '_' + Math.random().toString(36).slice(2,10)
  erpApiKeys[key] = { key, tenantId, label: label||'ERP Integration', createdAt: new Date().toISOString(), permissions: permissions || ['students:read','buses:read'] }
  return c.json({ success:true, key, message:'Copy this key — it will not be shown again' })
})

// DELETE /api/erp/keys/:key — revoke API key
api.delete('/erp/keys/:key', (c) => {
  const fullKey = Object.keys(erpApiKeys).find(k => k.startsWith(c.req.param('key').replace('••••••••','')))
  if (fullKey) delete erpApiKeys[fullKey]
  return c.json({ success:true })
})

// ── ERP INTEGRATION ENDPOINTS (API-key authenticated) ─────────
// POST /api/erp/students/push — ERP pushes student data to TrackSchool
api.post('/erp/students/push', async (c) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('apiKey')
  const keyData = erpApiKeys[apiKey || '']
  if (!keyData) return c.json({ success:false, error:'Invalid API key' }, 401)
  // Update lastUsed
  if (keyData) keyData.lastUsed = new Date().toISOString()
  const body = await c.req.json()
  const incoming = Array.isArray(body) ? body : body.students || []
  let created = 0, updated = 0
  incoming.forEach((s: any) => {
    const idx = students.findIndex(x => x.id === s.id || (x.name === s.name && x.class === s.class && x.tenantId === keyData.tenantId))
    if (idx >= 0) { students[idx] = { ...students[idx], ...s, tenantId:keyData.tenantId }; updated++ }
    else { students.push({ ...s, id: s.id||uid('st'), tenantId:keyData.tenantId, rfidTag: s.rfidTag||uid('RF') }); created++ }
  })
  return c.json({ success:true, created, updated, total:incoming.length, syncedAt: new Date().toISOString() })
})

// POST /api/erp/attendance/push — ERP pushes attendance to TrackSchool
api.post('/erp/attendance/push', async (c) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('apiKey')
  if (!erpApiKeys[apiKey||'']) return c.json({ success:false, error:'Invalid API key' }, 401)
  const body = await c.req.json()
  const records = Array.isArray(body) ? body : body.attendance || []
  let updated = 0
  records.forEach((r: any) => {
    const idx = students.findIndex(s => s.id === r.studentId || s.rfidTag === r.rfidTag)
    if (idx >= 0) { students[idx].status = r.status || r.attendance === 'A' ? 'absent' : 'boarded'; updated++ }
  })
  return c.json({ success:true, updated, syncedAt: new Date().toISOString() })
})

// GET /api/erp/students/sync — ERP pulls student-transport mapping
api.get('/erp/students/sync', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const apiKey = c.req.header('X-API-Key')
  if (apiKey && erpApiKeys[apiKey]) erpApiKeys[apiKey].lastUsed = new Date().toISOString()
  const data = students.filter(s => s.tenantId === tenantId).map(s => ({
    student_id: s.id, name: s.name, class: s.class,
    bus_number: buses.find(b => b.id === s.busId)?.number || '',
    bus_nickname: buses.find(b => b.id === s.busId)?.nickname || '',
    route: routes.find(r => r.id === s.routeId)?.name || '',
    stop: routes.find(r => r.id === s.routeId)?.stops?.find((st: any) => st.id === s.stopId)?.name || '',
    rfid: s.rfidTag, status: s.status, parentPhone: s.parentPhone
  }))
  return c.json({ success: true, sync_time: new Date().toISOString(), count: data.length, data })
})

api.get('/erp/attendance/today', (c) => {
  const tenantId = c.req.query('tenantId') || 't001'
  const st = students.filter(s => s.tenantId === tenantId)
  return c.json({
    success: true, date: new Date().toISOString().slice(0,10),
    summary: { total: st.length, boarded: st.filter(s => s.status === 'boarded').length, absent: st.filter(s => s.status === 'absent').length },
    data: st.map(s => ({ student_id: s.id, name: s.name, class: s.class, rfid: s.rfidTag, attendance: s.status === 'absent' ? 'A' : 'P', boardingStatus: s.status }))
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

// POST /api/erp/webhook/register — register ERP webhook URL
const webhooks: Record<string, { tenantId:string; url:string; events:string[]; secret:string; active:boolean }> = {}
api.post('/erp/webhook/register', async (c) => {
  const body = await c.req.json()
  const id = uid('wh')
  webhooks[id] = { tenantId:body.tenantId, url:body.url, events:body.events||['bus.location','student.boarded','alert.sos'], secret:body.secret||uid('whs'), active:true }
  return c.json({ success:true, webhookId:id, secret:webhooks[id].secret })
})

// ── TEACHER PORTAL API ────────────────────────────────────────
// GET /api/teacher/class/:class — get all students in a class with bus status
api.get('/teacher/class/:className', (c) => {
  const className = c.req.param('className')
  const tenantId = c.req.query('tenantId') || 't001'
  const classStudents = students.filter(s => s.tenantId === tenantId && s.class?.toLowerCase() === className.toLowerCase())
  if (!classStudents.length) return c.json({ success:false, error:'No students found for this class' }, 404)
  const data = classStudents.map(s => {
    const bus = buses.find(b => b.id === s.busId)
    const route = routes.find(r => r.id === s.routeId)
    return { id:s.id, name:s.name, class:s.class, status:s.status, rfid:s.rfidTag, parentName:s.parentName, parentPhone:s.parentPhone, busNickname:bus?.nickname||'—', busNumber:bus?.number||'—', busStatus:bus?.status||'—', routeName:route?.name||'—', speed:bus?.speed||0 }
  })
  return c.json({ success:true, class: className, count:data.length, data })
})

// GET /api/teacher/classes/:tenantId — list all unique classes
api.get('/teacher/classes/:tenantId', (c) => {
  const classes = [...new Set(students.filter(s => s.tenantId === c.req.param('tenantId')).map(s => s.class))].sort()
  return c.json({ success:true, data: classes })
})

// GET /api/teacher/absent/:tenantId — today's absent students
api.get('/teacher/absent/:tenantId', (c) => {
  const absent = students.filter(s => s.tenantId === c.req.param('tenantId') && s.status === 'absent')
  return c.json({ success:true, count:absent.length, data: absent.map(s => ({ id:s.id, name:s.name, class:s.class, parentPhone:s.parentPhone })) })
})

export default api
