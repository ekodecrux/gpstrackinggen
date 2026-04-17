# 🚌 TrackSchool — ERP-Integrated School Transport Intelligence Platform

> Multi-tenant SaaS GPS tracking platform (white-label) built for schools and transport systems.  
> Per-bus pricing · OpenStreetMap · Real-time tracking · ERP Integration · Driver App · Parent Portal

---

## 🌐 Live Demo

**Platform URL:** https://3000-i8ltuxy8fseduhvfv6f0z-ea026bf9.sandbox.novita.ai

| Module | URL | Demo Credentials |
|--------|-----|-----------------|
| 🏠 Landing Page | `/` | — |
| 🔑 Login | `/login` | See below |
| 👑 Super Admin | `/superadmin` | superadmin@trackschool.io / demo123 |
| 🏫 School Admin | `/admin` | admin@dps.edu.in / demo123 |
| 🗺 Live Tracking | `/tracking` | admin@dps.edu.in / demo123 |
| 📱 Driver App | `/driver` | driver@dps.edu.in / demo123 |
| 👨‍👩‍👧 Parent Portal | `/parent` | parent@dps.edu.in / demo123 |
| 🔗 ERP API Docs | `/erp-docs` | — |

---

## 📦 Tech Stack

- **Backend:** Hono (TypeScript) on Cloudflare Workers/Pages
- **Frontend:** Vanilla JS + Tailwind CSS (CDN) + Chart.js + Leaflet.js
- **Maps:** OpenStreetMap + Leaflet.js (ZERO API cost)
- **Build:** Vite + @hono/vite-build
- **Runtime:** Wrangler + PM2 (dev)
- **Auth:** JWT mock (production: real JWT)
- **Storage:** Mock data (production: Cloudflare D1 SQLite)

---

## 🏗️ Architecture

```
TrackSchool/
├── src/
│   ├── index.tsx          ← Main Hono router + all HTML page renderers
│   ├── renderer.tsx       ← JSX renderer
│   ├── routes/
│   │   └── api.ts         ← All REST API endpoints
│   └── data/
│       └── mockData.ts    ← Mock DB (5 tenants, 7 buses, 10 students, etc.)
├── public/
│   └── static/            ← Static assets
├── dist/                  ← Built output (Cloudflare Pages)
├── ecosystem.config.cjs   ← PM2 config
├── wrangler.jsonc         ← Cloudflare config
└── package.json
```

---

## 🚀 Modules Built

### 👑 Super Admin Panel (`/superadmin`)
- **Dashboard:** Platform KPIs — MRR ₹2.36L, 5 tenants, 92 buses, 4,280 students
- **Tenant Management:** View/filter/manage all schools, status toggle, detail modal
- **Billing & Revenue:** MRR/ARR charts, invoice table, overdue tracking
- **Analytics:** City-wise fleet distribution, trip completion rates, NPS=74
- **Settings:** Branding, tracking config, notifications, security

### 🏫 Tenant Admin Panel (`/admin`)
- **Dashboard:** Fleet status, trip summary, live alert feed, student boarding pie chart
- **Bus Management:** Full fleet table with speed, fuel gauge, driver assignment
- **Driver Management:** Rating, trip history, license, bus assignment
- **Student Management:** RFID tags, boarding status, parent contacts, route/stop mapping
- **Route Management:** Interactive map with all 4 routes + stop markers (Leaflet)
- **Alerts:** Filterable alert feed — SOS, speeding, delay, geofence, fuel
- **Reports:** Weekly trip performance, driver radar chart, trip history table

### 🗺️ Live Tracking Dashboard (`/tracking`)
- **Full-screen Leaflet map** with OpenStreetMap tiles (free, no API key)
- **All 7 buses** plotted with color-coded status icons (animated pulse for active)
- **Real-time movement simulation** — buses move every 3 seconds
- **Route polylines** with all stops for 4 routes
- **Bus sidebar** with filter by status/search, click to focus on map
- **Satellite tile toggle** (Esri World Imagery)
- **Info panel:** live counts of on-trip / idle / delayed / alerts / students

### 📱 Driver App (`/driver`)
- **Two-phone preview:** Active trip view + Pre-trip checklist view
- **Live GPS mini-map** with real-time bus movement simulation
- **Trip control:** Start Trip / End Trip buttons
- **Pre-trip checklist** (tyres, fuel, brakes, seatbelts, first aid)
- **SOS Panic Button** — full-screen red button with confirmation
- **Stop-by-stop progress** with ETA for each pickup point
- **Live speed/distance counters** updating every 2 seconds

