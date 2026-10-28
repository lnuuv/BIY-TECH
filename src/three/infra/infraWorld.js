// Infrastructure 3D world: three modes that follow the reference site's "3D" page.
//   layers     – four stacked, explodable layers (network / software / hardware / peripherals) with their parts
//   computer   – the same parts placed on a desk as one working computer system (+ data journey & quiz support)
//   simulation – the physical Internet: home → street cabinet → ISP → IXP → landing station → sea cable → remote DC
// One WebGL renderer is reused across modes; each mode's objects live in `this.content` and are disposed on switch.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { disposeTree } from '../engine.js';
import { INFRA_LAYERS, INFRA_PARTS, INFRA_SCENE, LAYER_BY_ID, SIM_SPOTS, SIM_JOURNEY } from '../../../shared/content/infrastructure.js';

const PX = 0.01; // reference CSS pixels → scene units
const SLAB = { w: 420, h: 12, d: 280 };
const DESK = { w: 620, h: 14, d: 340 };
const GAP = { exploded: 1.0, compact: 0.22 };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rgbColor = (rgb) => new THREE.Color(...rgb.split(',').map((n) => Number(n) / 255));
const sph = (target, r, theta, phi) => new THREE.Vector3(
  target.x + r * Math.sin(phi) * Math.sin(theta), target.y + r * Math.cos(phi), target.z + r * Math.sin(phi) * Math.cos(theta),
);

export const VIEWS = {
  layers: { target: new THREE.Vector3(0, 1.45, 0), r: 9.6, theta: -0.62, phi: 1.08, minR: 3.5, maxR: 18 },
  computer: { target: new THREE.Vector3(0.25, 0.55, 0.2), r: 8.6, theta: -0.5, phi: 1.02, minR: 3, maxR: 16 },
  simulation: { target: new THREE.Vector3(62, 0, 0), r: 330, theta: 0.25, phi: 1.0, minR: 20, maxR: 520 },
};

