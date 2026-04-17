// ============================================================
// MOCK DATA STORE — simulates a database for the GPS SaaS MVP
// In production: replace with D1 / MySQL / Postgres
// ============================================================

export const PLATFORM = {
  name: "TrackSchool",
  tagline: "ERP-Integrated School Transport Intelligence",
  version: "1.0.0",
  supportEmail: "support@trackschool.io",
};

// ── SUBSCRIPTION PLANS ────────────────────────────────────────
export const PLANS = [
  { id: "starter",    name: "Starter",     maxBuses: 10,  pricePerBus: 299,  features: ["Live Tracking","Alerts","Parent App"] },
  { id: "growth",     name: "Growth",      maxBuses: 50,  pricePerBus: 249,  features: ["Live Tracking","Alerts","Parent App","ERP Integration","Route Optimization"] },
  { id: "enterprise", name: "Enterprise",  maxBuses: 999, pricePerBus: 199,  features: ["Live Tracking","Alerts","Parent App","ERP Integration","Route Optimization","White Label","SLA Support","Custom Domain"] },
];

// ── TENANTS (SCHOOLS) ─────────────────────────────────────────
export const TENANTS: Tenant[] = [
  {
    id: "t001", name: "Delhi Public School", code: "DPS",
    email: "admin@dps.edu.in", phone: "+91-9876543210",
    city: "New Delhi", state: "Delhi",
    plan: "growth", activeBuses: 18, maxBuses: 50,
    status: "active", joinedAt: "2024-08-01",
    logo: "", primaryColor: "#1a73e8", secondaryColor: "#0d47a1",
    domain: "dps.trackschool.io",
    monthlyRevenue: 4482, balance: 2500,
    contact: "Mr. Ramesh Kumar",
  },
  {
    id: "t002", name: "St. Mary's Convent", code: "SMC",
    email: "admin@stmarys.edu.in", phone: "+91-9876543211",
    city: "Mumbai", state: "Maharashtra",
    plan: "starter", activeBuses: 7, maxBuses: 10,
    status: "active", joinedAt: "2024-09-15",
    logo: "", primaryColor: "#2e7d32", secondaryColor: "#1b5e20",
    domain: "stmarys.trackschool.io",
    monthlyRevenue: 2093, balance: 500,
    contact: "Sr. Theresa Joseph",
  },
  {
    id: "t003", name: "Kendriya Vidyalaya #3", code: "KV3",
    email: "admin@kv3.edu.in", phone: "+91-9876543212",
    city: "Bengaluru", state: "Karnataka",
    plan: "enterprise", activeBuses: 42, maxBuses: 999,
    status: "active", joinedAt: "2024-07-10",
    logo: "", primaryColor: "#6a1b9a", secondaryColor: "#4a148c",
    domain: "kv3.trackschool.io",
    monthlyRevenue: 8358, balance: 12000,
    contact: "Dr. Suresh Nair",
  },
  {
    id: "t004", name: "Ryan International School", code: "RIS",
    email: "admin@ryan.edu.in", phone: "+91-9876543213",
    city: "Pune", state: "Maharashtra",
    plan: "growth", activeBuses: 25, maxBuses: 50,
    status: "trial", joinedAt: "2025-01-05",
    logo: "", primaryColor: "#e65100", secondaryColor: "#bf360c",
    domain: "ryan.trackschool.io",
    monthlyRevenue: 0, balance: 0,
    contact: "Ms. Priya Singh",
  },
  {
    id: "t005", name: "DAV Model School", code: "DAV",
    email: "admin@dav.edu.in", phone: "+91-9876543214",
    city: "Chandigarh", state: "Punjab",
    plan: "starter", activeBuses: 9, maxBuses: 10,
    status: "suspended", joinedAt: "2024-06-01",
    logo: "", primaryColor: "#c62828", secondaryColor: "#b71c1c",
    domain: "dav.trackschool.io",
    monthlyRevenue: 2691, balance: -1200,
    contact: "Mr. Harpreet Bedi",
  },
];

