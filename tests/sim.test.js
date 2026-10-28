import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../src/lab/sim.js';

const mk = () => S.emptyModel();
const wire = (m, a, ap, b, bp) => { const r = S.connect(m, { d: a.id, p: ap }, { d: b.id, p: bp }); assert.ok(r.ok, r.reason); return r.link; };
const cfg = (d, ip, mask = '255.255.255.0', gw = '') => (d.cfg = { mode: 'static', ip, mask, gw });
const pingTo = (m, a, b) => S.ping(m, a.id, { dev: b.id, ip: S.effectiveConfigs(m).get(b.id).ip });

test('ip helpers', () => {
  assert.equal(S.parseIp('192.168.1.1'), 3232235777);
  assert.equal(S.parseIp('256.1.1.1'), null);
  assert.equal(S.parseIp('1.2.3'), null);
  assert.ok(S.parseMask('255.255.255.0') !== null);
  assert.equal(S.parseMask('255.0.255.0'), null);
});

test('two PCs on a switch can ping; failure modes explain themselves', () => {
  const m = mk();
  const sw = S.createDevice(m, 'switch'), a = S.createDevice(m, 'pc'), b = S.createDevice(m, 'pc');
  cfg(a, '192.168.1.10'); cfg(b, '192.168.1.11');
  // no cables yet
  let r = pingTo(m, a, b); assert.equal(r.ok, false); assert.equal(r.failure.code, 'no_link');
  wire(m, a, 'eth0', sw, 'fa1'); wire(m, b, 'eth0', sw, 'fa2');
  r = pingTo(m, a, b); assert.equal(r.ok, true, JSON.stringify(r.failure)); assert.deepEqual(r.path, [a.id, sw.id, b.id]);
  // wrong IP on b (different subnet, no gateway) -> a cannot reach (no gateway)
  cfg(b, '192.168.5.11'); r = pingTo(m, a, b); assert.equal(r.ok, false); assert.equal(r.failure.code, 'no_gateway');
  cfg(b, '192.168.1.11');
  // switch off -> link down
  sw.on = false; r = pingTo(m, a, b); assert.equal(r.ok, false); assert.equal(r.failure.code, 'link_down');
  sw.on = true;
  // destination off
  b.on = false; r = pingTo(m, a, { id: b.id });
  assert.equal(S.ping(m, a.id, { dev: b.id, ip: '192.168.1.11' }).failure.code, 'dst_off');
  b.on = true;
  // invalid mask
  a.cfg.mask = '255.0.255.0'; r = pingTo(m, a, b); assert.equal(r.failure.code, 'bad_mask');
});

test('router connects two subnets; missing gateway on destination breaks the reply', () => {
  const m = mk();
  const r = S.createDevice(m, 'router');
  const s1 = S.createDevice(m, 'switch'), s2 = S.createDevice(m, 'switch');
  const a = S.createDevice(m, 'pc'), b = S.createDevice(m, 'pc');
  wire(m, r, 'LAN1', s1, 'fa1'); wire(m, r, 'LAN2', s2, 'fa1'); wire(m, a, 'eth0', s1, 'fa2'); wire(m, b, 'eth0', s2, 'fa2');
  cfg(a, '192.168.1.10', '255.255.255.0', '192.168.1.1'); cfg(b, '192.168.2.10', '255.255.255.0', '192.168.2.1');
  let res = pingTo(m, a, b);
  assert.equal(res.ok, true, JSON.stringify(res.failure));
  assert.ok(res.path.includes(r.id));
  cfg(b, '192.168.2.10', '255.255.255.0', '');
  res = pingTo(m, a, b);
  assert.equal(res.ok, false); assert.match(res.failure.title, /reply could not return/);
  cfg(b, '192.168.2.10', '255.255.255.0', '192.168.2.1');
  r.on = false; res = pingTo(m, a, b); assert.equal(res.ok, false); assert.equal(res.failure.code, 'dst_off');
});

