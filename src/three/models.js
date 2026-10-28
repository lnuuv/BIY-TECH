// Procedural, genuinely 3D hardware models (no external assets → loads instantly, works offline).
// Units: 1 unit = 10 cm. Every selectable component is a "part": { id, group, home, explode, anchor }.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const hasDOM = typeof document !== 'undefined';

// ---------- materials & textures ----------
const PAL = {
  pcb:    { color: 0x0e1b26, metalness: 0.15, roughness: 0.55 },
  black:  { color: 0x12161d, metalness: 0.15, roughness: 0.62 },
  dark:   { color: 0x1c222c, metalness: 0.3, roughness: 0.55 },
  alu:    { color: 0xaeb7c4, metalness: 0.92, roughness: 0.28 },
  steel:  { color: 0x8892a0, metalness: 0.95, roughness: 0.35 },
  gold:   { color: 0xd8b04a, metalness: 1, roughness: 0.28 },
  copper: { color: 0xc0743a, metalness: 1, roughness: 0.3 },
  white:  { color: 0xe9edf3, metalness: 0.05, roughness: 0.4 },
  blue:   { color: 0x1b6fd1, metalness: 0.2, roughness: 0.4 },
  green:  { color: 0x1f8a52, metalness: 0.2, roughness: 0.5 },
  yellow: { color: 0xe3b53a, metalness: 0.2, roughness: 0.5 },
  red:    { color: 0xc23b3b, metalness: 0.2, roughness: 0.5 },
  rubber: { color: 0x0a0c10, metalness: 0, roughness: 0.9 },
};
export const mat = (k, o = {}) => new THREE.MeshStandardMaterial({ ...PAL[k], emissive: 0x000000, ...o });
const led = (color, i = 1.6) => new THREE.MeshStandardMaterial({ color: 0x050607, emissive: color, emissiveIntensity: i, roughness: 0.4 });
const glass = (o = 0.14) => new THREE.MeshPhysicalMaterial({ color: 0x5a7a99, metalness: 0, roughness: 0.02, transparent: true, opacity: o * 0.7, depthWrite: false, emissive: 0x000000, envMapIntensity: 0.6 });

