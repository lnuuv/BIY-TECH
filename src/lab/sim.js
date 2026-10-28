// Networking Lab simulation engine — pure functions, no React/DOM. Rule-based:
// IPv4 addressing, subnet masks, default gateways, DNS, switches/VLANs/APs (layer 2),
// routers & static routes (layer 3), DHCP, conflict detection, and an Internet host.
// Every result is computed from the actual model state (devices, ports, cables, configs).

import { failMsg, stepMsg } from './messages.js';

export const DEVICE_TYPES = {
  pc:      { kind: 'host',   label: { en: 'PC', ar: 'حاسوب مكتبي' },        ports: [['eth0', 'eth']] },
  laptop:  { kind: 'host',   label: { en: 'Laptop', ar: 'حاسوب محمول' },    ports: [['eth0', 'eth'], ['wifi0', 'wifi']] },
  phone:   { kind: 'host',   label: { en: 'Smartphone', ar: 'هاتف ذكي' },    ports: [['wifi0', 'wifi']] },
  server:  { kind: 'host',   label: { en: 'File server', ar: 'خادم ملفات' }, ports: [['eth0', 'eth']] },
  printer: { kind: 'host',   label: { en: 'Printer', ar: 'طابعة' },          ports: [['eth0', 'eth']] },
  switch:  { kind: 'l2',     label: { en: 'Switch', ar: 'سويتش' },           ports: Array.from({ length: 6 }, (_, i) => [`fa${i + 1}`, 'eth']) },
  ap:      { kind: 'l2',     label: { en: 'Access point', ar: 'نقطة وصول' }, ports: [['eth0', 'eth'], ['radio', 'wifi', true]] },
  router:  { kind: 'router', label: { en: 'Router', ar: 'راوتر' },           ports: [['LAN1', 'eth'], ['LAN2', 'eth'], ['WAN', 'eth']] },
  internet:{ kind: 'internet', label: { en: 'Internet', ar: 'الإنترنت' },    ports: [['eth0', 'eth']] },
};

export const CABLE_TYPES = {
  auto:      { id: 'auto',      kind: 'auto', label: { en: 'Auto-Select Cable', ar: 'اختيار تلقائي للكابل' } },
  straight:  { id: 'straight',  kind: 'eth',  label: { en: 'Cat6 Straight-Through', ar: 'كابل إيثرنت مستقيم Cat6' } },
  crossover: { id: 'crossover', kind: 'eth',  label: { en: 'Cat6 Crossover', ar: 'كابل إيثرنت متقاطع Crossover' } },
  fiber:     { id: 'fiber',     kind: 'eth',  label: { en: 'Fiber Patch', ar: 'كابل ألياف ضوئية Fiber' } },
  wifi:      { id: 'wifi',      kind: 'wifi', label: { en: 'Wi-Fi Association', ar: 'ارتباط لاسلكي Wi-Fi' } },
};

export const INTERNET_GW = '203.0.113.1';
export const INTERNET_HOST = '93.184.216.34';
export const DEFAULT_SSID = 'Unit1-Lab-WiFi';
export const DEFAULT_WIFI_KEY = 'academy123';

// ---------- 2D <-> 3D spatial coordinate conversion ----------
// Maps 2D canvas (1000x640, center 500,320) <-> 3D floor plane (X: -12..+12, Z: -7.68..+7.68)
export function xyTo3d(x = 500, y = 320) {
  return {
    x: Number(((x - 500) * 0.024).toFixed(3)),
    y: 0,
    z: Number(((y - 320) * 0.024).toFixed(3)),
  };
}
export function pos3dToXy(pos3d = { x: 0, y: 0, z: 0 }) {
  return {
    x: Math.max(50, Math.min(950, Math.round((pos3d.x || 0) / 0.024 + 500))),
    y: Math.max(50, Math.min(590, Math.round((pos3d.z || 0) / 0.024 + 320))),
  };
}