test('DHCP gives leases, and falls back to APIPA without a server', () => {
  const m = mk();
  const r = S.createDevice(m, 'router'), sw = S.createDevice(m, 'switch'), a = S.createDevice(m, 'pc'), b = S.createDevice(m, 'pc');
  wire(m, r, 'LAN1', sw, 'fa1'); wire(m, a, 'eth0', sw, 'fa2'); wire(m, b, 'eth0', sw, 'fa3');
  a.cfg.mode = 'dhcp'; b.cfg.mode = 'dhcp';
  let c = S.effectiveConfigs(m); assert.equal(c.get(a.id).source, 'apipa');
  assert.equal(pingTo(m, a, b).ok, true); // both APIPA 169.254/16 on same segment
  r.dhcp = true; c = S.effectiveConfigs(m);
  assert.equal(c.get(a.id).ip, '192.168.1.100'); assert.equal(c.get(b.id).ip, '192.168.1.101'); assert.equal(c.get(a.id).gw, '192.168.1.1');
  assert.equal(pingTo(m, a, b).ok, true);
});

test('Wi-Fi through an access point; wifi rules', () => {
  const m = mk();
  const sw = S.createDevice(m, 'switch'), ap = S.createDevice(m, 'ap'), srv = S.createDevice(m, 'server'), ph = S.createDevice(m, 'phone'), pc = S.createDevice(m, 'pc');
  assert.equal(S.canConnect(m, { d: ph.id, p: 'wifi0' }, { d: pc.id, p: 'eth0' }).ok, false);
  wire(m, ap, 'eth0', sw, 'fa1'); wire(m, srv, 'eth0', sw, 'fa2'); wire(m, ph, 'wifi0', ap, 'radio');
  cfg(ph, '192.168.1.50'); cfg(srv, '192.168.1.20');
  const res = pingTo(m, ph, srv); assert.equal(res.ok, true, JSON.stringify(res.failure)); assert.ok(res.rtt > 0);
  assert.ok(res.path.includes(ap.id));
  const second = S.createDevice(m, 'laptop');
  assert.equal(S.connect(m, { d: second.id, p: 'wifi0' }, { d: ap.id, p: 'radio' }).ok, true); // radio accepts many clients
  assert.equal(S.canConnect(m, { d: pc.id, p: 'eth0' }, { d: sw.id, p: 'fa1' }).ok, false); // busy port
});

test('Internet reachability depends on WAN cable and gateway', () => {
  const m = mk();
  const net = S.createDevice(m, 'internet'), r = S.createDevice(m, 'router'), sw = S.createDevice(m, 'switch'), a = S.createDevice(m, 'pc');
  wire(m, r, 'LAN1', sw, 'fa1'); wire(m, a, 'eth0', sw, 'fa2'); cfg(a, '192.168.1.10', '255.255.255.0', '192.168.1.1');
  const tgt = { dev: net.id, ip: S.INTERNET_HOST };
  assert.equal(S.ping(m, a.id, tgt).ok, false);
  wire(m, r, 'WAN', net, 'eth0');
  assert.equal(S.ping(m, a.id, tgt).ok, true);
  r.ports.find((p) => p.id === 'WAN').gw = '203.0.113.99';
  assert.equal(S.ping(m, a.id, tgt).failure.code, 'gw_unreachable');
});

test('troubleshooting preset starts broken and is fixable; missions evaluate real state', () => {
  const m = S.leshevBroken();
  assert.equal(S.troubleshootSolved(m).done, false);
  const byName = (n) => m.devices.find((d) => d.name === n);
  byName('Manager PC').cfg.gw = '192.168.1.1';
  assert.equal(S.troubleshootSolved(m).done, false);
  byName('Fitter laptop').cfg.ip = '192.168.1.50';
  assert.equal(S.troubleshootSolved(m).done, false);
  byName('Office router').ports.find((p) => p.id === 'WAN').gw = S.INTERNET_GW;
  const s = S.troubleshootSolved(m); assert.equal(s.done, true, s.hint);
  const m1 = S.MISSIONS[0].check(S.emptyModel()); assert.equal(m1.done, false);
});

