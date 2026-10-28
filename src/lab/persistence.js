// Topology persistence (localStorage) and 2D <-> 3D schema migration
import {
  DEVICE_TYPES,
  DEFAULT_SSID,
  DEFAULT_WIFI_KEY,
  emptyModel,
  getDevice,
  xyTo3d,
} from './sim.js';

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