// ---------- IPv4 helpers ----------
export function parseIp(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return null;
  return (((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]) >>> 0;
}
export const fmtIp = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
export function parseMask(s) {
  const n = parseIp(s);
  if (n === null) return null;
  const inv = ~n >>> 0;
  return (inv & (inv + 1)) === 0 ? n : null; // contiguous ones then zeros
}
export const sameSubnet = (a, b, mask) => ((a & mask) >>> 0) === ((b & mask) >>> 0);
const isPrivate = (n) => sameSubnet(n, parseIp('10.0.0.0'), parseIp('255.0.0.0')) || sameSubnet(n, parseIp('172.16.0.0'), parseIp('255.240.0.0')) || sameSubnet(n, parseIp('192.168.0.0'), parseIp('255.255.0.0'));

// ---------- model ----------
export function emptyModel() { return { devices: [], links: [], seq: 0 }; }

export function createDevice(model, type, x = 100, y = 100, opts = {}) {
  const t = DEVICE_TYPES[type];
  if (!t) throw new Error(`Unknown device type: ${type}`);
  const seq = ++model.seq;
  const n = model.devices.filter((d) => d.type === type).length + 1;
  const pos3d = opts.pos3d ? { x: Number(opts.pos3d.x) || 0, y: Number(opts.pos3d.y) || 0, z: Number(opts.pos3d.z) || 0 } : xyTo3d(x, y);
  const xy = opts.pos3d && x === 100 && y === 100 ? pos3dToXy(pos3d) : { x, y };
  const d = {
    id: `d${seq}`,
    seq,
    type,
    kind: t.kind,
    x: xy.x,
    y: xy.y,
    pos3d,
    rotY: opts.rotY ?? 0,
    on: true,
    name: type === 'internet' ? 'Internet' : `${t.label.en} ${n}`,
    ports: t.ports.map(([id, kind, multi]) => ({
      id,
      kind,
      multi: !!multi,
      adminUp: true,
      ...(type === 'switch' ? { vlan: 1, mode: 'access' } : {}),
    })),
    cfg: {
      mode: 'static',
      ip: '',
      mask: '255.255.255.0',
      gw: '',
      dns: '8.8.8.8',
      preferredPort: '',
      ssid: DEFAULT_SSID,
      wifiKey: DEFAULT_WIFI_KEY,
    },
  };
  if (type === 'ap') {
    d.ssid = DEFAULT_SSID;
    d.security = 'WPA2-PSK';
    d.wifiKey = DEFAULT_WIFI_KEY;
    d.channel = 6;
  }
  if (t.kind === 'router') {
    const lan1 = d.ports.find((p) => p.id === 'LAN1'), lan2 = d.ports.find((p) => p.id === 'LAN2'), w = d.ports.find((p) => p.id === 'WAN');
    lan1.ip = '192.168.1.1'; lan1.mask = '255.255.255.0'; lan1.adminUp = true;
    lan2.ip = '192.168.2.1'; lan2.mask = '255.255.255.0'; lan2.adminUp = true;
    w.ip = '203.0.113.2'; w.mask = '255.255.255.0'; w.gw = INTERNET_GW; w.adminUp = true;
    d.dhcp = false;
    d.dhcpDns = '8.8.8.8';
    d.defaultRoute = true;
    d.routes = [];
  }
  if (t.kind === 'internet') {
    d.ports[0].ip = INTERNET_GW;
    d.ports[0].mask = '255.255.255.0';
    d.ports[0].adminUp = true;
  }
  model.devices.push(d);
  return d;
}

export function moveDevice(model, devId, coords) {
  const d = getDevice(model, devId);
  if (!d) return null;
  if ('z' in coords) {
    const cx = Math.max(-11.4, Math.min(11.4, Number(coords.x) || 0));
    const cz = Math.max(-7.2, Math.min(7.2, Number(coords.z) || 0));
    d.pos3d = { x: Number(cx.toFixed(3)), y: 0, z: Number(cz.toFixed(3)) };
    const xy = pos3dToXy(d.pos3d);
    d.x = xy.x;
    d.y = xy.y;
  } else {
    d.x = Math.max(50, Math.min(950, Math.round(coords.x)));
    d.y = Math.max(50, Math.min(590, Math.round(coords.y)));
    d.pos3d = xyTo3d(d.x, d.y);
  }
  return d;
}

export function rotateDevice(model, devId, deltaRad = Math.PI / 4) {
  const d = getDevice(model, devId);
  if (!d) return null;
  d.rotY = Number((((d.rotY || 0) + deltaRad) % (Math.PI * 2)).toFixed(4));
  return d;
}

export function duplicateDevice(model, devId) {
  const src = getDevice(model, devId);
  if (!src || src.type === 'internet') return null;
  const copy = createDevice(model, src.type, Math.min(920, src.x + 70), Math.min(570, src.y + 50));
  copy.rotY = src.rotY || 0;
  copy.on = src.on;
  if (src.cfg) {
    copy.cfg = structuredClone(src.cfg);
    // Avoid cloning the exact static IP onto the duplicate to prevent immediate IP conflicts, or increment last octet if valid
    const ipN = parseIp(copy.cfg.ip);
    if (ipN !== null && (ipN & 255) < 250) {
      copy.cfg.ip = fmtIp(ipN + 1);
    }
  }
  if (src.type === 'ap') {
    copy.ssid = src.ssid || DEFAULT_SSID;
    copy.security = src.security || 'WPA2-PSK';
    copy.wifiKey = src.wifiKey || DEFAULT_WIFI_KEY;
    copy.channel = src.channel || 6;
  }
  if (src.type === 'switch') {
    copy.ports = src.ports.map((p) => ({ ...p }));
  }
  if (src.kind === 'router') {
    copy.dhcp = src.dhcp;
    copy.dhcpDns = src.dhcpDns || '8.8.8.8';
    copy.defaultRoute = src.defaultRoute;
    copy.routes = structuredClone(src.routes || []);
  }
  return copy;
}

export const getDevice = (m, id) => m.devices.find((d) => d.id === id);
const linksOfPort = (m, devId, portId) => m.links.filter((l) => (l.a.d === devId && l.a.p === portId) || (l.b.d === devId && l.b.p === portId));
const peerOf = (l, devId, portId) => (l.a.d === devId && l.a.p === portId ? l.b : l.a);
export const portFree = (m, d, p) => (p.multi ? true : linksOfPort(m, d.id, p.id).length === 0);

export function canConnect(m, a, b, cableType = 'auto') {
  const da = getDevice(m, a.d), db = getDevice(m, b.d);
  if (!da || !db) return { ok: false, code: 'missing', reason: 'Device not found.' };
  if (da.id === db.id) return { ok: false, code: 'self', reason: 'A device cannot be cabled to itself.' };
  const pa = da.ports.find((p) => p.id === a.p), pb = db.ports.find((p) => p.id === b.p);
  if (!pa || !pb) return { ok: false, code: 'missing', reason: 'Port not found.' };
  if (pa.kind !== pb.kind) return { ok: false, code: 'kind', reason: pa.kind === 'wifi' || pb.kind === 'wifi' ? 'Wi-Fi radios only pair with another Wi-Fi radio (a client with an access point).' : 'Ports are not compatible.' };
  if (cableType && cableType !== 'auto') {
    const wantKind = cableType === 'wifi' ? 'wifi' : 'eth';
    if (pa.kind !== wantKind) return { ok: false, code: 'kind', reason: wantKind === 'wifi' ? 'Selected Wi-Fi tool requires wireless interfaces.' : 'Selected Ethernet cable requires RJ45/Ethernet ports.' };
  }
  if (pa.kind === 'wifi') {
    if (da.type !== 'ap' && db.type !== 'ap') return { ok: false, code: 'wifi', reason: 'Wi-Fi needs an access point: connect the client to an access point radio.' };
    if (da.type === 'ap' && db.type === 'ap') return { ok: false, code: 'wifi', reason: 'Two access points cannot associate in this lab.' };
  }
  if (!portFree(m, da, pa)) return { ok: false, code: 'busy', p: { n: da.name, port: pa.id }, reason: `${da.name} port ${pa.id} is already connected.` };
  if (!portFree(m, db, pb)) return { ok: false, code: 'busy', p: { n: db.name, port: pb.id }, reason: `${db.name} port ${pb.id} is already connected.` };
  if (m.links.some((l) => (l.a.d === da.id && l.b.d === db.id) || (l.a.d === db.id && l.b.d === da.id))) return { ok: false, code: 'dup', reason: 'These devices are already connected.' };
  return { ok: true };
}

export function connect(m, a, b, cableType = 'auto') {
  const c = canConnect(m, a, b, cableType);
  if (!c.ok) return c;
  const da = getDevice(m, a.d), db = getDevice(m, b.d);
  const pa = da.ports.find((p) => p.id === a.p);
  const kind = pa.kind === 'wifi' ? 'wifi' : 'eth';
  let resolvedCable = cableType;
  if (!resolvedCable || resolvedCable === 'auto') {
    if (kind === 'wifi') resolvedCable = 'wifi';
    else if ((da.kind === 'host' && db.kind === 'host') || (da.type === 'switch' && db.type === 'switch') || (da.kind === 'router' && db.kind === 'router')) resolvedCable = 'crossover';
    else resolvedCable = 'straight';
  }
  const link = { id: `l${++m.seq}`, a, b, kind, cableType: resolvedCable };
  m.links.push(link);
  return { ok: true, link };
}
export const disconnect = (m, linkId) => { m.links = m.links.filter((l) => l.id !== linkId); };
export function removeDevice(m, id) { m.devices = m.devices.filter((d) => d.id !== id); m.links = m.links.filter((l) => l.a.d !== id && l.b.d !== id); }

// ---------- layer 2 reachability ----------
export function isLinkUp(m, l) {
  const da = getDevice(m, l.a.d), db = getDevice(m, l.b.d);
  if (!da?.on || !db?.on) return false;
  const pa = da.ports.find((p) => p.id === l.a.p), pb = db.ports.find((p) => p.id === l.b.p);
  if (pa?.adminUp === false || pb?.adminUp === false) return false;
  return true;
}

function wifiAuthOk(clientDev, apDev) {
  if (!apDev || apDev.type !== 'ap') return true;
  const apSsid = (apDev.ssid ?? DEFAULT_SSID).trim();
  const clSsid = (clientDev.cfg?.ssid ?? DEFAULT_SSID).trim();
  if (apSsid && clSsid && apSsid !== clSsid) return false;
  if ((apDev.security || 'WPA2-PSK') !== 'Open') {
    const apKey = apDev.wifiKey ?? DEFAULT_WIFI_KEY;
    const clKey = clientDev.cfg?.wifiKey ?? DEFAULT_WIFI_KEY;
    if (apKey !== clKey) return false;
  }
  return true;
}

function vlanCompatible(inPort, outPort) {
  if (!inPort || !outPort) return true;
  if (inPort.mode === 'trunk' || outPort.mode === 'trunk') return true;
  return (inPort.vlan || 1) === (outPort.vlan || 1);
}

/** Endpoints (hosts / router ports / internet) reachable at layer 2 from (dev,port), passing through switches & APs.
 *  With ignorePower=true powered-off devices, disabled ports, and VLAN filters are still traversed (used only to explain failures). */
export function l2Reach(m, devId, portId, ignorePower = false, opts = {}) {
  const ignoreVlan = ignorePower || !!opts.ignoreVlan;
  const ignoreWifiAuth = ignorePower || !!opts.ignoreWifiAuth;
  const out = [];
  const seen = new Set([`${devId}:${portId}`]);
  const walk = (fromDev, fromPort, path, activeVlan) => {
    const fDev = getDevice(m, fromDev);
    const fPortObj = fDev?.ports.find((p) => p.id === fromPort);
    if (!ignorePower && fPortObj?.adminUp === false) return;
    for (const l of linksOfPort(m, fromDev, fromPort)) {
      if (!ignorePower && !isLinkUp(m, l)) continue;
      const peer = peerOf(l, fromDev, fromPort);
      if (peer.d === devId) continue;
      const pd = getDevice(m, peer.d);
      if (!pd) continue;
      const peerPortObj = pd.ports.find((p) => p.id === peer.p);
      if (!ignorePower && peerPortObj?.adminUp === false) continue;

      // Check Wi-Fi authentication if link is wifi
      if (!ignoreWifiAuth && l.kind === 'wifi') {
        const client = fDev.type === 'ap' ? pd : fDev;
        const ap = fDev.type === 'ap' ? fDev : pd;
        if (!wifiAuthOk(client, ap)) continue;
      }

      if (pd.kind === 'l2') {
        const visitKey = `${pd.id}:${peer.p}`;
        if (seen.has(visitKey)) continue;
        seen.add(visitKey);
        const inVlan = pd.type === 'switch' ? (peerPortObj?.mode === 'trunk' ? activeVlan : (peerPortObj?.vlan || 1)) : activeVlan;
        for (const p of pd.ports) {
          if (p.id === peer.p && !p.multi) continue;
          if (!ignorePower && p.adminUp === false) continue;
          if (!ignoreVlan && pd.type === 'switch') {
            if (peerPortObj?.mode === 'trunk' && p.mode === 'access' && inVlan && (p.vlan || 1) !== inVlan) continue;
            if (!vlanCompatible(peerPortObj, p)) continue;
          }
          walk(pd.id, p.id, [...path, pd.id], inVlan);
        }
      } else {
        out.push({ dev: pd, port: peer.p, path: [...path] });
      }
    }
  };
  walk(devId, portId, [], null);
  return out;
}

export function activePort(m, d) {
  const preferred = d.cfg?.preferredPort;
  const prefer = [...d.ports].sort((a, b) => {
    if (preferred && a.id === preferred) return -1;
    if (preferred && b.id === preferred) return 1;
    return (a.kind === 'eth' ? -1 : 1) - (b.kind === 'eth' ? -1 : 1);
  });
  for (const p of prefer) {
    if (p.adminUp === false) continue;
    for (const l of linksOfPort(m, d.id, p.id)) if (isLinkUp(m, l)) return p;
  }
  return null;
}

// ---------- addressing (static / DHCP / APIPA) ----------
export function effectiveConfigs(m) {
  const cfgs = new Map();
  const leaseCount = new Map();
  const hosts = m.devices.filter((d) => d.kind === 'host').sort((a, b) => a.seq - b.seq);
  for (const h of hosts) {
    const ap = activePort(m, h);
    if (h.cfg.mode !== 'dhcp') {
      cfgs.set(h.id, { source: 'static', port: ap, ip: h.cfg.ip, mask: h.cfg.mask, gw: h.cfg.gw, dns: h.cfg.dns || '8.8.8.8' });
      continue;
    }
    if (!ap || !h.on) {
      cfgs.set(h.id, { source: 'none', port: ap, ip: '', mask: '', gw: '', dns: '' });
      continue;
    }
    const server = l2Reach(m, h.id, ap.id).find((ep) => ep.dev.kind === 'router' && ep.dev.on && ep.dev.dhcp && ep.dev.ports.find((p) => p.id === ep.port && p.adminUp !== false && parseIp(p.ip) !== null && parseMask(p.mask) !== null));
    if (server) {
      const rp = server.dev.ports.find((p) => p.id === server.port);
      const key = `${server.dev.id}:${rp.id}`;
      const n = (leaseCount.get(key) || 0) + 1; leaseCount.set(key, n);
      const net = (parseIp(rp.ip) & parseMask(rp.mask)) >>> 0;
      cfgs.set(h.id, { source: 'dhcp', port: ap, ip: fmtIp(net + 99 + n), mask: rp.mask, gw: rp.ip, dns: server.dev.dhcpDns || rp.ip, server: server.dev.id });
    } else {
      cfgs.set(h.id, { source: 'apipa', port: ap, ip: `169.254.${h.seq % 250}.${(h.seq * 7) % 250 + 1}`, mask: '255.255.0.0', gw: '', dns: '' });
    }
  }
  return cfgs;
}

/** Detect topology configuration conflicts and warnings (duplicate IPs, invalid masks, off-subnet gateways, disabled linked ports, Wi-Fi auth mismatch). */
export function detectConflicts(m) {
  const cfgs = effectiveConfigs(m);
  const issues = [];
  const ipOwners = new Map(); // ip -> [{ devId, devName, portId }]

  for (const d of m.devices) {
    if (!d.on) continue;
    if (d.kind === 'host') {
      const c = cfgs.get(d.id);
      if (d.cfg.mode === 'static' && d.cfg.ip) {
        if (parseIp(d.cfg.ip) === null) {
          issues.push({ code: 'bad_ip', deviceId: d.id, severity: 'error', p: { n: d.name, ip: d.cfg.ip } });
        } else if (parseMask(d.cfg.mask) === null) {
          issues.push({ code: 'bad_mask', deviceId: d.id, severity: 'error', p: { n: d.name, mask: d.cfg.mask } });
        } else if (d.cfg.gw && (parseIp(d.cfg.gw) === null || !sameSubnet(parseIp(d.cfg.ip), parseIp(d.cfg.gw), parseMask(d.cfg.mask)))) {
          issues.push({ code: 'gw_off_subnet', deviceId: d.id, severity: 'warn', p: { n: d.name, gw: d.cfg.gw, ip: d.cfg.ip, mask: d.cfg.mask } });
        }
      }
      if (c && parseIp(c.ip) !== null) {
        const arr = ipOwners.get(c.ip) || [];
        arr.push({ devId: d.id, devName: d.name, portId: c.port?.id || 'eth0' });
        ipOwners.set(c.ip, arr);
      }
    } else if (d.kind === 'router') {
      for (const p of d.ports) {
        if (p.adminUp === false) continue;
        if (p.ip && parseIp(p.ip) !== null) {
          const arr = ipOwners.get(p.ip) || [];
          arr.push({ devId: d.id, devName: `${d.name} (${p.id})`, portId: p.id });
          ipOwners.set(p.ip, arr);
        }
      }
    }
    for (const p of d.ports) {
      if (p.adminUp === false && linksOfPort(m, d.id, p.id).length > 0) {
        issues.push({ code: 'port_admin_down', deviceId: d.id, severity: 'warn', p: { n: d.name, port: p.id } });
      }
    }
  }

  for (const [ip, owners] of ipOwners.entries()) {
    if (owners.length > 1) {
      for (let i = 0; i < owners.length; i++) {
        const other = owners.find((_, idx) => idx !== i);
        issues.push({
          code: 'ip_conflict',
          deviceId: owners[i].devId,
          severity: 'error',
          p: { n: owners[i].devName, other: other.devName, ip },
        });
      }
    }
  }

  for (const l of m.links) {
    if (l.kind === 'wifi') {
      const da = getDevice(m, l.a.d), db = getDevice(m, l.b.d);
      if (da && db) {
        const client = da.type === 'ap' ? db : da;
        const ap = da.type === 'ap' ? da : db;
        if (!wifiAuthOk(client, ap)) {
          issues.push({
            code: 'wifi_auth',
            deviceId: client.id,
            severity: 'error',
            p: { n: client.name, ap: ap.name, ssid: ap.ssid || DEFAULT_SSID },
          });
        }
      }
    }
  }

  return issues;
}

/** All (device, ip) pairs that can be chosen as ping targets */
export function targets(m) {
  const cfgs = effectiveConfigs(m);
  const t = [];
  for (const d of m.devices) {
    if (d.kind === 'host') {
      const c = cfgs.get(d.id);
      if (c && parseIp(c.ip) !== null) t.push({ dev: d.id, ip: c.ip, label: `${d.name} (${c.ip})` });
    } else if (d.kind === 'router') {
      for (const p of d.ports) if (parseIp(p.ip) !== null) t.push({ dev: d.id, ip: p.ip, label: `${d.name} ${p.id} (${p.ip})` });
    } else if (d.kind === 'internet') {
      t.push({ dev: d.id, ip: INTERNET_HOST, label: `Internet — example.com (${INTERNET_HOST})` });
    }
  }
  return t;
}

// ---------- ping / Test Connection ----------
/** failure = { code, deviceId, p(params), title/why/fix (English; UI re-renders in the active language) } */
const F = (code, dev, p = {}) => ({ code, deviceId: dev, p, ...failMsg(code, p, 'en') });
const mkStep = (k, status, p, dev) => ({ k, status, p, dev, ...stepMsg(k, p, 'en') });
const ownsIp = (cfgs, ep, ip) => {
  if (ep.dev.kind === 'router') return ep.dev.ports.find((p) => p.id === ep.port && p.adminUp !== false)?.ip === ip;
  if (ep.dev.kind === 'internet') return ip === INTERNET_GW;
  const c = cfgs.get(ep.dev.id); return !!c && c.ip === ip && c.port?.id === ep.port;
};
const ownsIpAnyPort = (cfgs, dev, ip) => (dev.kind === 'router' ? dev.ports.some((p) => p.ip === ip) : dev.kind === 'host' ? cfgs.get(dev.id)?.ip === ip : false);

/** Helper to check if VLAN segmentation or Wi-Fi auth blocked L2 reachability */
function diagnoseL2Block(m, cfgs, fromDev, fromPort, nextIp) {
  // 0. Check if any administratively disabled port is blocking reachability to nextIp
  const allReach = l2Reach(m, fromDev.id, fromPort, true);
  const blockedEp = allReach.find((ep) => ep.dev.on && ownsIpAnyPort(cfgs, ep.dev, nextIp));
  if (blockedEp) {
    const chain = [fromDev.id, ...blockedEp.path, blockedEp.dev.id];
    for (let i = 0; i < chain.length - 1; i++) {
      const lk = linkBetween(m, chain[i], chain[i + 1]);
      if (lk) {
        for (const end of [lk.a, lk.b]) {
          const d = getDevice(m, end.d);
          const p = d?.ports.find((x) => x.id === end.p);
          if (d && p?.adminUp === false) {
            return F("port_admin_down", d.id, { n: d.name, port: p.id });
          }
        }
      }
    }
  }
  // 1. Check Wi-Fi auth mismatch on direct or bridged Wi-Fi links
  for (const l of m.links) {
    if (l.kind === 'wifi') {
      const da = getDevice(m, l.a.d), db = getDevice(m, l.b.d);
      const client = da?.type === 'ap' ? db : da;
      const ap = da?.type === 'ap' ? da : db;
      if (client && ap && !wifiAuthOk(client, ap)) {
        const reachNoWifiCheck = l2Reach(m, fromDev.id, fromPort, false, { ignoreWifiAuth: true });
        if (reachNoWifiCheck.some((ep) => ownsIp(cfgs, ep, nextIp))) {
          return F('wifi_auth', client.id, { n: client.name, ap: ap.name, ssid: ap.ssid || DEFAULT_SSID });
        }
      }
    }
  }
  // 2. Check VLAN mismatch on switches
  const reachIgnoreVlan = l2Reach(m, fromDev.id, fromPort, false, { ignoreVlan: true });
  const targetNoVlan = reachIgnoreVlan.find((ep) => ownsIp(cfgs, ep, nextIp));
  if (targetNoVlan) {
    for (const swId of targetNoVlan.path) {
      const sw = getDevice(m, swId);
      if (sw?.type === 'switch') {
        const usedPorts = sw.ports.filter((p) => linksOfPort(m, sw.id, p.id).length > 0 && p.mode !== 'trunk');
        const vlans = [...new Set(usedPorts.map((p) => p.vlan || 1))];
        if (vlans.length > 1) {
          const pA = usedPorts[0], pB = usedPorts.find((p) => (p.vlan || 1) !== (pA.vlan || 1)) || usedPorts[1];
          return F('vlan_mismatch', sw.id, { sw: sw.name, portA: pA.id, vlanA: pA.vlan || 1, portB: pB.id, vlanB: pB.vlan || 1 });
        }
      }
    }
  }
  return null;
}

/** One-direction delivery from a sender interface to dstIp. */
function deliver(m, cfgs, sender, dstIp, ttl = 8) {
  const steps = [];
  const path = [sender.dev.id];
  let node = sender; // {dev, port(id), ip, mask, gw}
  let hops = 0, wan = false, wifi = false;
  const add = (k, status, p, dev) => steps.push(mkStep(k, status, p, dev));
  const dstN = parseIp(dstIp);
  const fail = (code, dev, p) => ({ ok: false, steps, path, hops, failure: F(code, dev, p) });
  while (ttl-- > 0) {
    const ipN = parseIp(node.ip), maskN = parseMask(node.mask);
    if (ipN === null) return fail('bad_ip', node.dev.id, { n: node.dev.name, ip: node.ip });
    if (maskN === null) return fail('bad_mask', node.dev.id, { n: node.dev.name, mask: node.mask });
    const local = sameSubnet(dstN, ipN, maskN);
    let nextIp = dstIp;
    add('onnet', local ? 'ok' : 'info', { dst: dstIp, ip: node.ip, mask: node.mask, local }, node.dev.id);
    if (!local) {
      const gwN = parseIp(node.gw);
      if (!node.gw) return fail('no_gateway', node.dev.id, { n: node.dev.name, dst: dstIp, router: node.dev.kind !== 'host', fixGw: INTERNET_GW });
      nextIp = node.gw;
      if (gwN === null || !sameSubnet(gwN, ipN, maskN)) return fail('gw_off_subnet', node.dev.id, { n: node.dev.name, gw: node.gw, ip: node.ip, mask: node.mask });
    }
    const port = node.dev.ports.find((p) => p.id === node.port);
    if (port?.adminUp === false) return fail('port_admin_down', node.dev.id, { n: node.dev.name, port: node.port });
    if (port?.kind === 'wifi') wifi = true;
    const reach = l2Reach(m, node.dev.id, node.port);
    // Check for duplicate IP on the same L2 segment
    const matchingTargets = reach.filter((ep) => ownsIp(cfgs, ep, nextIp));
    if (matchingTargets.length > 1) {
      return fail('ip_conflict', matchingTargets[0].dev.id, { n: matchingTargets[0].dev.name, other: matchingTargets[1].dev.name, ip: nextIp });
    }
    const target = matchingTargets[0];
    if (!target) {
      const link = linksOfPort(m, node.dev.id, node.port)[0];
      if (!link) return fail('no_link', node.dev.id, { n: node.dev.name, port: node.port });
      add('arp_fail', 'fail', { ip: nextIp, local }, node.dev.id);
      const l2Diag = diagnoseL2Block(m, cfgs, node.dev, node.port, nextIp);
      if (l2Diag) return { ok: false, steps, path, hops, failure: l2Diag };
      const everything = l2Reach(m, node.dev.id, node.port, true);
      const dark = everything.find((ep) => !ep.dev.on && ownsIpAnyPort(cfgs, ep.dev, nextIp));
      if (dark) return fail('dst_off', dark.dev.id, { n: dark.dev.name, ip: nextIp });
      // Check if a port along the link is administratively down
      const peerEnd = peerOf(link, node.dev.id, node.port);
      const peerDev = getDevice(m, peerEnd.d);
      const peerPort = peerDev?.ports.find((p) => p.id === peerEnd.p);
      if (peerPort?.adminUp === false) return fail('port_admin_down', peerDev.id, { n: peerDev.name, port: peerPort.id });
      if (!linksOfPort(m, node.dev.id, node.port).some((l) => isLinkUp(m, l))) {
        const off = [getDevice(m, link.a.d), getDevice(m, link.b.d)].find((d) => !d.on);
        if (off) return fail('link_down', off.id, { n: off.name });
      }
      return fail(local ? 'unreachable' : 'gw_unreachable', node.dev.id, { n: node.dev.name, ip: nextIp, offSwitch: everything.length > reach.length, router: node.dev.kind === 'router', fixGw: INTERNET_GW });
    }
    for (const id of target.path) path.push(id);
    path.push(target.dev.id); hops += target.path.length + 1;
    add('reach', 'ok', { ip: nextIp, path: target.path.map((id) => getDevice(m, id).name), n: target.dev.name }, target.dev.id);
    if (target.dev.kind === 'internet') {
      wan = true;
      if (dstIp === INTERNET_HOST || dstIp === INTERNET_GW) return { ok: true, steps, path, hops, wan, wifi };
      return fail('private_on_internet', target.dev.id, { ip: dstIp, fixIp: INTERNET_HOST });
    }
    if (target.dev.kind === 'host') {
      if (nextIp === dstIp) return { ok: true, steps, path, hops, wan, wifi };
      return fail('gw_not_router', target.dev.id, { ip: nextIp, n: target.dev.name });
    }
    const r = target.dev;
    const ownIfc = r.ports.find((p) => p.id === target.port);
    if (r.ports.some((p) => p.ip === dstIp && p.adminUp !== false)) return { ok: true, steps, path, hops, wan, wifi };
    add('route', 'info', { n: r.name, dst: dstIp }, r.id);
    const egress = r.ports.find((p) => p.id !== ownIfc.id && p.id !== 'WAN' && p.adminUp !== false && parseIp(p.ip) !== null && parseMask(p.mask) !== null && sameSubnet(dstN, parseIp(p.ip), parseMask(p.mask)) && linksOfPort(m, r.id, p.id).length);
    if (egress) {
      add('fwd', 'ok', { n: r.name, port: egress.id, dst: dstIp, ip: egress.ip, mask: egress.mask }, r.id);
      node = { dev: r, port: egress.id, ip: egress.ip, mask: egress.mask, gw: '' };
      continue;
    }
    // Check static routes on the router
    if (Array.isArray(r.routes) && r.routes.length > 0) {
      const matchedRoute = r.routes.find((rt) => {
        const rNet = parseIp(rt.dst), rMask = parseMask(rt.mask), rNh = parseIp(rt.nextHop);
        return rNet !== null && rMask !== null && rNh !== null && sameSubnet(dstN, rNet, rMask);
      });
      if (matchedRoute) {
        const nhN = parseIp(matchedRoute.nextHop);
        const outPort = r.ports.find((p) => p.adminUp !== false && parseIp(p.ip) !== null && parseMask(p.mask) !== null && sameSubnet(nhN, parseIp(p.ip), parseMask(p.mask)) && linksOfPort(m, r.id, p.id).length);
        if (outPort) {
          add('fwd_static', 'ok', { n: r.name, port: outPort.id, nh: matchedRoute.nextHop, dst: dstIp }, r.id);
          node = { dev: r, port: outPort.id, ip: outPort.ip, mask: outPort.mask, gw: matchedRoute.nextHop };
          continue;
        }
      }
    }
    const wanP = r.ports.find((p) => p.id === 'WAN');
    if (r.defaultRoute && wanP && wanP.adminUp !== false && linksOfPort(m, r.id, 'WAN').length && parseIp(wanP.ip) !== null) {
      if (isPrivate(dstN)) return fail('no_route', r.id, { n: r.name, ip: dstIp, priv: true });
      add('fwd_wan', 'ok', { n: r.name }, r.id);
      node = { dev: r, port: 'WAN', ip: wanP.ip, mask: wanP.mask, gw: wanP.gw };
      continue;
    }
    return fail('no_route', r.id, { n: r.name, ip: dstIp, defOff: !r.defaultRoute });
  }
  return fail('ttl', sender.dev.id, {});
}

export function ping(m, srcId, dstSel) {
  const cfgs = effectiveConfigs(m);
  const src = getDevice(m, srcId);
  const steps = [];
  const fail = (code, dev, p, extra = {}) => ({ ok: false, steps, path: [], returnPath: [], failure: F(code, dev, p), rtt: null, ...extra });
  const add = (k, status, p, dev) => steps.push(mkStep(k, status, p, dev));
  if (!src) return fail('no_src', null, {});
  if (!src.on) { add('powered', 'fail', { n: src.name }, src.id); return fail('src_off', src.id, { n: src.name }); }
  add('powered', 'ok', { n: src.name }, src.id);
  const dstDev = dstSel && getDevice(m, dstSel.dev);
  if (!dstDev) return fail('no_dst', null, {});
  let sender;
  if (src.kind === 'host') {
    const port = activePort(m, src);
    if (!port) {
      const adminDisabledPort = src.ports.find((p) => p.adminUp === false && linksOfPort(m, src.id, p.id).length > 0);
      if (adminDisabledPort) {
        add('link_fail', 'fail', { adminDown: true }, src.id);
        return fail('port_admin_down', src.id, { n: src.name, port: adminDisabledPort.id });
      }
      const any = src.ports.some((p) => linksOfPort(m, src.id, p.id).length);
      add('link_fail', 'fail', { any }, src.id);
      if (any) {
        const peerPortDown = src.ports.flatMap((p) => linksOfPort(m, src.id, p.id)).map((l) => {
          const pe = l.a.d === src.id ? l.b : l.a;
          const pd = getDevice(m, pe.d);
          const pp = pd?.ports.find((x) => x.id === pe.p);
          return pd && pp?.adminUp === false ? { pd, pp } : null;
        }).find(Boolean);
        if (peerPortDown) return fail('port_admin_down', peerPortDown.pd.id, { n: peerPortDown.pd.name, port: peerPortDown.pp.id });
        const off = src.ports.flatMap((p) => linksOfPort(m, src.id, p.id)).map((l) => getDevice(m, l.a.d === src.id ? l.b.d : l.a.d)).find((d) => !d.on);
        return fail('link_down', src.id, { n: off ? off.name : '?' });
      }
      return fail('no_link', src.id, { n: src.name });
    }
    add('link_ok', 'ok', { port: port.id, wifi: port.kind === 'wifi' }, src.id);
    const c = cfgs.get(src.id);
    if (src.cfg.mode === 'dhcp') add('dhcp', c.source === 'dhcp' ? 'ok' : 'fail', { ok: c.source === 'dhcp', ip: c.ip, server: c.server ? getDevice(m, c.server).name : '' }, src.id);
    const ipOk = parseIp(c.ip) !== null, maskOk = parseMask(c.mask) !== null;
    if (!ipOk || !maskOk) {
      add('ip_bad', 'fail', { ipBad: !ipOk, ip: c.ip, mask: c.mask }, src.id);
      return fail(!ipOk ? 'bad_ip' : 'bad_mask', src.id, { n: src.name, ip: c.ip, mask: c.mask });
    }
    // Check if another active device on the network already uses sender's IP
    const dupSender = m.devices.find((o) => o.id !== src.id && o.on && (o.kind === 'host' ? cfgs.get(o.id)?.ip === c.ip : o.kind === 'router' ? o.ports.some((p) => p.adminUp !== false && p.ip === c.ip) : false));
    if (dupSender) {
      return fail('ip_conflict', src.id, { n: src.name, other: dupSender.name, ip: c.ip });
    }
    add('ip_ok', 'ok', { ip: c.ip, mask: c.mask, gw: c.gw, dns: c.dns }, src.id);
    sender = { dev: src, port: port.id, ip: c.ip, mask: c.mask, gw: c.gw };
  } else if (src.kind === 'router') {
    const p = src.ports.find((q) => q.adminUp !== false && parseIp(q.ip) !== null && linksOfPort(m, src.id, q.id).length);
    if (!p) { add('router_port', 'fail', {}, src.id); return fail('no_link', src.id, { n: src.name }); }
    sender = { dev: src, port: p.id, ip: p.ip, mask: p.mask, gw: '' };
    add('router_port', 'ok', { port: p.id, ip: p.ip }, src.id);
  } else return fail('bad_src', src.id, {});
  add('dest', 'info', { ip: dstSel.ip, n: dstDev.name }, dstDev.id);
  if (dstSel.ip === sender.ip) { add('loopback', 'ok', {}, src.id); return { ok: true, steps, path: [src.id], returnPath: [src.id], failure: null, rtt: 0 }; }
  const fwd = deliver(m, cfgs, sender, dstSel.ip);
  steps.push(...fwd.steps);
  if (!fwd.ok) return { ok: false, steps, path: fwd.path, returnPath: [], failure: fwd.failure, rtt: null };
  let back = { ok: true, path: [...fwd.path].reverse(), hops: fwd.hops, wan: fwd.wan, wifi: fwd.wifi, steps: [] };
  if (dstDev.kind === 'host') {
    const c = cfgs.get(dstDev.id);
    if (parseIp(c.ip) === null) return fail('bad_ip', dstDev.id, { n: dstDev.name, ip: c.ip }, { path: fwd.path });
    if (parseMask(c.mask) === null) return fail('bad_mask', dstDev.id, { n: dstDev.name, mask: c.mask }, { path: fwd.path });
    back = deliver(m, cfgs, { dev: dstDev, port: c.port.id, ip: c.ip, mask: c.mask, gw: c.gw }, sender.ip, 8);
    steps.push(mkStep('reply', 'info', { n: dstDev.name, ip: sender.ip }, dstDev.id), ...back.steps.map((s) => ({ ...s, back: true })));
    if (!back.ok) return { ok: false, steps, path: fwd.path, returnPath: back.path, rtt: null, failure: { ...back.failure, reply: { n: dstDev.name }, ...(() => { const mm = failMsg(back.failure.code, back.failure.p, 'en'); return { title: `Request arrived, but the reply could not return — ${mm.title}`, why: `${dstDev.name} received the ping, but its reply failed: ${mm.why}` }; })() } };
  }
  const rtt = Math.round((fwd.hops + (back.hops || fwd.hops)) * 0.6 + (fwd.wifi || back.wifi ? 6 : 0) + (fwd.wan ? 28 : 0) + 1);
  add('echo', 'ok', { rtt, hops: fwd.path.length - 1, wifi: fwd.wifi, wan: fwd.wan }, src.id);
  return { ok: true, steps, path: fwd.path, returnPath: back.path, failure: null, rtt };
}

export const linkBetween = (m, a, b) => m.links.find((l) => (l.a.d === a && l.b.d === b) || (l.a.d === b && l.b.d === a));

// ---------- Persistence & 2D -> 3D Topology Migration ----------
export function migrateTopology(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.devices) || !Array.isArray(raw.links)) {
    return emptyModel();
  }
  const m = {
    seq: Number(raw.seq) || 0,
    devices: [],
    links: [],
  };
  for (const d of raw.devices) {
    if (!d || !DEVICE_TYPES[d.type]) continue;
    const t = DEVICE_TYPES[d.type];
    const x = Number.isFinite(d.x) ? d.x : 500;
    const y = Number.isFinite(d.y) ? d.y : 320;
    const pos3d = d.pos3d && Number.isFinite(d.pos3d.x) && Number.isFinite(d.pos3d.z)
      ? { x: Number(d.pos3d.x), y: Number(d.pos3d.y) || 0, z: Number(d.pos3d.z) }
      : xyTo3d(x, y);
    const ports = t.ports.map(([pid, pkind, multi]) => {
      const existing = Array.isArray(d.ports) ? d.ports.find((p) => p.id === pid) : null;
      return {
        id: pid,
        kind: pkind,
        multi: !!multi,
        adminUp: existing?.adminUp !== false,
        ...(d.type === 'switch' ? { vlan: existing?.vlan || 1, mode: existing?.mode || 'access' } : {}),
        ...(existing?.ip !== undefined ? { ip: existing.ip } : {}),
        ...(existing?.mask !== undefined ? { mask: existing.mask } : {}),
        ...(existing?.gw !== undefined ? { gw: existing.gw } : {}),
      };
    });
    const migrated = {
      id: String(d.id || `d${++m.seq}`),
      seq: Number(d.seq) || ++m.seq,
      type: d.type,
      kind: t.kind,
      x,
      y,
      pos3d,
      rotY: Number(d.rotY) || 0,
      on: d.on !== false,
      name: String(d.name || t.label.en),
      ports,
      cfg: {
        mode: d.cfg?.mode === 'dhcp' ? 'dhcp' : 'static',
        ip: d.cfg?.ip ?? '',
        mask: d.cfg?.mask ?? '255.255.255.0',
        gw: d.cfg?.gw ?? '',
        dns: d.cfg?.dns ?? '8.8.8.8',
        preferredPort: d.cfg?.preferredPort ?? '',
        ssid: d.cfg?.ssid ?? DEFAULT_SSID,
        wifiKey: d.cfg?.wifiKey ?? DEFAULT_WIFI_KEY,
      },
    };
    if (d.type === 'ap') {
      migrated.ssid = d.ssid ?? DEFAULT_SSID;
      migrated.security = d.security ?? 'WPA2-PSK';
      migrated.wifiKey = d.wifiKey ?? DEFAULT_WIFI_KEY;
      migrated.channel = Number(d.channel) || 6;
    }
    if (t.kind === 'router') {
      migrated.dhcp = !!d.dhcp;
      migrated.dhcpDns = d.dhcpDns ?? '8.8.8.8';
      migrated.defaultRoute = d.defaultRoute !== false;
      migrated.routes = Array.isArray(d.routes) ? d.routes.map((r) => ({ ...r })) : [];
    }
    m.devices.push(migrated);
    m.seq = Math.max(m.seq, migrated.seq);
  }
  for (const l of raw.links) {
    if (!l?.a?.d || !l?.a?.p || !l?.b?.d || !l?.b?.p) continue;
    const da = getDevice(m, l.a.d), db = getDevice(m, l.b.d);
    if (!da || !db) continue;
    const kind = l.kind === 'wifi' ? 'wifi' : 'eth';
    m.links.push({
      id: String(l.id || `l${++m.seq}`),
      a: { d: l.a.d, p: l.a.p },
      b: { d: l.b.d, p: l.b.p },
      kind,
      cableType: l.cableType || (kind === 'wifi' ? 'wifi' : 'straight'),
    });
  }
  return m;
}

const STORAGE_KEY = 'u1.lab.topology.v1';
export function saveTopologyToStorage(model) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    }
  } catch { /* ignore storage errors */ }
}
export function loadTopologyFromStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.devices) && parsed.devices.length > 0) {
          return migrateTopology(parsed);
        }
      }
    }
  } catch { /* ignore storage errors */ }
  return null;
}

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
