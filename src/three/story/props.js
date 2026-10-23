// Procedural props for the story world. Units: metres. No external model files → loads instantly.
// Reconstructed from the 30 real classroom reference photos (Jordanian BTEC IT Lab).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const hasDOM = typeof document !== 'undefined';
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- textures ----------
const texCache = new Map();
export function canvasTex(key, w, h, draw, repeat) {
  if (!hasDOM) return null;
  const ck = key + (repeat ? repeat.join('x') : '');
  if (texCache.has(ck)) return texCache.get(ck);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.userData.shared = true;
  texCache.set(ck, t);
  return t;
}
export function liveTex(w, h) {
  if (!hasDOM) return { tex: null, ctx: null, canvas: null };
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, ctx: c.getContext('2d'), canvas: c };
}

const tileTex = (rx, ry) => canvasTex('tile-v2', 512, 512, (g, w, h) => {
  g.fillStyle = '#efe7d8'; g.fillRect(0, 0, w, h);
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2800; i++) {
    g.fillStyle = `rgba(${175 + rnd() * 55},${158 + rnd() * 45},${132 + rnd() * 38},${0.04 + rnd() * 0.055})`;
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 16, 1 + rnd() * 3);
  }
  g.strokeStyle = '#cfc2aa'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
}, [rx, ry]);

const corridorTileTex = (rx, ry) => canvasTex('corridor-terrazzo', 256, 256, (g, w, h) => {
  g.fillStyle = '#ddd5c5'; g.fillRect(0, 0, w, h);
  let s = 31; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1600; i++) {
    const v = 115 + Math.floor(rnd() * 95);
    g.fillStyle = `rgba(${v},${v - 5},${v - 12},0.22)`;
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  g.strokeStyle = '#b9afa0'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
}, [rx, ry]);

const woodTex = () => canvasTex('wood-greyoak', 512, 128, (g, w, h) => {
  g.fillStyle = '#75706a'; g.fillRect(0, 0, w, h);
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) {
    const v = rnd() > 0.5 ? 68 : 142;
    g.strokeStyle = `rgba(${v},${v - 4},${v - 8},${0.05 + rnd() * 0.07})`;
    g.lineWidth = 1 + rnd() * 2;
    g.beginPath();
    const y = rnd() * h;
    g.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.5 + (rnd() - 0.5) * 1.8);
    g.stroke();
  }
}, [1, 1]);