### 👨‍👩‍👧 Parent Portal (`/parent`)
- **Live bus map** showing exactly where Aarav's bus is
- **Journey timeline** — stop-by-stop boarding progress
- **ETA countdown** to school arrival
- **7-day trip history** with on-time / delayed status
- **Notification preferences** (SMS / Push / Email per event)
- **Driver contact** — one-tap call link

### 🔗 ERP Integration API Docs (`/erp-docs`)
- **Live API console** — click "Try It" buttons to call real APIs
- `GET /api/erp/students/sync` — sync student-bus mapping to ERP
- `GET /api/erp/attendance/today` — transport attendance for ERP auto-fill
- `GET /api/erp/buses/status` — live fleet status JSON
- **Webhook events** list with payload examples
- **PHP/CodeIgniter integration** code example

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/platform/stats` | Platform-wide KPIs |
| GET | `/api/tenants` | All tenants |
| GET | `/api/tenants/:id` | Single tenant |
| GET | `/api/buses?tenantId=` | Fleet for tenant |
| GET | `/api/buses/:id/location` | Live GPS (simulated drift) |
| GET | `/api/drivers?tenantId=` | Drivers for tenant |
| GET | `/api/routes?tenantId=` | Routes with stops |
| GET | `/api/students?tenantId=` | Students |
| GET | `/api/alerts?tenantId=` | Alerts (sorted by time) |
| GET | `/api/trips?tenantId=` | Trip history |
| POST | `/api/auth/login` | Authentication |
| GET | `/api/erp/students/sync` | ERP student sync |
| GET | `/api/erp/attendance/today` | ERP attendance |
| GET | `/api/erp/buses/status` | ERP bus status |

---

## 💰 Pricing Model

| Plan | Price | Buses | Key Features |
|------|-------|-------|--------------|
| Starter | ₹299/bus/mo | Up to 10 | Tracking, Alerts, Parent App |
| Growth | ₹249/bus/mo | Up to 50 | + ERP APIs, Route Optimization |
| Enterprise | ₹199/bus/mo | Unlimited | + White Label, Custom Domain, SLA |

---

## 🗺️ Maps Strategy

- **OpenStreetMap** — completely free, no API keys, no billing surprises
- **Leaflet.js 1.9.4** — lightweight (42KB), full-featured
- **Esri satellite tiles** — free satellite toggle layer
- **Route visualization** — color-coded polylines per route
- **Bus icons** — custom emoji markers with pulse animation for active buses

---

## 📊 Mock Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| Tenants | 5 | DPS Delhi, St. Mary's Mumbai, KV Bengaluru, Ryan Pune, DAV Chandigarh |
| Buses | 7 | Across 3 tenants, with GPS coords |
| Drivers | 7 | With ratings, trip counts, license |
| Routes | 6 | With full stop arrays + ETA |
| Students | 10 | With RFID, parent contacts |
| Alerts | 7 | Covering all severity levels |
| Trips | 6 | Mix of completed/in-progress/delayed |

---

## 🔮 Production Roadmap

### Immediate (Month 1-2)
- [ ] Cloudflare D1 database (replace mock data)
- [ ] Real JWT authentication
- [ ] Cloudflare KV for session management
- [ ] WebSocket via Durable Objects (real-time GPS)

### Short-term (Month 3-4)
- [ ] SMS integration (MSG91 / Twilio)
- [ ] Native mobile app (React Native PWA wrapper)
- [ ] RFID device integration API
- [ ] Actual GPS device SDK (GL300, Teltonika)

### Growth (Month 5-6)
- [ ] Cloudflare Pages white-label deployment per tenant
- [ ] Stripe payment integration (per-bus billing)
- [ ] AI-powered route optimization
- [ ] Driver behavior scoring (acceleration/braking)
- [ ] Geofencing via Cloudflare Workers Cron Triggers

---

## 🛠️ Local Development

```bash
# Start dev server
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Or directly
npm run dev:sandbox  # runs on port 3000

# Rebuild after changes
npm run build && pm2 restart trackschool

# Check logs
pm2 logs trackschool --nostream
```

---

## 🚀 Deploy to Cloudflare Pages

```bash
# Setup auth
npx wrangler login

# Deploy
npm run build
npx wrangler pages deploy dist --project-name trackschool
```

---

**Built with ❤️ for Indian schools | © 2025 TrackSchool Technologies Pvt. Ltd.**