export class InfraWorld {
  constructor(container, { onPick, onHover, labelFor, onReady } = {}) {
    this.container = container;
    this.cb = { onPick, onHover, labelFor };
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.quality = coarse || (navigator.hardwareConcurrency || 4) <= 4 ? 'medium' : 'high';
    this.disposed = false; this.visible = true; this.mode = null;
    this.units = new Map(); // id → { meshes:[{fill,edge,base}], layer, group }
    this.labels = new Map(); // id → { el, anchor:Vector3, prio, mini, w, h }
    this.hidden = new Set(); this.selected = null; this.hover = null; this.flashes = new Map();
    this.auto = !this.reduced; this.gap = GAP.exploded; this.gapTarget = GAP.exploded;
    this.lastInteract = -1e9; this.tween = null; this.packetTween = null;
    this.sim = { night: false, flow: true, labels: true };
    this._v = new THREE.Vector3();

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: this.quality === 'high', alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 1.75 : 1.25));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    r.domElement.setAttribute('role', 'img');
    container.appendChild(r.domElement);
    this.labelLayer = document.createElement('div'); this.labelLayer.className = 'infra-labels'; container.appendChild(this.labelLayer);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 2000);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, rotateSpeed: 0.75, zoomSpeed: 0.9, minPolarAngle: 0.12, maxPolarAngle: 1.5 });
    this.controls.addEventListener('start', () => { this.tween = null; this.interacting = true; });
    this.controls.addEventListener('end', () => { this.interacting = false; this.lastInteract = performance.now(); });

    this.content = new THREE.Group(); this.scene.add(this.content);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    const dom = r.domElement;
    this._down = (e) => { this.downAt = { x: e.clientX, y: e.clientY }; };
    this._up = (e) => {
      if (!this.downAt) return; const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y); this.downAt = null;
      if (moved > 6) return;
      this.cb.onPick?.(this.pickAt(e.clientX, e.clientY));
    };
    this._move = (e) => {
      if (e.pointerType === 'touch' || this.interacting) return;
      const id = this.pickAt(e.clientX, e.clientY);
      if (id !== this.hover) { this.hover = id; dom.style.cursor = id ? 'pointer' : ''; this.cb.onHover?.(id); }
    };
    this._leave = () => { if (this.hover) { this.hover = null; this.cb.onHover?.(null); } };
    dom.addEventListener('pointerdown', this._down); dom.addEventListener('pointerup', this._up);
    dom.addEventListener('pointermove', this._move); dom.addEventListener('pointerleave', this._leave);

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container);
    this.io = new IntersectionObserver((en) => { this.visible = en[0]?.isIntersecting ?? true; }); this.io.observe(container);
    this.clock = new THREE.Clock();
    this.resize();
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
    onReady?.(this);
  }

  // ---------------------------------------------------------------- modes
  setMode(mode) {
    if (this.disposed || mode === this.mode) return;
    this.clearContent();
    this.mode = mode; this.selected = null; this.hover = null; this.flashes.clear();
    this.renderer.toneMapping = mode === 'simulation' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    if (mode === 'layers') this.buildLayers();
    else if (mode === 'computer') this.buildComputer();
    else this.buildSimulation();
    const v = VIEWS[mode];
    this.controls.minDistance = v.minR; this.controls.maxDistance = v.maxR;
    this.controls.maxPolarAngle = mode === 'simulation' ? 1.42 : 1.5;
    this.camera.near = mode === 'simulation' ? 1 : 0.05; this.camera.far = mode === 'simulation' ? 1500 : 200; this.camera.updateProjectionMatrix();
    this.jump(v);
    this.applyHidden(); this.refreshStyles();
  }
  clearContent() {
    this.stopTour();
    this.scene.remove(this.content); disposeTree(this.content);
    this.content = new THREE.Group(); this.scene.add(this.content);
    this.scene.background = null; this.scene.fog = null;
    this.units.clear();
    for (const l of this.labels.values()) l.el.remove();
    this.labels.clear();
    this.packet = null; this.packetTween = null; this.packetFrom = null; this.globes = []; this.simWorld = null;
    this.risers = null; this.layerGroups = null; this.stations = null;
    this.renderer.shadowMap.enabled = false;
  }

  // ---------------------------------------------------------------- shared builders
  /** a translucent neon box (fill + edges) registered under a selectable id */
  addBox(unitId, color, parent, [w, h, d], pos, { fillOpacity = 0.18 } = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOpacity, depthWrite: false, side: THREE.DoubleSide }));
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    fill.position.copy(pos); edge.position.copy(pos); fill.userData.id = unitId; fill.renderOrder = 1; edge.renderOrder = 2;
    parent.add(fill, edge);
    const u = this.units.get(unitId); u.meshes.push({ fill, edge, base: fillOpacity, color: color.clone() });
    return fill;
  }
  registerUnit(id, layer, group, extra = {}) { this.units.set(id, { id, layer, group, meshes: [], ...extra }); return this.units.get(id); }
  addLabel(id, text, anchor, { prio = 1, mini = false, cls = '', color = null, icon = '' } = {}) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = `infra-tag ${cls}`; el.tabIndex = -1; // keyboard users use the side list
    if (color) el.style.setProperty('--c', color);
    el.innerHTML = icon ? `<span aria-hidden="true">${icon}</span><b></b>` : '<b></b>';
    el.querySelector('b').textContent = text;
    el.addEventListener('click', (e) => { e.stopPropagation(); this.cb.onPick?.(id); });
    this.labelLayer.appendChild(el);
    this.labels.set(id, { id, el, anchor, prio, mini, w: 0, h: 0 });
  }
  relabel() { for (const [id, l] of this.labels) { const t = this.cb.labelFor?.(id); if (t) { l.el.querySelector('b').textContent = t; l.w = 0; } } }
  floorGrid(size, y) {
    const g = new THREE.GridHelper(size, size * 2, 0x38bdf8, 0x38bdf8);
    g.material.transparent = true; g.material.opacity = 0.12; g.material.depthWrite = false; g.position.y = y; this.content.add(g);
  }
  partBoxes(def, base, parent, color, unitId) {
    let top = 0;
    for (const [bx, bz, w, h, d, lift] of def.boxes) {
      this.addBox(unitId, color, parent, [w * PX, h * PX, d * PX], new THREE.Vector3((def.x + bx) * PX, base + (lift + h / 2) * PX, (def.z + bz) * PX));
      top = Math.max(top, lift + h);
    }
    if (def.globe) { this.addGlobe(unitId, color, parent, new THREE.Vector3(def.x * PX, base + 0.46, def.z * PX)); top = 92; }
    return top;
  }
  addGlobe(unitId, color, parent, center) {
    const g = new THREE.Group(); g.position.copy(center); parent.add(g);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, depthWrite: false }));
    hit.userData.id = unitId; g.add(hit);
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, i) => new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * 0.42, Math.sin((i / 64) * Math.PI * 2) * 0.42, 0))), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      ring.rotation.y = a; g.add(ring);
    }
    const eq = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, i) => new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * 0.42, 0, Math.sin((i / 64) * Math.PI * 2) * 0.42))), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }));
    g.add(eq);
    this.globes.push(g);
    this.units.get(unitId).meshes.push({ fill: hit, edge: null, base: 0.06, color: color.clone(), globe: g });
  }

  // ---------------------------------------------------------------- layers mode
  buildLayers() {
    this.floorGrid(14, -0.25);
    this.layerGroups = {};
    for (const layer of INFRA_LAYERS) {
      const color = rgbColor(layer.rgb);
      const g = new THREE.Group(); g.userData.order = layer.order; this.content.add(g); this.layerGroups[layer.id] = g;
      this.registerUnit(layer.id, layer.id, g, { isLayer: true });
      this.addBox(layer.id, color, g, [SLAB.w * PX, SLAB.h * PX, SLAB.d * PX], new THREE.Vector3(0, 0, 0), { fillOpacity: 0.13 });
      this.addLabel(layer.id, this.cb.labelFor?.(layer.id) || layer.id, { obj: g, offset: new THREE.Vector3(-SLAB.w * PX / 2 - 0.05, 0.05, SLAB.d * PX / 2) }, { prio: 3, cls: 'layer', color: layer.rgb });
      for (const part of INFRA_PARTS.filter((p) => p.layer === layer.id && !p.extra)) {
        this.registerUnit(part.id, layer.id, g);
        const top = this.partBoxes(part, SLAB.h * PX / 2, g, color, part.id);
        this.addLabel(part.id, this.cb.labelFor?.(part.id) || part.id, { obj: g, offset: new THREE.Vector3(part.x * PX, SLAB.h * PX / 2 + (top + 12) * PX, part.z * PX) }, { prio: 2, color: layer.rgb });
      }
    }
    // data-flow risers between the layers (the layers depend on each other)
    const corners = [[-2.1, -1.4], [2.1, -1.4], [-2.1, 1.4], [2.1, 1.4]];
    this.risers = corners.map(([x, z], i) => {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.35 }));
      line.position.set(x, 0, z); this.content.add(line);
      const dots = Array.from({ length: 3 }, (_, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xbae6fd })); m.userData.phase = (k / 3 + i * 0.17) % 1; this.content.add(m); return m; });
      return { line, dots, x, z };
    });
    this.layoutLayers(true);
  }
  layoutLayers() {
    if (!this.layerGroups) return;
    for (const g of Object.values(this.layerGroups)) g.position.y = (3 - g.userData.order) * this.gap;
    for (const r of this.risers || []) { const h = 3 * this.gap; r.line.scale.y = Math.max(0.001, h); r.line.position.y = h / 2; }
  }
  setExploded(on) { this.gapTarget = on ? GAP.exploded : GAP.compact; if (this.reduced) { this.gap = this.gapTarget; this.layoutLayers(); } }

  // ---------------------------------------------------------------- computer mode
  buildComputer() {
    this.floorGrid(14, -0.25);
    const desk = new THREE.Group(); this.content.add(desk);
    const deskColor = new THREE.Color(0.77, 0.59, 0.39);
    const dm = new THREE.Mesh(new THREE.BoxGeometry(DESK.w * PX, DESK.h * PX, DESK.d * PX), new THREE.MeshBasicMaterial({ color: deskColor, transparent: true, opacity: 0.16, depthWrite: false }));
    desk.add(dm, new THREE.LineSegments(new THREE.EdgesGeometry(dm.geometry), new THREE.LineBasicMaterial({ color: deskColor, transparent: true, opacity: 0.8 })));
    this.stations = {};
    const base = DESK.h * PX / 2;
    for (const item of INFRA_SCENE) {
      const layer = LAYER_BY_ID[item.group]; const color = rgbColor(layer.rgb);
      const g = new THREE.Group(); this.content.add(g);
      this.registerUnit(item.id, item.group, g, { mini: !!item.mini });
      const top = this.partBoxes(item, base, g, color, item.id);
      // station point = average box centre (as in the reference's journey)
      const n = item.boxes.length || 1;
      const avg = (f) => item.boxes.reduce((s, b) => s + f(b), 0) / n;
      this.stations[item.id] = item.globe ? new THREE.Vector3(item.x * PX, base + 0.46, item.z * PX)
        : new THREE.Vector3((item.x + avg((b) => b[0])) * PX, base + avg((b) => b[5] + b[3] / 2) * PX, (item.z + avg((b) => b[1])) * PX);
      const anchor = item.mini ? this.stations[item.id].clone().add(new THREE.Vector3(0, 0.18, 0)) : new THREE.Vector3(item.x * PX, base + (top + 14) * PX, item.z * PX);
      this.addLabel(item.id, this.cb.labelFor?.(item.id) || item.id, { pos: anchor }, { prio: item.mini ? 0 : 2, mini: !!item.mini, color: layer.rgb });
    }
    // the case is drawn more transparent so the parts inside stay visible
    for (const m of this.units.get('case')?.meshes || []) { m.base = 0.07; }
    const pk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pk.add(new THREE.LineSegments(new THREE.EdgesGeometry(pk.geometry), new THREE.LineBasicMaterial({ color: 0x38bdf8 })));
    pk.visible = false; this.content.add(pk); this.packet = pk;
  }
  /** data journey: move the glowing packet to a station (arc), or hide it with null */
  movePacket(id) {
    if (!this.packet) return;
    if (!id) { this.packet.visible = false; this.packetFrom = null; this.packetTween = null; return; }
    const to = this.stations[id]; if (!to) return;
    const from = this.packetFrom || to;
    this.packet.visible = true; this.packetFrom = to.clone();
    this.packetTween = { from: from.clone(), to: to.clone(), t0: performance.now(), ms: this.reduced ? 1 : 1300 };
  }

  // ---------------------------------------------------------------- simulation mode (port of the reference world)
  buildSimulation() {
    const scene = this.scene; const root = this.content; const shadows = this.quality === 'high';
    this.renderer.shadowMap.enabled = shadows; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.background = new THREE.Color(0x9fd3ff); scene.fog = new THREE.Fog(0x9fd3ff, 260, 760);
    const world = (this.simWorld = { windows: [], packets: [], waves: [], meshes: [] });
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
    const place = (mesh, id) => { mesh.castShadow = shadows; mesh.receiveShadow = shadows; if (id) mesh.userData.id = id; root.add(mesh); return mesh; };
    const box = (w, h, d, color, x, z, base = 0, extra, id) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, extra)); m.position.set(x, base + h / 2, z); return place(m, id); };
    const windowAt = (x, y, z, w = 1.4, h = 1.6) => { const mat = std(0x1b2a3d, { emissive: 0xffd27a, emissiveIntensity: 0, roughness: 0.4 }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); root.add(m); world.windows.push(mat); };
    let seed = 7; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const land = std(0x4a9a58, { roughness: 0.95 });
    const west = new THREE.Mesh(new THREE.BoxGeometry(155, 2, 140), land); west.position.set(-32.5, -1, 0); west.receiveShadow = shadows; root.add(west);
    const east = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 120), land); east.position.set(185, -1, 0); east.receiveShadow = shadows; root.add(east);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), std(0x0f6bb0, { transparent: true, opacity: 0.78, roughness: 0.25, metalness: 0.3 })); sea.rotation.x = -Math.PI / 2; sea.position.set(90, -0.35, 0); root.add(sea);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), std(0x0a2d4a)); floor.rotation.x = -Math.PI / 2; floor.position.set(90, -9, 0); root.add(floor);
    box(95, 0.1, 4, 0x3b3f4a, -28, 14, 0);
    for (let i = 0; i < 34; i++) {
      const onWest = rand() < 0.6; const x = onWest ? -105 + rand() * 145 : 140 + rand() * 90, z = -62 + rand() * 124;
      if (onWest && z > 6 && z < 22) continue;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 6), std(0x6b4a2b)); trunk.position.set(x, 1, z); place(trunk);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.2, 7), std(0x2f7d3f)); leaves.position.set(x, 4, z); place(leaves);
    }
    // home
    box(10, 6, 9, 0xe9dcc3, -70, 15, 0, undefined, 'home');
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.2, 4, 4), std(0xb4543d)); roof.position.set(-70, 8, 15); roof.rotation.y = Math.PI / 4; place(roof, 'home');
    [-73, -67].forEach((x) => windowAt(x, 3.4, 19.55));
    box(1.6, 0.8, 1, 0x222733, -64, 12.2, 0, undefined, 'home');
    box(0.12, 1.4, 0.12, 0x222733, -64.6, 12.2, 0.8); box(0.12, 1.4, 0.12, 0x222733, -63.4, 12.2, 0.8);
    // street cabinet
    box(2.4, 3.2, 1.6, 0x4f7a63, -52, 12, 0, undefined, 'cabinet');
    // cell tower
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 26, 8), std(0xc8ccd6, { metalness: 0.4 })); pole.position.set(-80, 13, -25); place(pole, 'tower');
    for (let i = 0; i < 3; i++) { const a = (i * 2 * Math.PI) / 3; const s = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 0.5), std(0xeeeeee)); s.position.set(-80 + Math.cos(a) * 1.3, 24, -25 + Math.sin(a) * 1.3); s.rotation.y = -a; place(s, 'tower'); }
    for (let i = 0; i < 3; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 })); ring.position.set(-80, 24, -25); ring.rotation.x = Math.PI / 2; ring.userData.phase = i / 3; root.add(ring); world.waves.push(ring); }
    // ISP
    box(14, 9, 12, 0x6f7c9c, -30, 12, 0, undefined, 'isp');
    [-34, -30, -26].forEach((x) => { windowAt(x, 3, 18.05); windowAt(x, 6.4, 18.05); });
    box(0.5, 6, 0.5, 0xc8ccd6, -27, 12, 9);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf0f0f0, { side: THREE.DoubleSide })); dish.position.set(-33, 11, 12); dish.rotation.x = -0.9; place(dish, 'isp');
    // IXP
    box(12, 8, 12, 0x7b6aa9, 0, 0, 0, undefined, 'ixp');
    box(12.4, 0.7, 12.4, 0xa78bfa, 0, 0, 8, { emissive: 0xa78bfa, emissiveIntensity: 0.9 }, 'ixp');
    [-3, 3].forEach((x) => windowAt(x, 4, 6.05));
    // data centre
    box(26, 9, 14, 0x505c75, 22, -18, 0, undefined, 'dc');
    for (let i = 0; i < 8; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.2), std(0x0e2a3a, { emissive: 0x22d3ee, emissiveIntensity: 0.55 })); v.position.set(12 + i * 3, 4, -10.9); root.add(v); }
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16), std(0x222733)); f.position.set(14 + i * 5, 9.3, -18); place(f, 'dc'); }
    // landing station
    box(7, 5, 7, 0x8d8268, 40, 5, 0, undefined, 'landing'); box(7.6, 0.6, 7.6, 0x5c5444, 40, 5, 5, undefined, 'landing'); windowAt(40, 2.4, 8.55);
    // east: remote data centre and city
    box(24, 9, 14, 0x505c75, 190, -10, 0, undefined, 'eastdc');
    for (let i = 0; i < 8; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.2), std(0x0e2a3a, { emissive: 0x22d3ee, emissiveIntensity: 0.55 })); v.position.set(181 + i * 2.6, 4, -2.9); root.add(v); }
    for (let i = 0; i < 10; i++) {
      const w = 4 + rand() * 4, h = 8 + rand() * 20, x = 160 + rand() * 62, z = 18 + rand() * 30;
      box(w, h, w, 0x6a7a93 + Math.floor(rand() * 0x101010), x, z, 0, undefined, 'eastdc');
      for (let k = 0; k < 3; k++) windowAt(x + (k - 1) * (w / 3), 3 + rand() * (h - 5), z + w / 2 + 0.05, 1, 1.2);
    }
    const eastDish = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 18), std(0xf0f0f0)); eastDish.position.set(205, 2.5, 3); eastDish.rotation.z = 2.4; place(eastDish, 'satellite');
    box(0.4, 2, 0.4, 0x999999, 205, 3, 0);
    // cables: land (west) · undersea · land (east) · IXP→DC · tower→ISP
    const pts = [[-70, 0.4, 13], [-52, 0.4, 13], [-30, 0.4, 13], [-12, 0.4, 7], [0, 0.4, 2], [20, 0.4, 6], [40, 0.4, 5], [60, -2, 8], [90, -3, 0], [120, -2, -6], [140, 0.4, -10], [165, 0.4, -10], [190, 0.4, -8]];
    const curveOf = (list) => new THREE.CatmullRomCurve3(list.map((p) => V(p[0], p[1], p[2])));
    const tube = (curve, color, radius = 0.3, seg = 80, id) => { const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 6, false), std(color, { emissive: color, emissiveIntensity: 0.9, roughness: 0.4 })); if (id) m.userData.id = id; root.add(m); return m; };
    const landA = curveOf(pts.slice(0, 7)), seaCurve = curveOf(pts.slice(6, 11)), landB = curveOf(pts.slice(10));
    const ixpDc = curveOf([[0, 0.4, 0], [10, 0.4, -10], [22, 0.4, -16]]);
    const towerIsp = curveOf([[-80, 0.4, -24], [-55, 0.4, -5], [-32, 0.4, 10]]);
    tube(landA, 0x22d3ee); tube(seaCurve, 0xf59e0b, 0.4, 100, 'cable'); tube(landB, 0x22d3ee); tube(ixpDc, 0xa78bfa); tube(towerIsp, 0x34d399);
    world.journeyCurve = curveOf(pts); world.journeyPoints = pts;
    const addPackets = (curve, count, color, speed) => { const length = curve.getLength(); for (let i = 0; i < count; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color })); root.add(m); world.packets.push({ m, curve, length, t: i / count, speed }); } };
    addPackets(landA, 6, 0xffffff, 14); addPackets(seaCurve, 5, 0xfff1c2, 22); addPackets(landB, 3, 0xffffff, 14); addPackets(ixpDc, 3, 0xe9d5ff, 10); addPackets(towerIsp, 3, 0xbbf7d0, 10);
    // satellite + beam
    const sat = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 6), std(0xd9b44a, { metalness: 0.6, roughness: 0.4 })); body.userData.id = 'satellite';
    const pm = std(0x2a5db0, { emissive: 0x16356b, emissiveIntensity: 0.4 });
    const pa = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), pm); pa.position.x = 7; pa.userData.id = 'satellite';
    const pb = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), pm); pb.position.x = -7; pb.userData.id = 'satellite';
    sat.add(body, pa, pb); root.add(sat); world.satellite = sat;
    world.beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 1, 0)]), new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 })); root.add(world.beam);
    world.dish = V(205, 3, 3);
    // night sky
    const sp = []; for (let i = 0; i < 400; i++) { const a = rand() * Math.PI * 2, e = rand() * 1.2 + 0.1, r = 700; sp.push(Math.cos(a) * Math.cos(e) * r + 90, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    world.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false })); world.stars.visible = false; root.add(world.stars);
    // lights
    world.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x3a5a3a, 1.5); root.add(world.hemi);
    world.sun = new THREE.DirectionalLight(0xffffff, 2.4); world.sun.position.set(110, 140, 80); world.sun.target.position.set(80, 0, 0);
    world.sun.castShadow = shadows; world.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(world.sun.shadow.camera, { left: -180, right: 180, top: 130, bottom: -130, near: 10, far: 450 });
    root.add(world.sun, world.sun.target);
    // markers
    for (const s of SIM_SPOTS) this.addLabel(s.id, this.cb.labelFor?.(s.id) || s.id, { pos: V(...s.anchor) }, { prio: 2, cls: 'marker', icon: s.icon });
    this.setNight(this.sim.night);
  }
  setNight(on) {
    this.sim.night = on; const w = this.simWorld; if (!w) return;
    const sky = on ? 0x050816 : 0x9fd3ff; this.scene.background.set(sky); this.scene.fog.color.set(sky);
    w.hemi.intensity = on ? 0.45 : 1.5; w.sun.intensity = on ? 0.35 : 2.4; w.sun.color.set(on ? 0x8fa8ff : 0xffffff);
    w.windows.forEach((m) => { m.emissiveIntensity = on ? 1 : 0; }); w.stars.visible = on;
  }
  setFlow(on) { this.sim.flow = on; }
  setMarkers(on) { this.sim.labels = on; this.labelLayer.classList.toggle('off', !on); }
  focusSpot(id) {
    if (id == null) { this.flyTo(VIEWS.simulation); return; }
    const s = SIM_SPOTS.find((x) => x.id === id); if (!s) return;
    this.flyTo({ target: new THREE.Vector3(...s.target), r: s.cam[0], theta: s.cam[1], phi: s.cam[2] });
  }
  /** "Send a message" tour: index into SIM_JOURNEY; null removes the packet */
  tourTo(index) {
    const w = this.simWorld; if (!w) return;
    if (index == null) { this.stopTour(); return; }
    if (!w.fractions) {
      const p = w.journeyPoints; const cum = [0];
      for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]));
      const at = (i) => cum[i] / cum[cum.length - 1];
      w.fractions = [0, at(1), at(2), at(4), at(6), at(8), 1];
    }
    if (!w.tourPacket) { w.tourPacket = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); this.content.add(w.tourPacket); w.tourFrom = 0; w.tourTo = 0; }
    const step = SIM_JOURNEY[index]; if (!step) return;
    w.tourFrom = w.tourAt ?? 0; w.tourTo = w.fractions[index] ?? step.at; w.tourT0 = performance.now();
    this.focusSpot(step.id);
  }
  stopTour() { const w = this.simWorld; if (w?.tourPacket) { this.content.remove(w.tourPacket); w.tourPacket.geometry.dispose(); w.tourPacket.material.dispose(); w.tourPacket = null; w.tourAt = 0; } }

  // ---------------------------------------------------------------- selection & visibility
  select(id) { this.selected = id || null; this.refreshStyles(); }
  setHidden(ids) { this.hidden = new Set(ids); this.applyHidden(); }
  applyHidden() {
    if (this.mode === 'simulation') return;
    for (const u of this.units.values()) { const on = !this.hidden.has(u.layer); for (const m of u.meshes) { m.fill.visible = on; if (m.edge) m.edge.visible = on; if (m.globe) m.globe.visible = on; } }
    if (this.layerGroups) for (const [id, g] of Object.entries(this.layerGroups)) g.visible = !this.hidden.has(id);
    for (const l of this.labels.values()) { const u = this.units.get(l.id); l.hiddenByLayer = !!(u && this.hidden.has(u.layer)); }
  }
  flash(id, kind) { this.flashes.set(id, { kind, until: performance.now() + 1300 }); this.refreshStyles(); setTimeout(() => this.refreshStyles(), 1350); }
  refreshStyles() {
    if (this.mode === 'simulation') { for (const l of this.labels.values()) l.el.classList.toggle('sel', l.id === this.selected); return; }
    const now = performance.now(); const sel = this.selected; const selUnit = sel ? this.units.get(sel) : null;
    for (const u of this.units.values()) {
      const f = this.flashes.get(u.id); const flash = f && f.until > now ? f.kind : null;
      const isSel = u.id === sel; const inSelLayer = selUnit?.isLayer && u.layer === sel;
      const dim = sel && !isSel && !inSelLayer;
      for (const m of u.meshes) {
        const col = flash === 'good' ? new THREE.Color(0x34d399) : flash === 'bad' ? new THREE.Color(0xf87171) : m.color;
        m.fill.material.color.copy(col);
        m.fill.material.opacity = flash ? 0.55 : isSel ? Math.max(0.42, m.base * 2.5) : u.id === this.hover ? m.base * 1.8 : dim ? m.base * 0.35 : m.base;
        if (m.edge) { m.edge.material.color.copy(col); m.edge.material.opacity = dim ? 0.22 : 0.9; }
        if (m.globe) m.globe.children.forEach((c) => { if (c.material !== m.fill.material) { c.material.color.copy(col); c.material.opacity = dim ? 0.25 : 0.9; } });
      }
    }
    for (const l of this.labels.values()) {
      const f = this.flashes.get(l.id); const flash = f && f.until > now ? f.kind : '';
      l.el.classList.toggle('sel', l.id === sel); l.el.classList.toggle('dim', !!sel && l.id !== sel && !(selUnit?.isLayer && this.units.get(l.id)?.layer === sel));
      l.el.classList.toggle('good', flash === 'good'); l.el.classList.toggle('bad', flash === 'bad');
    }
  }
  setHover(id) { this.hover = id; this.refreshStyles(); }
  pickAt(cx, cy) {
    const b = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((cx - b.left) / b.width) * 2 - 1, -((cy - b.top) / b.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.content.children, true);
    // prefer small parts over the big layer slabs / case they sit in
    let best = null;
    for (const h of hits) {
      let o = h.object; while (o && !o.userData.id) o = o.parent; if (!o || !o.visible) continue;
      const id = o.userData.id; const u = this.units.get(id);
      if (u && this.hidden.has(u.layer)) continue;
      if (!best) best = id;
      if (u && !u.isLayer && id !== 'case') return id;
      if (this.mode === 'simulation') return id;
    }
    return best;
  }

  // ---------------------------------------------------------------- camera
  /** narrow (portrait / phone) stages need the camera further back to fit the same model */
  fit(v) { const a = this.camera.aspect || 1.6; const k = a < 1.35 ? Math.min(2.1, Math.pow(1.35 / a, 0.85)) : 1; return { ...v, r: Math.min(v.maxR ?? v.r * 3, v.r * k) }; }
  jump(view) { const v = this.fit(view); this.tween = null; this.controls.target.copy(v.target); this.camera.position.copy(sph(v.target, v.r, v.theta, v.phi)); this.controls.update(); }
  flyTo(view, ms = 1300) {
    const v = view.maxR ? this.fit(view) : view;
    const fromT = this.controls.target.clone(); const off = this.camera.position.clone().sub(fromT);
    const s0 = new THREE.Spherical().setFromVector3(off);
    let dTheta = v.theta - s0.theta; dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    this.tween = { fromT, toT: v.target.clone(), r0: s0.radius, r1: v.r, th0: s0.theta, dTh: dTheta, ph0: s0.phi, ph1: v.phi, t0: performance.now(), ms: this.reduced ? 1 : ms };
  }
  reset() { this.flyTo(VIEWS[this.mode]); }
  zoom(f) {
    const t = this.controls.target; const off = this.camera.position.clone().sub(t);
    const r = THREE.MathUtils.clamp(off.length() * f, this.controls.minDistance, this.controls.maxDistance);
    this.tween = null; this.camera.position.copy(t).addScaledVector(off.normalize(), r); this.controls.update();
  }
  setAuto(on) { this.auto = on; }

  // ---------------------------------------------------------------- loop
  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    for (const l of this.labels.values()) l.w = 0;
  }
  loop() {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.visible || document.hidden) return;
    const t = this.clock.elapsedTime; const now = performance.now();

    if (this.tween) {
      const tw = this.tween; const k = Math.min(1, (now - tw.t0) / tw.ms); const e = ease(k);
      const tgt = tw.fromT.clone().lerp(tw.toT, e);
      const s = new THREE.Spherical(tw.r0 + (tw.r1 - tw.r0) * e, tw.ph0 + (tw.ph1 - tw.ph0) * e, tw.th0 + tw.dTh * e);
      this.controls.target.copy(tgt); this.camera.position.copy(tgt).add(new THREE.Vector3().setFromSpherical(s));
      if (k >= 1) this.tween = null;
    } else if (this.auto && this.mode !== 'simulation' && !this.interacting && now - this.lastInteract > 3500) {
      // slow turntable, like the reference's auto-spin
      const off = this.camera.position.clone().sub(this.controls.target); off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.16);
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.controls.update();

    if (Math.abs(this.gap - this.gapTarget) > 0.0005) { this.gap += (this.gapTarget - this.gap) * (1 - Math.exp(-dt * 7)); this.layoutLayers(); }
    if (!this.reduced) {
      for (const g of this.globes || []) g.rotation.y += dt * 0.6;
      for (const r of this.risers || []) { const h = 3 * this.gap; r.dots.forEach((d) => { const k = (t * 0.22 + d.userData.phase) % 1; d.position.set(r.x, k * h, r.z); d.visible = this.gap > 0.4; }); }
    }
    if (this.packetTween && this.packet) {
      const p = this.packetTween; const k = Math.min(1, (now - p.t0) / p.ms); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.packet.position.lerpVectors(p.from, p.to, e); this.packet.position.y += Math.sin(k * Math.PI) * 0.4; this.packet.rotation.y += dt * 2;
      if (k >= 1) this.packetTween = null;
    }
    const w = this.simWorld;
    if (w) {
      if (this.sim.flow) for (const p of w.packets) { p.t = (p.t + (p.speed * dt) / p.length) % 1; p.m.position.copy(p.curve.getPointAt(p.t)); }
      for (const ring of w.waves) { const k = (t * 0.6 + ring.userData.phase) % 1; ring.scale.setScalar(0.4 + k * 4); ring.material.opacity = 0.8 * (1 - k); }
      const a = t * 0.18; w.satellite.position.set(100 + Math.cos(a) * 85, 56, -10 + Math.sin(a) * 55); w.satellite.rotation.y = -a;
      const pos = w.beam.geometry.attributes.position; pos.setXYZ(0, w.satellite.position.x, w.satellite.position.y, w.satellite.position.z); pos.setXYZ(1, w.dish.x, w.dish.y, w.dish.z); pos.needsUpdate = true;
      if (w.tourPacket) {
        const k = Math.min(1, (now - w.tourT0) / (this.reduced ? 1 : 1800)); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        w.tourAt = w.tourFrom + (w.tourTo - w.tourFrom) * e; w.tourPacket.position.copy(w.journeyCurve.getPointAt(Math.min(1, Math.max(0, w.tourAt)))); w.tourPacket.position.y += 1.2;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.placeLabels();
  }
  /** project HTML labels; higher priority first, nudge up once on collision, otherwise hide (selected always shown) */
  placeLabels() {
    const W = this.container.clientWidth, H = this.container.clientHeight;
    const list = [];
    for (const l of this.labels.values()) {
      const showMini = l.id === this.selected || l.id === this.hover;
      if (l.hiddenByLayer || (l.mini && !showMini) || (this.mode === 'simulation' && !this.sim.labels)) { l.el.style.visibility = 'hidden'; continue; }
      const a = l.anchor.pos ? this._v.copy(l.anchor.pos) : this._v.copy(l.anchor.offset).add(l.anchor.obj.position);
      a.project(this.camera);
      if (a.z > 1 || a.x < -1.15 || a.x > 1.15 || a.y < -1.15 || a.y > 1.15) { l.el.style.visibility = 'hidden'; continue; }
      if (!l.w) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
      const x = (a.x * 0.5 + 0.5) * W, y = (-a.y * 0.5 + 0.5) * H;
      const p = l.id === this.selected ? 10 : l.id === this.hover ? 9 : l.prio;
      list.push({ l, x, y, p, z: a.z });
    }
    list.sort((A, B) => B.p - A.p || A.z - B.z);
    const placed = [];
    for (const it of list) {
      const { l } = it; let x = it.x - l.w / 2, y = it.y - l.h; let ok = false;
      for (let k = 0; k < 3 && !ok; k++) {
        const r = { x, y: y - k * (l.h + 3), w: l.w, h: l.h };
        if (!placed.some((q) => r.x < q.x + q.w + 2 && r.x + r.w + 2 > q.x && r.y < q.y + q.h && r.y + r.h > q.y)) { ok = true; y = r.y; }
      }
      if (!ok && it.p < 9) { l.el.style.visibility = 'hidden'; continue; }
      placed.push({ x, y, w: l.w, h: l.h });
      l.el.style.visibility = 'visible';
      l.el.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
      l.el.style.zIndex = String(10 + it.p);
    }
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect(); this.controls.dispose();
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this._down); dom.removeEventListener('pointerup', this._up);
    dom.removeEventListener('pointermove', this._move); dom.removeEventListener('pointerleave', this._leave);
    disposeTree(this.scene); this.renderer.dispose(); this.renderer.forceContextLoss?.();
    dom.remove(); this.labelLayer.remove(); this.labels.clear(); this.units.clear();
  }
}