// ── BUSES ─────────────────────────────────────────────────────
export const BUSES: Bus[] = [
  { id:"b001", tenantId:"t001", number:"DL-01-AB-1234", nickname:"Bus Alpha", capacity:45, driver:"d001", route:"r001", status:"on_trip", lat:28.6139, lng:77.2090, speed:32, lastUpdate:"2025-01-15T08:22:00Z", fuel:68, odometer:24532, deviceId:"DEV-001", engineOn:true },
  { id:"b002", tenantId:"t001", number:"DL-01-CD-5678", nickname:"Bus Beta",  capacity:40, driver:"d002", route:"r002", status:"idle",    lat:28.6200, lng:77.2200, speed:0,  lastUpdate:"2025-01-15T08:20:00Z", fuel:45, odometer:18920, deviceId:"DEV-002", engineOn:false },
  { id:"b003", tenantId:"t001", number:"DL-01-EF-9012", nickname:"Bus Gamma", capacity:50, driver:"d003", route:"r003", status:"on_trip", lat:28.6050, lng:77.1980, speed:28, lastUpdate:"2025-01-15T08:21:00Z", fuel:82, odometer:31200, deviceId:"DEV-003", engineOn:true },
  { id:"b004", tenantId:"t001", number:"DL-02-GH-3456", nickname:"Bus Delta", capacity:45, driver:"d004", route:"r001", status:"delayed", lat:28.6300, lng:77.2150, speed:12, lastUpdate:"2025-01-15T08:18:00Z", fuel:31, odometer:41200, deviceId:"DEV-004", engineOn:true },
  { id:"b005", tenantId:"t001", number:"DL-02-IJ-7890", nickname:"Bus Epsilon",capacity:40, driver:"d005", route:"r004", status:"idle",   lat:28.6400, lng:77.2300, speed:0,  lastUpdate:"2025-01-15T07:55:00Z", fuel:91, odometer:8100,  deviceId:"DEV-005", engineOn:false },
  { id:"b006", tenantId:"t002", number:"MH-01-KL-2345", nickname:"Bus One",   capacity:48, driver:"d006", route:"r005", status:"on_trip", lat:19.0760, lng:72.8777, speed:25, lastUpdate:"2025-01-15T08:22:00Z", fuel:60, odometer:15600, deviceId:"DEV-006", engineOn:true },
  { id:"b007", tenantId:"t003", number:"KA-01-MN-6789", nickname:"Bus Eagle", capacity:52, driver:"d007", route:"r006", status:"on_trip", lat:12.9716, lng:77.5946, speed:35, lastUpdate:"2025-01-15T08:22:00Z", fuel:77, odometer:22400, deviceId:"DEV-007", engineOn:true },
];

// ── DRIVERS ───────────────────────────────────────────────────
export const DRIVERS: Driver[] = [
  { id:"d001", tenantId:"t001", name:"Rajesh Kumar",    phone:"+91-9811111111", license:"DL-0420110034761", photo:"", status:"on_duty",  rating:4.8, trips:1240, busId:"b001", joinedAt:"2022-03-15", emergencyContact:"+91-9811111112" },
  { id:"d002", tenantId:"t001", name:"Suresh Yadav",    phone:"+91-9822222222", license:"DL-0420120045872", photo:"", status:"off_duty", rating:4.6, trips:980,  busId:"b002", joinedAt:"2022-06-20", emergencyContact:"+91-9822222223" },
  { id:"d003", tenantId:"t001", name:"Mohan Lal",       phone:"+91-9833333333", license:"DL-0420130056983", photo:"", status:"on_duty",  rating:4.9, trips:1580, busId:"b003", joinedAt:"2021-11-10", emergencyContact:"+91-9833333334" },
  { id:"d004", tenantId:"t001", name:"Vikram Singh",    phone:"+91-9844444444", license:"DL-0420140068094", photo:"", status:"on_duty",  rating:4.3, trips:760,  busId:"b004", joinedAt:"2023-01-05", emergencyContact:"+91-9844444445" },
  { id:"d005", tenantId:"t001", name:"Anil Sharma",     phone:"+91-9855555555", license:"DL-0420150079205", photo:"", status:"off_duty", rating:4.7, trips:1100, busId:"b005", joinedAt:"2022-09-18", emergencyContact:"+91-9855555556" },
  { id:"d006", tenantId:"t002", name:"Santosh Patil",   phone:"+91-9866666666", license:"MH-0420130067123", photo:"", status:"on_duty",  rating:4.5, trips:890,  busId:"b006", joinedAt:"2023-03-12", emergencyContact:"+91-9866666667" },
  { id:"d007", tenantId:"t003", name:"Prakash Gowda",   phone:"+91-9877777777", license:"KA-0420140078234", photo:"", status:"on_duty",  rating:4.9, trips:2100, busId:"b007", joinedAt:"2021-07-22", emergencyContact:"+91-9877777778" },
];

