// Generic interactive 3D viewer (three.js). Model-agnostic: a "model" is { group, parts: {id: {group, explode:Vector3, ...}}, update?(t,dt), home?:{dir,dist,target} }.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class Viewer {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = { autoRotate: true, labels: false, ...opts };
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.quality = this.touch || (navigator.hardwareConcurrency || 4) <= 4 ? 'medium' : 'high';
    this.tweens = [];
    this.parts = {};
    this.hoverId = null; this.selectedId = null;
    this.rotMix = 1; this.lastInteract = -1e9; this.interacting = false;
    this.clock = new THREE.Clock();
    this.visible = true; this.disposed = false;
    this.labelEls = new Map();
    this.frameTimes = [];
    this._v = new THREE.Vector3();

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: this.quality === 'high', alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = this.quality === 'high';
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    r.domElement.tabIndex = 0;
    r.domElement.setAttribute('role', 'img');
    if (opts.ariaLabel) r.domElement.setAttribute('aria-label', opts.ariaLabel);
    container.appendChild(r.domElement);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'v3d-labels';
    container.appendChild(this.labelLayer);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.75;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
    this.camera.position.set(-4, 3.2, 5);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.07, enablePan: true, screenSpacePanning: true, minDistance: 1.2, maxDistance: 30, rotateSpeed: 0.8, zoomSpeed: 0.8 });
    this.controls.autoRotate = false; // we drive rotation ourselves to get easing
    this.controls.addEventListener('start', () => { this.interacting = true; this.cancelCameraTweens(); });
    this.controls.addEventListener('end', () => { this.interacting = false; this.lastInteract = this.clock.elapsedTime; });

    // lights
    const key = (this.key = new THREE.DirectionalLight(0xffffff, 2.4));
    key.position.set(-4, 7, 5);
    key.castShadow = this.quality === 'high';
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 });
    key.shadow.bias = -0.0004; key.shadow.radius = 4;
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.9); rim.position.set(5, 3, -5);
    const fill = new THREE.HemisphereLight(0xbfd8ff, 0x0b1220, 0.5);
    this.scene.add(key, rim, fill);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(); this.pointerInside = false; this.pointerDirty = false;

    const dom = r.domElement;
    this._onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const b = dom.getBoundingClientRect();
      this.pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      this.pointerInside = true; this.pointerDirty = true;
    };
    this._onLeave = () => { this.pointerInside = false; this.setHover(null); };
    this._onDown = (e) => { this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    this._onUp = (e) => {
      if (!this.downAt) return;
      const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      this.downAt = null;
      if (moved > 6) return;
      const b = dom.getBoundingClientRect();
      this.pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      const id = this.pick();
      this.opts.onPick ? this.opts.onPick(id) : this.select(id);
    };
    dom.addEventListener('pointermove', this._onMove);
    dom.addEventListener('pointerleave', this._onLeave);
    dom.addEventListener('pointerdown', this._onDown);
    dom.addEventListener('pointerup', this._onUp);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((en) => { this.visible = en[0]?.isIntersecting ?? true; });
    this.io.observe(container);
    this._vis = () => { this.clock.getDelta(); };
    document.addEventListener('visibilitychange', this._vis);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------- model ----------
  setModel(model) {
    this.resize();
    if (this.model) { this.root.remove(this.model.group); disposeTree(this.model.group); }
    this.model = model; this.parts = model.parts;
    this.root.add(model.group);
    for (const p of Object.values(this.parts)) { p.f = p.fTarget ?? 0; p.fTarget = p.f; p.h = 0; p.hTarget = 0; }
    this.hoverId = this.selectedId = null;
    this.clearLabels();
    model.group.traverse((o) => { if (o.isMesh) { o.castShadow = this.quality === 'high'; o.receiveShadow = this.quality === 'high'; } });
    this.updateParts(0, true);
    const box = new THREE.Box3();
    box.copy(this.boundsAt(0));
    if (model.home?.fitAll) box.union(this.boundsAt(1));
    this.center = box.getCenter(new THREE.Vector3());
    this.size = box.getSize(new THREE.Vector3());
    this.ground.position.y = box.min.y - 0.02;
    this.key.target.position.copy(this.center); this.scene.add(this.key.target);
    const radius = Math.max(this.size.x, this.size.y, this.size.z);
    const h = model.home || {};
    this.homeDist = h.dist ?? this.fitDistance(box) * 1.0;
    if (model.home?.fitAll) this.homeDist = Math.max(this.homeDist, this.fitDistance(box));
    this.homeTarget = (h.target ? h.target.clone() : this.center.clone());
    const dir = (h.dir ? h.dir.clone() : new THREE.Vector3(-0.8, 0.65, 1)).normalize();
    this.camera.position.copy(this.homeTarget).addScaledVector(dir, this.homeDist);
    this.controls.target.copy(this.homeTarget);
    this.controls.maxDistance = this.homeDist * 3;
    this.controls.minDistance = Math.max(0.6, radius * 0.25);
    this.controls.update();
    this.updateParts(0, true);
    this.renderer.render(this.scene, this.camera);
  }

  /** bounding box with every explodable part forced to factor f (0 assembled … 1 exploded); restores state afterwards */
  boundsAt(f) {
    const saved = [];
    for (const p of Object.values(this.parts)) if (p.explode) { saved.push([p, p.group.position.clone()]); p.group.position.copy(p.home).addScaledVector(p.explode, f); }
    this.model.group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    this.model.group.traverse((o) => { if (o.isMesh && !o.userData.noPick && o.visible) box.expandByObject(o); });
    for (const [p, pos] of saved) p.group.position.copy(pos);
    this.model.group.updateMatrixWorld(true);
    return box;
  }
  fitDistance(box) { const r = box.getSize(new THREE.Vector3()).length() / 2; const v = THREE.MathUtils.degToRad(this.camera.fov / 2); const h = Math.atan(Math.tan(v) * this.camera.aspect); return (r / Math.sin(Math.min(v, h))) * 1.0; }
  centerAssembled(dur = 1.4) { if (!this.model) return; const box = this.boundsAt(0); this.flyTo(box.getCenter(new THREE.Vector3()), this.camera.position.clone().sub(this.controls.target).normalize(), this.fitDistance(box) * 1.15, dur); }
  fitView(exploded, dur = 1.2) {
    if (!this.model || this.selectedId) return;
    const box = exploded ? this.boundsAt(1) : null;
    const target = exploded ? box.getCenter(new THREE.Vector3()) : this.homeTarget;
    const dist = exploded ? Math.max(this.homeDist, this.fitDistance(box) * (this.camera.aspect < 0.9 ? 0.92 : 1)) : this.homeDist;
    this.flyTo(target, this.camera.position.clone().sub(this.controls.target).normalize(), dist, dur);
  }

  // ---------- tweening ----------
  tween(dur, fn, key) {
    if (this.reduced) dur = 0.001;
    const t = { t: 0, dur, fn, key };
    this.tweens = this.tweens.filter((x) => !(key && x.key === key));
    this.tweens.push(t);
  }
  cancelCameraTweens() { this.tweens = this.tweens.filter((t) => t.key !== 'cam'); }
  flyTo(target, dir, dist, dur = 1.1) {
    if (this.gyro) { // phone-motion mode: the phone owns the camera's direction; only move closer / further away
      const g = this.gyro; const d0 = g.dist; const d1 = THREE.MathUtils.clamp(dist, this.controls.minDistance, this.controls.maxDistance);
      this.tween(dur, (k) => { g.dist = d0 + (d1 - d0) * ease(k); }, 'gyro');
      return;
    }
    const t0 = this.controls.target.clone();
    const o0 = this.camera.position.clone().sub(t0);
    const d0 = o0.length(); const dir0 = o0.clone().normalize();
    const dirN = dir.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(dir0, dirN);
    const qi = new THREE.Quaternion();
    this.tween(dur, (k) => {
      const e = ease(k);
      this.controls.target.lerpVectors(t0, target, e);
      qi.identity().slerp(q, e);
      const d = d0 + (dist - d0) * e;
      this.camera.position.copy(this.controls.target).addScaledVector(dir0.clone().applyQuaternion(qi), d);
    }, 'cam');
  }
  resetView(dur = 1.1) {
    if (this.gyro) { this.gyro.pre = null; this.gyro.blend = null; this.gyroRecenter(); this.flyTo(this.homeTarget, null, this.homeDist, dur); this.tween(dur, (k) => { this.root.rotation.y *= 1 - ease(k); }, 'rootrot'); return; }
    const d = this.camera.position.clone().sub(this.controls.target).normalize();
    this.flyTo(this.homeTarget, d, this.homeDist, dur);
  }

  // ---------- parts ----------
  /** stagger > 0 takes the parts out one after another (outer parts first) instead of all at once */
  setExploded(on, dur = 1.2, stagger = 0) {
    let ids = Object.keys(this.parts).filter((id) => this.parts[id].explode);
    if (on) ids = ids.reverse();
    ids.forEach((id, i) => this.setPartFactor(id, on ? 1 : 0, dur, stagger * i));
    this.exploded = on;
    if ((this.gyro || this.xr) && this.model) { // parts fly out to one side; slide the whole model back so it stays where it stood
      const g = this.model.group; const from = g.position.clone();
      const to = new THREE.Vector3();
      if (on) { g.position.set(0, 0, 0); const c0 = this.root.worldToLocal(this.boundsAt(0).getCenter(new THREE.Vector3())), c1 = this.root.worldToLocal(this.boundsAt(1).getCenter(new THREE.Vector3())); to.set(c0.x - c1.x, 0, c0.z - c1.z); g.position.copy(from); }
      this.tween(dur + stagger * ids.length * 0.6, (k) => g.position.lerpVectors(from, to, ease(k)), 'shift');
    }
    if (dur > 0.05) this.fitView(on, dur + stagger * ids.length * 0.5);
  }
  setPartFactor(id, target, dur = 1.0, delay = 0) {
    const p = this.parts[id]; if (!p) return;
    p.fTarget = target;
    if (this.reduced) { dur = 0.001; delay = 0; }
    let from = null; const total = dur + delay;
    this.tween(total, (k) => { const kk = clamp01((k * total - delay) / dur); if (kk <= 0) return; if (from === null) from = p.f; p.f = from + (target - from) * ease(kk); }, `f:${id}`);
  }
  select(id) {
    if (id === this.selectedId) id = id; // re-select keeps focus
    this.selectedId = id || null;
    if (this.opts.isolate) this.setIsolate(id || null);
    if (this.gyro) { if (id) this._gyroFocus(id); else this._gyroUnfocus(); }
    else if (id) this.focusPart(id); else this.resetView(1.0);
    this.opts.onSelect?.(id || null);
  }
  focusPart(id) {
    const p = this.parts[id]; if (!p) return;
    if (this.gyro) return; // keep the model where the student placed it
    this.updateParts(0, true);
    const box = new THREE.Box3().setFromObject(p.group);
    // account for the explode target position so we aim where the part will be
    const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3());
    if (p.explode && p.fTarget !== p.f) { const wp = p.group.parent.localToWorld(p.explode.clone()).sub(p.group.parent.getWorldPosition(new THREE.Vector3())); c.addScaledVector(wp, p.fTarget - p.f); }
    const cur = this.camera.position.clone().sub(this.controls.target).normalize();
    const out = c.clone().sub(this.center); out.y = Math.max(out.y, 0) + 0.5;
    const dir = out.lengthSq() > 1e-4 ? cur.clone().multiplyScalar(0.55).add(out.normalize().multiplyScalar(0.45)).normalize() : cur;
    const dist = THREE.MathUtils.clamp(Math.max(s.x, s.y, s.z) * 2.6 + 0.8, this.controls.minDistance, this.homeDist);
    this.flyTo(c, dir, dist, 1.1);
  }
  setHover(id) {
    if (id === this.hoverId) return;
    this.hoverId = id;
    this.renderer.domElement.style.cursor = id ? 'pointer' : '';
    this.opts.onHover?.(id);
  }
  pick() {
    if (!this.model) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.pickRay();
  }
  /** pick using whatever ray is currently set on this.raycaster (screen tap or AR controller) */
  pickRay() {
    if (!this.model) return null;
    const hits = this.raycaster.intersectObject(this.model.group, true);
    for (const h of hits) {
      let o = h.object;
      if (o.userData.noPick) continue;
      while (o) { if (o.userData.partId && this.parts[o.userData.partId]?.pickable !== false && (this.parts[o.userData.partId].visible !== false)) return o.userData.partId; o = o.parent; }
    }
    return null;
  }

  // ---------- labels ----------
  clearLabels() { this.labelEls.forEach((e) => e.remove()); this.labelEls.clear(); }
  updateLabels() {
    const show = this.opts.labels;
    const want = new Set(); const placed = [];
    const w = this.container.clientWidth, h = this.container.clientHeight;
    for (const [id, p] of Object.entries(this.parts)) {
      if (p.visible === false) continue;
      if (!(show || id === this.selectedId || id === this.hoverId)) continue;
      const text = this.opts.labelText?.(id, id === this.selectedId || id === this.hoverId); if (!text) continue;
      want.add(id);
      let el = this.labelEls.get(id);
      if (!el) { el = document.createElement('div'); el.className = 'v3d-label'; el.textContent = text; this.labelLayer.appendChild(el); this.labelEls.set(id, el); }
      if (el.textContent !== text) { el.textContent = text; el._w = 0; }
      const a = p.anchor ? p.group.localToWorld(p.anchor.clone()) : p.group.getWorldPosition(this._v);
      const v = a.clone().project(this.camera);
      const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      el.classList.toggle('is-active', id === this.selectedId);
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
      placed.push({ id, el, x, y, z: v.z, on, top: id === this.selectedId || id === this.hoverId });
    }
    // declutter: when tags would overlap, keep the selected one and the nearest ones, hide the rest
    if (this.opts.declutter) placed.sort((m, n) => (n.top - m.top) || (m.z - n.z));
    const boxes = [];
    for (const l of placed) {
      let vis = l.on;
      if (vis && this.opts.declutter) {
        if (!l.el._w) { l.el._w = l.el.offsetWidth; l.el._h = l.el.offsetHeight; }
        const r = { x0: l.x - l.el._w / 2 - 3, x1: l.x + l.el._w / 2 + 3, y0: l.y - l.el._h * 1.3 - 3, y1: l.y - l.el._h * 0.3 + 3 };
        if (!l.top && boxes.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) vis = false; else boxes.push(r);
      }
      l.el.style.opacity = vis ? (l.top ? '1' : '0.92') : '0';
    }
    for (const [id, el] of this.labelEls) if (!want.has(id)) { el.remove(); this.labelEls.delete(id); }
  }
  setLabels(on) { this.opts.labels = on; }

  updateParts(dt, snap = false) {
    const k = snap ? 1 : 1 - Math.exp(-dt * 10);
    for (const [id, p] of Object.entries(this.parts)) {
      const ht = id === this.selectedId ? 1 : id === this.hoverId ? 0.6 : 0;
      p.h += (ht - p.h) * k;
      if (p.explode) p.group.position.copy(p.home).addScaledVector(p.explode, p.f);
      if (p.onFactor) p.onFactor(p.f);
      if (p.meshes === undefined) {
        p.meshes = [];
        p.group.traverse((o) => { if (o.isMesh && !o.userData.noHighlight && o.material?.emissive) { o.userData._e = o.material.emissive.clone(); o.userData._ei = o.material.emissiveIntensity; p.meshes.push(o); } });
      }
      const pulse = p.h > 0.05 ? 0.38 + 0.14 * Math.sin(this.clock.elapsedTime * 4.5) : 0.38;
      if (Math.abs(p.h - (p._hLast ?? -1)) > 0.002 || p.h > 0.05) {
        p._hLast = p.h;
        for (const m of p.meshes) { m.material.emissive.copy(m.userData._e).lerp(HL, p.h * 0.55); m.material.emissiveIntensity = Math.max(m.userData._ei, p.h * pulse); }
      }
    }
    if (this.model?.guides) this.model.guides(this.parts);
  }

  // ---------- live phone camera behind the model ----------
  /** video: a playing <video> with the camera stream, or null to go back to the normal background */
  setCameraFeed(video) {
    if (this.feed) { this.feed.tex.dispose(); this.feed = null; this.scene.background = null; }
    if (!video) return;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.feed = { video, tex, key: '' };
    this.scene.background = tex;
    this._fitFeed();
  }
  _fitFeed() { // "object-fit: cover" for the camera image, whatever the phone's camera resolution is
    const f = this.feed; const v = f.video; if (!v.videoWidth) return;
    const c = this.renderer.domElement; const key = `${v.videoWidth}x${v.videoHeight}:${c.width}x${c.height}`;
    if (key === f.key) return; f.key = key;
    const va = v.videoWidth / v.videoHeight, ca = c.width / c.height;
    if (va > ca) { f.tex.repeat.set(ca / va, 1); f.tex.offset.set((1 - ca / va) / 2, 0); }
    else { f.tex.repeat.set(1, va / ca); f.tex.offset.set(0, (1 - va / ca) / 2); }
  }

  // ---------- phone-motion mode: the model stays put in the room while the phone turns ----------
  /** returns a promise that resolves true once orientation data actually arrives (false after a timeout) */
  enableGyro() {
    if (this.gyro) return Promise.resolve(true);
    return new Promise((resolve) => {
      const g = { q: null, start: null, base: null, dist: this.camera.position.distanceTo(this.controls.target), dir: null };
      const euler = new THREE.Euler(); const qx = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); const qz = new THREE.Quaternion(); const Z = new THREE.Vector3(0, 0, 1);
      let done = false;
      g.onOrient = (e) => {
        if (e.alpha == null && e.beta == null) return;
        const d2r = THREE.MathUtils.DEG2RAD;
        const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * d2r;
        euler.set((e.beta || 0) * d2r, (e.alpha || 0) * d2r, -(e.gamma || 0) * d2r, 'YXZ');
        const q = new THREE.Quaternion().setFromEuler(euler).multiply(qx).multiply(qz.setFromAxisAngle(Z, -orient));
        g.q = q;
        if (!g.start) {
          g.start = q.clone();
          g.base = this.camera.quaternion.clone();
          g.dir = this.camera.position.clone().sub(this.controls.target).normalize();
          g.target = this.controls.target.clone();
          this.gyro = g; this.controls.enabled = false; this.cancelCameraTweens();
          this._gyroTouch(true);
          if (!done) { done = true; resolve(true); }
        }
      };
      window.addEventListener('deviceorientation', g.onOrient);
      this._gyroPending = g;
      setTimeout(() => { if (!done) { done = true; window.removeEventListener('deviceorientation', g.onOrient); this._gyroPending = null; resolve(false); } }, 1500);
    });
  }
  disableGyro() {
    const g = this.gyro || this._gyroPending; if (!g) return;
    window.removeEventListener('deviceorientation', g.onOrient);
    this._gyroPending = null;
    if (!this.gyro) return;
    this._gyroTouch(false);
    this.gyro = null; this.controls.enabled = true; this.root.rotation.y = 0; this.model?.group.position.set(0, 0, 0);
    this.resetView(0.6);
  }
  /** put the model straight in front of the phone again (also used after switching model) */
  gyroRecenter() {
    const g = this.gyro; if (!g?.q) return;
    g.target = this.homeTarget.clone();
    this.camera.position.copy(g.target).addScaledVector(g.dir, g.dist);
    this.camera.lookAt(g.target);
    g.base = this.camera.quaternion.clone(); g.start = g.q.clone();
  }
  gyroRetarget() { const g = this.gyro; if (!g) return; g.dist = this.homeDist; this.root.rotation.y = 0; this.gyroRecenter(); }
  _gyroCamera() {
    const g = this.gyro; if (!g.q) return;
    // rotate the camera by however much the phone turned since the start; position stays on the start line
    const rel = g.start.clone().invert().multiply(g.q);
    this.camera.quaternion.copy(g.base).multiply(rel);
    if (g.blend) { // glide (instead of jumping) when the view is re-aimed at a part
      const k = clamp01((performance.now() - g.blend.t0) / 700);
      this.camera.quaternion.copy(g.blend.q.clone().slerp(this.camera.quaternion, ease(k)));
      if (k >= 1) g.blend = null;
    }
    this.camera.position.copy(g.target).addScaledVector(g.dir, g.dist);
  }
  /** phone-motion mode: glide the camera to a part (the part ends up straight ahead) */
  _gyroFocus(id) {
    const g = this.gyro; const p = this.parts[id]; if (!g || !p) return;
    if (!g.pre) g.pre = { target: g.target.clone(), dist: g.dist };
    this.updateParts(0, true);
    const box = new THREE.Box3().setFromObject(p.group);
    const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3());
    // far enough that the whole part fits in the half of the screen next to the info card
    this._gyroGlide(c, THREE.MathUtils.clamp(Math.max(this.fitDistance(box) * 1.9, Math.max(s.x, s.y, s.z) * 1.4 + 1), this.controls.minDistance, g.pre.dist));
  }
  _gyroUnfocus() { const g = this.gyro; if (!g?.pre) return; const { target, dist } = g.pre; g.pre = null; this._gyroGlide(target, dist); }
  _gyroGlide(target, dist) {
    const g = this.gyro; if (!g?.q) return;
    g.blend = { q: this.camera.quaternion.clone(), t0: performance.now() };
    g.start = g.q.clone(); // whatever way the phone points now becomes "straight at the part"
    const t0 = g.target.clone(), d0 = g.dist;
    this.tween(0.9, (k) => { const e = ease(k); g.target.lerpVectors(t0, target, e); g.dist = d0 + (dist - d0) * e; }, 'gyro');
  }

  // ---------- focus mode: everything except the chosen part fades to glass ----------
  setIsolate(id, dur = 0.45) {
    if (!this.model) return;
    const keep = new Set();
    if (id) this.parts[id]?.group.traverse((o) => { if (o.isMesh) keep.add(o); });
    const list = [];
    this.model.group.traverse((o) => {
      if (!o.isMesh || !o.material || o === this.blob) return;
      const m = o.material;
      if (!m.userData.ghost) m.userData.ghost = { t: m.transparent, o: m.opacity, dw: m.depthWrite, k: 0 };
      list.push([m, id && !keep.has(o) ? 1 : 0]);
    });
    this.isolated = id;
    const run = (k) => {
      for (const [m, to] of list) {
        const gh = m.userData.ghost; const from = gh.from ?? gh.k;
        gh.k = from + (to - from) * k;
        const on = gh.k > 0.001;
        m.transparent = on ? true : gh.t; m.depthWrite = on ? false : gh.dw;
        m.opacity = on ? Math.min(gh.o, gh.o + (0.1 - gh.o) * gh.k) : gh.o;
        m.needsUpdate = m.needsUpdate || on !== gh.on; gh.on = on;
      }
    };
    for (const [m] of list) m.userData.ghost.from = m.userData.ghost.k;
    if (dur <= 0.01) run(1); else this.tween(dur, (k) => run(ease(k)), 'iso');
  }

  // ---------- phones: when the info card covers one side, show the model in the other half ----------
  setFrameShift(frac, dur = 0.5) {
    const from = this.frameShift || 0;
    this.tween(dur, (k) => { this.frameShift = from + (frac - from) * ease(k); this._applyShift(); }, 'shift-frame');
  }
  _applyShift() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    if (Math.abs(this.frameShift || 0) < 0.002) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, (this.frameShift || 0) * w, 0, w, h);
  }
  // in phone-motion mode one finger spins the model and two fingers bring it closer / further
  _gyroTouch(on) {
    const dom = this.renderer.domElement;
    if (!on) { if (this._gt) { dom.removeEventListener('pointerdown', this._gt.down); dom.removeEventListener('pointermove', this._gt.move); dom.removeEventListener('pointerup', this._gt.up); dom.removeEventListener('pointercancel', this._gt.up); this._gt = null; } return; }
    const pts = new Map(); let pinch = 0;
    const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const down = (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) pinch = spread(); };
    const move = (e) => {
      const p = pts.get(e.pointerId); if (!p || !this.gyro) return;
      if (pts.size === 1) { this.root.rotation.y += (e.clientX - p.x) * 0.012; }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) { const s = spread(); if (pinch > 10) { this.gyro.dist = THREE.MathUtils.clamp(this.gyro.dist * (pinch / s), this.controls.minDistance, this.controls.maxDistance); } pinch = s; this.downAt = null; }
    };
    const up = (e) => { pts.delete(e.pointerId); pinch = pts.size === 2 ? spread() : 0; };
    dom.addEventListener('pointerdown', down); dom.addEventListener('pointermove', move); dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
    this._gt = { down, move, up };
  }

  // ---------- soft contact shadow so the model looks like it stands on the surface ----------
  setContactShadow(on) {
    if (this.blob) { this.blob.parent?.remove(this.blob); this.blob.geometry.dispose(); this.blob.material.map.dispose(); this.blob.material.dispose(); this.blob = null; }
    if (!on || !this.model) return;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const box = this.boundsAt(0); const s = box.getSize(new THREE.Vector3());
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.x * 1.6, s.z * 1.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(this.center.x, box.min.y + 0.005, this.center.z); m.renderOrder = -1; m.userData.noPick = true;
    this.root.add(m); this.blob = m;
  }

  // ---------- iPhone: export the model for Apple's AR Quick Look (real table, true size) ----------
  /**
   * animate: the file plays a loop inside AR Quick Look — assembled → parts come out one by one (with floating
   * name tags) → hold → back together. Apple shows its own play / pause button for it.
   * labels: [{ id, text }] name tags for the key parts (shown while taken apart).
   */
  async exportUSDZ({ exploded = false, animate = false, labels = [] } = {}) {
    if (!this.model) return null;
    const { USDZExporter } = await import('./usdzExporter.js');
    await document.fonts?.ready; // Arabic name tags need the Arabic font loaded
    const sel = this.selectedId; const hov = this.hoverId; this.selectedId = this.hoverId = null;
    const iso = this.isolated; if (iso) this.setIsolate(null, 0);
    const saved = Object.values(this.parts).map((p) => [p, p.f]);
    const shift = this.model.group.position.clone(); this.model.group.position.set(0, 0, 0);
    for (const p of Object.values(this.parts)) { if (p.explode) p.f = exploded && !animate ? 1 : 0; p.h = 0; }
    this.updateParts(0, true);
    const blobVisible = this.blob?.visible; if (this.blob) this.blob.visible = false;
    const box = this.boundsAt(exploded && !animate ? 1 : 0);
    if (animate) box.min.y = Math.min(box.min.y, this.boundsAt(1).min.y); // nothing may sink into the floor
    const scene = new THREE.Scene(); const holder = new THREE.Group(); scene.add(holder);
    holder.scale.setScalar(0.1); // 1 model unit = 10 cm → metres
    const c = box.getCenter(new THREE.Vector3());
    holder.position.set(-c.x * 0.1, -box.min.y * 0.1, -c.z * 0.1);
    holder.updateMatrixWorld(true);
    const copy = this.model.group.clone(true); copy.position.set(0, 0, 0);
    const light = []; const extra = [];
    copy.traverse((o) => {
      if (o.isLine || o.isInstancedMesh) { o.visible = false; return; }
      // rounded boxes have ~800 vertices each; plain boxes (24) keep the AR file small and fast to open on a phone
      const g = o.geometry;
      if (o.isMesh && g.type === 'BoxGeometry' && g.attributes.position.count > 24) {
        if (!g.boundingBox) g.computeBoundingBox();
        const sz = g.boundingBox.getSize(new THREE.Vector3()); const ce = g.boundingBox.getCenter(new THREE.Vector3());
        o.geometry = new THREE.BoxGeometry(sz.x, sz.y, sz.z).translate(ce.x, ce.y, ce.z); light.push(o.geometry);
      }
    });
    holder.add(copy);
    let animation = null;
    try {
      if (animate) animation = this._usdAnimate(copy, holder, labels, extra);
      scene.updateMatrixWorld(true); // true size: the exporter reads world matrices as they are
      const data = await new USDZExporter().parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 512, animation, ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } } });
      return new Blob([data], { type: 'model/vnd.usdz+zip' });
    } finally {
      light.forEach((g) => g.dispose());
      extra.forEach((o) => { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); });
      for (const [p, f] of saved) p.f = f;
      this.model.group.position.copy(shift);
      this.selectedId = sel; this.hoverId = hov;
      if (iso) this.setIsolate(iso, 0);
      if (this.blob) this.blob.visible = blobVisible;
      this.updateParts(0, true);
      this.model.group.updateMatrixWorld(true);
    }
  }
  /** bakes the take-apart / put-together loop into per-mesh matrix keyframes on the cloned meshes */
  _usdAnimate(copy, holder, labels, extra) {
    const STAG = 0.08, DUR = 1.2, T_EX = 1.2, HOLD = 3.0, TAIL = 1.2, STEPS = 6;
    const ids = Object.keys(this.parts).filter((id) => this.parts[id].explode);
    const outOrder = [...ids].reverse(); // same order as the on-screen explode: outer parts first
    const exEnd = T_EX + STAG * (ids.length - 1) + DUR;
    const T_AS = exEnd + HOLD;
    const end = T_AS + STAG * (ids.length - 1) + DUR + TAIL;
    const startOut = (id) => T_EX + STAG * outOrder.indexOf(id);
    const startIn = (id) => T_AS + STAG * ids.indexOf(id);
    const fAt = (id, t) => ease(clamp01((t - startOut(id)) / DUR)) - ease(clamp01((t - startIn(id)) / DUR));
    const keys = (id) => { const k = []; for (let j = 0; j <= STEPS; j++) k.push(startOut(id) + (DUR * j) / STEPS, startIn(id) + (DUR * j) / STEPS); return k; };
    const setTime = (t) => { for (const id of ids) this.parts[id].f = fAt(id, t); this.updateParts(0, true); this.model.group.updateMatrixWorld(true); };
    // which moving parts each mesh hangs under (a CPU sits in the board, which itself moves)
    const groupToId = new Map(Object.entries(this.parts).map(([id, p]) => [p.group, id]));
    const orig = []; this.model.group.traverse((o) => orig.push(o));
    const clones = []; copy.traverse((o) => clones.push(o));
    const rootInv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const toExport = (m) => new THREE.Matrix4().multiplyMatrices(holder.matrixWorld, rootInv).multiply(m);
    const bySet = new Map();
    orig.forEach((o, i) => {
      if (!o.isMesh || !clones[i]?.isMesh || !clones[i].visible) return;
      const movers = []; for (let a = o; a && a !== this.model.group; a = a.parent) { const id = groupToId.get(a); if (id && this.parts[id].explode) movers.push(id); }
      if (!movers.length) return;
      const key = movers.sort().join('|');
      if (!bySet.has(key)) bySet.set(key, { movers, items: [] });
      bySet.get(key).items.push([o, clones[i]]);
    });
    for (const { movers, items } of bySet.values()) {
      const times = [...new Set([0, end, ...movers.flatMap(keys)].map((t) => +t.toFixed(3)))].sort((a, b) => a - b);
      for (const [, cl] of items) cl.userData.usdSamples = [];
      for (const t of times) { setTime(t); for (const [o, cl] of items) cl.userData.usdSamples.push([t, toExport(o.matrixWorld)]); }
    }
    // floating name tags: appear once a part is out, disappear before it goes back in. They face the side the
    // model is normally looked at from (the glass side of the PC).
    const face = (this.model.home?.dir || new THREE.Vector3(-0.8, 0.65, 1)).clone().setY(0).normalize();
    const yaw = Math.atan2(face.x, face.z);
    setTime(exEnd);
    for (const { id, text } of labels) {
      const p = this.parts[id]; if (!p || !text) continue;
      const tag = makeTag(text); extra.push(tag);
      const a = p.anchor ? p.group.localToWorld(p.anchor.clone()) : p.group.getWorldPosition(new THREE.Vector3());
      const shown = new THREE.Matrix4().compose(a.clone().add(new THREE.Vector3(0, 0.45, 0)).addScaledVector(face, 0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
      // tucked away (tiny, inside the case) while hidden, so they never stretch the model's size for AR Quick Look
      const hidden = new THREE.Matrix4().compose(this.center.clone(), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(0.001, 0.001, 0.001));
      const tIn = (outOrder.indexOf(id) >= 0 ? startOut(id) : T_EX) + DUR * 0.8, tOut = (ids.indexOf(id) >= 0 ? startIn(id) : T_AS) - 0.1;
      const pop = (k) => shown.clone().scale(new THREE.Vector3(k, k, k));
      tag.userData.usdSamples = [[0, toExport(hidden)], [tIn, toExport(hidden)], [tIn + 0.15, toExport(pop(1.12))], [tIn + 0.3, toExport(shown)], [tOut, toExport(shown)], [tOut + 0.25, toExport(hidden)], [end, toExport(hidden)]];
      tag.matrixAutoUpdate = false; tag.matrix.copy(rootInv.clone().multiply(hidden)); // static fallback = hidden
      holder.add(tag);
    }
    setTime(0);
    return { fps: 24, end };
  }
  // ---------- WebXR augmented reality (Android Chrome / ARCore) ----------
  // The model is placed on a real surface at true size (1 unit = 10 cm → scale 0.1).
  // hooks: { onStatus(status: 'searching'|'found'|'placed'), onPick(id), onEnd() }
  async startXR(session, hooks = {}) {
    if (!this.model || this.xr) return;
    const r = this.renderer;
    r.xr.enabled = true;
    r.xr.setReferenceSpaceType('local');
    await r.xr.setSession(session);
    cancelAnimationFrame(this.raf);
    const xr = (this.xr = { session, hooks, placed: false, status: null, scale: 0.1 });
    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      xr.hitSource = await session.requestHitTestSource({ space: viewerSpace });
    } catch (e) { console.warn('hit-test unavailable', e); }

    // aiming ring that sticks to detected surfaces
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.09, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 }));
    ring.add(new THREE.Mesh(new THREE.CircleGeometry(0.07, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18 })));
    ring.matrixAutoUpdate = false; ring.visible = false; this.scene.add(ring); xr.reticle = ring;

    // anchor group that holds the model in the real world
    const anchor = new THREE.Group(); anchor.visible = false; this.scene.add(anchor); xr.anchor = anchor;
    xr.saved = { pos: this.root.position.clone(), ground: this.ground.visible };
    const bottom = this.ground.position.y + 0.02;
    this.scene.remove(this.root); anchor.add(this.root);
    this.root.position.set(-this.center.x, -bottom, -this.center.z);
    this.ground.visible = false;
    this.selectedId = null; this.hoverId = null;

    const ctrl = r.xr.getController(0); this.scene.add(ctrl); xr.ctrl = ctrl;
    xr.onSelect = () => this._xrTap();
    ctrl.addEventListener('select', xr.onSelect);
    xr.onEnd = () => this._xrEnded();
    session.addEventListener('end', xr.onEnd);
    this.clock.getDelta();
    r.setAnimationLoop((time, frame) => this._xrFrame(frame));
    this._xrStatus('searching');
  }
  stopXR() { this.xr?.session.end().catch(() => this._xrEnded()); }
  /** pinch-to-resize while in AR; factor is relative to the scale when the pinch started */
  xrScaleBy(factor) { const xr = this.xr; if (!xr?.placed) return; xr.scale = THREE.MathUtils.clamp(xr.scale * factor, 0.015, 0.6); xr.anchor.scale.setScalar(xr.scale); }
  xrRotateBy(rad) { if (this.xr?.placed) this.xr.anchor.rotation.y += rad; }
  xrReplace() { const xr = this.xr; if (!xr) return; xr.placed = false; xr.anchor.visible = false; this._xrStatus('searching'); }
  _xrStatus(s) { if (this.xr && this.xr.status !== s) { this.xr.status = s; this.xr.hooks.onStatus?.(s); } }
  _xrTap() {
    const xr = this.xr; if (!xr) return;
    if (xr.hooks.ignoreTap?.()) return; // e.g. the tap was part of a two-finger pinch
    if (!xr.placed) {
      if (!xr.reticle.visible) return;
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      xr.reticle.matrix.decompose(p, q, s);
      xr.anchor.position.copy(p);
      xr.anchor.scale.setScalar(xr.scale);
      // turn the model so the side it is normally viewed from faces the student
      const cam = this.renderer.xr.getCamera().getWorldPosition(new THREE.Vector3());
      const d = (this.model.home?.dir || new THREE.Vector3(-0.8, 0.65, 1));
      xr.anchor.rotation.set(0, Math.atan2(cam.x - p.x, cam.z - p.z) - Math.atan2(d.x, d.z), 0);
      xr.anchor.visible = true; xr.reticle.visible = false; xr.placed = true;
      this._xrStatus('placed');
      return;
    }
    const m = new THREE.Matrix4().extractRotation(xr.ctrl.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(xr.ctrl.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
    const id = this.pickRay();
    this.selectedId = id || null;
    xr.hooks.onPick?.(id || null);
  }
  _xrFrame(frame) {
    const xr = this.xr; if (!xr) return;
    const dt = Math.min(0.05, this.clock.getDelta()); const t = this.clock.elapsedTime;
    if (this.tweens.length) { for (const tw of this.tweens) if (tw.key !== 'cam') { tw.t += dt; tw.fn(clamp01(tw.t / tw.dur)); } this.tweens = this.tweens.filter((tw) => tw.key !== 'cam' && tw.t < tw.dur); }
    if (!xr.placed && frame && xr.hitSource) {
      const hits = frame.getHitTestResults(xr.hitSource);
      const ref = this.renderer.xr.getReferenceSpace();
      const pose = hits.length ? hits[0].getPose(ref) : null;
      if (pose) { xr.reticle.visible = true; xr.reticle.matrix.fromArray(pose.transform.matrix); this._xrStatus('found'); }
      else { xr.reticle.visible = false; this._xrStatus('searching'); }
    }
    this.model?.update?.(t, dt);
    this.updateParts(dt);
    this.renderer.render(this.scene, this.camera);
  }
  _xrEnded() {
    const xr = this.xr; if (!xr) return;
    this.xr = null;
    const r = this.renderer;
    r.setAnimationLoop(null);
    xr.ctrl.removeEventListener('select', xr.onSelect); xr.session.removeEventListener('end', xr.onEnd);
    xr.hitSource?.cancel?.();
    this.scene.remove(xr.reticle, xr.ctrl, xr.anchor);
    xr.anchor.remove(this.root); this.scene.add(this.root);
    this.root.position.copy(xr.saved.pos); this.ground.visible = xr.saved.ground;
    r.xr.enabled = false;
    this.resize(); this.resetView(0.01);
    this.clock.getDelta();
    if (!this.disposed) this.raf = requestAnimationFrame(this.loop);
    xr.hooks.onEnd?.();
  }

  resize() {
    if (this.xr) return; // the XR session owns the canvas size while AR is running
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the model comfortably framed on narrow (portrait) viewports
    this.camera.fov = w / h < 0.9 ? 50 : 38;
    this.camera.updateProjectionMatrix();
    if (this.frameShift) this._applyShift();
  }

  loop() {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    // tweens
    if (this.tweens.length) {
      for (const tw of this.tweens) { tw.t += dt; tw.fn(clamp01(tw.t / tw.dur)); }
      this.tweens = this.tweens.filter((tw) => tw.t < tw.dur);
    }
    // ambient rotation with easing: pauses while interacting / something is selected / hovered, resumes smoothly
    const idle = !this.interacting && !this.selectedId && !this.hoverId && t - this.lastInteract > 2.2 && !this.tweens.some((x) => x.key === 'cam');
    const target = this.opts.autoRotate && idle && !this.reduced ? 1 : 0;
    this.rotMix += (target - this.rotMix) * (1 - Math.exp(-dt * (target ? 0.9 : 5)));
    if (this.rotMix > 0.003) {
      const ang = dt * 0.16 * this.rotMix; // ~ 1 revolution / 40 s at full speed
      const off = this.camera.position.clone().sub(this.controls.target);
      off.applyAxisAngle(THREE.Object3D.DEFAULT_UP, ang);
      this.camera.position.copy(this.controls.target).add(off);
    }
    if (!this.reduced && this.model?.float !== false && !this.gyro && !this.feed) this.root.position.y = Math.sin(t * 0.8) * 0.025 * this.rotMix;
    // hover picking
    if (this.pointerInside && this.pointerDirty && !this.interacting) { this.pointerDirty = false; this.setHover(this.pick()); }
    if (this.gyro) this._gyroCamera(); else this.controls.update();
    if (this.feed) this._fitFeed();
    this.model?.update?.(t, dt);
    this.updateParts(dt);
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
    // adaptive quality: drop resolution if the device struggles
    this.frameTimes.push(dt); if (this.frameTimes.length > 90) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length; this.frameTimes = [];
      if (avg > 0.034 && this.renderer.getPixelRatio() > 1) { this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled = false; this.key.castShadow = false; this.resize(); }
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    if (this.xr) { const s = this.xr.session; this.xr = null; this.renderer.setAnimationLoop(null); s.end().catch(() => {}); }
    this.ro.disconnect(); this.io.disconnect();
    document.removeEventListener('visibilitychange', this._vis);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this._onMove); dom.removeEventListener('pointerleave', this._onLeave);
    dom.removeEventListener('pointerdown', this._onDown); dom.removeEventListener('pointerup', this._onUp);
    this.controls.dispose();
    if (this.model) disposeTree(this.model.group);
    this.envTex.dispose(); this.ground.geometry.dispose(); this.ground.material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    dom.remove(); this.labelLayer.remove();
  }
}

const HL = new THREE.Color(0x22d3ee);

/** a flat name tag (pill with text) for the AR file; 1 unit = 10 cm, so a tag is ~3 cm tall */
function makeTag(text) {
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  const font = '700 64px "IBM Plex Sans Arabic", Inter, Arial, sans-serif';
  g.font = font; const w = Math.ceil(g.measureText(text).width) + 72; c.width = Math.min(2048, w); c.height = 112;
  g.font = font; g.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr';
  const r = 52; g.fillStyle = 'rgba(9,14,25,0.92)'; g.strokeStyle = '#38bdf8'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(r, 4); g.arcTo(c.width - 4, 4, c.width - 4, c.height - 4, r); g.arcTo(c.width - 4, c.height - 4, 4, c.height - 4, r); g.arcTo(4, c.height - 4, 4, 4, r); g.arcTo(4, 4, c.width - 4, 4, r); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const h = 0.32; const m = new THREE.Mesh(new THREE.PlaneGeometry((h * c.width) / c.height, h),
    new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 1, transparent: true, alphaTest: 0.4, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
  return m;
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose(); });
  });
}
