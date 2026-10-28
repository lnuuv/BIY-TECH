// Pre-built lab topologies (3D Starter Lab, Leshev Outfitters) and guided missions
import {
  INTERNET_HOST,
  emptyModel,
  createDevice,
  connect,
  getDevice,
  effectiveConfigs,
  ping,
  parseIp,
  parseMask,
} from './sim.js';

// ---------- presets & missions ----------
const setCfg = (d, ip, mask = '255.255.255.0', gw = '', mode = 'static', dns = '8.8.8.8') => {
  d.cfg = { ...d.cfg, mode, ip, mask, gw, dns };
};
function wire(m, ad, ap, bd, bp) { const r = connect(m, { d: ad.id, p: ap }, { d: bd.id, p: bp }); if (!r.ok) throw new Error(r.reason); return r.link; }

/** Leshev Outfitters office with three deliberate faults for the troubleshooting mission */
export function leshevBroken() {
  const m = emptyModel();
  const net = createDevice(m, 'internet', 780, 60);
  const router = createDevice(m, 'router', 560, 170); router.name = 'Office router';
  const sw = createDevice(m, 'switch', 380, 250); sw.name = 'Core switch';
  const admin = createDevice(m, 'pc', 140, 140); admin.name = 'Admin PC';
  const manager = createDevice(m, 'pc', 140, 340); manager.name = 'Manager PC';
  const srv = createDevice(m, 'server', 380, 430); srv.name = 'File server';
  const ap = createDevice(m, 'ap', 600, 390); ap.name = 'Warehouse AP';
  const lap = createDevice(m, 'laptop', 790, 340); lap.name = 'Fitter laptop';
  wire(m, router, 'WAN', net, 'eth0'); wire(m, router, 'LAN1', sw, 'fa1');
  wire(m, admin, 'eth0', sw, 'fa2'); wire(m, manager, 'eth0', sw, 'fa3'); wire(m, srv, 'eth0', sw, 'fa4');
  wire(m, ap, 'eth0', sw, 'fa5'); wire(m, lap, 'wifi0', ap, 'radio');
  setCfg(admin, '192.168.1.10', '255.255.255.0', '192.168.1.1');
  setCfg(manager, '192.168.1.11', '255.255.255.0', '');            // fault 1: no default gateway
  setCfg(srv, '192.168.1.20', '255.255.255.0', '192.168.1.1');
  setCfg(lap, '192.168.2.50', '255.255.255.0', '192.168.1.1');     // fault 2: laptop on the wrong subnet
  router.ports.find((p) => p.id === 'WAN').gw = '203.0.113.9';     // fault 3: wrong ISP gateway on the router
  return m;
}

/** Starter 3D Lab Showcase Topology (functional out-of-the-box so students can explore 3D hardware or start fresh) */
export function starterLabTopology() {
  const m = emptyModel();
  const net = createDevice(m, 'internet', 720, 105);
  const router = createDevice(m, 'router', 520, 165); router.name = 'Edge Router'; router.dhcp = true;
  const sw = createDevice(m, 'switch', 440, 315); sw.name = 'Core Switch';
  const pc1 = createDevice(m, 'pc', 235, 210); pc1.name = 'Admin Workstation';
  const pc2 = createDevice(m, 'pc', 235, 415); pc2.name = 'CAD Desktop';
  const srv = createDevice(m, 'server', 430, 495); srv.name = 'File & DNS Server';
  const prn = createDevice(m, 'printer', 620, 495); prn.name = 'Office Printer';
  const ap = createDevice(m, 'ap', 640, 310); ap.name = 'Floor AP';
  const lap = createDevice(m, 'laptop', 790, 240); lap.name = 'Engineer Laptop';
  const ph = createDevice(m, 'phone', 790, 420); ph.name = 'Tech Smartphone';
  wire(m, router, 'WAN', net, 'eth0');
  wire(m, router, 'LAN1', sw, 'fa1');
  wire(m, pc1, 'eth0', sw, 'fa2');
  wire(m, pc2, 'eth0', sw, 'fa3');
  wire(m, srv, 'eth0', sw, 'fa4');
  wire(m, prn, 'eth0', sw, 'fa5');
  wire(m, ap, 'eth0', sw, 'fa6');
  wire(m, lap, 'wifi0', ap, 'radio');
  wire(m, ph, 'wifi0', ap, 'radio');
  setCfg(pc1, '192.168.1.10', '255.255.255.0', '192.168.1.1', 'static', '192.168.1.20');
  setCfg(pc2, '192.168.1.11', '255.255.255.0', '192.168.1.1', 'static', '192.168.1.20');
  setCfg(srv, '192.168.1.20', '255.255.255.0', '192.168.1.1', 'static', '8.8.8.8');
  setCfg(prn, '192.168.1.30', '255.255.255.0', '192.168.1.1', 'static', '192.168.1.20');
  lap.cfg.mode = 'dhcp';
  ph.cfg.mode = 'dhcp';
  return m;
}

export function troubleshootSolved(m) {
  const srv = m.devices.find((d) => d.name === 'File server');
  const net = m.devices.find((d) => d.type === 'internet');
  if (!srv || !net) return { done: false, hint: 'The File server or the Internet device was removed.' };
  const cfgs = effectiveConfigs(m);
  const problems = [];
  for (const n of ['Admin PC', 'Manager PC', 'Fitter laptop']) {
    const d = m.devices.find((x) => x.name === n);
    if (!d) { problems.push(`${n} was removed`); continue; }
    const toSrv = ping(m, d.id, { dev: srv.id, ip: cfgs.get(srv.id).ip });
    if (!toSrv.ok) { problems.push(`${n} cannot reach the file server: ${toSrv.failure.title}`); continue; }
    const toNet = ping(m, d.id, { dev: net.id, ip: INTERNET_HOST });
    if (!toNet.ok) problems.push(`${n} cannot reach the Internet: ${toNet.failure.title}`);
  }
  return { done: problems.length === 0, hint: problems[0] || '' };
}