const warmWoodTex = () => canvasTex('wood-warm', 256, 128, (g, w, h) => {
  g.fillStyle = '#7c4d2b'; g.fillRect(0, 0, w, h);
  let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(50,28,12,${0.06 + rnd() * 0.08})`;
    g.lineWidth = 1 + rnd() * 2;
    g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 4); g.stroke();
  }
}, [1, 1]);

// Zebra roller blind texture (horizontal alternating beige/brown opaque & sheer mesh stripes from classroom photos)
const blindTex = () => canvasTex('zebra-blind', 64, 256, (g, w, h) => {
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = '#dfd2bc'; g.fillRect(0, y, w, 18);
    g.fillStyle = '#b7a386'; g.fillRect(0, y + 16, w, 2);
    g.fillStyle = 'rgba(245,238,225,0.52)'; g.fillRect(0, y + 18, w, 14);
    g.fillStyle = 'rgba(130,110,85,0.18)';
    for (let yy = y + 20; yy < y + 32; yy += 3) g.fillRect(0, yy, w, 1);
  }
}, [1, 1]);

const honeyTex = () => canvasTex('honey', 256, 64, (g, w, h) => {
  g.fillStyle = '#121316'; g.fillRect(0, 0, w, h); g.fillStyle = '#050506';
  for (let y = 6; y < h; y += 9) for (let x = (Math.round(y / 9) % 2 ? 4 : 9); x < w; x += 10) {
    g.beginPath();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6); }
    g.fill();
  }
}, [1, 1]);

// Half-white, half-blue striped GCE circular mousepad (matching close-up photo 3.01.19 PM.jpeg)
const mousepadTex = () => canvasTex('gce-mousepad-v2', 256, 256, (g, w, h) => {
  g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0b5cab'; g.fillRect(0, 0, w, h * 0.54);
  g.fillStyle = 'rgba(255,255,255,0.28)';
  for (let y = 4; y < h * 0.54; y += 6) g.fillRect(0, y, w, 1.5);
  g.fillStyle = '#ffffff'; g.font = '800 68px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('GCE', w / 2, h * 0.3);
  g.fillStyle = '#0b5cab'; g.font = '700 22px Inter, Arial, sans-serif';
  g.fillText('35 years', w / 2, h * 0.7);
  g.fillStyle = '#1e293b'; g.font = '600 14px Inter, Arial, sans-serif';
  g.fillText('www.gce.com.jo', w / 2, h * 0.84);
  g.strokeStyle = '#cbd5e1'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, Math.PI * 2); g.stroke();
});

const posterTex = (text) => canvasTex(`poster${text}`, 256, 384, (g, w, h) => {
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#2f3542'; g.lineWidth = 6; g.strokeRect(70, 40, 116, 74); g.fillStyle = '#2f3542'; g.fillRect(118, 114, 20, 18); g.fillRect(96, 132, 64, 8);
  g.fillStyle = '#1d232d'; g.font = '700 34px Inter, Arial, sans-serif'; g.textAlign = 'center';
  text.split('\n').flatMap((l) => l.split(' ')).forEach((l, i) => g.fillText(l, w / 2, 196 + i * 40));
  const ys = h - 46; [['#1f7a3a', 0], ['#ffffff', 1], ['#c8202f', 2]].forEach(([c, i]) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, ys + i * 12); g.lineTo(w, ys - 24 + i * 12); g.lineTo(w, ys - 12 + i * 12); g.lineTo(0, ys + 12 + i * 12); g.fill(); });
});

const timetableTex = () => canvasTex('timetable-sheet', 256, 192, (g, w, h) => {
  g.fillStyle = '#fdfcf7'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#475569'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#0f172a'; g.font = '700 22px Tahoma, Arial'; g.textAlign = 'center';
  g.fillText('أول ثانوي تكنولوجيا', w / 2, 36);
  g.strokeStyle = '#94a3b8'; g.lineWidth = 1.5;
  for (let r = 1; r <= 5; r++) { const y = 48 + r * 24; g.beginPath(); g.moveTo(16, y); g.lineTo(w - 16, y); g.stroke(); }
  for (let c = 1; c <= 5; c++) { const x = 16 + c * 38; g.beginPath(); g.moveTo(x, 48); g.lineTo(x, 168); g.stroke(); }
});

const officeScreenTex = () => canvasTex('office-pc-screen', 512, 288, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0f2942'); gr.addColorStop(1, '#1d4ed8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.fillRect(58, 22, w - 116, h - 54);
  g.fillStyle = '#1e3a8a'; g.fillRect(58, 22, w - 116, 24);
  g.fillStyle = '#ffffff'; g.font = '700 13px Tahoma, Arial'; g.textAlign = 'center';
  g.fillText('كتاب رسمي — تجهيز مختبر BTEC', w / 2, 39);
  g.fillStyle = '#334155';
  for (let i = 0; i < 6; i++) {
    const lw = i === 5 ? (w - 180) * 0.55 : (w - 160);
    g.fillRect(80, 62 + i * 24, lw, 6);
  }
  g.fillStyle = '#15803d'; g.strokeStyle = '#15803d'; g.lineWidth = 3;
  g.strokeRect(92, 198, 96, 26);
  g.fillStyle = '#0f172a'; g.fillRect(0, h - 22, w, 22);
});

// ---------- materials ----------
const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, ...o });
export const MAT = {
  wall: M({ color: 0xf5f4ef, roughness: 0.9, side: THREE.DoubleSide }),
  band: M({ color: 0xe5d4b7, roughness: 0.84, side: THREE.DoubleSide }),
  trim: M({ color: 0xa59f94, roughness: 0.48 }),
  ceiling: M({ color: 0xf7f7f5, roughness: 0.95 }),
  black: M({ color: 0x14161a, roughness: 0.42 }),
  plastic: M({ color: 0x1b1d22, roughness: 0.48 }),
  chair: M({ color: 0x121317, roughness: 0.52 }),
  chrome: M({ color: 0xc4cad2, metalness: 0.9, roughness: 0.22 }),
  brass: M({ color: 0xd4af37, metalness: 0.85, roughness: 0.28 }),
  steel: M({ color: 0x7f8791, metalness: 0.8, roughness: 0.35 }),
  abbGrey: M({ color: 0x9aa1a9, roughness: 0.55, metalness: 0.2 }),
  wood: M({ color: 0xffffff, roughness: 0.52 }),
  warmWood: M({ color: 0x7c4d2b, roughness: 0.58 }),
  door: M({ color: 0x14161b, roughness: 0.32, metalness: 0.28 }),
  officeDoor: M({ color: 0x7c4722, roughness: 0.48 }),
  white: M({ color: 0xf2f3f5, roughness: 0.38 }),
  red: M({ color: 0xc81e2b, roughness: 0.4 }),
  yellow: M({ color: 0xfacc15, roughness: 0.45 }),
  blueBox: M({ color: 0x1e56a0, roughness: 0.65 }),
  cyanBox: M({ color: 0x38bdf8, roughness: 0.6 }),
  glassDark: new THREE.MeshPhysicalMaterial({ color: 0x1b2430, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false }),
  window: new THREE.MeshPhysicalMaterial({ color: 0xd4ead0, roughness: 0.1, emissive: 0xa3c995, emissiveIntensity: 0.5 }),
  screenOff: M({ color: 0x07090c, roughness: 0.15, metalness: 0.2 }),
  ghost: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, depthWrite: false }),
  ghostEdge: new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }),
  led: (c) => new THREE.MeshStandardMaterial({ color: 0x050505, emissive: c, emissiveIntensity: 1.8 }),
};
if (hasDOM) {
  MAT.wood.map = woodTex();
  MAT.warmWood.map = warmWoodTex();
  MAT.blind = M({ color: 0xffffff, map: blindTex(), roughness: 0.78, side: THREE.DoubleSide });
  MAT.mousepad = M({ color: 0xffffff, map: mousepadTex(), roughness: 0.75 });
  MAT.officeScreen = new THREE.MeshBasicMaterial({ map: officeScreenTex() });
}

export function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; return o; }
export function plane(w, h, m) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.receiveShadow = true; return o; }

// ---------- room ----------
/** Reconstructed BTEC IT Classroom + Exterior School Corridor from the 30 real classroom photos. Returns {group, door} */
export function buildRoom(R, F) {
  const g = new THREE.Group(); g.name = 'room';
  const hw = R.width / 2, hd = R.depth / 2, H = R.height, band = R.wainscot;

  // Surrounding exterior ground apron so top-down views never look like floating geometry in black space
  const outerApron = plane(R.width + 14, R.depth + 20, M({ color: 0xd8d1c5, roughness: 0.85 }));
  outerApron.rotation.x = -Math.PI / 2;
  outerApron.position.set(1.8, -0.006, -4.0);
  g.add(outerApron);

  // 60x60cm glossy light beige-grey porcelain tile floor
  const floor = plane(R.width, R.depth, new THREE.MeshStandardMaterial({
    map: tileTex(R.width / 0.6, R.depth / 0.6),
    roughness: 0.14,
    metalness: 0.06,
    envMapIntensity: 1.25,
  }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);

  const ceil = plane(R.width, R.depth, MAT.ceiling);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; g.add(ceil);

  // Rectangular LED ceiling light fixtures (3 columns x 3 rows)
  const lightHousingMat = M({ color: 0xe5e7eb, roughness: 0.35, metalness: 0.3 });
  const lightTubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffcf2, emissiveIntensity: 1.35 });
  for (const x of [-2.45, 0, 2.45]) {
    for (const z of [-3.3, 0, 3.3]) {
      const fixture = new THREE.Group();
      fixture.position.set(x, H - 0.018, z);
      fixture.add(box(0.26, 0.028, 1.24, lightHousingMat, 0, 0, 0, 0.005));
      for (const dx of [-0.065, 0.065]) {
        const tube = cyl(0.014, 0.014, 1.18, lightTubeMat, dx, -0.012, 0, 12);
        tube.rotation.x = Math.PI / 2;
        tube.castShadow = false;
        fixture.add(tube);
      }
      g.add(fixture);
    }
  }

  const wallMatDS = M({ color: 0xf5f4ef, roughness: 0.9, side: THREE.DoubleSide });
  const bandMatDS = M({ color: 0xe5d4b7, roughness: 0.84, side: THREE.DoubleSide });

  const wallSeg = (wall, a, b, y0, y1, mat, inset = 0) => {
    const len = b - a; if (len <= 0.001 || y1 - y0 <= 0.001) return;
    const m = plane(len, y1 - y0, mat); const c = (a + b) / 2, y = (y0 + y1) / 2;
    if (wall === 'front') { m.position.set(c, y, -hd + inset); }
    if (wall === 'back') { m.position.set(-c, y, hd - inset); m.rotation.y = Math.PI; }
    if (wall === 'left') { m.position.set(-hw + inset, y, -c); m.rotation.y = Math.PI / 2; }
    if (wall === 'right') { m.position.set(hw - inset, y, c); m.rotation.y = -Math.PI / 2; }
    g.add(m);
  };
  const fullWall = (wall, span, openings = []) => {
    const ops = [...openings].sort((p, q) => p.a - q.a);
    let cur = -span / 2;
    for (const o of ops) { wallSegBand(wall, cur, o.a); wallSegBand(wall, o.a, o.b, o.y0, o.y1); cur = o.b; }
    wallSegBand(wall, cur, span / 2);
  };
  const wallSegBand = (wall, a, b, gapY0, gapY1) => {
    const parts = gapY0 == null ? [[0, H]] : [[0, gapY0], [gapY1, H]];
    for (const [y0, y1] of parts) {
      const lo = Math.max(y0, 0), mid = Math.min(Math.max(band, y0), y1);
      if (mid > lo) wallSeg(wall, a, b, lo, mid, bandMatDS);
      if (y1 > mid) wallSeg(wall, a, b, mid, y1, wallMatDS);
    }
  };

  const leftWindows = F.windows && F.windows.length === 4
    ? F.windows
    : [{ z: -3.45, w: 1.72 }, { z: -1.15, w: 1.72 }, { z: 1.15, w: 1.72 }, { z: 3.45, w: 1.72 }];
  const rightTransoms = [{ z: -2.25, w: 1.38 }, { z: -0.45, w: 1.38 }, { z: 1.35, w: 1.38 }, { z: 3.15, w: 1.38 }];

  fullWall('front', R.width);
  fullWall('back', R.width);
  fullWall('left', R.depth, leftWindows.map((w) => ({ a: -w.z - w.w / 2, b: -w.z + w.w / 2, y0: 0.96, y1: 2.48 })));
  fullWall('right', R.depth, [
    { a: F.door.z - F.door.w / 2, b: F.door.z + F.door.w / 2, y0: 0, y1: F.door.h },
    ...rightTransoms.map((tw) => ({ a: tw.z - tw.w / 2, b: tw.z + tw.w / 2, y0: 1.98, y1: 2.66 })),
  ]);

  // Dado rail & floor skirting trim along all four walls
  for (const [x, z, ry, len] of [
    [0, -hd + 0.006, 0, R.width],
    [0, hd - 0.006, Math.PI, R.width],
    [-hw + 0.006, 0, Math.PI / 2, R.depth],
    [hw - 0.006, 0, -Math.PI / 2, R.depth],
  ]) {
    const t = box(len, 0.026, 0.012, MAT.trim, x, band, z); t.rotation.y = ry; g.add(t);
    const sk = box(len, 0.08, 0.015, MAT.trim, x, 0.04, z); sk.rotation.y = ry; g.add(sk);
  }

  // Left-wall 4 large windows with frames, outdoor greenery, and striped zebra roller blinds
  for (const w of leftWindows) {
    const win = new THREE.Group(); win.position.set(-hw, 1.72, w.z);
    const glassP = plane(w.w, 1.52, MAT.window); glassP.rotation.y = Math.PI / 2; glassP.position.x = -0.06; win.add(glassP);
    for (const dz of [-w.w / 2, 0, w.w / 2]) win.add(box(0.06, 1.52, 0.05, MAT.white, -0.03, 0, dz));
    for (const dy of [-0.76, 0.76]) win.add(box(0.12, 0.05, w.w + 0.05, MAT.white, -0.01, dy, 0));
    const sill = box(0.18, 0.04, w.w + 0.12, MAT.white, 0.05, -0.78, 0); win.add(sill);
    const bl = plane(w.w + 0.08, 1.18, MAT.blind); bl.rotation.y = Math.PI / 2; bl.position.set(0.055, 0.14, 0); win.add(bl);
    win.add(box(0.015, 0.02, w.w + 0.08, MAT.white, 0.06, -0.45, 0));
    win.add(box(0.1, 0.09, w.w + 0.14, MAT.white, 0.06, 0.76, 0, 0.01));
    g.add(win);
  }

  // Right-wall 4 high transom windows with matching zebra roller blinds
  for (const tw of rightTransoms) {
    const win = new THREE.Group(); win.position.set(hw, 2.32, tw.z);
    const glassP = plane(tw.w, 0.68, MAT.window); glassP.rotation.y = -Math.PI / 2; glassP.position.x = 0.05; win.add(glassP);
    for (const dz of [-tw.w / 2, 0, tw.w / 2]) win.add(box(0.05, 0.68, 0.045, MAT.white, 0.02, 0, dz));
    for (const dy of [-0.34, 0.34]) win.add(box(0.1, 0.04, tw.w + 0.04, MAT.white, 0, dy, 0));
    const bl = plane(tw.w + 0.06, 0.56, MAT.blind); bl.rotation.y = -Math.PI / 2; bl.position.set(-0.045, 0.04, 0); win.add(bl);
    win.add(box(0.08, 0.07, tw.w + 0.1, MAT.white, -0.05, 0.35, 0, 0.008));
    g.add(win);
  }

  // Front-wall BTEC posters + taped class timetable sheet ("أول ثانوي تكنولوجيا")
  for (const p of F.posters) {
    const m = plane(0.42, 0.63, new THREE.MeshStandardMaterial({ map: posterTex(p.text), roughness: 0.7 }));
    m.position.set(p.x, 2.15, -hd + 0.012);
    g.add(m);
  }
  if (hasDOM) {
    const tt = plane(0.34, 0.25, new THREE.MeshStandardMaterial({ map: timetableTex(), roughness: 0.75 }));
    tt.position.set(1.55, 1.48, -hd + 0.012);
    g.add(tt);
  }

  // Front-wall split AC unit above left of the interactive display
  const frontAC = buildAC();
  frontAC.position.set(-1.55, 2.68, -hd + 0.12);
  g.add(frontAC);
  g.add(box(2.4, 0.04, 0.035, MAT.white, -2.85, 2.58, -hd + 0.02));
  g.add(box(0.035, 1.9, 0.03, MAT.white, -3.55, 1.65, -hd + 0.02));
  g.add(box(0.035, 1.9, 0.03, MAT.white, -2.28, 1.65, -hd + 0.02));

  // Patriotic Jordanian flag triangular bunting
  const bunt = new THREE.Group();
  const cols = [0xc8202f, 0x1f7a3a, 0xffffff, 0x141619];
  const triG = new THREE.BufferGeometry().setFromPoints([V(-0.085, 0, 0), V(0.085, 0, 0), V(0, -0.165, 0)]);
  triG.computeVertexNormals();
  const flagMats = cols.map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.78 }));
  const crimsonFlagMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, side: THREE.DoubleSide, roughness: 0.65 });

  const addFlagString = (pA, pB, count, sagAmp = 0.2, customMat = null) => {
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const pos = new THREE.Vector3().lerpVectors(pA, pB, u);
      pos.y -= Math.sin(u * Math.PI) * sagAmp;
      const f = new THREE.Mesh(triG, customMat || flagMats[i % flagMats.length]);
      f.position.copy(pos);
      f.rotation.y = Math.atan2(pB.x - pA.x, pB.z - pA.z) + Math.PI / 2;
      bunt.add(f);
    }
  };
  addFlagString(V(-hw + 0.25, F.bunting.y, hd - 0.03), V(hw - 0.25, F.bunting.y, hd - 0.03), 32, 0.22);
  addFlagString(V(-1.1, 2.52, -hd + 0.03), V(1.1, 2.52, -hd + 0.03), 9, -0.1, crimsonFlagMat);
  addFlagString(V(-hw + 0.4, H - 0.06, -hd + 0.6), V(hw - 0.4, H - 0.06, hd - 0.6), 44, 0.24);
  addFlagString(V(hw - 0.4, H - 0.06, -hd + 0.6), V(-hw + 0.4, H - 0.06, hd - 0.6), 44, 0.24);
  g.add(bunt);

  // Glossy black metal door (pivot at hinge) + frame + ABB electrical breaker panel & curved PVC conduits
  const door = buildDoor(F.door);
  door.pivot.position.set(hw, 0, F.door.z - F.door.w / 2);
  g.add(door.pivot);

  const fr = new THREE.Group(); fr.position.set(hw - 0.01, 0, F.door.z);
  fr.add(
    box(0.08, F.door.h + 0.06, 0.06, MAT.black, 0, F.door.h / 2, -F.door.w / 2 - 0.03),
    box(0.08, F.door.h + 0.06, 0.06, MAT.black, 0, F.door.h / 2, F.door.w / 2 + 0.03),
    box(0.08, 0.06, F.door.w + 0.12, MAT.black, 0, F.door.h + 0.03, 0)
  );
  const dbZ = F.door.z + F.door.w / 2 + 0.36;
  fr.add(box(0.09, 0.42, 0.46, MAT.abbGrey, -0.03, 1.92, dbZ - F.door.z, 0.008));
  fr.add(box(0.035, 0.14, 0.38, M({ color: 0xb4bcc4, roughness: 0.45 }), -0.078, 1.88, dbZ - F.door.z));
  fr.add(box(0.006, 0.028, 0.06, MAT.red, -0.076, 2.08, dbZ - F.door.z - 0.16));
  fr.add(cyl(0.018, 0.018, 0.42, M({ color: 0xcbd5e1 }), -0.03, 2.28, dbZ - F.door.z - 0.06, 12));
  fr.add(cyl(0.018, 0.018, 0.48, M({ color: 0xcbd5e1 }), -0.03, 2.31, dbZ - F.door.z + 0.04, 12));
  fr.add(box(0.035, 0.038, F.door.w + 0.92, M({ color: 0xcbd5e1 }), -0.025, F.door.h + 0.22, -0.05));
  fr.add(box(0.035, 0.038, F.door.w + 0.98, M({ color: 0xcbd5e1 }), -0.025, F.door.h + 0.3, -0.02));
  fr.add(box(0.03, 0.95, 0.065, MAT.white, -0.02, 1.24, dbZ - F.door.z));
  g.add(fr);

  // ---------- Full 3D School Corridor extending UPWARD (-z) because our lab is the LAST lab at the end of the corridor ----------
  const corrW = 3.0;
  const corrZEnd = F.door.z + 1.25; // Dead-end wall right after our classroom door (-2.4m)
  const corrZStart = -hd - 7.5;     // Extends upward (-z) along the school wing (-13.0m)
  const corrLen = corrZEnd - corrZStart;
  const corrMidZ = (corrZStart + corrZEnd) / 2;

  const corridor = new THREE.Group();
  corridor.name = 'corridor';
  const corFloor = plane(corrW, corrLen, new THREE.MeshStandardMaterial({
    map: corridorTileTex(corrW / 0.4, corrLen / 0.4),
    roughness: 0.25,
    metalness: 0.05,
  }));
  corFloor.rotation.x = -Math.PI / 2;
  corFloor.position.set(hw + corrW / 2, 0.002, corrMidZ);
  corridor.add(corFloor);

  // Corridor ceiling (FrontSide facing downward so it is visible from inside looking up, and open from high overhead camera)
  const corCeil = plane(corrW, corrLen, MAT.ceiling);
  corCeil.rotation.x = Math.PI / 2;
  corCeil.position.set(hw + corrW / 2, H, corrMidZ);
  corridor.add(corCeil);
  for (const cz of [corrZStart + 1.8, corrMidZ, corrZEnd - 1.4]) {
    corridor.add(box(0.24, 0.025, 1.1, lightTubeMat, hw + corrW / 2, H - 0.015, cz));
  }

  // Opposite outer corridor wall (at x = hw + corrW, running from corrZStart to corrZEnd)
  corridor.add(box(0.08, band, corrLen, bandMatDS, hw + corrW, band / 2, corrMidZ));
  corridor.add(box(0.08, H - band, corrLen, wallMatDS, hw + corrW, band + (H - band) / 2, corrMidZ));
  corridor.add(box(0.02, 0.026, corrLen, MAT.trim, hw + corrW - 0.045, band, corrMidZ));
  corridor.add(box(0.02, 0.08, corrLen, MAT.trim, hw + corrW - 0.045, 0.04, corrMidZ));

  // Inner corridor wall continuation above the classroom's front wall (from z = corrZStart to z = -hd at x = hw)
  const extInnerLen = -hd - corrZStart;
  const extInnerMidZ = (corrZStart + (-hd)) / 2;
  corridor.add(box(0.08, band, extInnerLen, bandMatDS, hw, band / 2, extInnerMidZ));
  corridor.add(box(0.08, H - band, extInnerLen, wallMatDS, hw, band + (H - band) / 2, extInnerMidZ));
  corridor.add(box(0.02, 0.026, extInnerLen, MAT.trim, hw + 0.045, band, extInnerMidZ));
  corridor.add(box(0.02, 0.08, extInnerLen, MAT.trim, hw + 0.045, 0.04, extInnerMidZ));

  // Bright corridor windows along the outer corridor wall (going upward in -z)
  for (const wz of [F.door.z, -6.2, -9.0, -11.6]) {
    const cWin = new THREE.Group();
    cWin.position.set(hw + corrW - 0.045, 1.72, wz);
    const cGlass = plane(1.45, 1.26, new THREE.MeshBasicMaterial({ color: 0xeaf4f8, side: THREE.DoubleSide }));
    cGlass.rotation.y = -Math.PI / 2;
    cWin.add(cGlass);
    cWin.add(
      box(0.04, 1.3, 0.04, MAT.white, 0, 0, -0.72),
      box(0.04, 1.3, 0.04, MAT.white, 0, 0, 0),
      box(0.04, 1.3, 0.04, MAT.white, 0, 0, 0.72),
      box(0.06, 0.04, 1.5, MAT.white, 0, 0.64, 0),
      box(0.06, 0.04, 1.5, MAT.white, 0, -0.64, 0)
    );
    for (let by = -0.45; by <= 0.45; by += 0.22) {
      cWin.add(box(0.02, 0.015, 1.44, MAT.steel, -0.01, by, 0));
    }
    corridor.add(cWin);
  }

  // Corridor end walls: dead-end wall right below our classroom door (corrZEnd) and far upper end (corrZStart)
  for (const ez of [corrZStart, corrZEnd]) {
    corridor.add(box(corrW, band, 0.08, bandMatDS, hw + corrW / 2, band / 2, ez));
    corridor.add(box(corrW, H - band, 0.08, wallMatDS, hw + corrW / 2, band + (H - band) / 2, ez));
    corridor.add(box(corrW, 0.026, 0.02, MAT.trim, hw + corrW / 2, band, ez));
    corridor.add(box(corrW, 0.08, 0.02, MAT.trim, hw + corrW / 2, 0.04, ez));
  }

  // Barred transom window above the door on the corridor side
  const doorTransom = new THREE.Group();
  doorTransom.position.set(hw + 0.03, 2.62, F.door.z);
  doorTransom.add(box(0.04, 0.62, 1.65, MAT.black, 0, 0, 0));
  const dtGlass = plane(1.55, 0.54, MAT.blind);
  dtGlass.rotation.y = Math.PI / 2;
  dtGlass.position.x = 0.022;
  doorTransom.add(dtGlass);
  for (let bz = -0.65; bz <= 0.65; bz += 0.22) {
    doorTransom.add(cyl(0.007, 0.007, 0.58, MAT.black, 0.03, 0, bz, 8));
  }
  corridor.add(doorTransom);

  // Black/grey electrical conduit pipe running along the corridor ceiling corner into the wall above the door
  corridor.add(
    cyl(0.016, 0.016, 1.15, MAT.black, hw + 0.08, 2.45, -hd + 0.08, 10),
    box(0.03, 0.03, 0.9, MAT.black, hw + 0.08, 2.98, -hd + 0.45)
  );

  // Black wrought-iron security grille gate outside the door
  const grille = new THREE.Group();
  grille.position.set(hw + 0.06, 0, F.door.z - F.door.w / 2);
  grille.rotation.y = -1.25;
  grille.add(
    box(0.03, F.door.h, 0.03, MAT.black, 0, F.door.h / 2, 0),
    box(0.03, F.door.h, 0.03, MAT.black, 0, F.door.h / 2, F.door.w),
    box(0.03, 0.03, F.door.w, MAT.black, 0, F.door.h - 0.02, F.door.w / 2),
    box(0.03, 0.03, F.door.w, MAT.black, 0, 1.05, F.door.w / 2),
    box(0.03, 0.03, F.door.w, MAT.black, 0, 0.05, F.door.w / 2),
    box(0.04, 0.1, 0.09, MAT.black, 0, 0.98, F.door.w - 0.05)
  );
  for (let b = 1; b < 7; b++) {
    grille.add(cyl(0.007, 0.007, F.door.h - 0.06, MAT.black, 0, F.door.h / 2, (b / 7) * F.door.w, 8));
  }
  corridor.add(grille);
  g.add(corridor);

  return { group: g, door };
}

export function buildDoor(D, isOffice = false) {
  const pivot = new THREE.Group();
  const leaf = new THREE.Group(); pivot.add(leaf);
  const doorMat = isOffice ? MAT.officeDoor : MAT.door;
  leaf.add(box(0.045, D.h, D.w, doorMat, 0, D.h / 2, D.w / 2));
  leaf.add(box(0.05, D.h - 0.24, D.w - 0.18, M({ color: isOffice ? 0x6e3d1c : 0x101217, roughness: 0.28, metalness: 0.3 }), 0, D.h / 2, D.w / 2));
  const hMat = isOffice ? MAT.chrome : MAT.brass;
  leaf.add(
    box(0.058, 0.2, 0.038, hMat, 0, 1.0, D.w - 0.09),
    box(0.085, 0.024, 0.13, hMat, -0.035, 1.03, D.w - 0.12),
    box(0.085, 0.024, 0.13, hMat, 0.035, 1.03, D.w - 0.12)
  );
  pivot.userData.open = 0;
  return { pivot, setOpen: (k) => { pivot.rotation.y = -k * 1.45; pivot.userData.open = k; } };
}

// ---------- furniture ----------
export function buildDeskSegment(w = 0.95, d = 0.6) {
  const g = new THREE.Group();
  g.add(box(w, 0.035, d, MAT.wood, 0, 0.74, 0, 0.006));
  g.add(box(0.03, 0.72, d - 0.04, MAT.wood, -w / 2 + 0.015, 0.36, 0), box(0.03, 0.72, d - 0.04, MAT.wood, w / 2 - 0.015, 0.36, 0));
  g.add(box(w - 0.04, 0.38, 0.02, MAT.wood, 0, 0.51, -d / 2 + 0.03));
  g.add(cyl(0.026, 0.026, 0.004, MAT.black, w / 2 - 0.12, 0.759, -d / 2 + 0.09, 16));
  return g;
}

export function buildChair() {
  const g = new THREE.Group();
  g.add(box(0.44, 0.055, 0.42, MAT.chair, 0, 0.465, 0, 0.022));
  const back = box(0.42, 0.38, 0.042, MAT.chair, 0, 0.75, 0.2, 0.022); back.rotation.x = -0.11; g.add(back);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
    g.add(cyl(0.013, 0.013, 0.465, MAT.black, x, 0.232, z, 10));
  }
  g.add(cyl(0.013, 0.013, 0.42, MAT.black, -0.19, 0.6, 0.2, 10), cyl(0.013, 0.013, 0.42, MAT.black, 0.19, 0.6, 0.2, 10));
  return g;
}

export function buildTeacherChair() {
  const g = new THREE.Group();
  g.add(box(0.48, 0.065, 0.46, MAT.chair, 0, 0.48, 0, 0.025));
  const back = box(0.46, 0.58, 0.05, MAT.chair, 0, 0.82, 0.21, 0.025); back.rotation.x = -0.1; g.add(back);
  g.add(cyl(0.024, 0.028, 0.34, MAT.black, 0, 0.28, 0, 12));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.026, 0.022, 0.28, MAT.chrome, Math.sin(a) * 0.14, 0.09, Math.cos(a) * 0.14, 0.005);
    leg.rotation.y = a;
    g.add(leg);
    g.add(cyl(0.02, 0.02, 0.03, MAT.black, Math.sin(a) * 0.26, 0.02, Math.cos(a) * 0.26, 10));
  }
  return g;
}

export function buildTeacherDesk(w = 1.65, d = 0.72) {
  const g = new THREE.Group();
  const segW = w / 2 - 0.005;
  for (const sx of [-w / 4, w / 4]) {
    g.add(box(segW, 0.038, d, MAT.wood, sx, 0.75, 0, 0.006));
    g.add(
      box(0.032, 0.73, d - 0.02, MAT.wood, sx - segW / 2 + 0.016, 0.365, 0),
      box(0.032, 0.73, d - 0.02, MAT.wood, sx + segW / 2 - 0.016, 0.365, 0)
    );
    g.add(box(segW - 0.05, 0.48, 0.022, MAT.wood, sx, 0.47, d / 2 - 0.03));
    g.add(cyl(0.026, 0.026, 0.004, MAT.black, sx - segW / 2 + 0.16, 0.77, -d / 2 + 0.12, 16));
  }
  g.add(box(0.055, 0.018, 0.16, MAT.white, -0.64, 0.778, 0.14, 0.006));
  g.add(box(0.036, 0.004, 0.045, M({ color: 0x94a3b8 }), -0.64, 0.788, 0.1, 0.002));
  const sideChair = buildChair();
  sideChair.position.set(w / 2 + 0.12, 0, 0.04);
  sideChair.rotation.y = Math.PI / 2;
  g.add(sideChair);
  return g;
}

export function buildTinyPC() {
  const g = new THREE.Group();
  const body = box(0.184, 0.037, 0.18, MAT.black, 0, 0, 0, 0.004); g.add(body);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.178, 0.033), new THREE.MeshStandardMaterial({ map: honeyTex(), roughness: 0.6 }));
  front.position.set(0, 0, 0.0905); g.add(front);
  g.add(box(0.176, 0.006, 0.038, M({ color: 0xb91c1c, roughness: 0.45 }), 0, 0.012, 0.072));
  g.add(box(0.005, 0.035, 0.15, M({ color: 0xb91c1c, roughness: 0.45 }), 0.092, 0, 0));
  const pw = cyl(0.006, 0.006, 0.002, MAT.chrome, 0.07, -0.004, 0.092, 16); pw.rotation.x = Math.PI / 2; g.add(pw);
  const ant = cyl(0.004, 0.005, 0.10, MAT.black, -0.07, 0.035, -0.092, 10);
  ant.rotation.z = 0.25;
  g.add(ant);
  return g;
}

const keysTex = () => canvasTex('keys', 512, 160, (g, w, h) => {
  g.fillStyle = '#111317'; g.fillRect(0, 0, w, h);
  const rows = [15, 15, 14, 13, 12]; const kw = (w - 16) / 15.5;
  rows.forEach((n, r) => { let x = 8 + (15 - n) * kw * 0.25; for (let i = 0; i < n; i++) { const ww = r === 4 && i === 5 ? kw * 4 : kw; g.fillStyle = '#23262c'; g.fillRect(x + 2, 8 + r * 29, ww - 4, 24); g.fillStyle = '#4b5059'; g.fillRect(x + 6, 12 + r * 29, 3, 3); x += ww; if (r === 4 && i === 5) i += 3; } });
});

export function buildWorkstation({ screen } = {}) {
  const g = new THREE.Group();
  const mon = new THREE.Group(); mon.position.set(0, 0.758, -0.13); g.add(mon);
  mon.add(box(0.24, 0.012, 0.17, MAT.plastic, 0, 0.006, -0.03, 0.006));
  mon.add(box(0.05, 0.25, 0.022, MAT.plastic, 0, 0.135, -0.072, 0.006));
  mon.add(box(0.054, 0.014, 0.026, MAT.red, 0, 0.075, -0.072, 0.003));
  const panel = new THREE.Group(); panel.position.set(0, 0.33, 0); mon.add(panel);
  panel.add(box(0.54, 0.32, 0.016, MAT.plastic, 0, 0, 0, 0.003));
  panel.add(box(0.3, 0.2, 0.03, MAT.plastic, 0, -0.01, -0.02, 0.01));
  panel.add(box(0.08, 0.08, 0.02, MAT.plastic, 0, -0.03, -0.045, 0.004));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.528, 0.297), screen || MAT.screenOff); scr.position.set(0, 0.007, 0.0081); panel.add(scr);
  panel.add(box(0.006, 0.003, 0.002, MAT.led(0xffffff), 0.24, -0.152, 0.0085));
  panel.add(box(0.026, 0.008, 0.002, MAT.red, -0.235, -0.151, 0.0085));
  // Horizontal VESA snap-in bracket & Tiny PC mounted flat and horizontally across the back of the monitor (بالعرض كبس)
  const bracket = box(0.192, 0.188, 0.044, MAT.steel, 0.11, -0.01, -0.032); panel.add(bracket);
  const tiny = buildTinyPC();
  tiny.rotation.x = Math.PI / 2;
  tiny.position.set(0.11, -0.01, -0.034);
  panel.add(tiny);
  const cab = trunk([V(0.11, -0.09, -0.05), V(0.08, -0.20, -0.065), V(0.04, -0.31, -0.07)], 0x0d0e10, 0.007); panel.add(cab);
  const kb = new THREE.Group(); kb.position.set(0, 0.768, 0.13); kb.rotation.x = 0.05; g.add(kb);
  kb.add(box(0.44, 0.016, 0.14, MAT.plastic, 0, 0, 0, 0.005));
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.125), new THREE.MeshStandardMaterial({ map: keysTex(), roughness: 0.7 })); keys.rotation.x = -Math.PI / 2; keys.position.y = 0.0085; kb.add(keys);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), MAT.plastic); mouse.scale.set(0.95, 0.55, 1.6); mouse.position.set(0.3, 0.776, 0.14); mouse.castShadow = true; g.add(mouse);
  const wheel = cyl(0.006, 0.006, 0.004, MAT.red, 0.3, 0.791, 0.122, 12); wheel.rotation.z = Math.PI / 2; g.add(wheel);
  const pad = cyl(0.105, 0.105, 0.003, MAT.mousepad || M({ color: 0x1d4ed8, roughness: 0.85 }), 0.3, 0.7595, 0.14, 28);
  g.add(pad);
  g.userData.screen = scr; g.userData.tiny = tiny;
  return g;
}

export function buildCabinet(units = 6) {
  const U = 0.0445; const W = 0.6, D = 0.45, Hh = units * U + 0.12;
  const g = new THREE.Group();
  const shell = new THREE.Group(); g.add(shell);
  const t = 0.012;
  shell.add(box(W, t, D, MAT.black, 0, Hh / 2 - t / 2, 0), box(W, t, D, MAT.black, 0, -Hh / 2 + t / 2, 0));
  shell.add(box(t, Hh, D, MAT.black, -W / 2 + t / 2, 0, 0), box(t, Hh, D, MAT.black, W / 2 - t / 2, 0, 0));
  shell.add(box(W, Hh, t, MAT.black, 0, 0, -D / 2 + t / 2));
  const fan = cyl(0.06, 0.06, 0.01, MAT.plastic, 0, Hh / 2 + 0.006, 0, 24); g.add(fan);
  g.add(box(0.13, 0.004, 0.13, M({ color: 0x0a0a0a, roughness: 0.3 }), 0, Hh / 2 + 0.012, 0));
  const grom = cyl(0.03, 0.03, 0.01, MAT.plastic, W / 2 + 0.004, 0, -0.05, 20); grom.rotation.z = Math.PI / 2; g.add(grom);
  for (let i = 0; i < 16; i++) g.add(box(0.014, 0.004, 0.004, M({ color: 0x050505 }), -0.2 + i * 0.027, Hh / 2 - 0.02, D / 2 + 0.002));
  for (const x of [-0.24, 0.24]) g.add(box(0.02, units * U + 0.02, 0.015, MAT.steel, x, 0, D / 2 - 0.08));
  const doorPivot = new THREE.Group(); doorPivot.position.set(-W / 2, 0, D / 2 + 0.006); g.add(doorPivot);
  const leaf = new THREE.Group(); doorPivot.add(leaf);
  leaf.add(box(W, 0.04, 0.012, MAT.black, W / 2, Hh / 2 - 0.02, 0), box(W, 0.04, 0.012, MAT.black, W / 2, -Hh / 2 + 0.02, 0));
  leaf.add(box(0.05, Hh, 0.012, MAT.black, 0.025, 0, 0), box(0.07, Hh, 0.012, MAT.black, W - 0.035, 0, 0));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, Hh - 0.08), MAT.glassDark); gl.position.set(W / 2 - 0.01, 0, 0.002); leaf.add(gl);
  leaf.add(cyl(0.012, 0.012, 0.012, MAT.chrome, W - 0.035, 0, 0.01, 16).rotateX(Math.PI / 2));
  const unitY = (u) => Hh / 2 - 0.06 - (u - 0.5) * U;
  g.userData = { U, W, D, H: Hh, unitY, doorPivot, setDoor: (k) => { doorPivot.rotation.y = -k * 1.7; } };
  return g;
}

export function buildRackPart(kind) {
  const g = new THREE.Group(); const w = 0.48, h = 0.042, d = kind === 'switch' ? 0.25 : kind === 'pdu' ? 0.18 : 0.1;
  const col = kind === 'switch' ? 0x2a3038 : kind === 'pdu' ? 0x1a1a1a : kind === 'cm' ? 0x101010 : 0x16181c;
  g.add(box(w, h, d, M({ color: col, roughness: 0.5, metalness: 0.3 }), 0, 0, -d / 2));
  if (kind === 'patch' || kind === 'switch') {
    const n = 24; const rows = kind === 'switch' ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = -0.2 + (i % 24) * 0.0172 + (Math.floor(i / 6)) * 0.004; const y = rows === 2 ? (r ? -0.009 : 0.009) : 0;
      g.add(box(0.012, 0.01, 0.004, M({ color: 0x050505 }), x, y, 0.002));
    }
    if (kind === 'switch') for (let i = 0; i < 12; i++) g.add(box(0.004, 0.004, 0.003, MAT.led(i % 3 ? 0x22c55e : 0xf59e0b), 0.215 - i * 0.003, 0.012, 0.002));
  }
  if (kind === 'cm') for (let i = 0; i < 5; i++) g.add(box(0.04, 0.03, 0.03, M({ color: 0x0a0a0a }), -0.19 + i * 0.095, 0, 0.012));
  if (kind === 'pdu') { for (let i = 0; i < 6; i++) g.add(box(0.035, 0.025, 0.004, M({ color: 0x0b0b0b }), -0.15 + i * 0.05, 0, 0.002)); g.add(box(0.02, 0.012, 0.004, MAT.led(0xef4444), 0.2, 0, 0.002)); }
  return g;
}

export function buildAC() {
  const g = new THREE.Group();
  g.add(box(0.98, 0.3, 0.22, MAT.white, 0, 0, 0, 0.05));
  g.add(box(0.88, 0.022, 0.04, M({ color: 0xd8dbe0 }), 0, -0.13, 0.1));
  g.add(box(0.11, 0.042, 0.005, MAT.blueBox, 0.34, 0.03, 0.111));
  g.add(box(0.04, 0.014, 0.004, MAT.led(0x60a5fa), 0.18, -0.02, 0.111));
  return g;
}

export function buildDisplay(w = 2.3, h = 1.32) {
  const g = new THREE.Group();
  const frame = box(w + 0.08, h + 0.09, 0.075, MAT.black, 0, 0, 0, 0.012); g.add(frame);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.screenOff); scr.position.z = 0.038; g.add(scr);
  g.add(box(w * 0.35, 0.018, 0.04, MAT.white, 0, -h / 2 - 0.028, 0.045, 0.004));
  for (let i = 0; i < 6; i++) {
    g.add(box(0.016, 0.01, 0.004, MAT.chrome, -w / 2 + 0.18 + i * 0.032, -h / 2 - 0.022, 0.039));
  }
  g.add(box(0.012, 0.012, 0.004, MAT.led(0x22c55e), w / 2 - 0.08, -h / 2 - 0.022, 0.039));
  g.userData.screen = scr; return g;
}

export function buildPrinter() {
  const g = new THREE.Group();
  g.add(box(0.84, 0.036, 0.62, MAT.wood, 0, 0.73, 0, 0.006));
  g.add(box(0.035, 0.71, 0.58, MAT.wood, -0.4, 0.355, 0), box(0.035, 0.71, 0.58, MAT.wood, 0.4, 0.355, 0));
  g.add(cyl(0.024, 0.024, 0.004, MAT.black, 0.22, 0.75, 0.14, 16));
  g.add(box(0.42, 0.62, 0.46, MAT.warmWood, 0.14, 0.31, 0.02, 0.008));
  for (const dy of [0.16, 0.34, 0.51]) {
    g.add(box(0.38, 0.14, 0.012, MAT.warmWood, 0.14, dy, 0.255));
    g.add(box(0.08, 0.012, 0.018, MAT.chrome, 0.14, dy, 0.266));
  }
  g.add(box(0.42, 0.32, 0.4, MAT.white, -0.1, 0.9, 0.02, 0.02));
  g.add(box(0.4, 0.055, 0.38, M({ color: 0xdbe0e6 }), -0.1, 1.08, 0.02, 0.01));
  g.add(box(0.26, 0.045, 0.26, MAT.white, -0.12, 1.13, 0.02, 0.008));
  const ctrl = box(0.11, 0.025, 0.08, MAT.white, -0.24, 1.04, 0.22, 0.005);
  ctrl.rotation.x = 0.45;
  g.add(ctrl);
  g.add(box(0.16, 0.06, 0.015, M({ color: 0x1b1d22 }), -0.1, 0.96, 0.215));
  const led = box(0.012, 0.012, 0.004, MAT.led(0x22c55e), -0.22, 1.045, 0.235); g.add(led); g.userData.led = led;
  g.add(box(0.18, 0.09, 0.24, MAT.blueBox, 0.2, 0.79, -0.12, 0.004));
  g.add(box(0.17, 0.08, 0.22, MAT.cyanBox, 0.2, 0.875, -0.14, 0.004));
  const ext = new THREE.Group();
  ext.position.set(0.31, 0.75, -0.06);
  ext.add(cyl(0.065, 0.065, 0.36, MAT.blueBox, 0, 0.18, 0, 18));
  ext.add(box(0.06, 0.16, 0.07, MAT.white, 0, 0.19, 0.04, 0.01));
  ext.add(box(0.048, 0.12, 0.072, MAT.red, 0, 0.19, 0.041, 0.008));
  ext.add(cyl(0.018, 0.024, 0.055, MAT.chrome, 0, 0.38, 0, 12));
  ext.add(box(0.065, 0.016, 0.016, MAT.black, 0.02, 0.41, 0));
  g.add(ext);

  const paper = box(0.21, 0.003, 0.27, M({ color: 0xffffff }), -0.1, 0.835, 0.25); paper.visible = false; g.add(paper); g.userData.paper = paper;
  return g;
}

export function buildUPS() {
  const g = new THREE.Group();
  const bin = new THREE.Group();
  bin.position.set(-0.62, 0, 0);
  bin.add(cyl(0.16, 0.125, 0.42, MAT.black, 0, 0.21, 0, 20));
  bin.add(cyl(0.175, 0.165, 0.06, M({ color: 0x0a0b0e, roughness: 0.35 }), 0, 0.42, 0, 20));
  g.add(bin);

  g.add(box(0.23, 0.56, 0.5, MAT.black, 0, 0.31, 0, 0.012));
  for (const [cx, cz] of [[-0.085, -0.2], [0.085, -0.2], [-0.085, 0.2], [0.085, 0.2]]) {
    g.add(cyl(0.018, 0.018, 0.03, MAT.chrome, cx, 0.015, cz, 10));
  }
  g.add(box(0.09, 0.003, 0.065, MAT.yellow, 0.055, 0.591, 0.14));
  g.add(box(0.11, 0.065, 0.005, MAT.chrome, 0, 0.48, 0.251, 0.004));
  const lcd = box(0.08, 0.032, 0.006, M({ color: 0x0a1a10, emissive: 0x22c55e, emissiveIntensity: 0.0 }), 0, 0.488, 0.253); g.add(lcd);
  for (let i = 0; i < 8; i++) {
    g.add(box(0.16, 0.012, 0.006, M({ color: 0x08090b }), 0, 0.26 + i * 0.022, 0.252));
  }

  const pal = new THREE.Group();
  pal.position.set(0.52, 0, -0.02);
  for (const px of [-0.14, 0, 0.14]) pal.add(box(0.045, 0.038, 0.48, MAT.warmWood, px, 0.019, 0));
  for (const pz of [-0.2, -0.1, 0, 0.1, 0.2]) pal.add(box(0.34, 0.014, 0.065, MAT.warmWood, 0, 0.045, pz));
  pal.add(box(0.22, 0.34, 0.44, MAT.black, 0, 0.22, 0, 0.01));
  pal.add(box(0.045, 0.055, 0.006, MAT.white, 0.04, 0.21, 0.222));
  pal.add(box(0.035, 0.02, 0.008, MAT.red, 0.04, 0.21, 0.225));
  g.add(pal);

  g.userData.lcd = lcd; return g;
}

export function buildBoxStack(n = 6) {
  const g = new THREE.Group(); const m = M({ color: 0xc4a074, roughness: 0.9 });
  for (let i = 0; i < n; i++) { const b = box(0.55, 0.32, 0.42, m, (i % 2) * 0.58 - 0.29, 0.16 + Math.floor(i / 2) * 0.33, 0); g.add(b); }
  return g;
}

export function trunk(points, color = 0xf5f5f5, r = 0.014) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.01);
  const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), r, 6, false);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: 0x000000 }));
  return m;
}

// ---------- office & exterior ----------
export function buildOffice() {
  const g = new THREE.Group(); const W = 6, D = 5, H = 3.5, band = 1.05;
  const fl = plane(W, D, M({ color: 0x9b7b5a, roughness: 0.5, map: woodTex(), side: THREE.DoubleSide })); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const wm = M({ color: 0xe9e4da, roughness: 0.9, side: THREE.DoubleSide });
  const bm = M({ color: 0xd8cab2, roughness: 0.85, side: THREE.DoubleSide });
  // Solid 3D box walls on all 4 sides of the office so there is NEVER a missing wall or black void from any angle
  const walls = [
    [0, -D / 2, 0, W],
    [-W / 2, 0, Math.PI / 2, D],
    [W / 2, 0, -Math.PI / 2, D],
    [0, D / 2, Math.PI, W],
  ];
  for (const [x, z, ry, len] of walls) {
    const lower = box(len, band, 0.08, bm, x, band / 2, z); lower.rotation.y = ry; g.add(lower);
    const upper = box(len, H - band, 0.08, wm, x, band + (H - band) / 2, z); upper.rotation.y = ry; g.add(upper);
    const rail = box(len, 0.028, 0.1, MAT.trim, x, band, z); rail.rotation.y = ry; g.add(rail);
    const sk = box(len, 0.08, 0.1, MAT.trim, x, 0.04, z); sk.rotation.y = ry; g.add(sk);
  }
  const ce = box(W, 0.08, D, MAT.ceiling, 0, H, 0); g.add(ce);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e6, emissiveIntensity: 1.2 });
  g.add(box(1.2, 0.025, 0.6, lightMat, 0, H - 0.045, 0));

  // Framed school noticeboard & wall clock on the +z office wall (visible behind visitors in dialogue shots)
  const backBoard = box(1.2, 0.78, 0.04, M({ color: 0x4a2f1d }), -0.45, 1.82, D / 2 - 0.05); g.add(backBoard);
  const backBoardFace = plane(1.08, 0.66, M({ color: 0xf7f4eb, roughness: 0.8, side: THREE.DoubleSide }));
  backBoardFace.position.set(-0.45, 1.82, D / 2 - 0.072); backBoardFace.rotation.y = Math.PI; g.add(backBoardFace);
  const clock = cyl(0.17, 0.17, 0.035, M({ color: 0x3d2616 }), 1.15, 2.15, D / 2 - 0.05, 24);
  clock.rotation.x = Math.PI / 2; g.add(clock);

  // Principal's desk & executive chair:
  // Principal Abu Anis sits on the -z side (at z = -1.80) facing +z (rotation.y = 0).
  const desk = new THREE.Group(); desk.position.set(0, 0, -1.2); g.add(desk);
  desk.add(box(1.9, 0.05, 0.9, M({ color: 0x4a2f1d, roughness: 0.4 }), 0, 0.76, 0));
  desk.add(box(1.9, 0.72, 0.05, M({ color: 0x3d2616, roughness: 0.5 }), 0, 0.37, 0.4));
  desk.add(box(0.05, 0.72, 0.85, M({ color: 0x3d2616 }), -0.92, 0.37, 0), box(0.05, 0.72, 0.85, M({ color: 0x3d2616 }), 0.92, 0.37, 0));
  // Official papers on Abu Anis's desk
  desk.add(box(0.32, 0.02, 0.24, M({ color: 0xffffff }), -0.28, 0.795, -0.16), box(0.3, 0.02, 0.22, M({ color: 0xf5f1e6 }), -0.26, 0.81, -0.15));
  // Office telephone on Abu Anis's right-hand side of the desk
  const phone = box(0.16, 0.05, 0.12, MAT.plastic, -0.64, 0.81, -0.14, 0.02); desk.add(phone);
  // Principal's PC workstation placed on the left side of the desk so Abu Anis's face & right hand are completely unobstructed
  const officeWS = buildWorkstation({ screen: MAT.officeScreen || MAT.screenOff });
  officeWS.rotation.y = Math.PI - 0.22;
  officeWS.position.set(0.38, 0.028, 0.02);
  desk.add(officeWS);

  // Executive high-back leather chair positioned at z = -1.82 facing +z (towards desk)
  const exec = new THREE.Group(); exec.position.set(0, 0, -1.82); g.add(exec);
  exec.add(box(0.58, 0.09, 0.52, MAT.chair, 0, 0.45, 0, 0.04));
  const execBack = box(0.56, 0.76, 0.09, MAT.chair, 0, 0.88, -0.22, 0.04); execBack.rotation.x = -0.08; exec.add(execBack);
  for (const sx of [-0.28, 0.28]) {
    exec.add(box(0.045, 0.03, 0.34, MAT.chair, sx, 0.64, -0.02, 0.012));
    exec.add(cyl(0.014, 0.014, 0.18, MAT.chrome, sx, 0.54, -0.12, 10));
    exec.add(cyl(0.014, 0.014, 0.18, MAT.chrome, sx, 0.54, 0.1, 10));
  }
  exec.add(cyl(0.03, 0.03, 0.42, MAT.chrome, 0, 0.22, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.028, 0.022, 0.3, MAT.chrome, Math.sin(a) * 0.15, 0.08, Math.cos(a) * 0.15, 0.005);
    leg.rotation.y = a; exec.add(leg);
  }
  // Two visitor chairs in front of the desk: rotation.y = 0 so their backrests are at +z and seats face -z (towards Principal Abu Anis and his desk)
  for (const x of [-0.62, 0.62]) {
    const c = buildChair();
    c.position.set(x, 0, -0.26);
    c.rotation.y = 0;
    g.add(c);
  }
  // shelves, plant, framed certificate on the back wall behind Abu Anis
  const sh = new THREE.Group(); sh.position.set(-2.6, 0, -1.4); g.add(sh);
  sh.add(box(0.4, 2, 1.4, M({ color: 0x4a2f1d }), 0, 1, 0));
  const bc = [0x2b4c7e, 0x7e2b2b, 0x2b7e4f, 0xd9b44a, 0x555b66];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) sh.add(box(0.3, 0.3, 0.06 + (i % 3) * 0.02, M({ color: bc[(i + r) % 5] }), 0.05, 0.35 + r * 0.45, -0.6 + i * 0.14));
  const cert = box(0.7, 0.5, 0.03, M({ color: 0x3d2616 }), 0, 1.9, -D / 2 + 0.055); g.add(cert);
  const ce2 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), new THREE.MeshStandardMaterial({ roughness: 0.8, map: canvasTex('cert', 512, 346, (gg, w, h) => {
    gg.fillStyle = '#f6f0de'; gg.fillRect(0, 0, w, h); gg.strokeStyle = '#b8902f'; gg.lineWidth = 10; gg.strokeRect(14, 14, w - 28, h - 28); gg.lineWidth = 2; gg.strokeRect(30, 30, w - 60, h - 60);
    gg.fillStyle = '#3d2b12'; gg.textAlign = 'center'; gg.font = '700 40px "IBM Plex Sans Arabic", Tahoma, Arial'; gg.fillText('شهادة تقدير', w / 2, 110);
    gg.font = '24px "IBM Plex Sans Arabic", Tahoma, Arial'; for (let i = 0; i < 3; i++) { gg.fillStyle = '#9c8a66'; gg.fillRect(110, 160 + i * 34, w - 220, 4); }
    gg.fillStyle = '#b8902f'; gg.beginPath(); gg.arc(w / 2, 290, 26, 0, 7); gg.fill();
  }) })); ce2.position.set(0, 1.9, -D / 2 + 0.072); g.add(ce2);
  const pot = cyl(0.18, 0.14, 0.35, M({ color: 0x8b5a3c }), 2.45, 0.175, -1.95); g.add(pot);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M({ color: 0x2f7a3e })); l.position.set(2.45 + Math.cos(i) * 0.12, 0.55 + (i % 3) * 0.12, -1.95 + Math.sin(i) * 0.12); g.add(l); }
  const win = plane(1.6, 1.2, MAT.window); win.position.set(W / 2 - 0.045, 1.7, -0.8); win.rotation.y = -Math.PI / 2; g.add(win);
  const door = buildDoor({ w: 0.95, h: 2.15 }, true); door.pivot.position.set(W / 2 - 0.045, 0, 1.2); door.pivot.rotation.y = 0; g.add(door.pivot);
  g.userData = { door, W, D };
  return g;
}

export function buildExterior(school = { ar: '', en: '' }) {
  const g = new THREE.Group();
  const ground = plane(120, 120, M({ color: 0xb9ae96, roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const yard = plane(30, 14, M({ color: 0xd8cfbf, roughness: 0.9 })); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.01, 6); g.add(yard);
  const stone = M({ color: 0xe8dcc4, roughness: 0.85 });
  const b = box(26, 9, 9, stone, 0, 4.5, -4.5); g.add(b);
  const winM = M({ color: 0x51677e, roughness: 0.1, metalness: 0.4 });
  for (let f = 0; f < 3; f++) for (let i = 0; i < 10; i++) { if (f === 0 && (i === 4 || i === 5)) continue; g.add(box(1.4, 1.5, 0.08, winM, -11.2 + i * 2.5, 1.7 + f * 2.8, 0.02)); g.add(box(1.5, 0.08, 0.2, MAT.white, -11.2 + i * 2.5, 0.92 + f * 2.8, 0.1)); }
  g.add(box(2.6, 2.6, 0.1, M({ color: 0x5a3a22 }), 0, 1.3, 0.05));
  g.add(box(11, 1.35, 0.12, M({ color: 0x1f6b3a }), 0, 3.95, 0.07));
  g.add(box(11.2, 0.06, 0.16, MAT.white, 0, 4.65, 0.08), box(11.2, 0.06, 0.16, MAT.white, 0, 3.25, 0.08));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 1.2), new THREE.MeshStandardMaterial({ map: canvasTex('sign-' + school.ar, 2048, 232, (gg, w, h) => {
    gg.fillStyle = '#1f6b3a'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#fff'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.direction = 'rtl'; gg.font = '700 96px "IBM Plex Sans Arabic", Tahoma, Arial'; gg.fillText(school.ar, w / 2, h * 0.38);
    gg.direction = 'ltr'; gg.font = '600 46px Inter, Arial'; gg.fillText(school.en.toUpperCase(), w / 2, h * 0.8);
  }), roughness: 0.6 }));
  sign.position.set(0, 3.95, 0.14); g.add(sign);
  const trunkM = M({ color: 0x6b4a30 }); const leafM = M({ color: 0x3f7d3a, roughness: 0.9 });
  for (const [x, z] of [[-10, 5], [10, 5], [-14, 9], [14, 9], [-7, 13], [7, 13]]) { g.add(cyl(0.15, 0.2, 2, trunkM, x, 1, z)); const c = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), leafM); c.position.set(x, 2.9, z); c.castShadow = true; g.add(c); }
  return g;
}

export function makeGhost(obj) {
  const g = new THREE.Group();
  obj.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(obj);
  const s = bb.getSize(V()); const c = bb.getCenter(V());
  const m = new THREE.Mesh(new THREE.BoxGeometry(s.x, s.y, s.z), MAT.ghost); m.position.copy(c);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), MAT.ghostEdge); e.position.copy(c);
  g.add(m, e); return g;
}