test('3D spatial placement, movement, rotation, and duplication preserve network behavior', () => {
  const m = mk();
  const sw = S.createDevice(m, 'switch', 400, 300);
  const a = S.createDevice(m, 'pc', 150, 200);
  const b = S.createDevice(m, 'pc', 650, 200);
  wire(m, a, 'eth0', sw, 'fa1');
  wire(m, b, 'eth0', sw, 'fa2');
  cfg(a, '192.168.1.10');
  cfg(b, '192.168.1.11');

  assert.ok(a.pos3d && typeof a.pos3d.x === 'number' && typeof a.pos3d.z === 'number');
  assert.equal(pingTo(m, a, b).ok, true);

  // Move device A in 3D space and rotate it; connectivity and IPs must remain unchanged
  S.moveDevice(m, a.id, { x: -6.5, y: 0, z: 3.25 });
  S.rotateDevice(m, a.id, Math.PI / 2);
  assert.equal(a.pos3d.x, -6.5);
  assert.equal(a.pos3d.z, 3.25);
  assert.equal(a.cfg.ip, '192.168.1.10');
  assert.equal(pingTo(m, a, b).ok, true);

  // Duplicate device A -> gets next IP (.11 or incremented) and 3D coordinates
  const copy = S.duplicateDevice(m, a.id);
  assert.ok(copy && copy.id !== a.id);
  assert.equal(copy.type, 'pc');
});

test('VLAN segmentation, port administrative shutdown, IP conflicts, Wi-Fi auth, and static routes', () => {
  const m = mk();
  const sw = S.createDevice(m, 'switch');
  const a = S.createDevice(m, 'pc');
  const b = S.createDevice(m, 'pc');
  wire(m, a, 'eth0', sw, 'fa1');
  wire(m, b, 'eth0', sw, 'fa2');
  cfg(a, '192.168.1.10');
  cfg(b, '192.168.1.11');
  assert.equal(pingTo(m, a, b).ok, true);

  // 1. VLAN mismatch blocks traffic on access ports and explains why
  sw.ports.find((p) => p.id === 'fa1').vlan = 10;
  sw.ports.find((p) => p.id === 'fa2').vlan = 20;
  let r = pingTo(m, a, b);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'vlan_mismatch');

  // Matching VLAN 10 restores connectivity
  sw.ports.find((p) => p.id === 'fa2').vlan = 10;
  assert.equal(pingTo(m, a, b).ok, true);

  // 2. Port administrative shutdown blocks traffic and reports port_admin_down
  sw.ports.find((p) => p.id === 'fa2').adminUp = false;
  r = pingTo(m, a, b);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'port_admin_down');
  sw.ports.find((p) => p.id === 'fa2').adminUp = true;

  // 3. Duplicate IP conflict detection
  const c = S.createDevice(m, 'pc');
  wire(m, c, 'eth0', sw, 'fa3');
  sw.ports.find((p) => p.id === 'fa3').vlan = 10;
  cfg(c, '192.168.1.11'); // same IP as b
  const conflicts = S.detectConflicts(m);
  assert.ok(conflicts.some((x) => x.code === 'ip_conflict'));
  r = pingTo(m, a, b);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'ip_conflict');
  S.removeDevice(m, c.id);

  // 4. Static routing between two routers
  const m2 = mk();
  const r1 = S.createDevice(m2, 'router');
  const r2 = S.createDevice(m2, 'router');
  r2.ports.find((p) => p.id === 'LAN1').ip = '192.168.2.2';
  r2.ports.find((p) => p.id === 'LAN2').ip = '192.168.3.1';
  r2.ports.find((p) => p.id === 'LAN2').mask = '255.255.255.0';
  const h1 = S.createDevice(m2, 'pc');
  const h3 = S.createDevice(m2, 'pc');
  wire(m2, h1, 'eth0', r1, 'LAN1');
  wire(m2, r1, 'LAN2', r2, 'LAN1');
  wire(m2, h3, 'eth0', r2, 'LAN2');
  cfg(h1, '192.168.1.10', '255.255.255.0', '192.168.1.1');
  cfg(h3, '192.168.3.10', '255.255.255.0', '192.168.3.1');
  r1.routes = [{ dst: '192.168.3.0', mask: '255.255.255.0', nextHop: '192.168.2.2' }];
  r2.routes = [{ dst: '192.168.1.0', mask: '255.255.255.0', nextHop: '192.168.2.1' }];
  const routeRes = pingTo(m2, h1, h3);
  assert.equal(routeRes.ok, true, JSON.stringify(routeRes.failure));

  // 5. Starter 3D Lab topology and migration preserve all devices and links
  const starter = S.starterLabTopology();
  const migrated = S.migrateTopology(JSON.parse(JSON.stringify(starter)));
  assert.equal(migrated.devices.length, starter.devices.length);
  assert.equal(migrated.links.length, starter.links.length);
});
