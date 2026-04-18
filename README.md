# 🚌 TrackSchool — GPS Fleet SaaS Platform

> ERP-Integrated School Transport Intelligence with Groq AI, Twilio SMS/OTP & Gmail Email

[![GitHub](https://img.shields.io/badge/GitHub-ekodecrux%2Fgpstrackinggen-blue?logo=github)](https://github.com/ekodecrux/gpstrackinggen)
[![Stack](https://img.shields.io/badge/Stack-Hono%20%2B%20Cloudflare%20Workers-orange)](https://hono.dev)
[![AI](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-green)](https://groq.com)

---

## 🌐 Live Demo
| URL | Description |
|-----|-------------|
| `/` | Landing page + pricing |
| `/login` | Email login (demo123) |
| `/login/phone` | Phone OTP login (Twilio Verify) |
| `/superadmin` | Super Admin dashboard |
| `/admin` | School Admin dashboard |
| `/tracking` | Live GPS map (Leaflet + OpenStreetMap) |
| `/driver` | Driver PWA with SOS button |
| `/parent` | Parent portal |
| `/admin/ai` | Groq AI Fleet Assistant |
| `/notify-console` | SMS / OTP / Email test console |
| `/erp-docs` | ERP REST API documentation |

---

## 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@trackschool.io | demo123 |
| School Admin | admin@dps.edu.in | demo123 |
| Driver | driver@dps.edu.in | demo123 |
| Parent | parent@dps.edu.in | demo123 |

---

## ✅ Completed Features

### Core Platform
- **Multi-tenant SaaS** — 5 tenants (schools), 7 buses, role-based access
- **Super Admin** — tenant onboarding, billing/MRR charts, analytics, platform settings
- **School Admin** — buses, drivers, students, routes, alerts, reports, settings
- **Live Tracking** — full-screen Leaflet/OpenStreetMap map, 3s GPS simulation, satellite toggle
- **Driver PWA** — active/pre-trip views, stop list, SOS panic button (wired to Twilio)
- **Parent Portal** — live child tracking, journey timeline, notifications, trip history
- **ERP API Docs** — interactive console with 14 REST endpoints + webhook docs
- **Per-bus Pricing** — ₹299 / ₹249 / ₹199 per bus/month tiers

### 🤖 Groq AI Integration (`/api/ai/*`)
| Endpoint | Description |
|----------|-------------|
| `POST /api/ai/chat` | Fleet intelligence chat (Llama 3.3 70B) |
| `POST /api/ai/optimize-route` | AI route optimization analysis |
| `POST /api/ai/driver-analysis` | Driver performance scoring |
| `POST /api/ai/analyze-alerts` | Alert intelligence report |
| `POST /api/ai/predict-eta` | AI ETA prediction |
| `POST /api/ai/daily-summary` | Daily operations summary |

### 📱 Twilio SMS (`/api/notify/sms/*`)
| Endpoint | Description |
|----------|-------------|
| `POST /sms/send` | Custom SMS to any number |
| `POST /sms/sos` | SOS panic → emergency contacts + admin |
| `POST /sms/arrival` | Bus arriving at stop → parent |
| `POST /sms/delay` | Delay alert → all parents on bus |

### 🔐 Twilio Verify OTP (`/api/notify/otp/*`)
| Endpoint | Description |
|----------|-------------|
| `POST /otp/send` | Send 6-digit OTP via SMS |
| `POST /otp/verify` | Verify OTP → JWT + role redirect |

### 📧 Email (`/api/notify/email/*`)
| Endpoint | Description |
|----------|-------------|
| `POST /email/send` | Custom email |
| `POST /email/welcome` | New tenant onboarding email |
| `POST /email/alert` | Alert notification to school admin |
| `POST /email/daily-report` | AI-generated daily summary email |

---

## 🔧 Tech Stack
- **Backend:** Hono 4 on Cloudflare Workers (edge-first)
- **Frontend:** Tailwind CSS CDN + Chart.js + Leaflet.js + FontAwesome
- **Maps:** OpenStreetMap (zero cost) via Leaflet.js
- **AI:** Groq API — Llama 3.3 70B Versatile (ultra-fast inference)
- **SMS/OTP:** Twilio Messaging + Twilio Verify
- **Email:** MailChannels (free on CF Workers) + Gmail SMTP fallback
- **Build:** Vite + @hono/vite-cloudflare-pages
- **Runtime:** Cloudflare Pages + Workers

---

## ⚙️ Configuration (`.dev.vars`)

```env
# Groq AI — https://console.groq.com
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Twilio — https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=<get from Twilio Console → Account Info>
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=<your Twilio purchased number e.g. +12025551234>

# Gmail SMTP (App Password)
SMTP_USER=your@gmail.com
SMTP_PASS=<16-char Gmail App Password>

# Admin contact for SOS alerts
ADMIN_PHONE=+91XXXXXXXXXX
```

> ⚠️ **To activate SMS/OTP:** Get your `TWILIO_AUTH_TOKEN` from [Twilio Console](https://console.twilio.com) under **Account Info**. Also add a purchased Twilio phone number as `TWILIO_FROM_NUMBER`.

---

## 🚀 Local Development

```bash
# Install
npm install

# Build
npm run build

# Start (PM2)
pm2 start ecosystem.config.cjs

# Visit
open http://localhost:3000
```

---

## 📦 Cloudflare Deployment

```bash
# Deploy to production
npm run deploy

# Set secrets
npx wrangler pages secret put GROQ_API_KEY --project-name gpstrackinggen
npx wrangler pages secret put TWILIO_ACCOUNT_SID --project-name gpstrackinggen
npx wrangler pages secret put TWILIO_AUTH_TOKEN --project-name gpstrackinggen
npx wrangler pages secret put TWILIO_VERIFY_SERVICE_SID --project-name gpstrackinggen
npx wrangler pages secret put TWILIO_FROM_NUMBER --project-name gpstrackinggen
npx wrangler pages secret put SMTP_USER --project-name gpstrackinggen
npx wrangler pages secret put SMTP_PASS --project-name gpstrackinggen
npx wrangler pages secret put ADMIN_PHONE --project-name gpstrackinggen
```

---

## 📋 Remaining / Next Steps

- [ ] Add Cloudflare D1 database to replace mock data
- [ ] Real-time WebSocket GPS via Cloudflare Durable Objects
- [ ] Stripe per-bus subscription billing
- [ ] RFID student boarding event integration
- [ ] White-label custom domain per tenant
- [ ] Push notifications (FCM / Web Push)
- [ ] Mobile app (React Native / Flutter) wrapping the PWA

---

## 📁 Project Structure
```
webapp/
├── src/
│   ├── index.tsx          # All pages (Landing, Admin, Tracking, Driver, Parent, AI…)
│   ├── routes/
│   │   ├── api.ts         # REST API (buses, drivers, students, ERP sync…)
│   │   ├── groq.ts        # Groq AI endpoints
│   │   └── notifications.ts # Twilio SMS/OTP + Email endpoints
│   └── data/
│       └── mockData.ts    # Mock fleet data (replace with D1 DB)
├── public/static/         # Static assets
├── .dev.vars              # Local secrets (NOT committed)
├── ecosystem.config.cjs   # PM2 config
└── wrangler.jsonc         # Cloudflare Pages config
```

---

*© 2025 TrackSchool Technologies Pvt. Ltd. | Made with ❤️ in India*