// ── ROUTES ────────────────────────────────────────────────────
export const ROUTES: Route[] = [
  {
    id:"r001", tenantId:"t001", name:"Route A - North Delhi", color:"#e53935",
    stops:[
      { id:"s1", name:"Rohini Sec-7",     lat:28.7200, lng:77.1100, order:1, students:8,  eta:"07:15" },
      { id:"s2", name:"Pitampura",        lat:28.7000, lng:77.1300, order:2, students:6,  eta:"07:28" },
      { id:"s3", name:"Netaji Subhash Place", lat:28.6800, lng:77.1500, order:3, students:5, eta:"07:40" },
      { id:"s4", name:"Azadpur",          lat:28.7100, lng:77.1800, order:4, students:9,  eta:"07:52" },
      { id:"s5", name:"School Gate",      lat:28.6139, lng:77.2090, order:5, students:0,  eta:"08:10" },
    ],
    totalStudents:28, distance:"18 km", duration:"55 min", activeBuses:2,
  },
  {
    id:"r002", tenantId:"t001", name:"Route B - South Delhi", color:"#1e88e5",
    stops:[
      { id:"s6",  name:"Saket",           lat:28.5225, lng:77.2165, order:1, students:10, eta:"07:10" },
      { id:"s7",  name:"Malviya Nagar",   lat:28.5355, lng:77.2071, order:2, students:7,  eta:"07:22" },
      { id:"s8",  name:"Hauz Khas",       lat:28.5494, lng:77.2001, order:3, students:5,  eta:"07:35" },
      { id:"s9",  name:"IIT Gate",        lat:28.5459, lng:77.1926, order:4, students:4,  eta:"07:48" },
      { id:"s10", name:"School Gate",     lat:28.6139, lng:77.2090, order:5, students:0,  eta:"08:15" },
    ],
    totalStudents:26, distance:"22 km", duration:"65 min", activeBuses:1,
  },
  {
    id:"r003", tenantId:"t001", name:"Route C - East Delhi",  color:"#43a047",
    stops:[
      { id:"s11", name:"Preet Vihar",     lat:28.6462, lng:77.2897, order:1, students:12, eta:"07:05" },
      { id:"s12", name:"Nirman Vihar",    lat:28.6355, lng:77.2800, order:2, students:8,  eta:"07:18" },
      { id:"s13", name:"Anand Vihar",     lat:28.6469, lng:77.3152, order:3, students:6,  eta:"07:30" },
      { id:"s14", name:"Akshardham",      lat:28.6127, lng:77.2773, order:4, students:4,  eta:"07:45" },
      { id:"s15", name:"School Gate",     lat:28.6139, lng:77.2090, order:5, students:0,  eta:"08:05" },
    ],
    totalStudents:30, distance:"20 km", duration:"60 min", activeBuses:1,
  },
  {
    id:"r004", tenantId:"t001", name:"Route D - West Delhi",  color:"#fb8c00",
    stops:[
      { id:"s16", name:"Dwarka Sec-10",   lat:28.5921, lng:77.0460, order:1, students:9,  eta:"07:00" },
      { id:"s17", name:"Uttam Nagar",     lat:28.6211, lng:77.0589, order:2, students:7,  eta:"07:15" },
      { id:"s18", name:"Janakpuri",       lat:28.6289, lng:77.0839, order:3, students:5,  eta:"07:28" },
      { id:"s19", name:"Rajouri Garden",  lat:28.6479, lng:77.1220, order:4, students:6,  eta:"07:42" },
      { id:"s20", name:"School Gate",     lat:28.6139, lng:77.2090, order:5, students:0,  eta:"08:00" },
    ],
    totalStudents:27, distance:"25 km", duration:"60 min", activeBuses:1,
  },
  {
    id:"r005", tenantId:"t002", name:"Route 1 - Andheri",     color:"#8e24aa",
    stops:[
      { id:"s21", name:"Andheri West",    lat:19.1190, lng:72.8468, order:1, students:14, eta:"07:15" },
      { id:"s22", name:"Versova",         lat:19.1302, lng:72.8183, order:2, students:8,  eta:"07:28" },
      { id:"s23", name:"School Gate",     lat:19.0760, lng:72.8777, order:3, students:0,  eta:"08:05" },
    ],
    totalStudents:22, distance:"12 km", duration:"50 min", activeBuses:1,
  },
  {
    id:"r006", tenantId:"t003", name:"Route 1 - Koramangala", color:"#00acc1",
    stops:[
      { id:"s24", name:"Koramangala 6th Block", lat:12.9352, lng:77.6245, order:1, students:16, eta:"07:10" },
      { id:"s25", name:"BTM Layout",      lat:12.9166, lng:77.6101, order:2, students:10, eta:"07:22" },
      { id:"s26", name:"School Gate",     lat:12.9716, lng:77.5946, order:3, students:0,  eta:"08:00" },
    ],
    totalStudents:26, distance:"14 km", duration:"50 min", activeBuses:1,
  },
];

