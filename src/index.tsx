import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import api from './routes/api'

const app = new Hono()

// ── Static assets ─────────────────────────────────────────────
app.use('/static/*', serveStatic({ root: './public' }))

// ── API Routes ────────────────────────────────────────────────
app.route('/api', api)

// ── LANDING PAGE ──────────────────────────────────────────────
app.get('/', (c) => c.html(landingPage()))

// ── AUTH ──────────────────────────────────────────────────────
app.get('/login', (c) => c.html(loginPage()))

// ── SUPER ADMIN ───────────────────────────────────────────────
app.get('/superadmin', (c) => c.html(superAdminPage()))
app.get('/superadmin/tenants', (c) => c.html(superAdminPage('tenants')))
app.get('/superadmin/billing', (c) => c.html(superAdminPage('billing')))
app.get('/superadmin/analytics', (c) => c.html(superAdminPage('analytics')))
app.get('/superadmin/settings', (c) => c.html(superAdminPage('settings')))

// ── TENANT ADMIN ─────────────────────────────────────────────
app.get('/admin', (c) => c.html(tenantAdminPage()))
app.get('/admin/buses', (c) => c.html(tenantAdminPage('buses')))
app.get('/admin/drivers', (c) => c.html(tenantAdminPage('drivers')))
app.get('/admin/students', (c) => c.html(tenantAdminPage('students')))
app.get('/admin/routes', (c) => c.html(tenantAdminPage('routes')))
app.get('/admin/alerts', (c) => c.html(tenantAdminPage('alerts')))
app.get('/admin/reports', (c) => c.html(tenantAdminPage('reports')))
app.get('/admin/settings', (c) => c.html(tenantAdminPage('settings')))

// ── LIVE TRACKING ─────────────────────────────────────────────
app.get('/tracking', (c) => c.html(trackingPage()))

// ── DRIVER APP ────────────────────────────────────────────────
app.get('/driver', (c) => c.html(driverAppPage()))

// ── PARENT PORTAL ─────────────────────────────────────────────
app.get('/parent', (c) => c.html(parentPortalPage()))

// ── ERP API DOCS ──────────────────────────────────────────────
app.get('/erp-docs', (c) => c.html(erpDocsPage()))

export default app

