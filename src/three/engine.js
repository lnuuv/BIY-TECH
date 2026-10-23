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
    this.xrActive = false; this.xrSession = null; this.hitTestSource = null; this.arPlaced = false;
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
    for (const p of Object.values(this.parts)) { p.f = p.initialFactor ?? p.fTarget ?? 0; p.fTarget = p.f; p.h = 0; p.hTarget = 0; }
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
    if (this.xrActive) {
      const span = Math.max(this.size.x, this.size.y, this.size.z) || 1;
      this.root.scale.setScalar(0.45 / span);
      this.root.visible = this.arPlaced;
    }
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
    const dist = exploded ? Math.max(this.homeDist, this.fitDistance(box)) : this.homeDist;
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
    const d = this.camera.position.clone().sub(this.controls.target).normalize();
    this.flyTo(this.homeTarget, d, this.homeDist, dur);
  }

  // ---------- parts ----------
  setExploded(on, dur = 1.2) { for (const id of Object.keys(this.parts)) if (this.parts[id].explode) this.setPartFactor(id, on ? 1 : 0, dur); this.exploded = on; if (dur > 0.05) this.fitView(on, dur); }
  setPartFactor(id, target, dur = 1.0) {
    const p = this.parts[id]; if (!p) return;
    const from = p.f; p.fTarget = target;
    this.tween(this.reduced ? 0.001 : dur, (k) => { p.f = from + (target - from) * ease(k); }, `f:${id}`);
  }
  select(id) {
    if (id === this.selectedId) id = id; // re-select keeps focus
    this.selectedId = id || null;
    if (id) this.focusPart(id); else this.resetView(1.0);
    this.opts.onSelect?.(id || null);
  }
  focusPart(id) {
    const p = this.parts[id]; if (!p) return;
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
    const want = new Set();
    const w = this.container.clientWidth, h = this.container.clientHeight;
    for (const [id, p] of Object.entries(this.parts)) {
      if (p.visible === false) continue;
      if (!(show || id === this.selectedId || id === this.hoverId)) continue;
      const text = this.opts.labelText?.(id, id === this.selectedId || id === this.hoverId); if (!text) continue;
      want.add(id);
      let el = this.labelEls.get(id);
      if (!el) { el = document.createElement('div'); el.className = 'v3d-label'; el.textContent = text; this.labelLayer.appendChild(el); this.labelEls.set(id, el); }
      if (el.textContent !== text) el.textContent = text;
      const a = p.anchor ? p.group.localToWorld(p.anchor.clone()) : p.group.getWorldPosition(this._v);
      const v = a.clone().project(this.camera);
      const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      el.style.opacity = on ? (id === this.selectedId || id === this.hoverId ? '1' : '0.92') : '0';
      el.classList.toggle('is-active', id === this.selectedId);
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -130%)`;
    }
    for (const [id, el] of this.labelEls) if (!want.has(id)) { el.remove(); this.labelEls.delete(id); }
  }
  setLabels(on) { this.opts.labels = on; }

  async startAR(onStateChange) {
    if (!navigator.xr) {
      throw new Error('Immersive AR is not supported in this browser.');
    }
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['local-floor', 'dom-overlay'],
      domOverlay: { root: this.container.parentElement },
    });
    this.xrSession = session;
    try {
      this.renderer.xr.enabled = true;
      try { this.renderer.xr.setReferenceSpaceType('local-floor'); } catch { this.renderer.xr.setReferenceSpaceType('local'); }
      await this.renderer.xr.setSession(session);
      this.xrActive = true;
      this.onARStateChange = onStateChange;
      this.onARStateChange?.(true);
      this.arPlaced = false;
      this.arAutoRotate = this.opts.autoRotate;
      this.opts.autoRotate = false;
      this.controls.enabled = false;
      this.ground.visible = false;
      const span = Math.max(this.size.x, this.size.y, this.size.z) || 1;
      this.root.scale.setScalar(0.45 / span);
      this.root.position.set(0, 0, 0);
      this.root.visible = false;

      const ringGeometry = new THREE.RingGeometry(0.08, 0.11, 32);
      ringGeometry.rotateX(-Math.PI / 2);
      this.reticle = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      this.reticle.matrixAutoUpdate = false;
      this.reticle.visible = false;
      this.scene.add(this.reticle);

      this.arController = this.renderer.xr.getController(0);
      this.arController.addEventListener('select', this._placeARModel = () => {
        if (!this.reticle?.visible) return;
        this.root.position.setFromMatrixPosition(this.reticle.matrix);
        this.root.quaternion.setFromRotationMatrix(this.reticle.matrix);
        this.root.visible = true;
        this.arPlaced = true;
      });
      this.scene.add(this.arController);

      const viewerSpace = await session.requestReferenceSpace('viewer');
      this.hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      session.addEventListener('end', this._onAREnd = () => this.finishAR());
      cancelAnimationFrame(this.raf);
      this.clock.start();
      this.renderer.setAnimationLoop((time, frame) => {
        if (!frame) return;
        const refSpace = this.renderer.xr.getReferenceSpace();
        const hit = this.hitTestSource && frame.getHitTestResults(this.hitTestSource)[0];
        const pose = hit && refSpace && hit.getPose(refSpace);
        if (pose && this.reticle) {
          this.reticle.matrix.fromArray(pose.transform.matrix);
          this.reticle.visible = true;
        } else if (this.reticle) {
          this.reticle.visible = false;
        }
        this.updateFrame(Math.min(0.05, this.clock.getDelta()));
      });
    } catch (error) {
      if (session) await session.end().catch(() => {});
      this.finishAR();
      throw error;
    }
  }

  resetARPlacement() {
    if (!this.xrActive) return;
    this.arPlaced = false;
    this.root.visible = false;
  }

  async exitAR() {
    if (this.xrSession) await this.xrSession.end();
  }

  finishAR() {
    if (!this.xrActive && !this.xrSession) return;
    this.xrActive = false;
    this.xrSession = null;
    this.onARStateChange?.(false);
    this.onARStateChange = null;
    this.renderer.setAnimationLoop(null);
    this.hitTestSource?.cancel();
    this.hitTestSource = null;
    if (this.arController) {
      this.arController.removeEventListener('select', this._placeARModel);
      this.scene.remove(this.arController);
      this.arController = null;
    }
    if (this.reticle) {
      this.scene.remove(this.reticle);
      this.reticle.geometry.dispose();
      this.reticle.material.dispose();
      this.reticle = null;
    }
    this.renderer.xr.enabled = false;
    this.root.visible = true;
    this.root.position.set(0, 0, 0);
    this.root.quaternion.identity();
    this.root.scale.setScalar(1);
    this.ground.visible = true;
    this.controls.enabled = true;
    this.opts.autoRotate = this.arAutoRotate ?? this.opts.autoRotate;
    if (!this.disposed) this.raf = requestAnimationFrame(this.loop);
  }

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

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the model comfortably framed on narrow (portrait) viewports
    this.camera.fov = w / h < 0.9 ? 50 : 38;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    if (this.disposed) return;
    if (this.xrActive) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this.updateFrame(dt);
  }

  updateFrame(dt) {
    if (this.disposed) return;
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
    if (!this.reduced && this.model?.float !== false) this.root.position.y = Math.sin(t * 0.8) * 0.025 * this.rotMix;
    // hover picking
    if (this.pointerInside && this.pointerDirty && !this.interacting) { this.pointerDirty = false; this.setHover(this.pick()); }
    this.controls.update();
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
    if (this.xrSession) this.xrSession.end().catch(() => {});
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

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose(); });
  });
}