// ── STUDENTS ─────────────────────────────────────────────────
export const STUDENTS: Student[] = [
  { id:"st001", tenantId:"t001", name:"Aarav Sharma",   class:"5A", routeId:"r001", busId:"b001", stopId:"s1", parentName:"Ashok Sharma",   parentPhone:"+91-9901111111", parentEmail:"ashok@gmail.com",   rfidTag:"RF001", status:"boarded" },
  { id:"st002", tenantId:"t001", name:"Diya Gupta",     class:"3B", routeId:"r001", busId:"b001", stopId:"s2", parentName:"Priya Gupta",     parentPhone:"+91-9902222222", parentEmail:"priya@gmail.com",   rfidTag:"RF002", status:"boarded" },
  { id:"st003", tenantId:"t001", name:"Rohan Verma",    class:"7C", routeId:"r002", busId:"b002", stopId:"s6", parentName:"Sunil Verma",     parentPhone:"+91-9903333333", parentEmail:"sunil@gmail.com",   rfidTag:"RF003", status:"at_stop" },
  { id:"st004", tenantId:"t001", name:"Sneha Patel",    class:"4A", routeId:"r002", busId:"b002", stopId:"s7", parentName:"Rajesh Patel",    parentPhone:"+91-9904444444", parentEmail:"rajesh@gmail.com",  rfidTag:"RF004", status:"at_stop" },
  { id:"st005", tenantId:"t001", name:"Arjun Nair",     class:"9B", routeId:"r003", busId:"b003", stopId:"s11",parentName:"Mohan Nair",      parentPhone:"+91-9905555555", parentEmail:"mohan@gmail.com",   rfidTag:"RF005", status:"boarded" },
  { id:"st006", tenantId:"t001", name:"Kavya Reddy",    class:"6D", routeId:"r003", busId:"b003", stopId:"s12",parentName:"Anita Reddy",     parentPhone:"+91-9906666666", parentEmail:"anita@gmail.com",   rfidTag:"RF006", status:"boarded" },
  { id:"st007", tenantId:"t001", name:"Ishaan Mehta",   class:"2A", routeId:"r004", busId:"b005", stopId:"s16",parentName:"Vikash Mehta",    parentPhone:"+91-9907777777", parentEmail:"vikash@gmail.com",  rfidTag:"RF007", status:"absent"  },
  { id:"st008", tenantId:"t001", name:"Ananya Singh",   class:"8B", routeId:"r001", busId:"b001", stopId:"s4", parentName:"Deepak Singh",    parentPhone:"+91-9908888888", parentEmail:"deepak@gmail.com",  rfidTag:"RF008", status:"boarded" },
  { id:"st009", tenantId:"t002", name:"Rhea Fernandez", class:"4B", routeId:"r005", busId:"b006", stopId:"s21",parentName:"Carlos Fernandez",parentPhone:"+91-9909999999", parentEmail:"carlos@gmail.com",  rfidTag:"RF009", status:"boarded" },
  { id:"st010", tenantId:"t003", name:"Siddharth R",    class:"10A",routeId:"r006", busId:"b007", stopId:"s24",parentName:"Ramesh R",        parentPhone:"+91-9910000000", parentEmail:"ramesh@gmail.com",  rfidTag:"RF010", status:"boarded" },
];