// ════════════════════════════════════════════════════════════════
// SHARED STYLES & SCRIPTS
// ════════════════════════════════════════════════════════════════
function sharedHead(title: string, extra = '') {
  return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — TrackSchool</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚌</text></svg>">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
${extra}
<style>
  :root { --primary:#1a73e8; --dark:#0d47a1; --accent:#00c853; }
  * { box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; margin:0; }
  .sidebar { width:260px; min-height:100vh; background:linear-gradient(180deg,#0d1b2a 0%,#1a2a3a 100%); color:#fff; position:fixed; top:0; left:0; z-index:100; transition:.3s; overflow-y:auto; }
  .sidebar .logo { padding:20px; border-bottom:1px solid rgba(255,255,255,.1); display:flex; align-items:center; gap:10px; }
  .sidebar .logo span { font-size:1.4rem; font-weight:800; letter-spacing:-.5px; color:#fff; }
  .sidebar .logo small { display:block; font-size:.65rem; color:#90caf9; font-weight:400; }
  .sidebar nav a { display:flex; align-items:center; gap:12px; padding:12px 20px; color:rgba(255,255,255,.75); text-decoration:none; transition:.2s; font-size:.875rem; border-left:3px solid transparent; }
  .sidebar nav a:hover, .sidebar nav a.active { color:#fff; background:rgba(255,255,255,.08); border-left-color:#1a73e8; }
  .sidebar nav a i { width:20px; text-align:center; }
  .sidebar nav .section-title { padding:16px 20px 6px; font-size:.65rem; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:1px; font-weight:600; }
  .main-content { margin-left:260px; min-height:100vh; background:#f0f2f5; }
  .topbar { background:#fff; padding:0 24px; height:64px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e0e0e0; position:sticky; top:0; z-index:99; }
  .topbar h1 { font-size:1.25rem; font-weight:700; color:#1a1a2e; margin:0; }
  .page { padding:24px; }
  .card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
  .stat-card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08); display:flex; align-items:center; gap:16px; }
  .stat-card .icon { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; }
  .stat-card .value { font-size:1.8rem; font-weight:800; color:#1a1a2e; line-height:1; }
  .stat-card .label { font-size:.8rem; color:#666; margin-top:4px; }
  .stat-card .change { font-size:.75rem; margin-top:4px; }
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:.72rem; font-weight:600; }
  .badge.active, .badge.on_trip { background:#e8f5e9; color:#2e7d32; }
  .badge.idle, .badge.info { background:#e3f2fd; color:#1565c0; }
  .badge.delayed { background:#fff3e0; color:#e65100; }
  .badge.trial { background:#f3e5f5; color:#6a1b9a; }
  .badge.suspended { background:#ffebee; color:#c62828; }
  .badge.critical { background:#ffebee; color:#b71c1c; }
  .badge.high { background:#fff3e0; color:#bf360c; }
  .badge.medium { background:#fff8e1; color:#f57f17; }
  .badge.low { background:#f1f8e9; color:#33691e; }
  .badge.boarded { background:#e8f5e9; color:#2e7d32; }
  .badge.absent { background:#ffebee; color:#c62828; }
  .badge.at_stop { background:#fff8e1; color:#f57f17; }
  .badge.completed { background:#e8f5e9; color:#2e7d32; }
  .badge.in_progress { background:#e3f2fd; color:#1565c0; }
  .badge.on_duty { background:#e8f5e9; color:#2e7d32; }
  .badge.off_duty { background:#f5f5f5; color:#757575; }
  table { width:100%; border-collapse:collapse; }
  thead th { background:#f8f9fa; padding:12px 16px; text-align:left; font-size:.78rem; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.5px; }
  tbody tr { border-bottom:1px solid #f0f0f0; transition:.15s; }
  tbody tr:hover { background:#f9f9f9; }
  tbody td { padding:13px 16px; font-size:.875rem; color:#333; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:8px; font-size:.875rem; font-weight:600; cursor:pointer; border:none; transition:.2s; text-decoration:none; }
  .btn-primary { background:#1a73e8; color:#fff; }
  .btn-primary:hover { background:#1565c0; }
  .btn-success { background:#00c853; color:#fff; }
  .btn-success:hover { background:#00a844; }
  .btn-danger  { background:#f44336; color:#fff; }
  .btn-danger:hover  { background:#d32f2f; }
  .btn-outline { background:transparent; color:#1a73e8; border:1.5px solid #1a73e8; }
  .btn-outline:hover { background:#e8f0fe; }
  .btn-sm { padding:6px 12px; font-size:.78rem; }
  .form-group { margin-bottom:16px; }
  .form-group label { display:block; font-size:.82rem; font-weight:600; color:#444; margin-bottom:6px; }
  .form-group input, .form-group select, .form-group textarea { width:100%; padding:10px 14px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:.875rem; outline:none; transition:.2s; }
  .form-group input:focus, .form-group select:focus { border-color:#1a73e8; box-shadow:0 0 0 3px rgba(26,115,232,.12); }
  .alert-banner { padding:12px 16px; border-radius:8px; font-size:.85rem; margin-bottom:12px; display:flex; align-items:center; gap:10px; }
  .alert-banner.critical { background:#ffebee; color:#c62828; border-left:4px solid #f44336; }
  .alert-banner.high { background:#fff3e0; color:#bf360c; border-left:4px solid #ff9800; }
  .alert-banner.medium { background:#fff8e1; color:#f57f17; border-left:4px solid #ffc107; }
  .alert-banner.low { background:#f1f8e9; color:#33691e; border-left:4px solid #8bc34a; }
  .alert-banner.info { background:#e3f2fd; color:#1565c0; border-left:4px solid #2196f3; }
  .map-container { border-radius:12px; overflow:hidden; border:1px solid #e0e0e0; }
  #map { height:500px; }
  .pulse { animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
  .live-dot { width:10px; height:10px; border-radius:50%; background:#00c853; display:inline-block; animation:pulse 1.5s infinite; }
  .tab-nav { display:flex; gap:4px; margin-bottom:20px; background:#f0f2f5; padding:4px; border-radius:10px; }
  .tab-btn { padding:8px 16px; border-radius:8px; font-size:.85rem; font-weight:600; cursor:pointer; border:none; background:transparent; color:#666; transition:.2s; }
  .tab-btn.active { background:#fff; color:#1a73e8; box-shadow:0 1px 3px rgba(0,0,0,.1); }
  .sidebar-toggle { display:none; background:none; border:none; font-size:1.4rem; cursor:pointer; color:#333; }
  @media(max-width:768px) {
    .sidebar { transform:translateX(-260px); }
    .sidebar.open { transform:translateX(0); }
    .main-content { margin-left:0; }
    .sidebar-toggle { display:block; }
    .stats-grid { grid-template-columns:1fr 1fr!important; }
  }
  .progress-bar { height:6px; background:#e0e0e0; border-radius:4px; overflow:hidden; }
  .progress-bar .fill { height:100%; border-radius:4px; transition:.5s; }
  .tooltip { position:relative; }
  .toast { position:fixed; bottom:20px; right:20px; z-index:9999; }
  .toast-item { background:#333; color:#fff; padding:12px 20px; border-radius:10px; margin-top:8px; font-size:.85rem; animation:slideIn .3s ease; display:flex; align-items:center; gap:8px; min-width:280px; box-shadow:0 4px 12px rgba(0,0,0,.3); }
  @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
  @media(max-width:1024px) { .grid-4{grid-template-columns:repeat(2,1fr);} .grid-3{grid-template-columns:repeat(2,1fr);} }
  @media(max-width:640px) { .grid-4,.grid-3,.grid-2{grid-template-columns:1fr;} }
</style>`
}

function toastScript() {
  return `
<div class="toast" id="toast-container"></div>
<script>
function showToast(msg, type='success') {
  const colors = {success:'#00c853',error:'#f44336',warning:'#ff9800',info:'#2196f3'};
  const icons  = {success:'✓',error:'✕',warning:'⚠',info:'ℹ'};
  const t = document.createElement('div');
  t.className = 'toast-item';
  t.style.borderLeft = '4px solid ' + (colors[type]||colors.info);
  t.innerHTML = '<span style="font-size:1rem">' + (icons[type]||'') + '</span>' + msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
</script>`
}

function sidebarLayout(activePage: string, role: 'super' | 'tenant', content: string, pageTitle: string) {
  const superNav = `
    <div class="section-title">Overview</div>
    <a href="/superadmin" class="${activePage==='dashboard'?'active':''}"><i class="fa fa-gauge-high"></i> Dashboard</a>
    <a href="/superadmin/tenants" class="${activePage==='tenants'?'active':''}"><i class="fa fa-building"></i> Tenants</a>
    <a href="/superadmin/billing" class="${activePage==='billing'?'active':''}"><i class="fa fa-credit-card"></i> Billing</a>
    <a href="/superadmin/analytics" class="${activePage==='analytics'?'active':''}"><i class="fa fa-chart-bar"></i> Analytics</a>
    <div class="section-title">Config</div>
    <a href="/superadmin/settings" class="${activePage==='settings'?'active':''}"><i class="fa fa-gear"></i> Platform Settings</a>
    <a href="/erp-docs"><i class="fa fa-code"></i> ERP API Docs</a>
    <div class="section-title">Switch View</div>
    <a href="/admin"><i class="fa fa-school"></i> Tenant Admin</a>
    <a href="/tracking"><i class="fa fa-map"></i> Live Tracking</a>`

  const tenantNav = `
    <div class="section-title">Overview</div>
    <a href="/admin" class="${activePage==='dashboard'?'active':''}"><i class="fa fa-gauge-high"></i> Dashboard</a>
    <a href="/tracking" class="${activePage==='tracking'?'active':''}"><i class="fa fa-map"></i> Live Tracking</a>
    <a href="/admin/alerts" class="${activePage==='alerts'?'active':''}"><i class="fa fa-bell"></i> Alerts <span style="background:#f44336;color:#fff;border-radius:10px;padding:1px 7px;font-size:.7rem;margin-left:auto">4</span></a>
    <div class="section-title">Management</div>
    <a href="/admin/buses" class="${activePage==='buses'?'active':''}"><i class="fa fa-bus"></i> Buses</a>
    <a href="/admin/drivers" class="${activePage==='drivers'?'active':''}"><i class="fa fa-id-badge"></i> Drivers</a>
    <a href="/admin/students" class="${activePage==='students'?'active':''}"><i class="fa fa-users"></i> Students</a>
    <a href="/admin/routes" class="${activePage==='routes'?'active':''}"><i class="fa fa-route"></i> Routes</a>
    <div class="section-title">Reports</div>
    <a href="/admin/reports" class="${activePage==='reports'?'active':''}"><i class="fa fa-file-lines"></i> Reports</a>
    <div class="section-title">Switch View</div>
    <a href="/superadmin"><i class="fa fa-crown"></i> Super Admin</a>
    <a href="/driver"><i class="fa fa-mobile"></i> Driver App</a>
    <a href="/parent"><i class="fa fa-heart"></i> Parent Portal</a>`

  const logoLabel = role === 'super' ? 'Super Admin' : 'DPS Admin'
  const nav = role === 'super' ? superNav : tenantNav

  return `<!DOCTYPE html>
<html lang="en">
<head>${sharedHead(pageTitle)}</head>
<body>
<div class="sidebar" id="sidebar">
  <div class="logo">
    <span>🚌</span>
    <div>
      <span>TrackSchool</span>
      <small>${logoLabel}</small>
    </div>
  </div>
  <nav>
    ${nav}
    <div style="padding:20px;margin-top:auto;">
      <a href="/login" style="color:rgba(255,255,255,.5);font-size:.8rem;"><i class="fa fa-right-from-bracket"></i> Logout</a>
    </div>
  </nav>
</div>
<div class="main-content">
  <div class="topbar">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="sidebar-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="fa fa-bars"></i></button>
      <h1>${pageTitle}</h1>
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <span style="font-size:.8rem;color:#666;"><span class="live-dot"></span> Live</span>
      <div style="width:36px;height:36px;border-radius:50%;background:#1a73e8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;cursor:pointer">A</div>
    </div>
  </div>
  <div class="page">${content}</div>
</div>
${toastScript()}
</body></html>`
}


// ════════════════════════════════════════════════════════════════
// LANDING PAGE
// ════════════════════════════════════════════════════════════════
function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('School Transport Intelligence Platform')}
<style>
  body { background:#0a0f1e; color:#fff; }
  .hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 20px; background:radial-gradient(ellipse at top, #1a2a4a 0%, #0a0f1e 60%); position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a73e8' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
  .hero-badge { background:rgba(26,115,232,.2); border:1px solid rgba(26,115,232,.4); color:#90caf9; padding:6px 18px; border-radius:20px; font-size:.8rem; font-weight:600; margin-bottom:24px; display:inline-block; }
  .hero h1 { font-size:clamp(2.4rem,5vw,4rem); font-weight:900; margin:0 0 16px; line-height:1.1; }
  .hero h1 span { background:linear-gradient(135deg,#1a73e8,#00c853); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .hero p { font-size:1.15rem; color:rgba(255,255,255,.7); max-width:600px; margin:0 auto 36px; line-height:1.7; }
  .hero-cta { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; }
  .hero-cta a { padding:14px 28px; border-radius:10px; font-size:1rem; font-weight:700; text-decoration:none; transition:.2s; }
  .hero-cta .cta-main { background:linear-gradient(135deg,#1a73e8,#1565c0); color:#fff; box-shadow:0 8px 24px rgba(26,115,232,.4); }
  .hero-cta .cta-main:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(26,115,232,.5); }
  .hero-cta .cta-out { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.3); }
  .hero-cta .cta-out:hover { background:rgba(255,255,255,.08); }
  .stats-row { display:flex; gap:40px; flex-wrap:wrap; justify-content:center; margin-top:64px; padding:32px; background:rgba(255,255,255,.04); border-radius:16px; border:1px solid rgba(255,255,255,.08); }
  .stat-item { text-align:center; }
  .stat-item .n { font-size:2rem; font-weight:800; color:#1a73e8; }
  .stat-item .l { font-size:.8rem; color:rgba(255,255,255,.5); margin-top:4px; }
  .features { padding:80px 20px; background:#0d1421; }
  .features h2 { text-align:center; font-size:2rem; font-weight:800; margin-bottom:48px; }
  .features h2 span { color:#1a73e8; }
  .feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; max-width:1100px; margin:0 auto; }
  .feature-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:28px; transition:.2s; }
  .feature-card:hover { background:rgba(26,115,232,.08); border-color:rgba(26,115,232,.3); transform:translateY(-4px); }
  .feature-card .fi { font-size:2.2rem; margin-bottom:16px; }
  .feature-card h3 { font-size:1.1rem; font-weight:700; margin:0 0 8px; }
  .feature-card p { color:rgba(255,255,255,.6); font-size:.875rem; line-height:1.6; margin:0; }
  .pricing { padding:80px 20px; background:#0a0f1e; }
  .pricing h2 { text-align:center; font-size:2rem; font-weight:800; margin-bottom:48px; }
  .price-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; max-width:900px; margin:0 auto; }
  .price-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:32px; position:relative; }
  .price-card.popular { border-color:#1a73e8; background:rgba(26,115,232,.08); }
  .price-card .popular-tag { position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#1a73e8; color:#fff; font-size:.72rem; font-weight:700; padding:4px 14px; border-radius:20px; }
  .price-card h3 { font-size:1.1rem; font-weight:700; margin:0 0 8px; }
  .price-card .price { font-size:2.4rem; font-weight:900; color:#1a73e8; }
  .price-card .price span { font-size:.9rem; font-weight:400; color:rgba(255,255,255,.5); }
  .price-card ul { list-style:none; padding:0; margin:20px 0 28px; }
  .price-card ul li { padding:6px 0; font-size:.875rem; color:rgba(255,255,255,.7); display:flex; align-items:center; gap:8px; }
  .price-card ul li::before { content:'✓'; color:#00c853; font-weight:700; }
  .price-card a { display:block; text-align:center; padding:12px; border-radius:8px; font-weight:700; text-decoration:none; transition:.2s; }
  .price-card.popular a { background:#1a73e8; color:#fff; }
  .price-card a:not(.popular a) { border:1.5px solid rgba(255,255,255,.2); color:#fff; }
  .modules-section { padding:80px 20px; background:#0d1421; }
  .modules-section h2 { text-align:center; font-size:2rem; font-weight:800; margin-bottom:16px; }
  .modules-section p.sub { text-align:center; color:rgba(255,255,255,.5); margin-bottom:48px; }
  .module-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; max-width:1100px; margin:0 auto; }
  .module-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:24px; text-align:center; text-decoration:none; color:#fff; transition:.2s; }
  .module-card:hover { background:rgba(26,115,232,.1); border-color:#1a73e8; transform:translateY(-3px); }
  .module-card .icon { font-size:2.4rem; margin-bottom:12px; }
  .module-card h3 { font-size:.95rem; font-weight:700; margin:0 0 6px; }
  .module-card p { font-size:.78rem; color:rgba(255,255,255,.5); margin:0; }
  footer { background:#060a12; padding:32px 20px; text-align:center; color:rgba(255,255,255,.3); font-size:.82rem; }
</style>
</head>
<body>
<!-- NAV -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(10,15,30,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07)">
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font-size:1.8rem">🚌</span>
    <span style="font-size:1.25rem;font-weight:800;color:#fff">TrackSchool</span>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <a href="#features" style="color:rgba(255,255,255,.7);text-decoration:none;font-size:.875rem">Features</a>
    <a href="#pricing" style="color:rgba(255,255,255,.7);text-decoration:none;font-size:.875rem">Pricing</a>
    <a href="/erp-docs" style="color:rgba(255,255,255,.7);text-decoration:none;font-size:.875rem">API</a>
    <a href="/login" style="background:#1a73e8;color:#fff;padding:9px 22px;border-radius:8px;text-decoration:none;font-size:.875rem;font-weight:700">Login →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" style="padding-top:80px">
  <div class="hero-badge">🏆 India's #1 School Transport Intelligence Platform</div>
  <h1>Smart GPS Tracking<br>for <span>Schools & Transport</span></h1>
  <p>Real-time bus tracking, ERP integration, parent notifications, and driver app — all in one white-label SaaS platform trusted by 500+ institutions.</p>
  <div class="hero-cta">
    <a href="/login" class="cta-main">🚀 Start Free Trial</a>
    <a href="/tracking" class="cta-out">🗺 Live Demo</a>
  </div>
  <div class="stats-row">
    <div class="stat-item"><div class="n">500+</div><div class="l">Schools Onboarded</div></div>
    <div class="stat-item"><div class="n">8,200+</div><div class="l">Buses Tracked Daily</div></div>
    <div class="stat-item"><div class="n">2.4M+</div><div class="l">Students Protected</div></div>
    <div class="stat-item"><div class="n">99.7%</div><div class="l">Uptime SLA</div></div>
    <div class="stat-item"><div class="n">₹199</div><div class="l">Per Bus / Month</div></div>
  </div>
</section>

<!-- MODULES -->
<section class="modules-section" id="modules">
  <h2>Complete Platform <span style="color:#1a73e8">Ecosystem</span></h2>
  <p class="sub">Every stakeholder gets their own purpose-built interface</p>
  <div class="module-cards">
    <a href="/superadmin" class="module-card">
      <div class="icon">👑</div>
      <h3>Super Admin</h3>
      <p>Manage all tenants, billing, analytics & white-label config</p>
    </a>
    <a href="/admin" class="module-card">
      <div class="icon">🏫</div>
      <h3>School Admin</h3>
      <p>Buses, drivers, students, routes & real-time notifications</p>
    </a>
    <a href="/tracking" class="module-card">
      <div class="icon">🗺️</div>
      <h3>Live Tracking</h3>
      <p>OpenStreetMap-powered real-time fleet map with ETAs</p>
    </a>
    <a href="/driver" class="module-card">
      <div class="icon">📱</div>
      <h3>Driver App</h3>
      <p>GPS broadcasting, trip control, SOS panic button</p>
    </a>
    <a href="/parent" class="module-card">
      <div class="icon">👨‍👩‍👧</div>
      <h3>Parent Portal</h3>
      <p>Track your child's bus live, get arrival notifications</p>
    </a>
    <a href="/erp-docs" class="module-card">
      <div class="icon">🔗</div>
      <h3>ERP Integration</h3>
      <p>REST APIs for attendance, student sync & transport fees</p>
    </a>
  </div>
</section>

<!-- FEATURES -->
<section class="features" id="features">
  <h2>Why Schools Choose <span>TrackSchool</span></h2>
  <div class="feature-grid">
    <div class="feature-card"><div class="fi">🗺️</div><h3>Zero-Cost Maps</h3><p>OpenStreetMap + Leaflet.js — no Google Maps billing surprises. Full control, zero API costs, works everywhere.</p></div>
    <div class="feature-card"><div class="fi">⚡</div><h3>Real-Time Tracking</h3><p>GPS updates every 5 seconds via WebSocket. Live ETA calculation, geofence alerts, route deviation detection.</p></div>
    <div class="feature-card"><div class="fi">📱</div><h3>Driver Mobile App</h3><p>Lightweight PWA — drivers start/stop trips, system tracks GPS, one-tap SOS panic button for emergencies.</p></div>
    <div class="feature-card"><div class="fi">🔗</div><h3>ERP Integration</h3><p>REST APIs connect with your existing ERP for student sync, attendance auto-fill, and transport fee management.</p></div>
    <div class="feature-card"><div class="fi">🏷️</div><h3>White Label Ready</h3><p>Custom domain, logo, colors per school. Each institution gets their branded experience on schoolname.trackschool.io.</p></div>
    <div class="feature-card"><div class="fi">🔔</div><h3>Smart Alerts</h3><p>Geofencing, speeding, delay, SOS, deviation — instant push/SMS notifications to parents and administrators.</p></div>
    <div class="feature-card"><div class="fi">📊</div><h3>Analytics & Reports</h3><p>Trip history, driver behavior scores, fuel tracking, attendance correlation — full operational intelligence.</p></div>
    <div class="feature-card"><div class="fi">🔐</div><h3>Multi-Tenant Security</h3><p>Data isolation per tenant, JWT auth, role-based access, audit logs. Enterprise-grade security at starter prices.</p></div>
    <div class="feature-card"><div class="fi">📡</div><h3>Offline Resilient</h3><p>Driver app caches GPS data during poor connectivity and syncs when back online. Works in rural areas.</p></div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="pricing">
  <h2>Simple Per-Bus Pricing</h2>
  <div class="price-grid">
    <div class="price-card">
      <h3>Starter</h3>
      <div class="price">₹299 <span>/ bus / month</span></div>
      <ul>
        <li>Up to 10 buses</li>
        <li>Live tracking</li>
        <li>Alerts & notifications</li>
        <li>Parent app</li>
        <li>Basic reports</li>
        <li>Email support</li>
      </ul>
      <a href="/login">Get Started</a>
    </div>
    <div class="price-card popular">
      <div class="popular-tag">MOST POPULAR</div>
      <h3>Growth</h3>
      <div class="price">₹249 <span>/ bus / month</span></div>
      <ul>
        <li>Up to 50 buses</li>
        <li>Everything in Starter</li>
        <li>ERP Integration APIs</li>
        <li>Route optimization</li>
        <li>Advanced analytics</li>
        <li>Priority support</li>
      </ul>
      <a href="/login" style="background:#1a73e8;color:#fff;border-radius:8px;padding:12px;display:block;text-align:center;font-weight:700;text-decoration:none">Start Free Trial</a>
    </div>
    <div class="price-card">
      <h3>Enterprise</h3>
      <div class="price">₹199 <span>/ bus / month</span></div>
      <ul>
        <li>Unlimited buses</li>
        <li>Everything in Growth</li>
        <li>White-label branding</li>
        <li>Custom domain</li>
        <li>SLA guarantee</li>
        <li>Dedicated support</li>
      </ul>
      <a href="/login">Contact Sales</a>
    </div>
  </div>
</section>

<footer>
  <p>🚌 <strong>TrackSchool</strong> — ERP-Integrated School Transport Intelligence Platform</p>
  <p style="margin-top:8px">© 2025 TrackSchool Technologies Pvt. Ltd. | support@trackschool.io | Made with ❤️ in India</p>
</footer>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════
function loginPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('Login')}
<style>
  body { background:linear-gradient(135deg,#0d1b2a 0%,#1a3a5c 100%); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .login-card { background:#fff; border-radius:20px; padding:40px; width:100%; max-width:440px; box-shadow:0 24px 64px rgba(0,0,0,.3); }
  .login-card h2 { font-size:1.6rem; font-weight:800; color:#1a1a2e; margin:0 0 4px; }
  .login-card p { color:#666; font-size:.875rem; margin:0 0 28px; }
  .role-selector { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:24px; }
  .role-btn { padding:12px; border-radius:8px; border:2px solid #e0e0e0; background:#f8f9fa; cursor:pointer; text-align:center; transition:.2s; }
  .role-btn:hover { border-color:#1a73e8; background:#e8f0fe; }
  .role-btn.selected { border-color:#1a73e8; background:#e8f0fe; color:#1a73e8; }
  .role-btn .ri { font-size:1.4rem; margin-bottom:4px; }
  .role-btn span { display:block; font-size:.75rem; font-weight:600; }
  .demo-creds { background:#f0f7ff; border:1px solid #bbdefb; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:.78rem; color:#1565c0; }
  .demo-creds strong { display:block; margin-bottom:4px; }
</style>
</head>
<body>
<div class="login-card">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:2.8rem">🚌</span>
    <h2>TrackSchool</h2>
    <p>Sign in to your account</p>
  </div>
  
  <div class="role-selector" id="roleSelector">
    <div class="role-btn selected" onclick="selectRole('super_admin',this)" data-email="superadmin@trackschool.io">
      <div class="ri">👑</div><span>Super Admin</span>
    </div>
    <div class="role-btn" onclick="selectRole('tenant_admin',this)" data-email="admin@dps.edu.in">
      <div class="ri">🏫</div><span>School Admin</span>
    </div>
    <div class="role-btn" onclick="selectRole('driver',this)" data-email="driver@dps.edu.in">
      <div class="ri">🚌</div><span>Driver</span>
    </div>
    <div class="role-btn" onclick="selectRole('parent',this)" data-email="parent@dps.edu.in">
      <div class="ri">👨‍👩‍👧</div><span>Parent</span>
    </div>
  </div>

  <div class="demo-creds" id="demoCreds">
    <strong>📋 Demo Credentials</strong>
    Email: <b id="demoEmail">superadmin@trackschool.io</b><br>
    Password: <b>demo123</b>
  </div>

  <form onsubmit="handleLogin(event)">
    <div class="form-group">
      <label>Email Address</label>
      <input type="email" id="email" value="superadmin@trackschool.io" placeholder="Enter email" required>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="password" value="demo123" placeholder="Enter password" required>
    </div>
    <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:1rem" id="loginBtn">
      <i class="fa fa-right-to-bracket"></i> Sign In
    </button>
  </form>
  
  <p style="text-align:center;margin-top:16px;font-size:.8rem;color:#666">
    <a href="/" style="color:#1a73e8">← Back to Home</a>
  </p>
</div>

${toastScript()}
<script>
let currentRole = 'super_admin';
function selectRole(role, el) {
  currentRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const email = el.dataset.email;
  document.getElementById('email').value = email;
  document.getElementById('demoEmail').textContent = email;
}
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Signing in...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('ts_token', data.data.token);
      localStorage.setItem('ts_role', data.data.role);
      localStorage.setItem('ts_name', data.data.name);
      if (data.data.tenantId) localStorage.setItem('ts_tenant', data.data.tenantId);
      showToast('Welcome back, ' + data.data.name + '!', 'success');
      setTimeout(() => {
        const routes = { super_admin:'/superadmin', tenant_admin:'/admin', driver:'/driver', parent:'/parent' };
        window.location.href = routes[data.data.role] || '/';
      }, 800);
    } else {
      showToast('Invalid credentials. Use demo123 as password.', 'error');
      btn.innerHTML = '<i class="fa fa-right-to-bracket"></i> Sign In';
      btn.disabled = false;
    }
  } catch(err) {
    showToast('Login failed. Please try again.', 'error');
    btn.innerHTML = '<i class="fa fa-right-to-bracket"></i> Sign In';
    btn.disabled = false;
  }
}
</script>
</body></html>`
}

// ════════════════════════════════════════════════════════════════
// SUPER ADMIN PAGE
// ════════════════════════════════════════════════════════════════
function superAdminPage(section = 'dashboard'): string {
  let content = ''
  let title = 'Super Admin'

  if (section === 'dashboard') {
    title = 'Platform Dashboard'
    content = superAdminDashboard()
  } else if (section === 'tenants') {
    title = 'Tenant Management'
    content = superAdminTenants()
  } else if (section === 'billing') {
    title = 'Billing & Revenue'
    content = superAdminBilling()
  } else if (section === 'analytics') {
    title = 'Platform Analytics'
    content = superAdminAnalytics()
  } else if (section === 'settings') {
    title = 'Platform Settings'
    content = superAdminSettings()
  }

  return sidebarLayout(section, 'super', content, title)
}

function superAdminDashboard(): string {
  return `
<div class="grid-4" style="margin-bottom:24px" id="platformStats">
  <div class="stat-card"><div class="icon" style="background:#e3f2fd"><i class="fa fa-building" style="color:#1a73e8"></i></div><div><div class="value" id="sTenants">5</div><div class="label">Total Tenants</div><div class="change" style="color:#00c853">↑ 3 this month</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#e8f5e9"><i class="fa fa-bus" style="color:#2e7d32"></i></div><div><div class="value" id="sBuses">92</div><div class="label">Active Buses</div><div class="change" style="color:#00c853">↑ 12 this month</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#fff3e0"><i class="fa fa-indian-rupee-sign" style="color:#e65100"></i></div><div><div class="value" id="sRevenue">₹2.36L</div><div class="label">Monthly Revenue</div><div class="change" style="color:#00c853">↑ 18% vs last month</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#f3e5f5"><i class="fa fa-users" style="color:#6a1b9a"></i></div><div><div class="value" id="sStudents">4,280</div><div class="label">Students Tracked</div><div class="change" style="color:#00c853">↑ 320 this month</div></div></div>
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Tenant Status Overview</h3>
      <a href="/superadmin/tenants" class="btn btn-outline btn-sm">View All</a>
    </div>
    <canvas id="tenantChart" height="200"></canvas>
  </div>
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Revenue Trend (6 Months)</h3>
    </div>
    <canvas id="revenueChart" height="200"></canvas>
  </div>
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Top Tenants by Revenue</h3>
    </div>
    <table>
      <thead><tr><th>School</th><th>Plan</th><th>Buses</th><th>MRR</th><th>Status</th></tr></thead>
      <tbody id="topTenants"></tbody>
    </table>
  </div>
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Active Alerts</h3>
      <span class="badge critical">4 Critical</span>
    </div>
    <div id="alertsList"></div>
  </div>
</div>

<div class="card">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <h3 style="margin:0;font-size:1rem;font-weight:700">Platform KPIs</h3>
  </div>
  <div class="grid-4">
    <div>
      <div style="font-size:.8rem;color:#666;margin-bottom:6px">MRR</div>
      <div style="font-size:1.4rem;font-weight:800;color:#1a73e8">₹2,36,400</div>
      <div class="progress-bar" style="margin-top:8px"><div class="fill" style="width:74%;background:#1a73e8"></div></div>
    </div>
    <div>
      <div style="font-size:.8rem;color:#666;margin-bottom:6px">Churn Rate</div>
      <div style="font-size:1.4rem;font-weight:800;color:#00c853">2.1%</div>
      <div class="progress-bar" style="margin-top:8px"><div class="fill" style="width:2.1%;background:#00c853"></div></div>
    </div>
    <div>
      <div style="font-size:.8rem;color:#666;margin-bottom:6px">NPS Score</div>
      <div style="font-size:1.4rem;font-weight:800;color:#ff9800">74</div>
      <div class="progress-bar" style="margin-top:8px"><div class="fill" style="width:74%;background:#ff9800"></div></div>
    </div>
    <div>
      <div style="font-size:.8rem;color:#666;margin-bottom:6px">Uptime SLA</div>
      <div style="font-size:1.4rem;font-weight:800;color:#00c853">99.7%</div>
      <div class="progress-bar" style="margin-top:8px"><div class="fill" style="width:99.7%;background:#00c853"></div></div>
    </div>
  </div>
</div>

<script>
// Load tenant data
async function loadDashboard() {
  try {
    const [tenantsRes, alertsRes] = await Promise.all([
      fetch('/api/tenants'), fetch('/api/alerts')
    ]);
    const tenants = (await tenantsRes.json()).data;
    const alerts = (await alertsRes.json()).data;

    // Top tenants table
    const sorted = [...tenants].sort((a,b) => b.monthlyRevenue - a.monthlyRevenue);
    document.getElementById('topTenants').innerHTML = sorted.map(t => \`
      <tr>
        <td><strong>\${t.name}</strong><br><small style="color:#666">\${t.city}</small></td>
        <td><span class="badge \${t.plan}">\${t.plan}</span></td>
        <td>\${t.activeBuses}</td>
        <td style="color:#1a73e8;font-weight:700">₹\${t.monthlyRevenue.toLocaleString()}</td>
        <td><span class="badge \${t.status}">\${t.status}</span></td>
      </tr>
    \`).join('');

    // Alerts
    const activeAlerts = alerts.filter(a => !a.resolved).slice(0,5);
    document.getElementById('alertsList').innerHTML = activeAlerts.map(a => \`
      <div class="alert-banner \${a.severity}" style="margin-bottom:8px">
        <i class="fa fa-\${a.type==='sos'?'triangle-exclamation':a.type==='speeding'?'gauge-high':'bell'}"></i>
        <div>
          <strong>\${a.type.toUpperCase()}</strong><br>
          <span style="font-size:.78rem">\${a.message}</span>
        </div>
      </div>
    \`).join('');

    // Charts
    const statusCounts = tenants.reduce((acc,t) => { acc[t.status] = (acc[t.status]||0)+1; return acc; }, {});
    new Chart(document.getElementById('tenantChart'), {
      type:'doughnut',
      data:{
        labels:['Active','Trial','Suspended','Inactive'],
        datasets:[{data:[statusCounts.active||0, statusCounts.trial||0, statusCounts.suspended||0, statusCounts.inactive||0], backgroundColor:['#00c853','#ff9800','#f44336','#9e9e9e'], borderWidth:0}]
      },
      options:{plugins:{legend:{position:'bottom'}}, cutout:'65%', responsive:true}
    });
  } catch(e) { console.error(e); }

  new Chart(document.getElementById('revenueChart'), {
    type:'bar',
    data:{
      labels:['Aug','Sep','Oct','Nov','Dec','Jan'],
      datasets:[{label:'MRR (₹)',data:[142000,168000,189000,204000,220000,236400],backgroundColor:'rgba(26,115,232,.7)',borderRadius:6}]
    },
    options:{plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>'₹'+(v/1000)+'K'}}, x:{grid:{display:false}}}, responsive:true}
  });
}
loadDashboard();
</script>`
}

function superAdminTenants(): string {
  return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <div style="display:flex;gap:8px">
    <input type="text" placeholder="Search tenants..." style="padding:9px 16px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none;width:240px" id="searchInput" oninput="filterTenants()">
    <select id="statusFilter" onchange="filterTenants()" style="padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none">
      <option value="">All Status</option>
      <option value="active">Active</option>
      <option value="trial">Trial</option>
      <option value="suspended">Suspended</option>
    </select>
  </div>
  <button class="btn btn-primary" onclick="showAddTenant()"><i class="fa fa-plus"></i> Add Tenant</button>
</div>

<div class="card" style="padding:0;overflow:hidden">
  <table>
    <thead>
      <tr><th>School / Organization</th><th>Plan</th><th>Buses</th><th>MRR</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
    </thead>
    <tbody id="tenantsTable"></tbody>
  </table>
</div>

<!-- Tenant Detail Modal -->
<div id="tenantModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:none;align-items:center;justify-content:center;padding:20px">
  <div style="background:#fff;border-radius:16px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto" id="tenantModalContent"></div>
</div>

${toastScript()}
<script>
let allTenants = [];
async function loadTenants() {
  const res = await fetch('/api/tenants');
  allTenants = (await res.json()).data;
  renderTenants(allTenants);
}

function renderTenants(tenants) {
  document.getElementById('tenantsTable').innerHTML = tenants.map(t => \`
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:\${t.primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem">\${t.code}</div>
          <div>
            <div style="font-weight:700">\${t.name}</div>
            <div style="font-size:.75rem;color:#666">\${t.city}, \${t.state} • \${t.domain}</div>
          </div>
        </div>
      </td>
      <td><span class="badge \${t.plan}">\${t.plan}</span></td>
      <td>
        <div style="font-weight:700">\${t.activeBuses} / \${t.maxBuses === 999 ? '∞' : t.maxBuses}</div>
        <div class="progress-bar" style="margin-top:4px;width:80px"><div class="fill" style="width:\${Math.min(100,(t.activeBuses/(t.maxBuses===999?100:t.maxBuses))*100)}%;background:#1a73e8"></div></div>
      </td>
      <td style="font-weight:700;color:\${t.monthlyRevenue>0?'#1a73e8':'#999'}">₹\${t.monthlyRevenue.toLocaleString()}</td>
      <td><span class="badge \${t.status}">\${t.status}</span></td>
      <td style="font-size:.8rem;color:#666">\${t.joinedAt}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" onclick="viewTenant('\${t.id}')"><i class="fa fa-eye"></i></button>
          <button class="btn btn-sm" style="background:\${t.status==='suspended'?'#00c853':'#ff9800'};color:#fff" onclick="toggleTenantStatus('\${t.id}','\${t.status}')">
            <i class="fa fa-\${t.status==='suspended'?'check':'ban'}"></i>
          </button>
        </div>
      </td>
    </tr>
  \`).join('');
}

function filterTenants() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  renderTenants(allTenants.filter(t =>
    (t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)) &&
    (!status || t.status === status)
  ));
}

function viewTenant(id) {
  const t = allTenants.find(x => x.id === id);
  if (!t) return;
  const modal = document.getElementById('tenantModal');
  modal.style.display = 'flex';
  document.getElementById('tenantModalContent').innerHTML = \`
    <div style="padding:28px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:56px;height:56px;border-radius:14px;background:\${t.primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem">\${t.code}</div>
          <div>
            <h2 style="margin:0;font-size:1.3rem">\${t.name}</h2>
            <p style="margin:0;color:#666;font-size:.85rem">\${t.city}, \${t.state}</p>
          </div>
        </div>
        <button onclick="closeTenantModal()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666">✕</button>
      </div>
      <div class="grid-2" style="gap:16px">
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Contact</label><p style="margin:0;font-weight:600">\${t.contact}</p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Email</label><p style="margin:0">\${t.email}</p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Plan</label><p style="margin:0"><span class="badge \${t.plan}">\${t.plan}</span></p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Status</label><p style="margin:0"><span class="badge \${t.status}">\${t.status}</span></p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Active Buses</label><p style="margin:0;font-weight:700;color:#1a73e8">\${t.activeBuses} / \${t.maxBuses === 999 ? 'Unlimited' : t.maxBuses}</p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Monthly Revenue</label><p style="margin:0;font-weight:700;color:#00c853">₹\${t.monthlyRevenue.toLocaleString()}</p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Domain</label><p style="margin:0;font-size:.85rem">\${t.domain}</p></div>
        <div><label style="font-size:.75rem;color:#666;font-weight:600">Joined</label><p style="margin:0;font-size:.85rem">\${t.joinedAt}</p></div>
      </div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;background:#e8f0fe;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.4rem;font-weight:800;color:#1a73e8">₹\${t.balance >= 0 ? '+'+t.balance.toLocaleString() : t.balance.toLocaleString()}</div>
            <div style="font-size:.75rem;color:#666">Account Balance</div>
          </div>
          <div style="flex:1;background:\${t.balance < 0 ? '#ffebee' : '#e8f5e9'};border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.4rem;font-weight:800;color:\${t.balance < 0 ? '#c62828' : '#2e7d32'}">\${t.balance < 0 ? 'OVERDUE' : 'GOOD'}</div>
            <div style="font-size:.75rem;color:#666">Payment Status</div>
          </div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn-primary" onclick="showToast('Email sent to \${t.contact}','success');closeTenantModal()"><i class="fa fa-envelope"></i> Send Email</button>
        <button class="btn btn-outline" onclick="showToast('Invoice generated','info');closeTenantModal()"><i class="fa fa-file-invoice"></i> Generate Invoice</button>
      </div>
    </div>
  \`;
}

function closeTenantModal() {
  document.getElementById('tenantModal').style.display = 'none';
}

function toggleTenantStatus(id, currentStatus) {
  const action = currentStatus === 'suspended' ? 'activated' : 'suspended';
  showToast('Tenant ' + action + ' successfully', currentStatus==='suspended'?'success':'warning');
}

function showAddTenant() {
  showToast('Add Tenant form — coming in full version', 'info');
}

loadTenants();
</script>`
}

function superAdminBilling(): string {
  return `
<div class="grid-4" style="margin-bottom:24px">
  <div class="stat-card"><div class="icon" style="background:#e8f5e9"><i class="fa fa-indian-rupee-sign" style="color:#2e7d32"></i></div><div><div class="value">₹2.36L</div><div class="label">Current MRR</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#e3f2fd"><i class="fa fa-chart-line" style="color:#1a73e8"></i></div><div><div class="value">₹28.4L</div><div class="label">ARR</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#fff3e0"><i class="fa fa-clock" style="color:#e65100"></i></div><div><div class="value">₹5,382</div><div class="label">Overdue</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#f3e5f5"><i class="fa fa-arrow-trend-up" style="color:#6a1b9a"></i></div><div><div class="value">+18%</div><div class="label">MoM Growth</div></div></div>
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Revenue by Plan</h3>
    <canvas id="planRevenueChart" height="220"></canvas>
  </div>
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Monthly Billing Trend</h3>
    <canvas id="billingTrendChart" height="220"></canvas>
  </div>
</div>

<div class="card" style="padding:0;overflow:hidden">
  <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
    <h3 style="margin:0;font-size:1rem;font-weight:700">Recent Invoices</h3>
    <button class="btn btn-primary btn-sm" onclick="showToast('Generating bulk invoices...','info')"><i class="fa fa-file-invoice"></i> Generate All</button>
  </div>
  <table>
    <thead><tr><th>Invoice</th><th>School</th><th>Period</th><th>Buses</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
    <tbody id="invoicesTable"></tbody>
  </table>
</div>

${toastScript()}
<script>
const tenantNames = { t001:'Delhi Public School', t002:"St. Mary's Convent", t003:'Kendriya Vidyalaya #3', t004:'Ryan International', t005:'DAV Model School' };

async function loadBilling() {
  const res = await fetch('/api/invoices');
  const invoices = (await res.json()).data;
  document.getElementById('invoicesTable').innerHTML = invoices.map(inv => \`
    <tr>
      <td style="font-weight:700;color:#1a73e8">\${inv.id.toUpperCase()}</td>
      <td>\${tenantNames[inv.tenantId] || inv.tenantId}</td>
      <td>\${inv.month}</td>
      <td>\${inv.buses}</td>
      <td style="font-weight:700">₹\${inv.amount.toLocaleString()}</td>
      <td><span class="badge \${inv.status === 'paid' ? 'active' : inv.status === 'overdue' ? 'critical' : 'medium'}">\${inv.status}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="showToast('Invoice downloaded','success')"><i class="fa fa-download"></i> PDF</button>
        \${inv.status === 'overdue' ? '<button class="btn btn-danger btn-sm" onclick="showToast(\'Reminder sent\',\'warning\')" style="margin-left:4px"><i class="fa fa-bell"></i></button>' : ''}
      </td>
    </tr>
  \`).join('');
}

new Chart(document.getElementById('planRevenueChart'), {
  type:'pie',
  data:{
    labels:['Starter (₹299/bus)','Growth (₹249/bus)','Enterprise (₹199/bus)'],
    datasets:[{data:[4784, 12732, 8358], backgroundColor:['#42a5f5','#1a73e8','#0d47a1'], borderWidth:0}]
  },
  options:{plugins:{legend:{position:'bottom'}}}
});

new Chart(document.getElementById('billingTrendChart'), {
  type:'line',
  data:{
    labels:['Aug','Sep','Oct','Nov','Dec','Jan'],
    datasets:[
      {label:'Collected',data:[132000,155000,178000,196000,215000,231018],borderColor:'#00c853',backgroundColor:'rgba(0,200,83,.1)',fill:true,tension:.4},
      {label:'Invoiced', data:[142000,168000,189000,204000,220000,236400],borderColor:'#1a73e8',backgroundColor:'rgba(26,115,232,.1)',fill:true,tension:.4}
    ]
  },
  options:{plugins:{legend:{position:'bottom'}},scales:{y:{ticks:{callback:v=>'₹'+(v/1000)+'K'}},x:{grid:{display:false}}}}
});

loadBilling();
</script>`
}

function superAdminAnalytics(): string {
  return `
<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Bus Fleet Distribution by City</h3>
    <canvas id="cityChart" height="250"></canvas>
  </div>
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Daily Trip Completion Rate</h3>
    <canvas id="tripChart" height="250"></canvas>
  </div>
</div>

<div class="grid-3" style="margin-bottom:24px">
  <div class="card" style="text-align:center;padding:32px">
    <div style="font-size:3rem;font-weight:900;color:#1a73e8">74</div>
    <div style="font-size:1rem;font-weight:700;margin:8px 0">NPS Score</div>
    <div style="font-size:.8rem;color:#666">Net Promoter Score — Excellent</div>
    <div class="progress-bar" style="margin-top:12px"><div class="fill" style="width:74%;background:linear-gradient(90deg,#f44336,#ff9800,#00c853)"></div></div>
  </div>
  <div class="card" style="text-align:center;padding:32px">
    <div style="font-size:3rem;font-weight:900;color:#00c853">99.7%</div>
    <div style="font-size:1rem;font-weight:700;margin:8px 0">Platform Uptime</div>
    <div style="font-size:.8rem;color:#666">Last 30 days SLA performance</div>
    <div class="progress-bar" style="margin-top:12px"><div class="fill" style="width:99.7%;background:#00c853"></div></div>
  </div>
  <div class="card" style="text-align:center;padding:32px">
    <div style="font-size:3rem;font-weight:900;color:#ff9800">2.1%</div>
    <div style="font-size:1rem;font-weight:700;margin:8px 0">Churn Rate</div>
    <div style="font-size:.8rem;color:#666">Monthly tenant churn — Industry avg: 5%</div>
    <div class="progress-bar" style="margin-top:12px"><div class="fill" style="width:2.1%;background:#ff9800"></div></div>
  </div>
</div>

<div class="card">
  <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Alert Distribution by Type (This Month)</h3>
  <canvas id="alertTypeChart" height="120"></canvas>
</div>

<script>
new Chart(document.getElementById('cityChart'), {
  type:'bar',
  data:{
    labels:['New Delhi','Mumbai','Bengaluru','Pune','Chandigarh'],
    datasets:[{label:'Active Buses',data:[18,7,42,25,9],backgroundColor:['#1a73e8','#00c853','#ff9800','#9c27b0','#f44336'],borderRadius:6}]
  },
  options:{plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}
});

new Chart(document.getElementById('tripChart'), {
  type:'line',
  data:{
    labels:['Mon','Tue','Wed','Thu','Fri','Sat','Today'],
    datasets:[{
      label:'Trip Completion %',
      data:[96,98,94,99,97,88,95],
      borderColor:'#1a73e8',backgroundColor:'rgba(26,115,232,.1)',fill:true,tension:.4,pointRadius:5,pointBackgroundColor:'#1a73e8'
    }]
  },
  options:{plugins:{legend:{display:false}},scales:{y:{min:80,max:100,ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}}}
});

new Chart(document.getElementById('alertTypeChart'), {
  type:'bar',
  data:{
    labels:['Delay','Speeding','Geofence','Idle','SOS','Fuel','Deviation'],
    datasets:[{data:[34,12,28,19,3,15,8],backgroundColor:['#ff9800','#f44336','#2196f3','#9e9e9e','#b71c1c','#ffc107','#795548'],borderRadius:4}]
  },
  options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false}}}}
});
</script>`
}

function superAdminSettings(): string {
  return `
<div class="grid-2" style="gap:24px">
  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-palette" style="color:#1a73e8;margin-right:8px"></i>Platform Branding</h3>
    <div class="form-group"><label>Platform Name</label><input type="text" value="TrackSchool"></div>
    <div class="form-group"><label>Tagline</label><input type="text" value="ERP-Integrated School Transport Intelligence"></div>
    <div class="form-group"><label>Support Email</label><input type="email" value="support@trackschool.io"></div>
    <div class="form-group"><label>Primary Color</label><input type="color" value="#1a73e8" style="height:42px;padding:4px"></div>
    <button class="btn btn-primary" onclick="showToast('Branding settings saved!','success')"><i class="fa fa-save"></i> Save Changes</button>
  </div>

  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-gear" style="color:#1a73e8;margin-right:8px"></i>Tracking Configuration</h3>
    <div class="form-group"><label>GPS Update Interval (seconds)</label><input type="number" value="5" min="2" max="60"></div>
    <div class="form-group"><label>Speed Alert Threshold (km/h)</label><input type="number" value="60" min="20" max="120"></div>
    <div class="form-group"><label>Idle Alert Timeout (minutes)</label><input type="number" value="30" min="5" max="120"></div>
    <div class="form-group"><label>Geofence Radius (meters)</label><input type="number" value="200" min="50" max="1000"></div>
    <button class="btn btn-primary" onclick="showToast('Tracking config saved!','success')"><i class="fa fa-save"></i> Save Changes</button>
  </div>

  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-bell" style="color:#1a73e8;margin-right:8px"></i>Notification Settings</h3>
    <div class="form-group"><label>SMS Provider</label><select><option>Twilio</option><option>MSG91</option><option>TextLocal</option></select></div>
    <div class="form-group"><label>SMS API Key</label><input type="password" value="••••••••••••" placeholder="Enter API key"></div>
    <div class="form-group"><label>Email Provider</label><select><option>SendGrid</option><option>Mailgun</option><option>AWS SES</option></select></div>
    <div class="form-group"><label>Push Notifications</label>
      <div style="display:flex;gap:16px;margin-top:6px">
        <label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="checkbox" checked> SOS Alerts</label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="checkbox" checked> Delays</label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="checkbox" checked> Arrival</label>
      </div>
    </div>
    <button class="btn btn-primary" onclick="showToast('Notification settings saved!','success')"><i class="fa fa-save"></i> Save Changes</button>
  </div>

  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-shield-halved" style="color:#1a73e8;margin-right:8px"></i>Security & Access</h3>
    <div class="form-group"><label>JWT Token Expiry</label><select><option>24 hours</option><option>7 days</option><option>30 days</option></select></div>
    <div class="form-group"><label>2FA Required for Admins</label>
      <select><option>Yes</option><option>No</option></select>
    </div>
    <div class="form-group"><label>Max Login Attempts</label><input type="number" value="5"></div>
    <div class="form-group"><label>Data Retention (months)</label><input type="number" value="24"></div>
    <button class="btn btn-primary" onclick="showToast('Security settings saved!','success')"><i class="fa fa-save"></i> Save Changes</button>
  </div>
</div>
${toastScript()}`
}

// ════════════════════════════════════════════════════════════════
// TENANT ADMIN PAGE
// ════════════════════════════════════════════════════════════════
function tenantAdminPage(section = 'dashboard'): string {
  let content = ''
  let title = 'School Admin'
  if (section === 'dashboard') { title = 'School Dashboard'; content = tenantDashboard() }
  else if (section === 'buses')    { title = 'Bus Management';   content = tenantBuses() }
  else if (section === 'drivers')  { title = 'Driver Management';content = tenantDrivers() }
  else if (section === 'students') { title = 'Student Management';content = tenantStudents() }
  else if (section === 'routes')   { title = 'Route Management'; content = tenantRoutes() }
  else if (section === 'alerts')   { title = 'Alerts & Notifications'; content = tenantAlerts() }
  else if (section === 'reports')  { title = 'Reports'; content = tenantReports() }
  else if (section === 'settings') { title = 'Settings'; content = tenantSettings() }
  return sidebarLayout(section, 'tenant', content, title)
}

function tenantDashboard(): string {
  return `
<div class="grid-4" style="margin-bottom:24px">
  <div class="stat-card"><div class="icon" style="background:#e3f2fd"><i class="fa fa-bus" style="color:#1a73e8"></i></div><div><div class="value" id="dBuses">18</div><div class="label">Active Buses</div><div class="change" style="color:#1a73e8">5 on trip right now</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#e8f5e9"><i class="fa fa-users" style="color:#2e7d32"></i></div><div><div class="value" id="dStudents">340</div><div class="label">Students Today</div><div class="change" style="color:#00c853">312 boarded</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#fff3e0"><i class="fa fa-route" style="color:#e65100"></i></div><div><div class="value" id="dRoutes">4</div><div class="label">Active Routes</div><div class="change" style="color:#666">All running</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#ffebee"><i class="fa fa-bell" style="color:#c62828"></i></div><div><div class="value" id="dAlerts">4</div><div class="label">Active Alerts</div><div class="change" style="color:#f44336">1 critical SOS!</div></div></div>
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Fleet Status</h3>
      <a href="/tracking" class="btn btn-primary btn-sm"><i class="fa fa-map"></i> Live Map</a>
    </div>
    <div id="fleetStatus"></div>
  </div>
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Today's Trip Summary</h3>
    </div>
    <canvas id="tripPieChart" height="180"></canvas>
  </div>
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Active Alerts</h3>
      <a href="/admin/alerts" class="btn btn-outline btn-sm">View All</a>
    </div>
    <div id="tenantAlertsList"></div>
  </div>
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h3 style="margin:0;font-size:1rem;font-weight:700">Student Boarding Status</h3>
    </div>
    <canvas id="boardingChart" height="180"></canvas>
  </div>
</div>

<script>
async function loadTenantDashboard() {
  const [busRes, alertRes, tripRes] = await Promise.all([
    fetch('/api/buses?tenantId=t001'),
    fetch('/api/alerts?tenantId=t001'),
    fetch('/api/trips?tenantId=t001')
  ]);
  const buses = (await busRes.json()).data;
  const alerts = (await alertRes.json()).data;
  const trips = (await tripRes.json()).data;

  document.getElementById('fleetStatus').innerHTML = buses.map(b => \`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:\${b.status==='on_trip'?'#00c853':b.status==='delayed'?'#ff9800':b.status==='breakdown'?'#f44336':'#bdbdbd'}"></div>
        <div>
          <div style="font-weight:700;font-size:.875rem">\${b.nickname}</div>
          <div style="font-size:.75rem;color:#666">\${b.number}</div>
        </div>
      </div>
      <div style="text-align:right">
        <span class="badge \${b.status}">\${b.status.replace('_',' ')}</span>
        <div style="font-size:.72rem;color:#666;margin-top:2px">\${b.speed} km/h • \${b.fuel}% fuel</div>
      </div>
    </div>
  \`).join('');

  const activeAlerts = alerts.filter(a => !a.resolved).slice(0,4);
  document.getElementById('tenantAlertsList').innerHTML = activeAlerts.length ? activeAlerts.map(a => \`
    <div class="alert-banner \${a.severity}" style="margin-bottom:8px">
      <i class="fa fa-\${a.severity==='critical'?'triangle-exclamation':'bell'}"></i>
      <div style="flex:1"><strong>\${a.type.toUpperCase()}</strong><br><small>\${a.message}</small></div>
    </div>
  \`).join('') : '<p style="color:#666;text-align:center;padding:20px">No active alerts</p>';

  const statusCount = { on_trip:0, idle:0, delayed:0, breakdown:0 };
  buses.forEach(b => statusCount[b.status] = (statusCount[b.status]||0)+1);
  new Chart(document.getElementById('tripPieChart'), {
    type:'doughnut',
    data:{labels:['On Trip','Idle','Delayed','Breakdown'],datasets:[{data:[statusCount.on_trip,statusCount.idle,statusCount.delayed,statusCount.breakdown],backgroundColor:['#00c853','#2196f3','#ff9800','#f44336'],borderWidth:0}]},
    options:{plugins:{legend:{position:'bottom'}},cutout:'60%'}
  });

  new Chart(document.getElementById('boardingChart'), {
    type:'bar',
    data:{labels:['Boarded','At Stop','Dropped','Absent'],datasets:[{data:[312,18,0,10],backgroundColor:['#00c853','#ff9800','#2196f3','#f44336'],borderRadius:6}]},
    options:{plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}
  });
}
loadTenantDashboard();
</script>`
}

function tenantBuses(): string {
  return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <input type="text" placeholder="Search buses..." style="padding:9px 16px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none;width:240px" id="busSearch" oninput="filterBuses()">
  <button class="btn btn-primary" onclick="showToast('Add Bus form — assign GPS device & driver','info')"><i class="fa fa-plus"></i> Add Bus</button>
</div>

<div class="grid-4" style="margin-bottom:24px" id="busStatCards">
  <div class="stat-card"><div class="icon" style="background:#e8f5e9"><i class="fa fa-bus" style="color:#2e7d32"></i></div><div><div class="value">5</div><div class="label">Active Fleet</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#e3f2fd"><i class="fa fa-location-dot" style="color:#1a73e8"></i></div><div><div class="value">3</div><div class="label">On Trip</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#fff3e0"><i class="fa fa-clock" style="color:#e65100"></i></div><div><div class="value">1</div><div class="label">Delayed</div></div></div>
  <div class="stat-card"><div class="icon" style="background:#f5f5f5"><i class="fa fa-moon" style="color:#757575"></i></div><div><div class="value">2</div><div class="label">Idle</div></div></div>
</div>

<div class="card" style="padding:0;overflow:hidden">
  <table>
    <thead><tr><th>Bus</th><th>Driver</th><th>Route</th><th>Status</th><th>Speed</th><th>Fuel</th><th>Device</th><th>Actions</th></tr></thead>
    <tbody id="busesTable"></tbody>
  </table>
</div>

${toastScript()}
<script>
let allBuses = [], allDrivers = [], allRoutes = [];
async function loadBuses() {
  const [busRes,drvRes,rteRes] = await Promise.all([
    fetch('/api/buses?tenantId=t001'),
    fetch('/api/drivers?tenantId=t001'),
    fetch('/api/routes?tenantId=t001')
  ]);
  allBuses = (await busRes.json()).data;
  allDrivers = (await drvRes.json()).data;
  allRoutes = (await rteRes.json()).data;
  renderBuses(allBuses);
}
function renderBuses(buses) {
  document.getElementById('busesTable').innerHTML = buses.map(b => {
    const drv = allDrivers.find(d => d.id === b.driver);
    const rte = allRoutes.find(r => r.id === b.route);
    const fuelColor = b.fuel < 30 ? '#f44336' : b.fuel < 50 ? '#ff9800' : '#00c853';
    return \`<tr>
      <td>
        <div style="font-weight:700">\${b.nickname}</div>
        <div style="font-size:.75rem;color:#666">\${b.number} • Cap: \${b.capacity}</div>
      </td>
      <td>\${drv ? drv.name : 'Unassigned'}<br><small style="color:#666">\${drv ? drv.phone : ''}</small></td>
      <td style="font-size:.82rem">\${rte ? rte.name : '—'}</td>
      <td><span class="badge \${b.status}">\${b.status.replace('_',' ')}</span></td>
      <td><span style="font-weight:700">\${b.speed}</span> <span style="color:#666;font-size:.75rem">km/h</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:\${fuelColor};font-weight:700">\${b.fuel}%</span>
          <div class="progress-bar" style="width:50px"><div class="fill" style="width:\${b.fuel}%;background:\${fuelColor}"></div></div>
        </div>
      </td>
      <td style="font-size:.8rem;color:#666">\${b.deviceId}</td>
      <td>
        <div style="display:flex;gap:4px">
          <a href="/tracking?bus=\${b.id}" class="btn btn-outline btn-sm"><i class="fa fa-map-marker-alt"></i></a>
          <button class="btn btn-sm" style="background:#ff9800;color:#fff" onclick="showToast('Edit bus \${b.nickname}','info')"><i class="fa fa-edit"></i></button>
        </div>
      </td>
    </tr>\`;
  }).join('');
}
function filterBuses() {
  const q = document.getElementById('busSearch').value.toLowerCase();
  renderBuses(allBuses.filter(b => b.nickname.toLowerCase().includes(q) || b.number.toLowerCase().includes(q)));
}
loadBuses();
</script>`
}

function tenantDrivers(): string {
  return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <input type="text" placeholder="Search drivers..." style="padding:9px 16px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none;width:240px">
  <button class="btn btn-primary" onclick="showToast('Add Driver form','info')"><i class="fa fa-plus"></i> Add Driver</button>
</div>

<div class="card" style="padding:0;overflow:hidden">
  <table>
    <thead><tr><th>Driver</th><th>Phone</th><th>License</th><th>Assigned Bus</th><th>Status</th><th>Rating</th><th>Total Trips</th><th>Actions</th></tr></thead>
    <tbody id="driversTable"></tbody>
  </table>
</div>

${toastScript()}
<script>
async function loadDrivers() {
  const [drvRes, busRes] = await Promise.all([fetch('/api/drivers?tenantId=t001'), fetch('/api/buses?tenantId=t001')]);
  const drivers = (await drvRes.json()).data;
  const buses = (await busRes.json()).data;
  document.getElementById('driversTable').innerHTML = drivers.map(d => {
    const bus = buses.find(b => b.id === d.busId);
    const stars = '★'.repeat(Math.round(d.rating)) + '☆'.repeat(5-Math.round(d.rating));
    return \`<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">\${d.name.charAt(0)}</div>
          <div>
            <div style="font-weight:700">\${d.name}</div>
            <div style="font-size:.75rem;color:#666">Since \${d.joinedAt}</div>
          </div>
        </div>
      </td>
      <td>\${d.phone}</td>
      <td style="font-size:.8rem">\${d.license}</td>
      <td>\${bus ? bus.nickname+' ('+bus.number+')' : '<span style="color:#999">Unassigned</span>'}</td>
      <td><span class="badge \${d.status}">\${d.status.replace('_',' ')}</span></td>
      <td><span style="color:#ff9800;font-size:.85rem">\${stars}</span> <span style="font-size:.75rem;color:#666">\${d.rating}</span></td>
      <td style="font-weight:700">\${d.trips.toLocaleString()}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-outline btn-sm" onclick="showToast('Viewing \${d.name} profile','info')"><i class="fa fa-eye"></i></button>
          <button class="btn btn-sm" style="background:#ff9800;color:#fff" onclick="showToast('Edit driver','info')"><i class="fa fa-edit"></i></button>
        </div>
      </td>
    </tr>\`;
  }).join('');
}
loadDrivers();
</script>`
}

function tenantStudents(): string {
  return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <div style="display:flex;gap:8px">
    <input type="text" placeholder="Search students..." style="padding:9px 16px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none;width:220px" id="studentSearch" oninput="filterStudents()">
    <select id="busFilter" onchange="filterStudents()" style="padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none">
      <option value="">All Buses</option>
      <option value="b001">Bus Alpha</option><option value="b002">Bus Beta</option>
      <option value="b003">Bus Gamma</option><option value="b004">Bus Delta</option>
    </select>
  </div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-outline btn-sm" onclick="showToast('Exporting attendance CSV...','info')"><i class="fa fa-download"></i> Export</button>
    <button class="btn btn-primary" onclick="showToast('Add Student form','info')"><i class="fa fa-plus"></i> Add Student</button>
  </div>
</div>

<div class="card" style="padding:0;overflow:hidden">
  <table>
    <thead><tr><th>Student</th><th>Class</th><th>Bus</th><th>Route</th><th>Stop</th><th>Parent</th><th>RFID</th><th>Today</th></tr></thead>
    <tbody id="studentsTable"></tbody>
  </table>
</div>

${toastScript()}
<script>
let allStudents=[], allBusesS=[], allRoutesS=[];
async function loadStudents() {
  const [sRes,bRes,rRes] = await Promise.all([fetch('/api/students?tenantId=t001'),fetch('/api/buses?tenantId=t001'),fetch('/api/routes?tenantId=t001')]);
  allStudents=(await sRes.json()).data; allBusesS=(await bRes.json()).data; allRoutesS=(await rRes.json()).data;
  renderStudents(allStudents);
}
function renderStudents(students) {
  document.getElementById('studentsTable').innerHTML = students.map(s => {
    const bus = allBusesS.find(b => b.id===s.busId);
    const route = allRoutesS.find(r => r.id===s.routeId);
    const stop = route?.stops.find(st => st.id===s.stopId);
    return \`<tr>
      <td><div style="font-weight:700">\${s.name}</div></td>
      <td>\${s.class}</td>
      <td style="font-size:.82rem">\${bus?.nickname||'—'}</td>
      <td style="font-size:.78rem;color:#666">\${route?.name||'—'}</td>
      <td style="font-size:.78rem">\${stop?.name||'—'}</td>
      <td><div>\${s.parentName}</div><small style="color:#666">\${s.parentPhone}</small></td>
      <td style="font-size:.75rem;font-family:monospace;color:#1a73e8">\${s.rfidTag}</td>
      <td><span class="badge \${s.status}">\${s.status.replace('_',' ')}</span></td>
    </tr>\`;
  }).join('');
}
function filterStudents() {
  const q=document.getElementById('studentSearch').value.toLowerCase();
  const bf=document.getElementById('busFilter').value;
  renderStudents(allStudents.filter(s => s.name.toLowerCase().includes(q) && (!bf||s.busId===bf)));
}
loadStudents();
</script>`
}

function tenantRoutes(): string {
  return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <h3 style="margin:0;font-size:1rem;color:#666">4 routes configured • 111 students total</h3>
  <button class="btn btn-primary" onclick="showToast('Route builder opening...','info')"><i class="fa fa-plus"></i> New Route</button>
</div>

<div id="routeCards" class="grid-2" style="margin-bottom:24px"></div>

<div class="card">
  <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Route Map Preview</h3>
  <div class="map-container"><div id="routeMap" style="height:400px"></div></div>
</div>

${toastScript()}
<script>
const routeColors = { r001:'#e53935', r002:'#1e88e5', r003:'#43a047', r004:'#fb8c00' };
async function loadRoutes() {
  const res = await fetch('/api/routes?tenantId=t001');
  const routes = (await res.json()).data;
  document.getElementById('routeCards').innerHTML = routes.map(r => \`
    <div class="card" style="border-left:4px solid \${r.color};padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="margin:0;font-size:1rem;font-weight:700">\${r.name}</h3>
        <span class="badge active">\${r.activeBuses} bus\${r.activeBuses>1?'es':''}</span>
      </div>
      <div class="grid-3" style="gap:12px;margin-bottom:12px">
        <div style="text-align:center"><div style="font-size:1.3rem;font-weight:800;color:#1a73e8">\${r.totalStudents}</div><div style="font-size:.72rem;color:#666">Students</div></div>
        <div style="text-align:center"><div style="font-size:1.3rem;font-weight:800;color:#ff9800">\${r.distance}</div><div style="font-size:.72rem;color:#666">Distance</div></div>
        <div style="text-align:center"><div style="font-size:1.3rem;font-weight:800;color:#00c853">\${r.duration}</div><div style="font-size:.72rem;color:#666">Duration</div></div>
      </div>
      <div style="border-top:1px solid #f0f0f0;padding-top:12px">
        <div style="font-size:.75rem;color:#666;margin-bottom:6px;font-weight:600">STOPS (\${r.stops.length})</div>
        \${r.stops.map((s,i) => \`<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:.78rem">
          <span style="width:20px;height:20px;border-radius:50%;background:\${r.color};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0">\${i+1}</span>
          \${s.name} <span style="color:#666;margin-left:auto">\${s.eta} • \${s.students} students</span>
        </div>\`).join('')}
      </div>
    </div>
  \`).join('');

  // Map
  const map = L.map('routeMap').setView([28.6139, 77.2090], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors' }).addTo(map);
  routes.forEach(r => {
    const coords = r.stops.map(s => [s.lat, s.lng]);
    L.polyline(coords, { color: r.color, weight: 3, opacity: 0.8 }).addTo(map);
    r.stops.forEach((s,i) => {
      L.circleMarker([s.lat, s.lng], { radius: i===r.stops.length-1?10:7, color: r.color, fillColor: i===r.stops.length-1?r.color:'#fff', fillOpacity: i===r.stops.length-1?0.9:1, weight: 2 })
        .bindPopup(\`<b>\${s.name}</b><br>Stop \${s.order} • ETA: \${s.eta}<br>\${s.students} students\`)
        .addTo(map);
    });
  });
}
loadRoutes();
</script>`
}

function tenantAlerts(): string {
  return `
<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
  <select id="alertTypeFilter" onchange="filterAlerts()" style="padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none">
    <option value="">All Types</option>
    <option value="sos">SOS</option><option value="speeding">Speeding</option>
    <option value="delay">Delay</option><option value="geofence">Geofence</option>
    <option value="fuel">Fuel</option><option value="idle">Idle</option>
  </select>
  <select id="alertSeverityFilter" onchange="filterAlerts()" style="padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.875rem;outline:none">
    <option value="">All Severity</option>
    <option value="critical">Critical</option><option value="high">High</option>
    <option value="medium">Medium</option><option value="low">Low</option>
  </select>
  <button class="btn btn-outline btn-sm" onclick="showToast('All alerts marked as read','info')">Mark All Read</button>
</div>

<div id="alertsContainer"></div>

${toastScript()}
<script>
let allAlerts = [];
async function loadAlerts() {
  const res = await fetch('/api/alerts?tenantId=t001');
  allAlerts = (await res.json()).data;
  renderAlerts(allAlerts);
}
function renderAlerts(alerts) {
  const icons = { sos:'triangle-exclamation', speeding:'gauge-high', delay:'clock', geofence:'map-pin', fuel:'gas-pump', idle:'moon', deviation:'route', breakdown:'wrench' };
  document.getElementById('alertsContainer').innerHTML = alerts.map(a => \`
    <div class="alert-banner \${a.severity}" style="margin-bottom:10px;border-radius:10px">
      <i class="fa fa-\${icons[a.type]||'bell'}" style="font-size:1.1rem"></i>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px">
          <strong style="text-transform:uppercase;font-size:.8rem">\${a.type}</strong>
          <span class="badge \${a.severity}" style="font-size:.65rem">\${a.severity}</span>
          \${a.resolved ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:700">RESOLVED</span>' : ''}
        </div>
        <div style="margin-top:2px">\${a.message}</div>
        <div style="font-size:.72rem;margin-top:4px;opacity:.7">\${new Date(a.timestamp).toLocaleString('en-IN')}</div>
      </div>
      \${!a.resolved ? \`<button onclick="resolveAlert('\${a.id}')" style="background:none;border:1.5px solid currentColor;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.75rem;font-weight:600">Resolve</button>\` : ''}
    </div>
  \`).join('');
}
function filterAlerts() {
  const type = document.getElementById('alertTypeFilter').value;
  const sev = document.getElementById('alertSeverityFilter').value;
  renderAlerts(allAlerts.filter(a => (!type||a.type===type) && (!sev||a.severity===sev)));
}
function resolveAlert(id) {
  allAlerts = allAlerts.map(a => a.id===id ? {...a, resolved:true} : a);
  renderAlerts(allAlerts);
  showToast('Alert resolved','success');
}
loadAlerts();
</script>`
}

function tenantReports(): string {
  return `
<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Weekly Trip Performance</h3>
    <canvas id="weeklyTripChart" height="220"></canvas>
  </div>
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Driver Performance Scores</h3>
    <canvas id="driverScoreChart" height="220"></canvas>
  </div>
</div>

<div class="card" style="margin-bottom:24px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <h3 style="margin:0;font-size:1rem;font-weight:700">Trip History</h3>
    <button class="btn btn-outline btn-sm" onclick="showToast('Generating PDF report...','info')"><i class="fa fa-download"></i> Export PDF</button>
  </div>
  <table>
    <thead><tr><th>Trip ID</th><th>Bus</th><th>Route</th><th>Driver</th><th>Date</th><th>Start</th><th>End</th><th>Students</th><th>Distance</th><th>Status</th></tr></thead>
    <tbody id="tripsTable"></tbody>
  </table>
</div>

${toastScript()}
<script>
async function loadReports() {
  const res = await fetch('/api/trips?tenantId=t001');
  const trips = (await res.json()).data;
  const buseMap = {b001:'Bus Alpha',b002:'Bus Beta',b003:'Bus Gamma',b004:'Bus Delta'};
  const rteMap = {r001:'Route A',r002:'Route B',r003:'Route C',r004:'Route D'};
  const drvMap = {d001:'Rajesh Kumar',d002:'Suresh Yadav',d003:'Mohan Lal',d004:'Vikram Singh'};
  document.getElementById('tripsTable').innerHTML = trips.map(t => \`
    <tr>
      <td style="font-weight:700;color:#1a73e8;font-size:.8rem">\${t.id.toUpperCase()}</td>
      <td>\${buseMap[t.busId]||t.busId}</td>
      <td style="font-size:.8rem">\${rteMap[t.routeId]||t.routeId}</td>
      <td>\${drvMap[t.driverId]||t.driverId}</td>
      <td>\${t.date}</td>
      <td>\${t.startTime}</td>
      <td>\${t.endTime||'—'}</td>
      <td>\${t.studentsBoarded}</td>
      <td>\${t.distanceCovered} km</td>
      <td><span class="badge \${t.status}">\${t.status.replace('_',' ')}</span></td>
    </tr>
  \`).join('');
}

new Chart(document.getElementById('weeklyTripChart'), {
  type:'bar',
  data:{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Today'],datasets:[
    {label:'Completed',data:[8,8,7,9,8,4,5],backgroundColor:'#00c853',borderRadius:4},
    {label:'Delayed',  data:[1,0,2,0,1,1,1],backgroundColor:'#ff9800',borderRadius:4},
  ]},
  options:{plugins:{legend:{position:'bottom'}},scales:{x:{grid:{display:false},stacked:true},y:{stacked:true,beginAtZero:true}}}
});
new Chart(document.getElementById('driverScoreChart'), {
  type:'radar',
  data:{labels:['Punctuality','Speed Control','Route Adherence','Safety','Attendance'],datasets:[
    {label:'Rajesh Kumar',data:[95,88,96,92,100],borderColor:'#1a73e8',backgroundColor:'rgba(26,115,232,.15)'},
    {label:'Mohan Lal',  data:[98,92,99,97,98], borderColor:'#00c853',backgroundColor:'rgba(0,200,83,.15)'},
    {label:'Vikram Singh',data:[78,71,82,80,90],borderColor:'#ff9800',backgroundColor:'rgba(255,152,0,.15)'},
  ]},
  options:{plugins:{legend:{position:'bottom'}},scales:{r:{min:60,max:100}}}
});

loadReports();
</script>`
}

function tenantSettings(): string {
  return `
<div class="grid-2" style="gap:24px">
  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-school" style="color:#1a73e8;margin-right:8px"></i>School Profile</h3>
    <div class="form-group"><label>School Name</label><input type="text" value="Delhi Public School"></div>
    <div class="form-group"><label>Address</label><input type="text" value="New Delhi, Delhi - 110001"></div>
    <div class="form-group"><label>Admin Email</label><input type="email" value="admin@dps.edu.in"></div>
    <div class="form-group"><label>Admin Phone</label><input type="tel" value="+91-9876543210"></div>
    <div class="form-group"><label>Primary Color</label><input type="color" value="#1a73e8" style="height:42px;padding:4px"></div>
    <button class="btn btn-primary" onclick="showToast('School profile updated!','success')"><i class="fa fa-save"></i> Save</button>
  </div>
  <div class="card">
    <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700"><i class="fa fa-bell" style="color:#1a73e8;margin-right:8px"></i>Notification Preferences</h3>
    <div style="display:flex;flex-direction:column;gap:14px">
      ${['Bus Departure Alert','Bus Arrival Alert','Delay Notification','SOS Alert','Geofence Breach','Speeding Alert','Low Fuel Alert'].map((n,i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#f8f9fa;border-radius:8px">
          <span style="font-size:.875rem">${n}</span>
          <div style="display:flex;gap:12px">
            <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:400"><input type="checkbox" ${i < 4 ? 'checked' : ''}> SMS</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:400"><input type="checkbox" checked> Push</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:400"><input type="checkbox" ${i < 5 ? 'checked' : ''}> Email</label>
          </div>
        </div>`).join('')}
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="showToast('Notification settings saved!','success')"><i class="fa fa-save"></i> Save</button>
  </div>
</div>
${toastScript()}`
}

// ════════════════════════════════════════════════════════════════
// LIVE TRACKING PAGE
// ════════════════════════════════════════════════════════════════
function trackingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('Live Tracking')}
<style>
  body { display:flex; overflow:hidden; height:100vh; }
  .tracking-sidebar { width:320px; height:100vh; background:#fff; border-right:1px solid #e0e0e0; display:flex; flex-direction:column; flex-shrink:0; overflow:hidden; }
  .tracking-sidebar .header { padding:16px; border-bottom:1px solid #f0f0f0; background:linear-gradient(135deg,#0d1b2a,#1a3a5c); color:#fff; }
  .tracking-sidebar .header h2 { margin:0; font-size:1.1rem; }
  .tracking-sidebar .header p { margin:4px 0 0; font-size:.75rem; opacity:.7; }
  .bus-list { overflow-y:auto; flex:1; }
  .bus-item { padding:12px 16px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:.15s; display:flex; align-items:center; gap:12px; }
  .bus-item:hover, .bus-item.selected { background:#e8f0fe; }
  .bus-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
  .tracking-map { flex:1; position:relative; }
  #map { width:100%; height:100%; }
  .map-overlay { position:absolute; top:16px; right:16px; z-index:1000; display:flex; flex-direction:column; gap:8px; }
  .map-btn { background:#fff; border:none; border-radius:8px; padding:10px 14px; font-size:.82rem; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.15); display:flex; align-items:center; gap:6px; transition:.2s; }
  .map-btn:hover { background:#e8f0fe; color:#1a73e8; }
  .info-panel { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); z-index:1000; background:#fff; border-radius:12px; padding:16px 24px; box-shadow:0 4px 20px rgba(0,0,0,.2); display:flex; gap:32px; }
  .info-item { text-align:center; }
  .info-item .v { font-size:1.3rem; font-weight:800; color:#1a73e8; }
  .info-item .l { font-size:.72rem; color:#666; }
  .bus-popup { background:#fff; border-radius:10px; padding:12px; min-width:200px; box-shadow:0 4px 16px rgba(0,0,0,.15); }
  .speed-gauge { position:absolute; top:16px; left:16px; z-index:1000; background:#fff; border-radius:12px; padding:12px 16px; box-shadow:0 2px 8px rgba(0,0,0,.15); display:none; }
  @media(max-width:768px) { .tracking-sidebar { width:100%; height:40vh; } body { flex-direction:column; } .tracking-map { height:60vh; } }
</style>
</head>
<body>

<!-- Sidebar -->
<div class="tracking-sidebar">
  <div class="header">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h2>🗺 Live Fleet</h2>
        <p><span class="live-dot"></span> Real-time GPS tracking</p>
      </div>
      <a href="/admin" style="color:rgba(255,255,255,.7);font-size:.8rem;text-decoration:none">← Admin</a>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <input type="text" placeholder="Search bus..." id="busSearchT" oninput="filterBusList()" style="flex:1;padding:8px 12px;border:none;border-radius:8px;font-size:.8rem;outline:none;background:rgba(255,255,255,.15);color:#fff;placeholder-color:rgba(255,255,255,.5)">
      <select id="statusFilterT" onchange="filterBusList()" style="padding:8px;border:none;border-radius:8px;font-size:.78rem;background:rgba(255,255,255,.15);color:#fff;outline:none">
        <option value="">All</option>
        <option value="on_trip">On Trip</option>
        <option value="idle">Idle</option>
        <option value="delayed">Delayed</option>
      </select>
    </div>
  </div>
  
  <div style="padding:10px 16px;font-size:.75rem;color:#666;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between">
    <span id="busCount">Loading...</span>
    <span><span style="color:#00c853">●</span> Live updates</span>
  </div>
  
  <div class="bus-list" id="busList"></div>
  
  <div style="padding:12px 16px;border-top:1px solid #f0f0f0;background:#f8f9fa">
    <div style="font-size:.75rem;color:#666;margin-bottom:8px;font-weight:600">ACTIVE ALERTS</div>
    <div id="sidebarAlerts"></div>
  </div>
</div>

<!-- Map -->
<div class="tracking-map">
  <div id="map"></div>
  
  <div class="map-overlay">
    <button class="map-btn" onclick="fitAllBuses()"><i class="fa fa-expand"></i> Fit All</button>
    <button class="map-btn" onclick="toggleSatellite()" id="satBtn"><i class="fa fa-satellite"></i> Satellite</button>
    <button class="map-btn" onclick="toggleHeatmap()" id="heatBtn"><i class="fa fa-fire"></i> Heatmap</button>
    <button class="map-btn" onclick="window.location.href='/admin'"><i class="fa fa-gauge-high"></i> Dashboard</button>
  </div>
  
  <div class="info-panel">
    <div class="info-item"><div class="v" id="infoOnTrip">0</div><div class="l">On Trip</div></div>
    <div class="info-item"><div class="v" id="infoIdle">0</div><div class="l">Idle</div></div>
    <div class="info-item"><div class="v" id="infoDelayed">0</div><div class="l">Delayed</div></div>
    <div class="info-item"><div class="v" id="infoAlerts">0</div><div class="l">Alerts</div></div>
    <div class="info-item"><div class="v" id="infoStudents">0</div><div class="l">Students</div></div>
  </div>
</div>

${toastScript()}
<script>
let map, allBusList = [], busMarkers = {}, busRoutes = {}, selectedBus = null;
let routeLines = [], satLayer = null, normalLayer = null, heatmapOn = false;

const busColors = { on_trip:'#00c853', idle:'#2196f3', delayed:'#ff9800', breakdown:'#f44336', parked:'#9e9e9e' };

function createBusIcon(bus) {
  const color = busColors[bus.status] || '#9e9e9e';
  const angle = Math.floor(Math.random() * 360);
  return L.divIcon({
    html: \`<div style="position:relative">
      <div style="width:36px;height:36px;border-radius:50%;background:\${color};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">🚌</div>
      \${bus.status==='on_trip' ? '<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#00c853;border-radius:50%;border:2px solid #fff;animation:pulse 1.5s infinite"></div>' : ''}
      \${bus.status==='delayed' ? '<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#ff9800;border-radius:50%;border:2px solid #fff"></div>' : ''}
    </div>\`,
    iconSize:[36,36], iconAnchor:[18,18], popupAnchor:[0,-20]
  });
}

async function initMap() {
  map = L.map('map', { zoomControl:true }).setView([28.6139, 77.2090], 12);
  normalLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors', maxZoom:19 });
  satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution:'© Esri', maxZoom:19 });
  normalLayer.addTo(map);

  // Load routes
  const rRes = await fetch('/api/routes?tenantId=t001');
  const routes = (await rRes.json()).data;
  routes.forEach(r => {
    const coords = r.stops.map(s => [s.lat, s.lng]);
    const line = L.polyline(coords, { color:r.color, weight:3, opacity:0.5, dashArray:'8 6' }).addTo(map);
    busRoutes[r.id] = line;
    r.stops.forEach((s,i) => {
      L.circleMarker([s.lat, s.lng], { radius:i===r.stops.length-1?8:5, color:r.color, fillColor: i===r.stops.length-1?r.color:'#fff', fillOpacity:i===r.stops.length-1?0.9:1, weight:2 })
        .bindPopup(\`<b>\${s.name}</b><br>Stop \${s.order} • ETA: \${s.eta}<br>👥 \${s.students} students\`)
        .addTo(map);
    });
  });

  await loadBuses();
}

async function loadBuses() {
  const [bRes, aRes] = await Promise.all([fetch('/api/buses?tenantId=t001'), fetch('/api/alerts?tenantId=t001')]);
  allBusList = (await bRes.json()).data;
  const alerts = (await aRes.json()).data.filter(a => !a.resolved);

  // Update info panel
  document.getElementById('infoOnTrip').textContent = allBusList.filter(b=>b.status==='on_trip').length;
  document.getElementById('infoIdle').textContent = allBusList.filter(b=>b.status==='idle').length;
  document.getElementById('infoDelayed').textContent = allBusList.filter(b=>b.status==='delayed').length;
  document.getElementById('infoAlerts').textContent = alerts.length;
  document.getElementById('infoStudents').textContent = 312;
  document.getElementById('busCount').textContent = allBusList.length + ' buses tracked';

  // Render bus list
  renderBusList(allBusList);

  // Place/update markers
  allBusList.forEach(bus => {
    if (busMarkers[bus.id]) {
      busMarkers[bus.id].setLatLng([bus.lat, bus.lng]);
      busMarkers[bus.id].setIcon(createBusIcon(bus));
    } else {
      const marker = L.marker([bus.lat, bus.lng], { icon: createBusIcon(bus) })
        .bindPopup(createBusPopup(bus), { maxWidth:260 })
        .addTo(map);
      marker.on('click', () => selectBus(bus.id));
      busMarkers[bus.id] = marker;
    }
  });

  // Sidebar alerts
  document.getElementById('sidebarAlerts').innerHTML = alerts.slice(0,3).map(a => \`
    <div class="alert-banner \${a.severity}" style="margin-bottom:6px;padding:8px 12px;font-size:.75rem">
      <i class="fa fa-bell" style="font-size:.8rem"></i> \${a.message.substring(0,60)}...
    </div>
  \`).join('') || '<p style="font-size:.75rem;color:#666;margin:0">No active alerts</p>';
}

function createBusPopup(bus) {
  return \`<div style="min-width:200px;padding:4px">
    <div style="font-weight:800;font-size:1rem;margin-bottom:6px">\${bus.nickname}</div>
    <div style="font-size:.8rem;color:#666;margin-bottom:8px">\${bus.number}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.8rem">
      <div><i class="fa fa-gauge-high" style="color:#1a73e8"></i> \${bus.speed} km/h</div>
      <div><i class="fa fa-gas-pump" style="color:#ff9800"></i> \${bus.fuel}% fuel</div>
      <div><i class="fa fa-circle" style="color:\${busColors[bus.status]}"></i> \${bus.status.replace('_',' ')}</div>
      <div><i class="fa fa-clock" style="color:#666"></i> Just now</div>
    </div>
    <div style="margin-top:10px;display:flex;gap:6px">
      <a href="/admin" style="background:#1a73e8;color:#fff;padding:4px 10px;border-radius:6px;font-size:.75rem;font-weight:700;text-decoration:none">Details</a>
      <button onclick="map.closePopup()" style="background:#f0f0f0;border:none;padding:4px 10px;border-radius:6px;font-size:.75rem;cursor:pointer">Close</button>
    </div>
  </div>\`;
}

function renderBusList(buses) {
  document.getElementById('busList').innerHTML = buses.map(bus => \`
    <div class="bus-item \${selectedBus===bus.id?'selected':''}" onclick="selectBus('\${bus.id}')">
      <div class="bus-dot" style="background:\${busColors[bus.status]||'#9e9e9e'}"></div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:.875rem">\${bus.nickname}</div>
        <div style="font-size:.72rem;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${bus.number}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:.8rem;font-weight:700;color:\${busColors[bus.status]}">\${bus.speed} km/h</div>
        <div style="font-size:.7rem;color:#999">\${bus.fuel}% ⛽</div>
      </div>
    </div>
  \`).join('');
}

function filterBusList() {
  const q = document.getElementById('busSearchT').value.toLowerCase();
  const s = document.getElementById('statusFilterT').value;
  renderBusList(allBusList.filter(b => (b.nickname.toLowerCase().includes(q)||b.number.toLowerCase().includes(q)) && (!s||b.status===s)));
}

function selectBus(id) {
  selectedBus = id;
  const bus = allBusList.find(b => b.id===id);
  if (!bus) return;
  renderBusList(allBusList);
  map.setView([bus.lat, bus.lng], 15);
  busMarkers[id]?.openPopup();
}

function fitAllBuses() {
  if (!allBusList.length) return;
  const bounds = allBusList.map(b => [b.lat, b.lng]);
  map.fitBounds(bounds, { padding:[40,40] });
}

function toggleSatellite() {
  const btn = document.getElementById('satBtn');
  if (map.hasLayer(satLayer)) {
    map.removeLayer(satLayer); normalLayer.addTo(map);
    btn.innerHTML = '<i class="fa fa-satellite"></i> Satellite';
  } else {
    map.removeLayer(normalLayer); satLayer.addTo(map);
    btn.innerHTML = '<i class="fa fa-map"></i> Map';
  }
}

function toggleHeatmap() {
  heatmapOn = !heatmapOn;
  document.getElementById('heatBtn').style.color = heatmapOn ? '#1a73e8' : '';
  showToast(heatmapOn ? 'Heatmap overlay enabled' : 'Heatmap disabled', 'info');
}

// Simulate real-time movement
function simulateMovement() {
  allBusList.forEach(bus => {
    if (bus.status === 'on_trip' || bus.status === 'delayed') {
      const drift = 0.0008;
      bus.lat += (Math.random() - 0.5) * drift;
      bus.lng += (Math.random() - 0.5) * drift;
      bus.speed = Math.max(5, Math.min(60, bus.speed + (Math.random() - 0.5) * 4));
      if (busMarkers[bus.id]) busMarkers[bus.id].setLatLng([bus.lat, bus.lng]);
    }
  });
  if (selectedBus) {
    const bus = allBusList.find(b => b.id===selectedBus);
    if (bus && busMarkers[bus.id]) busMarkers[bus.id].openPopup();
  }
  renderBusList(allBusList.filter(b => {
    const q = document.getElementById('busSearchT').value.toLowerCase();
    const s = document.getElementById('statusFilterT').value;
    return (b.nickname.toLowerCase().includes(q)||b.number.toLowerCase().includes(q)) && (!s||b.status===s);
  }));
  document.getElementById('infoOnTrip').textContent = allBusList.filter(b=>b.status==='on_trip').length;
}

initMap().then(() => {
  setInterval(simulateMovement, 3000);
  showToast('Live tracking active — GPS updates every 3s', 'success');
});
</script>
</body></html>`
}

// ════════════════════════════════════════════════════════════════
// DRIVER APP PAGE
// ════════════════════════════════════════════════════════════════
function driverAppPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('Driver App')}
<style>
  body { background:#f0f2f5; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
  .phone-frame { width:375px; background:#fff; border-radius:40px; overflow:hidden; box-shadow:0 24px 80px rgba(0,0,0,.25); border:8px solid #1a1a2e; min-height:780px; position:relative; }
  .status-bar { background:#0d1b2a; color:#fff; padding:10px 20px; display:flex; justify-content:space-between; font-size:.72rem; }
  .app-header { background:linear-gradient(135deg,#1a73e8,#0d47a1); color:#fff; padding:20px; }
  .app-header h1 { margin:0; font-size:1.3rem; font-weight:800; }
  .app-header p { margin:4px 0 0; font-size:.78rem; opacity:.8; }
  .app-body { padding:16px; }
  .driver-card { background:linear-gradient(135deg,#1a73e8,#0d47a1); color:#fff; border-radius:16px; padding:18px; margin-bottom:16px; }
  .trip-status { border-radius:16px; padding:16px; margin-bottom:16px; }
  .trip-status.idle { background:#f0f2f5; }
  .trip-status.active { background:linear-gradient(135deg,#00c853,#00a844); color:#fff; }
  .action-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
  .action-btn { border:none; border-radius:14px; padding:16px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; font-size:.8rem; font-weight:700; transition:.2s; }
  .action-btn:active { transform:scale(.95); }
  .action-btn .icon { font-size:1.8rem; }
  .sos-btn { width:100%; background:linear-gradient(135deg,#f44336,#b71c1c); color:#fff; border:none; border-radius:16px; padding:18px; font-size:1.1rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:16px; box-shadow:0 8px 24px rgba(244,67,54,.4); transition:.2s; }
  .sos-btn:active { transform:scale(.97); }
  .mini-map { height:160px; border-radius:14px; overflow:hidden; margin-bottom:16px; }
  .stat-row { display:flex; gap:10px; margin-bottom:16px; }
  .stat-box { flex:1; background:#f8f9fa; border-radius:12px; padding:12px; text-align:center; }
  .stat-box .v { font-size:1.4rem; font-weight:800; color:#1a73e8; }
  .stat-box .l { font-size:.68rem; color:#666; }
  .stop-list { background:#f8f9fa; border-radius:14px; padding:12px; margin-bottom:16px; }
  .stop-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #ebebeb; }
  .stop-item:last-child { border-bottom:none; }
  .stop-num { width:26px; height:26px; border-radius:50%; background:#1a73e8; color:#fff; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; }
  .stop-num.done { background:#00c853; }
  .bottom-nav { position:sticky; bottom:0; background:#fff; border-top:1px solid #f0f0f0; display:flex; justify-content:space-around; padding:10px 0 6px; }
  .nav-item { display:flex; flex-direction:column; align-items:center; gap:3px; font-size:.65rem; font-weight:600; color:#999; cursor:pointer; padding:0 12px; }
  .nav-item.active { color:#1a73e8; }
  .badge-alert { background:#f44336; color:#fff; border-radius:50%; width:16px; height:16px; font-size:.6rem; display:flex; align-items:center; justify-content:center; position:absolute; top:-4px; right:-4px; }
  .trip-start-btn { width:100%; background:linear-gradient(135deg,#00c853,#00a844); color:#fff; border:none; border-radius:14px; padding:16px; font-size:1rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:.2s; }
  .trip-stop-btn { width:100%; background:linear-gradient(135deg,#ff9800,#f57c00); color:#fff; border:none; border-radius:14px; padding:16px; font-size:1rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:.2s; }
</style>
</head>
<body>
<div style="text-align:center;max-width:600px;margin:0 auto">
  <h2 style="font-size:1rem;color:#666;margin-bottom:16px">📱 Driver App — Mobile PWA Preview</h2>
  <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap">
    
    <!-- Phone 1: Active Trip -->
    <div>
      <p style="font-size:.78rem;color:#999;margin-bottom:8px">🟢 Active Trip View</p>
      <div class="phone-frame">
        <div class="status-bar">
          <span>09:15</span>
          <span>📶 4G &nbsp; 🔋 78%</span>
        </div>
        <div class="app-header">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <h1>🚌 TrackSchool Driver</h1>
              <p>Rajesh Kumar • Bus Alpha</p>
            </div>
            <div style="background:rgba(255,255,255,.2);border-radius:10px;padding:6px 10px;font-size:.72rem">
              <span class="live-dot"></span> GPS ON
            </div>
          </div>
        </div>
        <div class="app-body">
          <div class="trip-status active">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <i class="fa fa-circle-play" style="font-size:1.2rem"></i>
              <span style="font-weight:800">TRIP IN PROGRESS</span>
            </div>
            <div style="font-size:.8rem;opacity:.9">Route A - North Delhi • Started 07:10</div>
            <div style="font-size:.8rem;opacity:.9;margin-top:2px">Students: 22 boarded / 0 dropped</div>
          </div>

          <div class="stat-row">
            <div class="stat-box"><div class="v" id="dSpeed">28</div><div class="l">km/h</div></div>
            <div class="stat-box"><div class="v" id="dDist">14.2</div><div class="l">km covered</div></div>
            <div class="stat-box"><div class="v">08:10</div><div class="l">ETA school</div></div>
          </div>

          <div class="mini-map" id="driverMap"></div>

          <div class="stop-list">
            <div style="font-size:.75rem;font-weight:700;color:#666;margin-bottom:6px">NEXT STOPS</div>
            <div class="stop-item"><div class="stop-num done">✓</div><div><div style="font-size:.82rem;font-weight:700;text-decoration:line-through;color:#999">Rohini Sec-7</div><div style="font-size:.7rem;color:#999">8 students picked</div></div><div style="margin-left:auto;font-size:.72rem;color:#00c853">Done</div></div>
            <div class="stop-item"><div class="stop-num done">✓</div><div><div style="font-size:.82rem;font-weight:700;text-decoration:line-through;color:#999">Pitampura</div><div style="font-size:.7rem;color:#999">6 students picked</div></div><div style="margin-left:auto;font-size:.72rem;color:#00c853">Done</div></div>
            <div class="stop-item" style="background:#e8f0fe;margin:0 -4px;padding:8px 4px;border-radius:8px"><div class="stop-num" style="background:#ff9800">3</div><div><div style="font-size:.82rem;font-weight:700;color:#ff9800">Netaji Subhash Place</div><div style="font-size:.7rem;color:#666">5 students • ETA 07:40</div></div><div style="margin-left:auto;font-size:.72rem;color:#ff9800">Next →</div></div>
            <div class="stop-item"><div class="stop-num">4</div><div><div style="font-size:.82rem">Azadpur</div><div style="font-size:.7rem;color:#999">9 students • ETA 07:52</div></div></div>
            <div class="stop-item"><div class="stop-num">🏫</div><div><div style="font-size:.82rem">School Gate</div><div style="font-size:.7rem;color:#999">Destination • ETA 08:10</div></div></div>
          </div>

          <button class="sos-btn" onclick="triggerSOS()">
            🚨 SOS EMERGENCY
          </button>

          <button class="trip-stop-btn" onclick="endTrip()">
            <i class="fa fa-stop-circle"></i> End Trip
          </button>
        </div>
        <div class="bottom-nav">
          <div class="nav-item active"><i class="fa fa-house" style="font-size:1.1rem"></i>Home</div>
          <div class="nav-item" style="position:relative"><i class="fa fa-map" style="font-size:1.1rem"></i>Map</div>
          <div class="nav-item" style="position:relative"><i class="fa fa-bell" style="font-size:1.1rem"></i><span class="badge-alert">2</span>Alerts</div>
          <div class="nav-item"><i class="fa fa-user" style="font-size:1.1rem"></i>Profile</div>
        </div>
      </div>
    </div>

    <!-- Phone 2: Pre-trip -->
    <div>
      <p style="font-size:.78rem;color:#999;margin-bottom:8px">⏸️ Pre-Trip View</p>
      <div class="phone-frame">
        <div class="status-bar">
          <span>06:58</span>
          <span>📶 4G &nbsp; 🔋 95%</span>
        </div>
        <div class="app-header">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div><h1>🚌 TrackSchool Driver</h1><p>Mohan Lal • Bus Gamma</p></div>
            <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:6px 10px;font-size:.72rem">GPS ON</div>
          </div>
        </div>
        <div class="app-body">
          <div class="driver-card">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.5rem">👨</div>
              <div>
                <div style="font-weight:800">Mohan Lal</div>
                <div style="opacity:.8;font-size:.78rem">License: DL-04-2013-056983</div>
                <div style="margin-top:4px"><span style="background:#00c853;padding:2px 8px;border-radius:10px;font-size:.7rem">On Duty</span></div>
              </div>
            </div>
            <div style="display:flex;gap:12px;margin-top:14px">
              <div style="flex:1;background:rgba(255,255,255,.1);border-radius:8px;padding:10px;text-align:center">
                <div style="font-size:1.2rem;font-weight:800">1,580</div>
                <div style="font-size:.7rem;opacity:.7">Total Trips</div>
              </div>
              <div style="flex:1;background:rgba(255,255,255,.1);border-radius:8px;padding:10px;text-align:center">
                <div style="font-size:1.2rem;font-weight:800">4.9 ⭐</div>
                <div style="font-size:.7rem;opacity:.7">Rating</div>
              </div>
            </div>
          </div>

          <div class="trip-status idle">
            <div style="font-weight:700;font-size:.9rem;margin-bottom:8px;color:#333">📋 Today's Assignment</div>
            <div style="font-size:.82rem;color:#555">Route: Route C - East Delhi</div>
            <div style="font-size:.82rem;color:#555">Bus: DL-01-EF-9012 (Gamma)</div>
            <div style="font-size:.82rem;color:#555">Departure: 07:00 AM</div>
            <div style="font-size:.82rem;color:#555">Students: 30 expected</div>
          </div>

          <div style="background:#fff3e0;border-radius:12px;padding:14px;margin-bottom:14px;border-left:4px solid #ff9800">
            <div style="font-weight:700;font-size:.82rem;color:#e65100">⚠️ Pre-Trip Checklist</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
              ${['Tyre pressure OK','Fuel above 30%','Brakes checked','Seatbelts functional','First aid kit present'].map(item => `
                <label style="display:flex;align-items:center;gap:8px;font-size:.78rem;color:#555">
                  <input type="checkbox" checked> ${item}
                </label>`).join('')}
            </div>
          </div>

          <button class="trip-start-btn" onclick="startTrip()">
            <i class="fa fa-play-circle"></i> Start Trip
          </button>

          <div style="margin-top:10px;display:flex;gap:8px">
            <button style="flex:1;background:#f0f2f5;border:none;border-radius:10px;padding:12px;font-size:.8rem;font-weight:700;cursor:pointer;color:#333" onclick="showDriverToast('Break request sent to admin','info')">
              ☕ Request Break
            </button>
            <button style="flex:1;background:#f0f2f5;border:none;border-radius:10px;padding:12px;font-size:.8rem;font-weight:700;cursor:pointer;color:#333" onclick="showDriverToast('Message sent to school admin','info')">
              💬 Contact Admin
            </button>
          </div>
        </div>
        <div class="bottom-nav">
          <div class="nav-item active"><i class="fa fa-house" style="font-size:1.1rem"></i>Home</div>
          <div class="nav-item"><i class="fa fa-map" style="font-size:1.1rem"></i>Map</div>
          <div class="nav-item"><i class="fa fa-bell" style="font-size:1.1rem"></i>Alerts</div>
          <div class="nav-item"><i class="fa fa-user" style="font-size:1.1rem"></i>Profile</div>
        </div>
      </div>
    </div>

  </div>
  <p style="margin-top:16px;font-size:.8rem;color:#666">← <a href="/admin" style="color:#1a73e8">Back to Admin</a> &nbsp;|&nbsp; <a href="/" style="color:#1a73e8">Home</a></p>
</div>

${toastScript()}
<script>
// Driver app mini map
const dMap = L.map('driverMap').setView([28.6139, 77.2090], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(dMap);
const busIcon = L.divIcon({ html:'<div style="font-size:24px">🚌</div>', iconSize:[24,24], iconAnchor:[12,12] });
const marker = L.marker([28.6200, 77.2100], {icon:busIcon}).addTo(dMap).bindPopup('Bus Gamma — Route C');
L.polyline([[28.6462,77.2897],[28.6355,77.2800],[28.6469,77.3152],[28.6127,77.2773],[28.6139,77.2090]], {color:'#43a047',weight:3,dashArray:'6 4'}).addTo(dMap);

// Simulate movement
let lat = 28.6200, lng = 77.2100, spd = 28;
setInterval(() => {
  lat += (Math.random() - 0.5) * 0.001;
  lng += (Math.random() - 0.5) * 0.001;
  spd = Math.max(10, Math.min(55, spd + (Math.random()-0.5)*5));
  marker.setLatLng([lat, lng]);
  const el = document.getElementById('dSpeed');
  if (el) el.textContent = Math.round(spd);
  const el2 = document.getElementById('dDist');
  if (el2) el2.textContent = (parseFloat(el2.textContent) + 0.02).toFixed(1);
}, 2000);

function showDriverToast(msg, type) { showToast(msg, type); }

function triggerSOS() {
  if (confirm('🚨 SEND SOS EMERGENCY ALERT?\\n\\nThis will immediately alert the school admin and platform team.')) {
    showToast('🚨 SOS SENT! Admin notified immediately', 'error');
  }
}

function startTrip() {
  showToast('✅ Trip started! GPS broadcasting active', 'success');
}

function endTrip() {
  if (confirm('End trip and submit report?')) {
    showToast('Trip ended. Report submitted automatically.', 'success');
  }
}
</script>
</body></html>`
}

// ════════════════════════════════════════════════════════════════
// PARENT PORTAL
// ════════════════════════════════════════════════════════════════
function parentPortalPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('Parent Portal')}
<style>
  body { background:#f0f2f5; }
  .parent-header { background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%); color:#fff; padding:20px 24px; }
  .parent-header h1 { margin:0; font-size:1.4rem; font-weight:800; }
  .content { max-width:900px; margin:0 auto; padding:24px; }
  .child-card { background:linear-gradient(135deg,#1a73e8,#0d47a1); color:#fff; border-radius:16px; padding:20px; margin-bottom:20px; }
  .tracking-card { background:#fff; border-radius:16px; padding:0; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); margin-bottom:20px; }
  .bus-info-bar { background:#e8f5e9; border-top:1px solid #c8e6c9; padding:14px 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
</style>
</head>
<body>
<div class="parent-header">
  <div style="display:flex;align-items:center;justify-content:space-between;max-width:900px;margin:0 auto">
    <div>
      <h1>🏠 Parent Portal</h1>
      <p style="margin:4px 0 0;opacity:.8;font-size:.85rem">Welcome, Ashok Sharma</p>
    </div>
    <div style="display:flex;gap:12px;align-items:center">
      <span style="font-size:.8rem;opacity:.7"><span class="live-dot"></span> Live</span>
      <a href="/" style="color:rgba(255,255,255,.7);text-decoration:none;font-size:.85rem">← Home</a>
    </div>
  </div>
</div>

<div class="content">
  <!-- Child Info -->
  <div class="child-card">
    <div style="display:flex;align-items:center;gap:16px">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.8rem">👦</div>
      <div style="flex:1">
        <h2 style="margin:0;font-size:1.2rem">Aarav Sharma</h2>
        <p style="margin:4px 0 0;opacity:.8;font-size:.85rem">Class 5A • Delhi Public School</p>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:rgba(0,200,83,.3);padding:3px 10px;border-radius:20px;font-size:.75rem">🟢 Boarded</span>
          <span style="background:rgba(255,255,255,.15);padding:3px 10px;border-radius:20px;font-size:.75rem">Bus Alpha</span>
          <span style="background:rgba(255,255,255,.15);padding:3px 10px;border-radius:20px;font-size:.75rem">Route A - North Delhi</span>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.8rem;opacity:.7">ETA School</div>
        <div style="font-size:1.8rem;font-weight:800" id="etaDisplay">08:10</div>
        <div style="font-size:.75rem;opacity:.7" id="etaStatus">On time</div>
      </div>
    </div>
  </div>

  <!-- Live Map -->
  <div class="tracking-card">
    <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
      <div>
        <h3 style="margin:0;font-size:1rem;font-weight:700">Live Bus Location</h3>
        <p style="margin:2px 0 0;font-size:.8rem;color:#666"><span class="live-dot"></span> Updating every 5 seconds</p>
      </div>
      <div id="busSpeedBadge" style="background:#e8f0fe;color:#1a73e8;padding:6px 14px;border-radius:20px;font-size:.82rem;font-weight:700">32 km/h</div>
    </div>
    <div id="parentMap" style="height:360px"></div>
    <div class="bus-info-bar">
      <div><i class="fa fa-bus" style="color:#1a73e8;margin-right:6px"></i><strong>Bus Alpha</strong> (DL-01-AB-1234)</div>
      <div><i class="fa fa-id-badge" style="color:#1a73e8;margin-right:6px"></i>Driver: Rajesh Kumar</div>
      <div><i class="fa fa-phone" style="color:#1a73e8;margin-right:6px"></i>
        <a href="tel:+919811111111" style="color:#1a73e8;font-weight:700">Call Driver</a>
      </div>
      <div><i class="fa fa-users" style="color:#1a73e8;margin-right:6px"></i>22 students on board</div>
    </div>
  </div>

  <div class="grid-2" style="margin-bottom:20px">
    <!-- Journey Timeline -->
    <div class="card">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Journey Timeline</h3>
      <div id="journeyTimeline"></div>
    </div>

    <!-- Notifications -->
    <div class="card">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Today's Notifications</h3>
      <div id="parentNotifications"></div>
      <div style="margin-top:16px;border-top:1px solid #f0f0f0;padding-top:14px">
        <h4 style="margin:0 0 10px;font-size:.875rem;font-weight:700">Notification Settings</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem"><input type="checkbox" checked> Bus departed from first stop</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem"><input type="checkbox" checked> Child boarded (RFID)</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem"><input type="checkbox" checked> Bus 10 min away from school</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem"><input type="checkbox" checked> Bus arrived at school</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem"><input type="checkbox"> Delay alerts</label>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="showToast('Preferences saved!','success')">Save Preferences</button>
      </div>
    </div>
  </div>

  <!-- Trip History -->
  <div class="card">
    <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Aarav's Trip History (Last 7 Days)</h3>
    <table>
      <thead><tr><th>Date</th><th>Bus</th><th>Boarded At</th><th>Arrived At</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Jan 15 (Today)</td><td>Bus Alpha</td><td>07:18 at Rohini Sec-7</td><td>—</td><td><span class="badge in_progress">In Progress</span></td></tr>
        <tr><td>Jan 14</td><td>Bus Alpha</td><td>07:16 at Rohini Sec-7</td><td>08:12</td><td><span class="badge completed">On Time</span></td></tr>
        <tr><td>Jan 13</td><td>Bus Alpha</td><td>07:22 at Rohini Sec-7</td><td>08:20</td><td><span class="badge medium">Delayed 8min</span></td></tr>
        <tr><td>Jan 12</td><td>Bus Alpha</td><td>07:14 at Rohini Sec-7</td><td>08:09</td><td><span class="badge completed">On Time</span></td></tr>
        <tr><td>Jan 11</td><td>Bus Alpha</td><td>07:18 at Rohini Sec-7</td><td>08:13</td><td><span class="badge completed">On Time</span></td></tr>
      </tbody>
    </table>
  </div>
</div>

${toastScript()}
<script>
// Parent map
const pMap = L.map('parentMap').setView([28.6500, 77.1500], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(pMap);

// School marker
L.marker([28.6139, 77.2090]).bindPopup('<b>🏫 Delhi Public School</b><br>Destination').addTo(pMap);

// Route
L.polyline([[28.7200,77.1100],[28.7000,77.1300],[28.6800,77.1500],[28.7100,77.1800],[28.6139,77.2090]], {color:'#e53935',weight:3,dashArray:'6 4'}).addTo(pMap);

// Stops
const stops = [
  [28.7200,77.1100,'Rohini Sec-7','07:15','done'],
  [28.7000,77.1300,'Pitampura','07:28','done'],
  [28.6800,77.1500,'Netaji Subhash Place','07:40','next'],
  [28.7100,77.1800,'Azadpur','07:52','upcoming'],
  [28.6139,77.2090,'School Gate','08:10','school'],
];
stops.forEach(([lat,lng,name,eta,status]) => {
  const color = status==='done'?'#00c853':status==='next'?'#ff9800':status==='school'?'#1a73e8':'#bdbdbd';
  L.circleMarker([lat,lng],{radius:7,color,fillColor:color,fillOpacity:1,weight:2}).bindPopup(\`<b>\${name}</b><br>ETA: \${eta}\`).addTo(pMap);
});

// Aarav's bus
const busIcon = L.divIcon({html:'<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">🚌</div>',iconSize:[28,28],iconAnchor:[14,14]});
let bLat = 28.6900, bLng = 77.1400;
const busM = L.marker([bLat,bLng],{icon:busIcon}).bindPopup('<b>Bus Alpha</b><br>Aarav is on this bus<br>32 km/h').addTo(pMap);

setInterval(() => {
  bLat += 0.0008; bLng += 0.0005;
  busM.setLatLng([bLat, bLng]);
}, 3000);

// Journey timeline
const timelineStops = [
  {name:'Rohini Sec-7',time:'07:18',status:'done',note:'Aarav boarded ✓'},
  {name:'Pitampura',time:'07:30',status:'done',note:'6 students boarded'},
  {name:'Netaji Subhash Place',time:'07:42',status:'current',note:'Bus approaching...'},
  {name:'Azadpur',time:'07:54',status:'upcoming',note:'~12 min away'},
  {name:'School Gate',time:'08:10',status:'upcoming',note:'ETA: 28 min'},
];
document.getElementById('journeyTimeline').innerHTML = timelineStops.map((s,i) => \`
  <div style="display:flex;gap:12px;padding-bottom:\${i<timelineStops.length-1?'16px':'0'}">
    <div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:28px;height:28px;border-radius:50%;background:\${s.status==='done'?'#00c853':s.status==='current'?'#1a73e8':'#e0e0e0'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0">\${s.status==='done'?'✓':i+1}</div>
      \${i<timelineStops.length-1?'<div style="width:2px;flex:1;background:#e0e0e0;margin-top:4px"></div>':''}
    </div>
    <div style="padding-top:4px">
      <div style="font-weight:700;font-size:.875rem;color:\${s.status==='done'?'#999':s.status==='current'?'#1a73e8':'#333'}">\${s.name}</div>
      <div style="font-size:.75rem;color:#666">\${s.time} • \${s.note}</div>
    </div>
  </div>
\`).join('');

// Notifications
const notifications = [
  {time:'07:10',msg:'Bus Alpha departed from Rohini Sec-7',type:'info'},
  {time:'07:18',msg:'✅ Aarav boarded Bus Alpha at Rohini Sec-7',type:'success'},
  {time:'07:30',msg:'Bus Alpha reached Pitampura stop',type:'info'},
];
document.getElementById('parentNotifications').innerHTML = notifications.map(n => \`
  <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0">
    <div style="width:8px;height:8px;border-radius:50%;background:\${n.type==='success'?'#00c853':'#2196f3'};margin-top:5px;flex-shrink:0"></div>
    <div>
      <div style="font-size:.82rem">\${n.msg}</div>
      <div style="font-size:.72rem;color:#999;margin-top:2px">\${n.time} AM</div>
    </div>
  </div>
\`).join('');
</script>
</body></html>`
}

// ════════════════════════════════════════════════════════════════
// ERP API DOCS PAGE
// ════════════════════════════════════════════════════════════════
function erpDocsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead('ERP Integration API')}
<style>
  body { background:#0a0f1e; color:#e0e0e0; }
  .docs-header { background:linear-gradient(135deg,#0d1b2a,#1a3a5c); padding:40px; border-bottom:1px solid rgba(255,255,255,.08); }
  .docs-nav { width:260px; min-height:100vh; background:#0d1421; border-right:1px solid rgba(255,255,255,.08); position:fixed; top:0; left:0; padding:20px 0; overflow-y:auto; }
  .docs-nav .brand { padding:16px 20px 20px; border-bottom:1px solid rgba(255,255,255,.08); font-weight:800; font-size:1.1rem; display:flex;align-items:center;gap:8px; }
  .docs-nav a { display:block; padding:8px 20px; font-size:.85rem; color:rgba(255,255,255,.6); text-decoration:none; transition:.15s; }
  .docs-nav a:hover { color:#fff; background:rgba(255,255,255,.05); }
  .docs-nav .section { padding:12px 20px 4px; font-size:.65rem; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1px; font-weight:600; }
  .docs-content { margin-left:260px; padding:40px; max-width:900px; }
  .endpoint { background:#0d1421; border:1px solid rgba(255,255,255,.08); border-radius:12px; margin-bottom:24px; overflow:hidden; }
  .endpoint-header { padding:16px 20px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:.2s; }
  .endpoint-header:hover { background:rgba(255,255,255,.04); }
  .method { padding:4px 12px; border-radius:6px; font-size:.75rem; font-weight:800; font-family:monospace; }
  .method.get { background:#e8f5e9; color:#2e7d32; }
  .method.post { background:#e3f2fd; color:#1565c0; }
  .method.put { background:#fff3e0; color:#e65100; }
  .method.delete { background:#ffebee; color:#c62828; }
  .endpoint-path { font-family:monospace; font-size:.9rem; color:#90caf9; }
  .endpoint-desc { font-size:.82rem; color:rgba(255,255,255,.5); margin-left:auto; }
  .endpoint-body { border-top:1px solid rgba(255,255,255,.08); padding:20px; }
  .code-block { background:#060a12; border-radius:8px; padding:16px; font-family:'Courier New',monospace; font-size:.8rem; overflow-x:auto; border:1px solid rgba(255,255,255,.05); }
  .code-block .key { color:#90caf9; }
  .code-block .str { color:#a5d6a7; }
  .code-block .num { color:#ffcc02; }
  .code-block .bool { color:#ff9800; }
  .try-btn { background:#1a73e8; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-size:.8rem; font-weight:700; cursor:pointer; transition:.2s; }
  .try-btn:hover { background:#1565c0; }
  .response-area { background:#060a12; border-radius:8px; padding:16px; font-family:monospace; font-size:.78rem; color:#a5d6a7; overflow-x:auto; border:1px solid rgba(0,200,83,.2); max-height:300px; overflow-y:auto; white-space:pre; display:none; }
  h1 { color:#fff; }
  h2 { color:#90caf9; border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:8px; }
  h3 { color:#fff; }
  p { line-height:1.7; color:rgba(255,255,255,.7); }
</style>
</head>
<body>

<div class="docs-nav">
  <div class="brand">🚌 TrackSchool API</div>
  <div class="section">Getting Started</div>
  <a href="#overview">Overview</a>
  <a href="#auth">Authentication</a>
  <a href="#ratelimit">Rate Limits</a>
  <div class="section">Core APIs</div>
  <a href="#buses">Buses & Fleet</a>
  <a href="#drivers">Drivers</a>
  <a href="#routes">Routes</a>
  <a href="#students">Students</a>
  <div class="section">ERP Integration</div>
  <a href="#erp-sync">Student Sync</a>
  <a href="#erp-attendance">Attendance</a>
  <a href="#erp-status">Bus Status</a>
  <div class="section">Webhooks</div>
  <a href="#webhooks">Webhook Events</a>
  <div class="section">Navigation</div>
  <a href="/">← Home</a>
  <a href="/superadmin">Super Admin</a>
  <a href="/admin">School Admin</a>
</div>

<div class="docs-content">
  <h1>TrackSchool ERP Integration API</h1>
  <p>The TrackSchool REST API enables your ERP system to integrate student data, sync attendance, monitor bus status, and automate transport operations. All endpoints return JSON and use token-based authentication.</p>

  <div style="background:rgba(26,115,232,.15);border:1px solid rgba(26,115,232,.3);border-radius:10px;padding:16px 20px;margin-bottom:32px">
    <strong style="color:#90caf9">Base URL:</strong> <code style="font-family:monospace;color:#a5d6a7">https://api.trackschool.io/v1</code><br>
    <strong style="color:#90caf9">Demo URL:</strong> <code style="font-family:monospace;color:#a5d6a7">http://localhost:3000/api</code><br>
    <strong style="color:#90caf9">Version:</strong> v1.0 &nbsp;|&nbsp; <strong style="color:#90caf9">Format:</strong> JSON &nbsp;|&nbsp; <strong style="color:#90caf9">Auth:</strong> Bearer Token
  </div>

  <h2 id="auth">🔐 Authentication</h2>
  <p>All API requests require a Bearer token in the Authorization header. Obtain your API key from the Tenant Admin panel under Settings → API Keys.</p>
  <div class="code-block">
curl -H <span class="str">"Authorization: Bearer YOUR_API_KEY"</span> \\
     -H <span class="str">"Content-Type: application/json"</span> \\
     https://api.trackschool.io/v1/buses
  </div>

  <h2 id="buses">🚌 Fleet API</h2>
  
  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="endpoint-path">/api/buses</span>
      <span class="endpoint-desc">List all buses with live status</span>
    </div>
    <div class="endpoint-body">
      <p style="font-size:.85rem;margin:0 0 12px">Returns all buses with real-time location, speed, fuel, and status information.</p>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="try-btn" onclick="tryApi('/api/buses', 'busesResponse')">▶ Try It</button>
        <code style="background:rgba(255,255,255,.05);padding:4px 10px;border-radius:6px;font-size:.8rem">?tenantId=t001</code>
      </div>
      <div class="response-area" id="busesResponse"></div>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="endpoint-path">/api/buses/:id/location</span>
      <span class="endpoint-desc">Real-time GPS location</span>
    </div>
    <div class="endpoint-body">
      <p style="font-size:.85rem;margin:0 0 12px">Get live GPS coordinates for a specific bus. Call every 5 seconds for real-time tracking.</p>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="try-btn" onclick="tryApi('/api/buses/b001/location', 'locationResponse')">▶ Try It (Bus Alpha)</button>
      </div>
      <div class="response-area" id="locationResponse"></div>
    </div>
  </div>

  <h2 id="erp-sync">🔗 ERP Integration Endpoints</h2>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="endpoint-path">/api/erp/students/sync</span>
      <span class="endpoint-desc">Sync student-bus mapping to ERP</span>
    </div>
    <div class="endpoint-body">
      <p style="font-size:.85rem;margin:0 0 12px">Returns complete student-bus-route-stop mapping for ERP synchronization. Use this to keep your student transport records up to date.</p>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="try-btn" onclick="tryApi('/api/erp/students/sync?tenantId=t001', 'syncResponse')">▶ Try It</button>
      </div>
      <div class="response-area" id="syncResponse"></div>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="endpoint-path">/api/erp/attendance/today</span>
      <span class="endpoint-desc">Get today's transport attendance</span>
    </div>
    <div class="endpoint-body">
      <p style="font-size:.85rem;margin:0 0 12px">Returns today's boarding status for all students. Integrate with your school ERP to auto-fill transport attendance.</p>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="try-btn" onclick="tryApi('/api/erp/attendance/today?tenantId=t001', 'attendanceResponse')">▶ Try It</button>
      </div>
      <div class="response-area" id="attendanceResponse"></div>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="endpoint-path">/api/erp/buses/status</span>
      <span class="endpoint-desc">Live fleet status for ERP dashboard</span>
    </div>
    <div class="endpoint-body">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="try-btn" onclick="tryApi('/api/erp/buses/status?tenantId=t001', 'busStatusResponse')">▶ Try It</button>
      </div>
      <div class="response-area" id="busStatusResponse"></div>
    </div>
  </div>

  <h2 id="webhooks">📡 Webhook Events</h2>
  <p>Configure webhooks in your Tenant Settings to receive real-time event pushes to your ERP system.</p>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    ${[
      ['bus.trip.started','Trip started by driver'],
      ['bus.trip.ended','Trip completed'],
      ['student.boarded','Student RFID scan on bus'],
      ['student.dropped','Student RFID scan at drop'],
      ['bus.sos.triggered','Driver triggered SOS panic'],
      ['bus.delay.detected','Bus is running late'],
      ['bus.geofence.entered','Bus entered school zone'],
      ['bus.speeding','Speed threshold exceeded'],
    ].map(([ev, desc]) => `
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px">
        <code style="font-size:.8rem;color:#90caf9">${ev}</code>
        <div style="font-size:.78rem;color:rgba(255,255,255,.5);margin-top:4px">${desc}</div>
      </div>`).join('')}
  </div>

  <div class="code-block">
<span class="key">// Webhook Payload Example: student.boarded</span>
{
  <span class="key">"event"</span>: <span class="str">"student.boarded"</span>,
  <span class="key">"timestamp"</span>: <span class="str">"2025-01-15T07:18:00Z"</span>,
  <span class="key">"tenant_id"</span>: <span class="str">"t001"</span>,
  <span class="key">"data"</span>: {
    <span class="key">"student_id"</span>: <span class="str">"st001"</span>,
    <span class="key">"student_name"</span>: <span class="str">"Aarav Sharma"</span>,
    <span class="key">"rfid_tag"</span>: <span class="str">"RF001"</span>,
    <span class="key">"bus_id"</span>: <span class="str">"b001"</span>,
    <span class="key">"bus_number"</span>: <span class="str">"DL-01-AB-1234"</span>,
    <span class="key">"stop_name"</span>: <span class="str">"Rohini Sec-7"</span>,
    <span class="key">"lat"</span>: <span class="num">28.7200</span>,
    <span class="key">"lng"</span>: <span class="num">77.1100</span>
  },
  <span class="key">"signature"</span>: <span class="str">"sha256=abc123..."</span>
}
  </div>

  <h2>📋 Response Format</h2>
  <div class="code-block">
<span class="key">// All API responses follow this structure:</span>
{
  <span class="key">"success"</span>: <span class="bool">true</span>,
  <span class="key">"data"</span>: [ <span class="key">/* response payload */</span> ],
  <span class="key">"count"</span>: <span class="num">18</span>,
  <span class="key">"timestamp"</span>: <span class="str">"2025-01-15T08:00:00Z"</span>
}

<span class="key">// Error response:</span>
{
  <span class="key">"success"</span>: <span class="bool">false</span>,
  <span class="key">"error"</span>: <span class="str">"Unauthorized"</span>,
  <span class="key">"code"</span>: <span class="num">401</span>
}
  </div>

  <h2>🚀 Quick Integration Example (PHP)</h2>
  <div class="code-block">
<span class="key">// PHP CodeIgniter / Laravel integration</span>
$apiKey  = <span class="str">'your_api_key_here'</span>;
$baseUrl = <span class="str">'https://api.trackschool.io/v1'</span>;

$ch = curl_init(<span class="str">"$baseUrl/erp/attendance/today?tenantId=YOUR_ID"</span>);
curl_setopt($ch, CURLOPT_HTTPHEADER, [<span class="str">"Authorization: Bearer $apiKey"</span>]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, <span class="bool">true</span>);
$response = json_decode(curl_exec($ch), <span class="bool">true</span>);

<span class="key">// Update your ERP attendance records</span>
foreach ($response[<span class="str">'data'</span>] as $student) {
    $this->db->update(<span class="str">'attendance'</span>, [
        <span class="str">'transport_status'</span> => $student[<span class="str">'attendance'</span>]
    ], [<span class="str">'student_id'</span> => $student[<span class="str">'student_id'</span>]]);
}
  </div>
</div>

${toastScript()}
<script>
async function tryApi(url, targetId) {
  const el = document.getElementById(targetId);
  el.style.display = 'block';
  el.textContent = 'Loading...';
  try {
    const res = await fetch(url);
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    showToast('API response received!', 'success');
  } catch(e) {
    el.textContent = 'Error: ' + e.message;
  }
}
</script>
</body></html>`
}