const pingPairs = (m, filter) => {
  const cfgs = effectiveConfigs(m);
  const hosts = m.devices.filter((d) => d.kind === 'host');
  for (const a of hosts) for (const b of hosts) {
    if (a.id === b.id || !filter(a, b)) continue;
    const r = ping(m, a.id, { dev: b.id, ip: cfgs.get(b.id).ip });
    if (r.ok) return { a, b, r };
  }
  return null;
};
const subnetOf = (cfgs, d) => { const c = cfgs.get(d.id); const ip = parseIp(c?.ip), mk = parseMask(c?.mask); return ip !== null && mk !== null ? (ip & mk) >>> 0 : null; };

export const MISSIONS = [
  { id: 'm1', lesson: 'networks', title: { en: 'First link: two PCs and a switch', ar: 'أول وصلة: حاسوبان وسويتش' },
    goal: { en: 'Add 2 PCs and a switch, cable them, give both PCs an IP in the same subnet (e.g. 192.168.1.10 and 192.168.1.11 with mask 255.255.255.0) and make Test Connection succeed.', ar: 'أضف حاسوبين وسويتش، صلهما بالكابلات، أعطِ كل حاسوب IP في الشبكة نفسها (مثل 192.168.1.10 و192.168.1.11 والقناع 255.255.255.0) واجعل Test Connection ينجح.' },
    check: (m) => { const sw = m.devices.some((d) => d.type === 'switch'); const x = pingPairs(m, (a, b) => a.type === 'pc' && b.type === 'pc'); return x && sw && x.r.path.some((id) => getDevice(m, id).type === 'switch') ? { done: true } : { done: false, hint: !sw ? 'Add a switch.' : 'Cable both PCs to the switch and set matching IPs.' }; } },
  { id: 'm2', lesson: 'networks', title: { en: 'Two networks, one router', ar: 'شبكتان وراوتر واحد' },
    goal: { en: 'Put a PC on LAN1 (192.168.1.0/24) and another on LAN2 (192.168.2.0/24) and ping across the router. Remember the default gateways (the router port IPs)!', ar: 'ضع حاسوباً على LAN1 (192.168.1.0/24) وآخر على LAN2 (192.168.2.0/24) واختبر الاتصال عبر الراوتر. لا تنسَ البوابات الافتراضية (عناوين منافذ الراوتر)!' },
    check: (m) => { const cfgs = effectiveConfigs(m); const x = pingPairs(m, (a, b) => { const sa = subnetOf(cfgs, a), sb = subnetOf(cfgs, b); return sa !== null && sb !== null && sa !== sb; }); return x && x.r.path.some((id) => getDevice(m, id).kind === 'router') ? { done: true } : { done: false, hint: 'A successful ping between two different subnets that passes through the router is needed.' }; } },
  { id: 'm3', lesson: 'connectivity', title: { en: 'Wireless warehouse', ar: 'مستودع لاسلكي' },
    goal: { en: 'Connect an access point to a switch, associate a phone or laptop over Wi-Fi, and ping the file server.', ar: 'صل نقطة وصول بسويتش، واربط هاتفاً أو حاسوباً محمولاً عبر Wi-Fi، ثم اختبر الاتصال بخادم الملفات.' },
    check: (m) => { const x = pingPairs(m, (a, b) => b.type === 'server' && m.links.some((l) => l.kind === 'wifi' && (l.a.d === a.id || l.b.d === a.id))); return x && x.r.path.some((id) => getDevice(m, id).type === 'ap') ? { done: true } : { done: false, hint: 'Needed: Wi-Fi client → AP → switch → server, with a successful ping.' }; } },
  { id: 'm4', lesson: 'transmission', title: { en: 'Go online', ar: 'الاتصال بالإنترنت' },
    goal: { en: 'Connect the router WAN port to the Internet device, put a PC on LAN1 with gateway 192.168.1.1 and ping example.com.', ar: 'صل منفذ WAN في الراوتر بجهاز الإنترنت، وضع حاسوباً على LAN1 بالبوابة 192.168.1.1، واختبر example.com.' },
    check: (m) => { const net = m.devices.find((d) => d.type === 'internet'); if (!net) return { done: false, hint: 'Add the Internet device.' }; for (const h of m.devices.filter((d) => d.kind === 'host')) if (ping(m, h.id, { dev: net.id, ip: INTERNET_HOST }).ok) return { done: true }; return { done: false, hint: 'No host can reach the Internet yet.' }; } },
  { id: 'm5', lesson: 'transmission', preset: 'leshev', title: { en: 'Troubleshoot Leshev Outfitters', ar: 'إصلاح شبكة Leshev Outfitters' },
    goal: { en: 'The office network has three faults. Use Test Connection from each device, read the explanation and fix it until Admin PC, Manager PC and Fitter laptop all reach the file server AND the Internet.', ar: 'في شبكة المكتب ثلاثة أعطال. استخدم Test Connection من كل جهاز واقرأ التفسير وأصلحها حتى تصل الأجهزة الثلاثة إلى خادم الملفات والإنترنت.' },
    check: troubleshootSolved },
];