// ── ALERTS / NOTIFICATIONS ────────────────────────────────────
export const ALERTS: Alert[] = [
  { id:"al001", tenantId:"t001", busId:"b004", type:"delay",     message:"Bus Delta is 8 minutes behind schedule on Route A",        timestamp:"2025-01-15T08:18:00Z", resolved:false, severity:"medium" },
  { id:"al002", tenantId:"t001", busId:"b001", type:"geofence",  message:"Bus Alpha entered school zone",                             timestamp:"2025-01-15T08:10:00Z", resolved:true,  severity:"info"   },
  { id:"al003", tenantId:"t001", busId:"b003", type:"speeding",  message:"Bus Gamma exceeded 50 km/h in school zone",                 timestamp:"2025-01-15T08:05:00Z", resolved:false, severity:"high"   },
  { id:"al004", tenantId:"t001", busId:"b002", type:"idle",      message:"Bus Beta has been idle for more than 30 minutes",           timestamp:"2025-01-15T07:50:00Z", resolved:false, severity:"low"    },
  { id:"al005", tenantId:"t002", busId:"b006", type:"sos",       message:"SOS triggered by driver Santosh Patil on Bus One",          timestamp:"2025-01-15T07:45:00Z", resolved:false, severity:"critical"},
  { id:"al006", tenantId:"t003", busId:"b007", type:"deviation", message:"Bus Eagle deviated from Route 1 by 1.2 km",                 timestamp:"2025-01-15T08:00:00Z", resolved:true,  severity:"medium" },
  { id:"al007", tenantId:"t001", busId:"b004", type:"fuel",      message:"Bus Delta fuel level below 35% — schedule refuelling",      timestamp:"2025-01-15T07:30:00Z", resolved:false, severity:"low"    },
];

// ── TRIPS ─────────────────────────────────────────────────────
export const TRIPS: Trip[] = [
  { id:"tr001", tenantId:"t001", busId:"b001", routeId:"r001", driverId:"d001", date:"2025-01-15", startTime:"07:10", endTime:"08:12", status:"completed", studentsBoarded:22, studentsDropped:22, distanceCovered:18.2, avgSpeed:29, alerts:0 },
  { id:"tr002", tenantId:"t001", busId:"b002", routeId:"r002", driverId:"d002", date:"2025-01-15", startTime:"07:05", endTime:"08:18", status:"completed", studentsBoarded:24, studentsDropped:24, distanceCovered:22.4, avgSpeed:26, alerts:0 },
  { id:"tr003", tenantId:"t001", busId:"b003", routeId:"r003", driverId:"d003", date:"2025-01-15", startTime:"07:00", endTime:"",      status:"in_progress", studentsBoarded:28, studentsDropped:0, distanceCovered:14.1, avgSpeed:28, alerts:1 },
  { id:"tr004", tenantId:"t001", busId:"b004", routeId:"r001", driverId:"d004", date:"2025-01-15", startTime:"07:15", endTime:"",      status:"delayed",    studentsBoarded:18, studentsDropped:0, distanceCovered:10.2, avgSpeed:18, alerts:2 },
  { id:"tr005", tenantId:"t001", busId:"b001", routeId:"r001", driverId:"d001", date:"2025-01-14", startTime:"07:08", endTime:"08:10", status:"completed", studentsBoarded:22, studentsDropped:22, distanceCovered:18.1, avgSpeed:31, alerts:0 },
  { id:"tr006", tenantId:"t002", busId:"b006", routeId:"r005", driverId:"d006", date:"2025-01-15", startTime:"07:10", endTime:"",      status:"in_progress", studentsBoarded:18, studentsDropped:0, distanceCovered:7.4,  avgSpeed:25, alerts:1 },
];

// ── USERS (staff) ─────────────────────────────────────────────
export const USERS: User[] = [
  { id:"u001", tenantId:"t001", name:"Ramesh Kumar",  email:"admin@dps.edu.in",  role:"tenant_admin", status:"active", lastLogin:"2025-01-15T07:00:00Z" },
  { id:"u002", tenantId:"t001", name:"Sunita Arora",  email:"sunita@dps.edu.in", role:"staff",        status:"active", lastLogin:"2025-01-15T07:30:00Z" },
  { id:"u003", tenantId:"t001", name:"Gaurav Bose",   email:"gaurav@dps.edu.in", role:"staff",        status:"active", lastLogin:"2025-01-14T16:00:00Z" },
  { id:"u004", tenantId:"t002", name:"Sr. Theresa",   email:"admin@stmarys.edu.in", role:"tenant_admin", status:"active", lastLogin:"2025-01-15T08:00:00Z" },
  { id:"u005", tenantId:"t003", name:"Dr. Suresh Nair",email:"admin@kv3.edu.in", role:"tenant_admin", status:"active", lastLogin:"2025-01-15T06:45:00Z" },
];

