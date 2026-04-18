# TrackSchool — GPS School Bus Tracking Platform

## 🌐 Production URLs
- **Live App**: https://trackschool.pages.dev
- **GitHub**: https://github.com/ekodecrux/gpstrackinggen
- **Cloudflare Dashboard**: https://dash.cloudflare.com (project: trackschool)

---

## ✅ Completed Features

### Super Admin
- **Dashboard** — MRR/ARR KPIs, fleet distribution charts, recent activity
- **Tenant Management** — Add, edit, activate/deactivate school tenants (full CRUD modal)
- **Billing** — Invoice generation, Razorpay payment buttons, mark-paid, PDF print, revenue charts
- **Analytics** — Bus distribution by city, revenue by plan (pie chart), monthly trend (line chart)
- **Settings** — Tracking config, notification provider config, security/JWT settings (all saved)

### Tenant Admin (School)
- **Dashboard** — Active buses, students today, routes, alerts, live map link
- **Bus Management** — Add/Edit/Delete buses with GPS device & driver assignment
- **Driver Management** — Add/Edit/Delete drivers with license, phone, emergency contact
- **Student Management** — Add/Edit/Delete students with RFID, parent contact, bus/route/stop
- **Route Management** — Add/Edit routes with distance, duration, color coding
- **Alerts** — View, filter, resolve individual/all alerts
- **Reports** — Weekly trip chart, driver performance chart, trip history table, CSV/PDF export
- **AI Assistant** — Groq Llama 3.3 70B powered summaries, anomaly detection, recommendations
- **Settings** — School profile, notification preferences (all saved)
- **Billing** — Razorpay plan upgrade, payment history, subscription status

### Tracking & Portals
- **Live Tracking** — Leaflet map with real-time bus locations, popups, speed/fuel
- **Driver App** — Trip start/end, SOS alert trigger, location sharing
- **Parent Portal** — Student tracking, arrival notifications, phone-based OTP login

### Notifications (All LIVE in production)
- **SMS** — Twilio Messaging API: SOS alerts, arrival, delay, custom
- **OTP** — Twilio Verify: phone login for drivers and parents
- **Email** — MailChannels (Cloudflare Workers production), Gmail SMTP fallback
- **SOS** — Sends dual SMS: emergency contact + admin phone

### Payments
- **Razorpay** — Order creation, HMAC-SHA256 verification, webhook handling
- **Plans** — Starter ₹299/bus, Growth ₹249/bus, Enterprise ₹199/bus
- **Invoice Pay** — Razorpay checkout wired into SuperAdmin billing

---

## 🔑 Environment Variables (Cloudflare Secrets — all set)

| Variable | Description |
|---|---|
| GROQ_API_KEY | Groq LLM API key |
| GROQ_MODEL | llama-3.3-70b-versatile |
| TWILIO_ACCOUNT_SID | (set as secret — starts with AC...) |
| TWILIO_AUTH_TOKEN | (set as secret) |
| TWILIO_VERIFY_SERVICE_SID | (set as secret — starts with VA...) |
| TWILIO_FROM_NUMBER | +16202209833 |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_USER | ekodecrux@gmail.com |
| SMTP_PASS | (set as secret) |
| SMTP_FROM | TrackSchool \<ekodecrux@gmail.com\> |
| ADMIN_PHONE | +919121664855 |
| RAZORPAY_KEY_ID | (set as secret — rzp_test_...) |
| RAZORPAY_KEY_SECRET | (set as secret) |

---

## 🔗 Key API Endpoints

### Auth
- `POST /api/auth/login` — email/password login (returns token + role)

### Buses
- `GET /api/buses?tenantId=t001`
- `POST /api/buses` — Add bus
- `PUT /api/buses/:id` — Edit bus
- `DELETE /api/buses/:id` — Delete bus
- `GET /api/buses/:id/location` — Live GPS location

### Drivers / Students / Routes / Tenants
- Full CRUD: GET, POST, PUT, DELETE for each resource

### Notifications
- `POST /api/notify/sms/send` — Custom SMS
- `POST /api/notify/sms/sos` — SOS alert (dual SMS)
- `POST /api/notify/sms/arrival` — Arrival notification
- `POST /api/notify/otp/send` — Send OTP via Twilio Verify
- `POST /api/notify/otp/verify` — Verify OTP code
- `POST /api/notify/email/welcome` — Welcome email
- `GET /api/notify/status` — Integration health check

### Payments
- `GET /api/pay/plans` — Subscription plans
- `POST /api/pay/order` — Create Razorpay order
- `POST /api/pay/verify` — Verify payment signature
- `POST /api/pay/webhook` — Razorpay webhook handler
- `GET /api/pay/history/:tenantId` — Payment history
- `GET /api/pay/subscription/:tenantId` — Current subscription

### AI
- `POST /api/ai/summary` — Daily ops summary (Groq)
- `POST /api/ai/chat` — Free-form AI assistant
- `POST /api/ai/anomaly` — Anomaly detection

---

## 👤 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@trackschool.io | demo123 |
| School Admin (DPS) | admin@dps.edu | demo123 |
| School Admin (St. Mary's) | admin@stmarys.edu | demo123 |
| Driver | driver@trackschool.io | demo123 |
| Parent | parent@trackschool.io | demo123 |

---

## 🏗️ Tech Stack
- **Backend**: Hono v4 (TypeScript) on Cloudflare Workers
- **Frontend**: Vanilla JS + Tailwind CSS CDN + Leaflet.js + Chart.js
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **SMS/OTP**: Twilio Messaging + Twilio Verify
- **Payments**: Razorpay (test mode)
- **Email**: MailChannels (production), Gmail SMTP (fallback)
- **Deployment**: Cloudflare Pages
- **Build**: Vite 6 + @hono/vite-cloudflare-pages

---

## 📁 Project Structure
```
src/
  index.tsx          — Main app (3400+ lines, all pages + UI)
  routes/
    api.ts           — REST API (buses, drivers, students, tenants, CRUD)
    notifications.ts — Twilio SMS/OTP + MailChannels email
    groq.ts          — Groq AI routes
    razorpay.ts      — Razorpay payment routes
  data/
    mockData.ts      — Seed data for buses, drivers, students, tenants
public/
  static/
    style.css        — Custom styles
```

## 🚀 Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ LIVE
- **Last Deployed**: 2026-04-18
- **Production URL**: https://trackschool.pages.dev