function canvasTex(w, h, draw, repeat) {
  if (!hasDOM) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const pcbTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#0e1b26'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(56,189,248,.22)'; g.lineWidth = 2;
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { if (rnd() > 0.5) x += (rnd() - 0.5) * 140; else y += (rnd() - 0.5) * 140; g.lineTo(x, y); }
    g.stroke(); g.fillStyle = 'rgba(216,176,74,.4)'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
  }
});
const grillTex = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#0b0e13'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a323f';
  for (let y = 6; y < h; y += 9) for (let x = (y / 9) % 2 ? 4 : 9; x < w; x += 10) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
}, [1, 1]);
const labelTex = (text, { w = 256, h = 64, bg = '#0b1220', fg = '#7dd3fc', size = 28 } = {}) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `700 ${size}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
});

// ---------- geometry helpers ----------
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0.012) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); return o; }
function tube(points, radius, m, seg = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : V(...p))), false, 'catmullrom', 0.4);
  const g = new THREE.TubeGeometry(curve, seg, radius, 8, false);
  const o = new THREE.Mesh(g, m); o.userData.curve = curve; return o;
}

class Parts {
  constructor(parent) { this.parent = parent; this.map = {}; }
  add(id, group, { pos = V(), explode, anchor, pickable = true } = {}) {
    group.position.copy(pos); group.userData.partId = id;
    this.parent.add(group);
    this.map[id] = { id, group, home: pos.clone(), explode, anchor: anchor || V(0, 0.2, 0), pickable };
    return this.map[id];
  }
}

function makeGuides(parent, parts) {
  const lines = [];
  const m = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, depthWrite: false });
  for (const p of Object.values(parts)) {
    if (!p.explode) continue;
    const g = new THREE.BufferGeometry().setFromPoints([V(), V()]);
    const l = new THREE.Line(g, m.clone()); l.userData.noPick = true; l.frustumCulled = false; l.renderOrder = 5;
    parent.add(l); lines.push([p, l]);
  }
  return () => { for (const [p, l] of lines) { const f = p.f ?? 0; l.material.opacity = Math.min(0.55, f * 0.9); l.visible = f > 0.02; if (l.visible) { const a = l.geometry.attributes.position; a.setXYZ(0, p.home.x, p.home.y, p.home.z); a.setXYZ(1, p.group.position.x, p.group.position.y, p.group.position.z); a.needsUpdate = true; } } };
}

function finStack(w, h, d, n, m, axis = 'y') {
  const g = new THREE.Group(); const step = h / n;
  for (let i = 0; i < n; i++) g.add(box(w, step * 0.45, d, m, 0, -h / 2 + step * (i + 0.5), 0, 0.004));
  return g;
}
function fan(r, m, bladeM, blades = 7) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.07, 8, 40), m); g.add(ring);
  const rotor = new THREE.Group();
  rotor.add(cyl(r * 0.22, r * 0.22, r * 0.14, m, 0, 0, 0).rotateX(Math.PI / 2));
  for (let i = 0; i < blades; i++) {
    const b = box(r * 0.62, r * 0.015, r * 0.3, bladeM, r * 0.55, 0, 0, 0.002); b.rotation.x = 0.5;
    const pivot = new THREE.Group(); pivot.rotation.z = (i / blades) * Math.PI * 2; pivot.add(b); rotor.add(pivot);
  }
  g.add(rotor); g.userData.rotor = rotor; return g;
}

// ===================================================================================
// MOTHERBOARD (ATX, lying flat, +y up, rear I/O on the −x edge). Used standalone and inside the PC.
// ===================================================================================
export function buildBoardParts(parent, { explodeIds = null, init = {}, installed = {} } = {}) {
  const P = new Parts(parent);
  const ex = (id, v) => (!explodeIds || explodeIds.has(id) ? v : undefined);
  const inst = (id) => installed[id] !== false;
  const fans = [];

  // PCB + capacitors + screws
  const pcb = new THREE.Group();
  const pcbMat = mat('pcb', { map: pcbTex() });
  if (pcbMat.map) pcbMat.map.repeat.set(3, 2.4), pcbMat.map.wrapS = pcbMat.map.wrapT = THREE.RepeatWrapping;
  pcb.add(box(3.05, 0.04, 2.44, pcbMat, 0, -0.02, 0, 0.01));
  for (let i = 0; i < 26; i++) {
    const x = 0.2 + (i % 13) * 0.085, z = 1.18 - Math.floor(i / 13) * 0.0 - (i % 3) * 0.0;
    const c = cyl(0.03, 0.03, 0.1, mat('black'), -1.0 + (i % 9) * 0.07, 0.05, -0.2 + Math.floor(i / 9) * 0.12 + 0.9 * 0);
    if (i < 18) pcb.add(c);
    void x; void z;
  }
  for (let i = 0; i < 6; i++) pcb.add(cyl(0.032, 0.032, 0.1, mat('black'), 0.05 + i * 0.075, 0.05, -0.15));
  for (const [x, z] of [[-1.35, -1.0], [1.3, -1.0], [-1.35, 1.0], [1.3, 1.0], [0.0, 0.0], [-0.5, 1.0]]) pcb.add(cyl(0.05, 0.05, 0.03, mat('gold'), x, 0.015, z, 16));
  P.add('pcb', pcb, { anchor: V(1.0, 0.1, -0.9) });

  // CPU socket frame (always on the board) + CPU on top
  const socket = new THREE.Group();
  socket.add(box(0.62, 0.05, 0.62, mat('steel'), 0, 0.025, 0, 0.01));
  socket.add(box(0.5, 0.052, 0.5, mat('black'), 0, 0.027, 0, 0.005));
  const lever = cyl(0.012, 0.012, 0.62, mat('steel'), 0.33, 0.06, 0, 8); lever.rotation.x = Math.PI / 2; socket.add(lever);
  P.add('socket', socket, { pos: V(-0.45, 0, -0.5), anchor: V(0.3, 0.1, 0.3) });

  const cpu = new THREE.Group();
  cpu.add(box(0.46, 0.014, 0.46, mat('green', { color: 0x1d5e3d }), 0, 0.058, 0, 0.004));
  cpu.add(box(0.31, 0.022, 0.31, mat('alu'), 0, 0.075, 0, 0.006));
  const tri = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.01, 3), mat('gold')); tri.position.set(-0.19, 0.067, -0.19); tri.rotation.y = Math.PI / 6; cpu.add(tri);
  P.add('cpu', cpu, { pos: V(-0.45, 0, -0.5), explode: ex('cpu', V(0, 1.15, 0)), anchor: V(0, 0.12, 0) });

  // CPU cooler: copper base, heat-pipes, aluminium fin stack, fan
  const cooler = new THREE.Group();
  cooler.add(box(0.55, 0.05, 0.55, mat('copper'), 0, 0.12, 0, 0.01));
  for (const dx of [-0.17, 0, 0.17]) cooler.add(cyl(0.03, 0.03, 0.7, mat('copper'), dx, 0.5, 0, 12));
  const fins = finStack(0.82, 0.95, 0.5, 26, mat('alu')); fins.position.set(0, 0.78, -0.02); cooler.add(fins);
  const f = fan(0.42, mat('black'), mat('dark')); f.position.set(0, 0.78, 0.31); f.scale.set(1, 1.1, 1); cooler.add(f); fans.push(f.userData.rotor);
  cooler.add(box(0.9, 1.0, 0.06, mat('black'), 0, 0.78, 0.31, 0.01).translateZ(-0.0));
  P.add('cooler', cooler, { pos: V(-0.45, 0.0, -0.5), explode: ex('cooler', V(0, 2.1, 0)), anchor: V(0, 1.3, 0) });

  // RAM slots + 2 modules
  const slots = new THREE.Group();
  for (let i = 0; i < 4; i++) { const x = i * 0.1; slots.add(box(0.05, 0.09, 1.33, mat('black'), x, 0.045, 0, 0.006)); for (const s of [-1, 1]) slots.add(box(0.045, 0.06, 0.05, mat('white'), x, 0.1, s * 0.66, 0.004)); }
  P.add('ramslot', slots, { pos: V(0.45, 0, -0.55), anchor: V(0.15, 0.15, 0.7) });
  const ram = new THREE.Group();
  for (const i of [1, 3]) {
    const m = new THREE.Group();
    m.add(box(0.032, 0.31, 1.33, mat('pcb', { color: 0x15402a }), 0, 0.24, 0, 0.004));
    m.add(box(0.045, 0.24, 1.2, mat('alu'), 0, 0.27, 0, 0.012));
    m.add(box(0.05, 0.025, 1.2, mat('black'), 0, 0.395, 0, 0.008));
    m.add(box(0.012, 0.04, 1.33, mat('gold'), 0, 0.105, 0, 0.002));
    m.position.x = i * 0.1; ram.add(m);
  }
  P.add('ram', ram, { pos: V(0.45, 0, -0.55), explode: ex('ram', V(0, 1.0, 0)), anchor: V(0.2, 0.55, 0) });

  // VRM heatsinks
  const vrm = new THREE.Group();
  const v1 = new THREE.Group(); v1.add(box(1.1, 0.07, 0.2, mat('alu'), 0, 0.05, 0, 0.01)); const f1 = finStack(1.08, 0.14, 0.18, 14, mat('alu')); f1.rotation.z = Math.PI / 2; f1.scale.set(1, 1, 1); v1.add(box(1.1, 0.14, 0.18, mat('dark'), 0, 0.14, 0, 0.01)); vrm.add(v1); v1.position.set(0, 0, 0);
  const v2 = box(0.2, 0.17, 1.0, mat('dark'), -0.55, 0.085, 0.55, 0.01); const v2f = box(0.2, 0.03, 1.0, mat('alu'), -0.55, 0.185, 0.55, 0.008); vrm.add(v2, v2f);
  P.add('vrm', vrm, { pos: V(-0.45, 0, -1.0), explode: ex('vrm', V(0, 0.75, 0)), anchor: V(0, 0.3, 0) });

  // chipset heatsink with label plate
  const chip = new THREE.Group();
  chip.add(box(0.55, 0.09, 0.55, mat('dark'), 0, 0.045, 0, 0.012));
  const plate = box(0.4, 0.012, 0.4, mat('alu', { map: labelTex('CHIPSET', { w: 256, h: 256, bg: '#1b2330', fg: '#7dd3fc', size: 34 }) }), 0, 0.096, 0, 0.004); chip.add(plate);
  P.add('chipset', chip, { pos: V(0.5, 0, 0.8), explode: ex('chipset', V(0, 0.75, 0.2)), anchor: V(0, 0.2, 0) });

  // PCIe slots
  const gs = new THREE.Group(); gs.add(box(0.89, 0.11, 0.07, mat('black'), 0, 0.055, 0, 0.006)); gs.add(box(0.89, 0.02, 0.09, mat('steel'), 0, 0.115, 0, 0.004)); gs.add(box(0.02, 0.07, 0.09, mat('white'), 0.44, 0.1, 0, 0.003));
  P.add('gpuslot', gs, { pos: V(-0.6, 0, 0.7), anchor: V(0, 0.2, 0) });
  const x1 = new THREE.Group(); x1.add(box(0.26, 0.1, 0.07, mat('black'), 0, 0.05, 0, 0.006)); x1.add(box(0.26, 0.02, 0.09, mat('steel'), 0, 0.105, 0, 0.004));
  P.add('pciex1', x1, { pos: V(-0.9, 0, 0.42), anchor: V(0, 0.2, 0) });

  // M.2 SSD on its slot
  const m2 = new THREE.Group();
  m2.add(box(0.8, 0.014, 0.22, mat('pcb', { color: 0x14171f }), 0, 0.06, 0, 0.003));
  for (const x of [-0.12, 0.08, 0.26]) m2.add(box(0.15, 0.012, 0.15, mat('black', { color: 0x07080b }), x, 0.073, 0, 0.003));
  m2.add(box(0.12, 0.011, 0.12, mat('steel'), -0.3, 0.073, 0, 0.003));
  m2.add(box(0.74, 0.003, 0.2, mat('alu', { map: labelTex('NVMe M.2 SSD', { w: 512, h: 128, bg: '#1d2430', fg: '#9ad7ff', size: 40 }) }), 0.0, 0.082, 0, 0));
  m2.add(cyl(0.025, 0.025, 0.04, mat('gold'), 0.43, 0.06, 0, 12));
  const m2slot = box(0.2, 0.04, 0.2, mat('black'), -0.45, 0.02, 0, 0.004); m2.add(m2slot);
  P.add('m2', m2, { pos: V(-0.55, 0, 0.18), explode: ex('m2', V(0, 0.85, 0.15)), anchor: V(0, 0.15, 0) });

  // SATA ports
  const sata = new THREE.Group();
  for (let i = 0; i < 4; i++) { sata.add(box(0.14, 0.1, 0.16, mat('black'), i * 0.14, 0.05, 0, 0.006)); sata.add(box(0.1, 0.02, 0.1, mat('dark'), i * 0.14, 0.095, 0, 0.003)); }
  P.add('sata', sata, { pos: V(0.95, 0, 1.05), explode: ex('sata', V(0.35, 0.35, 0.1)), anchor: V(0.2, 0.2, 0) });

  // power connectors
  const atx = new THREE.Group(); atx.add(box(0.13, 0.17, 0.52, mat('white'), 0, 0.085, 0, 0.008)); for (let i = 0; i < 12; i++) for (const s of [-1, 1]) atx.add(box(0.03, 0.04, 0.025, mat('gold'), s * 0.03, 0.175, -0.22 + i * 0.04, 0.002));
  P.add('atx', atx, { pos: V(1.42, 0, 0.2), explode: ex('atx', V(0.35, 0.4, 0)), anchor: V(0, 0.25, 0) });
  const eps = new THREE.Group(); eps.add(box(0.3, 0.16, 0.1, mat('white'), 0, 0.08, 0, 0.008)); for (let i = 0; i < 4; i++) eps.add(box(0.04, 0.03, 0.03, mat('gold'), -0.1 + i * 0.07, 0.165, 0, 0.002));
  P.add('cpupower', eps, { pos: V(-1.1, 0, -1.17), explode: ex('cpupower', V(0, 0.45, -0.25)), anchor: V(0, 0.25, 0) });

  // rear I/O: metal shield + ports
  const io = new THREE.Group();
  io.add(box(0.03, 0.56, 1.58, mat('steel'), 0, 0.28, 0, 0.004));
  const pm = mat('steel');
  for (const z of [-0.55, -0.3]) { io.add(box(0.28, 0.16, 0.22, pm, 0.15, 0.1, z, 0.006)); io.add(box(0.2, 0.1, 0.16, mat('black'), 0.2, 0.1, z, 0.004)); } // RJ45 (x2)
  for (const [z, y] of [[-0.05, 0.08], [-0.05, 0.25], [0.2, 0.08], [0.2, 0.25]]) { io.add(box(0.28, 0.14, 0.14, mat('blue', { color: y > 0.2 ? 0x1b6fd1 : 0x2a82e8 }), 0.15, y + 0.06, z, 0.006)); } // USB
  for (const z of [-0.8, -0.65]) io.add(box(0.2, 0.1, 0.17, mat('black'), 0.1, 0.38, z, 0.006)); // HDMI/DP
  for (const [i, c] of [0x3fae5a, 0x4a90e2, 0xe36a8a].entries()) { const j = cyl(0.045, 0.045, 0.12, mat('black', { color: 0x0a0a0a }), 0.07, 0.4 + 0.0, 0.55 + i * 0.0, 16); j.rotation.z = Math.PI / 2; j.position.z = 0.35 + i * 0.12; j.position.y = 0.1 + 0.2 * 0 + 0.42 * 0; const ring = cyl(0.05, 0.05, 0.015, mat('black', { color: c, emissive: c, emissiveIntensity: 0.2 }), 0.01, 0.1, 0.35 + i * 0.12, 16); ring.rotation.z = Math.PI / 2; io.add(j, ring); }
  P.add('io', io, { pos: V(-1.54, 0, -0.45), explode: ex('io', V(-1.3, 0, 0)), anchor: V(-0.1, 0.65, 0) });

  // CMOS battery
  const bat = new THREE.Group(); bat.add(cyl(0.12, 0.12, 0.03, mat('black'), 0, 0.015, 0, 24)); bat.add(cyl(0.1, 0.1, 0.034, mat('alu'), 0, 0.04, 0, 24));
  P.add('battery', bat, { pos: V(0.15, 0, 0.45), explode: ex('battery', V(0, 0.6, 0)), anchor: V(0, 0.15, 0) });

  // GPU (optional here; used by the PC build)
  if (installed.__gpu) {
    const gpu = new THREE.Group();
    gpu.add(box(2.7, 1.0, 0.02, mat('pcb', { color: 0x15202b }), 0.0, 0.62, 0, 0.004));                      // PCB (stands in the slot)
    gpu.add(box(0.06, 1.1, 0.02, mat('gold'), -0.4, 0.55, 0, 0.002).translateX(-0.4 * 0));
    const shroud = box(2.7, 1.0, 0.36, mat('dark', { color: 0x161b24 }), 0.0, 0.62, 0.2, 0.05); gpu.add(shroud);
    for (const x of [-0.7, 0.2, 1.0]) { const ff = fan(0.36, mat('black'), mat('dark')); ff.rotation.y = 0; ff.position.set(x, 0.62, 0.4); gpu.add(ff); fans.push(ff.userData.rotor); }
    gpu.add(box(2.62, 0.02, 0.38, led(0x22d3ee, 1.4), 0.0, 1.115, 0.2, 0.004));
    gpu.add(box(0.03, 1.2, 0.4, mat('steel'), -1.42, 0.55, 0.12, 0.004)); // bracket at the I/O end
    gpu.add(box(0.3, 0.08, 0.14, mat('black'), 1.0, 1.15, 0.2, 0.01)); // 8-pin power socket
    P.add('gpu', gpu, { pos: V(0.0, 0.0, 0.7), explode: V(0, 1.4, 0.0), anchor: V(0, 1.2, 0.2) });
  }
  const parts = P.map;
  for (const [id, f] of Object.entries(init)) if (parts[id]) { parts[id].fTarget = f; parts[id].f = f; }
  return { parts, fans };
}

export function buildMotherboard({ bench = false, init = {} } = {}) {
  const group = new THREE.Group();
  const ids = bench ? new Set(['cpu', 'ram', 'm2', 'cooler']) : null;
  const { parts, fans } = buildBoardParts(group, { explodeIds: ids, init });
  if (bench) { const m = box(4.2, 0.05, 3.5, mat('rubber'), 0, -0.07, 0, 0.02); m.userData.noPick = true; group.add(m); }
  const guides = makeGuides(group, parts);
  return { group, parts, guides, update: (t, dt) => fans.forEach((f) => (f.rotation.z += dt * 4)), home: bench ? { dir: V(-0.55, 0.9, 1), fitAll: true } : { dir: V(-0.55, 0.9, 1) } };
}

// ===================================================================================
// SERVER RACK
// ===================================================================================
const U = 0.445;
function rackUnit(Uh, depth, accent = 0x22d3ee) {
  const g = new THREE.Group(); const h = Uh * U - 0.03;
  g.add(box(4.7, h, depth, mat('dark'), 0, 0, -depth / 2, 0.01));
  g.add(box(4.83, h, 0.08, mat('black'), 0, 0, 0.04, 0.012));
  const strip = box(4.2, 0.018, 0.012, led(accent, 1.3), 0, h / 2 - 0.035, 0.09, 0.004); strip.userData.noHighlight = true; g.add(strip);
  for (const s of [-1, 1]) g.add(cyl(0.025, 0.025, 0.02, mat('steel'), s * 2.34, h / 2 - 0.07, 0.09, 10).rotateX(Math.PI / 2));
  g.userData.h = h; return g;
}
const leds = [];
function blinkLed(parent, x, y, z, color, phase) { const m = led(color, 1); const o = box(0.03, 0.03, 0.012, m, x, y, z, 0.004); o.userData.noHighlight = true; parent.add(o); leds.push({ m, phase }); }

export function buildRack() {
  const group = new THREE.Group(); const P = new Parts(group); const ledList = [];
  const N = 12, H = N * U + 0.5;
  const frame = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) frame.add(box(0.14, H, 0.14, mat('black'), sx * 2.75, H / 2, sz * 2.95, 0.01));
  frame.add(box(5.64, 0.12, 6.04, mat('black'), 0, 0.06, 0, 0.02)); frame.add(box(5.64, 0.12, 6.04, mat('black'), 0, H - 0.06, 0, 0.02));
  for (const sx of [-1, 1]) { frame.add(box(0.03, H - 0.3, 5.9, glass(0.1), sx * 2.8, H / 2, 0, 0)); frame.add(box(0.1, H - 0.3, 0.05, mat('steel'), sx * 2.45, H / 2, 2.55, 0.004)); frame.add(box(0.1, H - 0.3, 0.05, mat('steel'), sx * 2.45, H / 2, -2.2, 0.004)); }
  for (let i = 0; i < 4; i++) frame.add(box(0.05, 0.05, 0.1, mat('steel'), 0, 0, 0)); frame.children.splice(-4, 4);
  P.add('rackframe', frame, { anchor: V(2.8, H * 0.95, 2.9) });

  const y0 = 0.3; let slot = 0; const front = 2.55;
  const place = (id, Uh, node, ex, extra = {}) => {
    const y = y0 + slot * U + (Uh * U) / 2; slot += Uh;
    P.add(id, node, { pos: V(0, y, front), explode: V(0, 0, ex), anchor: V(0, 0.25, 0.2), ...extra });
  };
  // UPS 3U
  const ups = rackUnit(3, 4.2, 0x34d399);
  ups.add(box(1.4, 0.45, 0.012, mat('black'), -1.6, 0.35, 0.09, 0.01)); const lcd = box(1.2, 0.3, 0.012, mat('black', { emissive: 0x0e7490, emissiveIntensity: 0.9 }), -1.6, 0.35, 0.1, 0.006); lcd.userData.noHighlight = true; ups.add(lcd);
  ups.add(box(2.0, 0.5, 0.012, new THREE.MeshStandardMaterial({ map: grillTex(), color: 0xffffff, roughness: 0.7 }), 1.1, 0, 0.09, 0.004));
  ups.add(cyl(0.07, 0.07, 0.03, mat('green', { emissive: 0x34d399, emissiveIntensity: 0.6 }), -0.6, -0.3, 0.1, 16).rotateX(Math.PI / 2));
  place('ups', 3, ups, 0.9);
  // NAS 2U (12 bays)
  const nas = rackUnit(2, 4.0);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const bx = -1.65 + c * 0.66, by = -0.17 + r * 0.34; nas.add(box(0.58, 0.28, 0.02, mat('black', { color: 0x0a0d12 }), bx, by + 0.05, 0.1, 0.008)); nas.add(box(0.5, 0.03, 0.02, mat('steel'), bx, by - 0.05, 0.11, 0.004)); blinkLed(nas, bx + 0.22, by + 0.08, 0.115, c % 3 ? 0x34d399 : 0x22d3ee, c + r); }
  place('storage2u', 2, nas, 1.6);
  // 1U servers
  for (const [id, k] of [['server1u', 2.4], ['server1uB', 3.2]]) {
    const s = rackUnit(1, 4.0);
    for (let i = 0; i < 6; i++) { s.add(box(0.5, 0.26, 0.02, mat('black', { color: 0x0a0d12 }), -1.75 + i * 0.58, 0, 0.1, 0.006)); blinkLed(s, -1.55 + i * 0.58, -0.05, 0.115, 0x34d399, i * 1.3 + (k > 3 ? 2 : 0)); }
    s.add(box(1.3, 0.3, 0.012, new THREE.MeshStandardMaterial({ map: grillTex(), roughness: 0.7 }), 1.45, 0, 0.09, 0.004));
    s.add(cyl(0.06, 0.06, 0.03, mat('steel'), 2.2, 0, 0.1, 16).rotateX(Math.PI / 2));
    place(id, 1, s, k);
  }
  // 48-port switch (2 rows x 24 → drawn as 2x12 groups)
  const sw = rackUnit(1, 3.0, 0x38bdf8);
  const portsGeo = new RoundedBoxGeometry(0.12, 0.1, 0.03, 1, 0.01);
  const portsInst = new THREE.InstancedMesh(portsGeo, mat('black', { color: 0x050607 }), 48); const tmp = new THREE.Object3D();
  for (let i = 0; i < 48; i++) { const col = i % 24, row = Math.floor(i / 24); tmp.position.set(-1.65 + col * 0.145 + Math.floor(col / 4) * 0.04, -0.06 + row * 0.15 + 0.06, 0.1); tmp.updateMatrix(); portsInst.setMatrixAt(i, tmp.matrix); }
  sw.add(portsInst); for (let i = 0; i < 12; i++) blinkLed(sw, -1.65 + i * 0.29, 0.17, 0.11, i % 4 ? 0x34d399 : 0xfbbf24, i * 0.7);
  sw.add(box(0.6, 0.18, 0.012, mat('alu', { map: labelTex('48P SWITCH', { w: 256, h: 80, bg: '#1b2330', fg: '#7dd3fc', size: 26 }) }), 1.95, 0, 0.1, 0.004));
  place('rackswitch', 1, sw, 4.0);
  // patch panel
  const pp = rackUnit(1, 0.7, 0x38bdf8);
  for (let i = 0; i < 24; i++) { pp.add(box(0.12, 0.1, 0.03, mat('black', { color: 0x06070a }), -1.6 + i * 0.145, -0.02, 0.1, 0.004)); pp.add(box(0.12, 0.025, 0.012, mat(['blue', 'green', 'yellow', 'red'][i % 4]), -1.6 + i * 0.145, 0.1, 0.1, 0.002)); }
  place('patch', 1, pp, 4.8);
  // structured cabling
  const cables = new THREE.Group();
  const swY = y0 + (3 + 2 + 1 + 1) * U + U / 2, ppY = y0 + (3 + 2 + 1 + 1 + 1) * U + U / 2;
  const cols = [0x3b82f6, 0x22c55e, 0xfbbf24, 0xef4444, 0x22d3ee, 0xa78bfa];
  for (let i = 0; i < 6; i++) {
    const x = -1.6 + i * 0.145 + 0.0;
    const c = tube([[x, swY + 0.1, front + 0.12], [x + 0.1, swY + 0.3, front + 0.5], [x + 0.2 + i * 0.03, (swY + ppY) / 2, front + 0.55], [x + 0.1, ppY - 0.1, front + 0.4], [x, ppY - 0.02, front + 0.12]], 0.022, mat('black', { color: cols[i], roughness: 0.5 }), 40);
    cables.add(c);
  }
  P.add('rackcables', cables, { pickable: true, anchor: V(-1.2, swY + 0.3, front + 0.55) });

  const parts = P.map; const guides = makeGuides(group, parts);
  const mine = leds.splice(0);
  const update = (t) => { for (const { m, phase } of mine) m.emissiveIntensity = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3.1 + phase * 2.3)); };
  return { group, parts, guides, update, home: { dir: V(-0.55, 0.38, 1), dist: 15.5, target: V(0, H * 0.48, 1) }, float: false, ledList };
}

// ===================================================================================
// NETWORK EQUIPMENT: router, switch, firewall, access point + animated data packets on the cables
// ===================================================================================
function portRow(n, w, m, parent, x0, y, z, step) { for (let i = 0; i < n; i++) { parent.add(box(w, 0.11, 0.03, m, x0 + i * step, y, z, 0.004)); parent.add(box(w * 0.7, 0.012, 0.012, mat('gold'), x0 + i * step, y - 0.03, z + 0.016, 0)); } }
export function buildNetwork() {
  const group = new THREE.Group(); const P = new Parts(group);
  const table = box(10.5, 0.12, 4.2, mat('dark', { color: 0x141a24 }), 0, -0.07, 0, 0.03); table.userData.noPick = true; group.add(table);
  const mine = [];
  // router
  const r = new THREE.Group(); r.add(box(2.4, 0.3, 1.5, mat('black', { color: 0x161b24 }), 0, 0.15, 0, 0.06));
  r.add(box(2.2, 0.02, 1.3, mat('alu', { map: labelTex('ROUTER', { w: 512, h: 256, bg: '#1a212c', fg: '#7dd3fc', size: 54 }) }), 0, 0.31, 0, 0.004));
  portRow(4, 0.16, mat('black', { color: 0x040506 }), r, -0.55, 0.14, 0.76, 0.22); r.add(box(0.2, 0.12, 0.03, mat('yellow'), 0.62, 0.14, 0.76, 0.004));
  for (let i = 0; i < 5; i++) { const m = led(i === 4 ? 0xfbbf24 : 0x34d399, 1); const o = box(0.035, 0.035, 0.014, m, -0.55 + i * 0.22, 0.25, 0.76, 0.004); o.userData.noHighlight = true; r.add(o); mine.push({ m, phase: i }); }
  for (const [x, rz] of [[-0.9, 0.35], [-0.3, 0.12], [0.3, -0.12], [0.9, -0.35]]) { const a = cyl(0.035, 0.045, 1.3, mat('black'), x, 0.95, -0.55); a.rotation.z = rz; r.add(a); r.add(cyl(0.05, 0.05, 0.1, mat('steel'), x, 0.33, -0.55, 12)); }
  P.add('router', r, { pos: V(-3.5, 0, 0), anchor: V(0, 1.7, -0.4) });
  // switch
  const s = new THREE.Group(); s.add(box(3.2, 0.3, 1.3, mat('dark'), 0, 0.15, 0, 0.04));
  s.add(box(3.0, 0.02, 1.1, mat('alu', { map: labelTex('SWITCH 16', { w: 512, h: 256, bg: '#1a212c', fg: '#7dd3fc', size: 54 }) }), 0, 0.31, 0, 0.004));
  portRow(16, 0.14, mat('black', { color: 0x040506 }), s, -1.35, 0.14, 0.66, 0.18);
  for (let i = 0; i < 16; i++) { const m = led(i % 5 === 0 ? 0xfbbf24 : 0x34d399, 1); const o = box(0.03, 0.03, 0.012, m, -1.35 + i * 0.18, 0.24, 0.66, 0.004); o.userData.noHighlight = true; s.add(o); mine.push({ m, phase: i * 0.6 }); }
  P.add('lanswitch', s, { pos: V(-0.6, 0, 0), anchor: V(0, 0.55, 0.3) });
  // firewall
  const f = new THREE.Group(); f.add(box(2.2, 0.28, 1.2, mat('black', { color: 0x1a1216 }), 0, 0.14, 0, 0.04));
  f.add(box(2.0, 0.02, 1.0, mat('alu', { map: labelTex('FIREWALL', { w: 512, h: 256, bg: '#241418', fg: '#fca5a5', size: 54 }) }), 0, 0.29, 0, 0.004));
  portRow(6, 0.15, mat('black', { color: 0x040506 }), f, -0.5, 0.13, 0.61, 0.2);
  const fl = led(0xef4444, 1.2); const fo = box(0.05, 0.05, 0.014, fl, 0.8, 0.22, 0.61, 0.004); fo.userData.noHighlight = true; f.add(fo); mine.push({ m: fl, phase: 0 });
  P.add('firewall', f, { pos: V(2.3, 0, 0), anchor: V(0, 0.5, 0.3) });
  // access point
  const ap = new THREE.Group(); ap.add(cyl(0.8, 0.85, 0.2, mat('white'), 0, 0.1, 0, 48)); ap.add(cyl(0.7, 0.8, 0.06, mat('white'), 0, 0.22, 0, 48));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 8, 48), led(0x22d3ee, 1.6)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.26; ring.userData.noHighlight = true; ap.add(ring); mine.push({ m: ring.material, phase: 0 });
  ap.add(box(0.28, 0.07, 0.05, mat('black'), 0, 0.12, 0.85, 0.01));
  P.add('ap', ap, { pos: V(4.3, 0, 0.2), anchor: V(0, 0.6, 0) });
  // cables with travelling packets
  const cab = new THREE.Group(); cab.userData.noPick = true;
  const links = [[[-3.0, 0.14, 0.8], [-1.0, 0.0, 1.6]], [[-1.0, 0.14, 0.66], [2.3, 0.0, 1.6]], [[0.4, 0.14, 0.66], [4.3, 0.0, 1.6]]];
  const packets = [];
  const route = [[[-3.28, 0.14, 0.78], [-3.3, 0.02, 1.7], [-1.9, 0.02, 1.9], [-1.9, 0.14, 0.7]], [[-1.12, 0.14, 0.7], [-1.2, 0.02, 1.9], [1.9, 0.02, 1.9], [1.8, 0.14, 0.66]], [[-0.4, 0.14, 0.7], [-0.3, 0.02, 2.0], [4.0, 0.02, 2.0], [4.3, 0.12, 1.0]]];
  route.forEach((pts, i) => {
    const t = tube(pts, 0.026, mat('black', { color: [0x3b82f6, 0x22c55e, 0xfbbf24][i], roughness: 0.5 }), 60); cab.add(t);
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshBasicMaterial({ color: 0x67e8f9 })); pk.userData.noPick = true; cab.add(pk); packets.push({ pk, curve: t.userData.curve, off: i * 0.33 });
  });
  void links;
  P.add('cables', cab, { pickable: false });
  const update = (t) => { for (const { m, phase } of mine) m.emissiveIntensity = 0.4 + 1.1 * (0.5 + 0.5 * Math.sin(t * 3 + phase * 2)); for (const p of packets) { const u = ((t * 0.22 + p.off) % 1); p.pk.position.copy(p.curve.getPointAt(u)); p.pk.scale.setScalar(0.8 + 0.4 * Math.sin(u * Math.PI)); } };
  return { group, parts: P.map, update, home: { dir: V(-0.15, 0.55, 1), dist: 15, target: V(0.4, 0.3, 0.6) }, float: false };
}

// ===================================================================================
// COMPLETE DESKTOP PC (mid-tower, open left side). Board is rotated into the tray.
// ===================================================================================
export function buildPC({ mode = 'full', init = {} } = {}) {
  const group = new THREE.Group(); const P = new Parts(group); const fans = [];
  const full = mode === 'full';
  // --- case
  const cs = new THREE.Group(); const T = 0.06;
  cs.add(box(2.1, 0.1, 4.5, mat('black'), 0, 0.05, 0, 0.02));         // floor
  cs.add(box(2.1, 0.1, 4.5, mat('black'), 0, 4.55, 0, 0.02));         // roof
  cs.add(box(0.08, 4.6, 4.5, mat('dark'), 1.02, 2.3, 0, 0.01));        // motherboard tray (right)
  cs.add(box(2.1, 4.6, T, mat('black'), 0, 2.3, -2.2, 0.01));         // rear
  const front = box(2.1, 4.6, 0.12, mat('black'), 0, 2.3, 2.22, 0.02); cs.add(front);
  const mesh = box(1.6, 3.4, 0.014, new THREE.MeshStandardMaterial({ map: grillTex(), roughness: 0.6 }), 0, 2.4, 2.29, 0); cs.add(mesh);
  const strip = box(0.03, 3.6, 0.02, led(0x22d3ee, 1.5), -0.96, 2.4, 2.29, 0.004); strip.userData.noHighlight = true; cs.add(strip);
  cs.add(box(2.0, 0.05, 1.9, mat('dark'), 0, 1.45, -1.25, 0.01)); // PSU shroud
  for (const y of [1.6, 3.1]) { const f = fan(0.62, mat('black'), mat('dark')); f.position.set(0, y, 1.98); cs.add(f); fans.push(f.userData.rotor); }
  P.add('case', cs, { anchor: V(0, 4.7, 0) });

  // --- PSU
  const psu = new THREE.Group(); psu.add(box(1.5, 0.86, 1.4, mat('black', { color: 0x151a22 }), 0, 0, 0, 0.03));
  psu.add(box(1.4, 0.02, 1.3, new THREE.MeshStandardMaterial({ map: grillTex(), roughness: 0.7 }), 0, -0.44, 0, 0));
  psu.add(box(1.2, 0.02, 0.5, mat('alu', { map: labelTex('850 W · 80+ GOLD', { w: 512, h: 128, bg: '#1a212c', fg: '#fbbf24', size: 40 }) }), 0, 0.44, 0.35, 0));
  for (let i = 0; i < 6; i++) psu.add(box(0.18, 0.12, 0.02, mat('black', { color: 0x050607 }), -0.5 + i * 0.22, 0.2, 0.71, 0.004));
  P.add('psu', psu, { pos: V(0, 0.55, -1.35), explode: V(-3.0, 0.2, 0), anchor: V(0, 0.6, 0) });

  // --- motherboard assembly (rotated into the tray). Local x→world +z, local y→world −x, local z→world −y.
  const board = new THREE.Group();
  board.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(-1, 0, 0), V(0, -1, 0)));
  const bpos = V(0.98, 3.05, -0.3);
  board.position.copy(bpos);
  const inv = board.quaternion.clone().invert();
  const toLocal = (w) => w.clone().applyQuaternion(inv);
  const ids = full ? null : new Set(['gpu']);
  const bp = buildBoardParts(board, { explodeIds: null, installed: { __gpu: true } });
  fans.push(...bp.fans);
  // per-part world-space explode directions (open side is −x) converted into board-local vectors
  const WX = { cpu: V(-3.4, 1.0, 0.0), cooler: V(-4.0, 1.4, -0.3), ram: V(-3.0, 1.9, 0.0), m2: V(-3.2, 0.2, 0.9), vrm: V(-2.3, 2.1, 0), chipset: V(-2.3, -0.4, 0.5), battery: V(-2.2, 0.1, 0), atx: V(-2.0, -0.7, 0.2), cpupower: V(-2.0, 1.0, -0.2), sata: V(-2.0, -1.0, 0.3), io: V(-1.5, 0, -2.0), gpu: V(-3.6, -1.1, 0.4) };
  for (const [id, p] of Object.entries(bp.parts)) {
    if (WX[id]) p.explode = full ? toLocal(WX[id]) : (id === 'gpu' ? toLocal(WX.gpu) : undefined);
    else p.explode = undefined;
  }
  void ids;
  board.userData.partId = 'board';
  group.add(board);
  const boardPart = { id: 'board', group: board, home: bpos.clone(), explode: V(-4.2, 0.2, -0.3), anchor: V(0, 1.2, 0), pickable: false };
  P.map.board = boardPart;
  Object.assign(P.map, bp.parts);
  // ---- PSU cables (tubes that "draw on")
  group.updateMatrixWorld(true);
  const W = (local) => board.localToWorld(V(...local));
  const cabM = () => mat('rubber', { roughness: 0.6 });
  const cableDefs = {
    cable24: { pts: [V(0.3, 0.75, -0.7), V(0.3, 1.0, -0.2), W([1.42, 0.2, 0.2]).add(V(-0.1, 0.2, 0)), W([1.42, 0.12, 0.2])], r: 0.07 },
    cableEps: { pts: [V(-0.3, 0.75, -0.7), V(-0.5, 0.9, -1.75), V(-0.55, 3.9, -1.85), W([-1.1, 0.35, -1.17]).add(V(0.1, 0, -0.3)), W([-1.1, 0.12, -1.17])], r: 0.05 },
    cablePcie: { pts: [V(0.0, 0.75, -0.7), V(-0.3, 1.4, 0.0), W([1.0, 1.4, 0.9]).add(V(-0.4, 0.2, 0)), W([1.0, 1.2, 0.9])], r: 0.05 },
  };
  for (const [id, c] of Object.entries(cableDefs)) {
    const t = tube(c.pts, c.r, cabM(), 80);
    const total = t.geometry.index.count;
    const g = new THREE.Group(); g.add(t);
    const part = P.add(id, g, { anchor: c.pts[1].clone() });
    part.f = init[id] ?? 0; part.fTarget = part.f;
    part.onFactor = (f) => { const k = 1 - f; t.geometry.setDrawRange(0, Math.floor((total * k) / 3) * 3); g.visible = k > 0.01; part.visible = k > 0.01; };
    part.onFactor(part.f);
  }
  // --- side panel (tempered glass) — exists in assembly; closes the case at the end
  const side = new THREE.Group(); side.add(box(0.05, 4.5, 4.3, glass(0.16), 0, 0, 0, 0)); side.add(box(0.06, 4.56, 0.05, mat('black'), 0, 0, 2.15, 0)); side.add(box(0.06, 4.56, 0.05, mat('black'), 0, 0, -2.15, 0));
  P.add('sidepanel', side, { pos: V(-1.06, 2.3, 0), explode: V(-4.5, 0, 0), anchor: V(0, 2.3, 0) });
  for (const [id, f] of Object.entries(init)) { const p = P.map[id]; if (p && !p.onFactor) { p.f = f; p.fTarget = f; } }

  const guides = makeGuides(group, P.map);
  group.userData.noFloat = true;
  return { group, parts: P.map, guides, update: (t, dt) => fans.forEach((f) => (f.rotation.z += dt * 5)), home: { dir: V(-1, 0.45, 0.9), fitAll: mode === 'assembly' } };
}

export const BUILDERS = { motherboard: () => buildMotherboard(), rack: buildRack, network: buildNetwork, pc: () => buildPC({ mode: 'full' }) };