// ── PLATFORM STATS ────────────────────────────────────────────
export const PLATFORM_STATS = {
  totalTenants: 5,
  activeTenants: 3,
  trialTenants: 1,
  suspendedTenants: 1,
  totalBuses: 92,
  activeBusesToday: 67,
  totalDrivers: 145,
  totalStudents: 4280,
  monthlyRevenue: 236400,
  annualRevenue: 2836800,
  mrr: 236400,
  churnRate: 2.1,
  npsScore: 74,
  activeAlerts: 4,
  tripsToday: 94,
  avgBusesPerTenant: 18.4,
};

// ── BILLING RECORDS ───────────────────────────────────────────
export const INVOICES = [
  { id:"inv001", tenantId:"t001", amount:4482,  month:"Jan 2025", status:"paid",    paidAt:"2025-01-05", buses:18 },
  { id:"inv002", tenantId:"t001", amount:4482,  month:"Dec 2024", status:"paid",    paidAt:"2024-12-05", buses:18 },
  { id:"inv003", tenantId:"t002", amount:2093,  month:"Jan 2025", status:"paid",    paidAt:"2025-01-07", buses:7  },
  { id:"inv004", tenantId:"t003", amount:8358,  month:"Jan 2025", status:"paid",    paidAt:"2025-01-03", buses:42 },
  { id:"inv005", tenantId:"t005", amount:2691,  month:"Jan 2025", status:"overdue", paidAt:"",           buses:9  },
  { id:"inv006", tenantId:"t005", amount:2691,  month:"Dec 2024", status:"overdue", paidAt:"",           buses:9  },
];

// ── TYPES ─────────────────────────────────────────────────────
export interface Tenant {
  id:string; name:string; code:string; email:string; phone:string;
  city:string; state:string; plan:string; activeBuses:number; maxBuses:number;
  status:"active"|"trial"|"suspended"|"inactive";
  joinedAt:string; logo:string; primaryColor:string; secondaryColor:string;
  domain:string; monthlyRevenue:number; balance:number; contact:string;
}
export interface Bus {
  id:string; tenantId:string; number:string; nickname:string; capacity:number;
  driver:string; route:string; status:"on_trip"|"idle"|"delayed"|"breakdown"|"parked";
  lat:number; lng:number; speed:number; lastUpdate:string; fuel:number;
  odometer:number; deviceId:string; engineOn:boolean;
}
export interface Driver {
  id:string; tenantId:string; name:string; phone:string; license:string;
  photo:string; status:"on_duty"|"off_duty"|"leave";
  rating:number; trips:number; busId:string; joinedAt:string; emergencyContact:string;
}
export interface Route {
  id:string; tenantId:string; name:string; color:string;
  stops:Stop[]; totalStudents:number; distance:string; duration:string; activeBuses:number;
}
export interface Stop {
  id:string; name:string; lat:number; lng:number; order:number; students:number; eta:string;
}
export interface Student {
  id:string; tenantId:string; name:string; class:string; routeId:string; busId:string;
  stopId:string; parentName:string; parentPhone:string; parentEmail:string;
  rfidTag:string; status:"boarded"|"at_stop"|"dropped"|"absent";
}
export interface Alert {
  id:string; tenantId:string; busId:string;
  type:"delay"|"geofence"|"speeding"|"idle"|"sos"|"deviation"|"fuel"|"breakdown";
  message:string; timestamp:string; resolved:boolean;
  severity:"info"|"low"|"medium"|"high"|"critical";
}
export interface Trip {
  id:string; tenantId:string; busId:string; routeId:string; driverId:string;
  date:string; startTime:string; endTime:string;
  status:"scheduled"|"in_progress"|"completed"|"delayed"|"cancelled";
  studentsBoarded:number; studentsDropped:number; distanceCovered:number; avgSpeed:number; alerts:number;
}
export interface User {
  id:string; tenantId:string; name:string; email:string;
  role:"super_admin"|"tenant_admin"|"staff"|"parent"|"driver";
  status:"active"|"inactive"; lastLogin:string;
}
