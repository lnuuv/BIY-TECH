// Interactive 3D Networking Lab Scene Controller (Three.js)
// Manages the 3D laboratory environment, realistic animated hardware nodes, port-to-port 3D cables
// with live ambient traffic pulses, raycast picking, floor-plane device dragging, camera presets,
// and multi-layered 3D packet animations with comet trails, shockwaves, and protocol HUD badges.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildNetDevice3D } from './netModels.js';
import { disposeTree } from './engine.js';
import * as S from '../lab/sim.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const CABLE_COLORS = {
  straight: 0x2563eb,
  crossover: 0xf59e0b,
  fiber: 0x10b981,
  wifi: 0x38bdf8,
};

export class NetLabScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.cbs = callbacks;
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.quality = this.touch || (navigator.hardwareConcurrency || 4) <= 4 ? 'medium' : 'high';
    this.disposed = false;
    this.visible = true;
    this.clock = new THREE.Clock();
    this.tweens = [];

    // Scene state synchronized from React
    this.model = S.emptyModel();
    this.cfgs = new Map();
    this.conflicts = [];
    this.sel = null;         // { type: 'dev' | 'link', id }
    this.hover = null;       // { type: 'dev' | 'link' | 'port', id, deviceId, portId }
    this.conn = null;        // { d, p, cableType }
    this.toolMode = 'select';// 'select' | 'connect'
    this.cableType = 'auto';
    this.showLabels = true;
    this.showGrid = true;
    this.snapGrid = true;
    this.liveTraffic = true;
    this.followPacket = false;
    this.autoOrbit = false;
    this.animSpeed = 1.0;
    this.failDevId = null;
    this.hotDevs = new Set();
    this.hotLinks = new Set();

    // 3D entity maps
    this.devNodes = new Map(); // devId -> buildNetDevice3D result
    this.linkNodes = new Map();// linkId -> { id, group, tubeMesh, mat, curve, kind, cableType, baseColor, sig, drawProgress, totalIdx, flowOrb, flowPhase }
    this.labelEls = new Map(); // devId -> DOM element
    this.shockwaves = [];      // active 3D ring shockwaves

    // WebGL Renderer
    const r = (this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality === 'high',
      alpha: true,
      powerPreference: 'high-performance',
    }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.1;
    r.shadowMap.enabled = this.quality === 'high';
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    r.domElement.tabIndex = 0;
    container.appendChild(r.domElement);

    // HTML overlay layer for crisp device labels, interactive port badges & floating packet HUD
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'v3d-labels netlab-labels';
    this.labelLayer.dir = 'ltr';
    container.appendChild(this.labelLayer);

    // Floating Packet Protocol HUD Element
    this.packetHudEl = document.createElement('div');
    this.packetHudEl.className = 'net3d-packet-hud';
    this.packetHudEl.style.opacity = '0';
    this.labelLayer.appendChild(this.packetHudEl);

    // Scene & PBR Environment
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.75;

    // Camera & OrbitControls
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 150);
    this.homePos = V(-1.6, 10.4, 14.8);
    this.homeTarget = V(0.1, 0.2, 0.2);
    this.camera.position.copy(this.homePos);

    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.08,
      enablePan: true,
      screenSpacePanning: false,
      minDistance: 2.2,
      maxDistance: 34,
      maxPolarAngle: Math.PI / 2 - 0.03,
      rotateSpeed: 0.75,
      zoomSpeed: 0.9,
    });
    this.controls.target.copy(this.homeTarget);
    if (this.autoOrbit && !this.dragState && !this.packetAnim && !this.reduced) {
      const off = this.camera.position.clone().sub(this.controls.target);
      off.applyAxisAngle(V(0, 1, 0), dt * 0.22);
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.controls.update();
    this.controls.addEventListener('start', () => {
      this.tweens = this.tweens.filter((t) => t.key !== 'cam');
    });

    // Lighting
    const key = (this.keyLight = new THREE.DirectionalLight(0xffffff, 2.35));
    key.position.set(-8, 15, 10);
    key.castShadow = this.quality === 'high';
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 38 });
    key.shadow.bias = -0.0005;
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rim.position.set(10, 8, -10);
    const fill = new THREE.HemisphereLight(0xdbeafe, 0x090d16, 0.68);
    this.scene.add(key, rim, fill);

    // 3D Lab Floor Platform & Coordinate Grid
    this.floorGroup = new THREE.Group();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1322,
      roughness: 0.86,
      metalness: 0.14,
    });
    this.floorMesh = new THREE.Mesh(new THREE.BoxGeometry(24.8, 0.16, 16.4), floorMat);
    this.floorMesh.position.set(0, -0.08, 0);
    this.floorMesh.receiveShadow = true;
    this.floorMesh.userData = { kind: 'floor', noHighlight: true };
    this.floorGroup.add(this.floorMesh);

    // Subtle glowing lab table border frame
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(24.82, 0.165, 16.42));
    this.borderLineMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.75 });
    const borderLine = new THREE.LineSegments(borderGeo, this.borderLineMat);
    borderLine.position.set(0, -0.08, 0);
    borderLine.userData.noPick = true;
    this.floorGroup.add(borderLine);

    this.gridHelper = new THREE.GridHelper(24, 24, 0x1e3a5f, 0x15233b);
    this.gridHelper.position.y = 0.003;
    this.gridHelper.scale.z = 16 / 24;
    this.gridHelper.userData.noPick = true;
    this.floorGroup.add(this.gridHelper);
    this.scene.add(this.floorGroup);

    // Groups for devices, cables, rubber-band preview cable, and animated packets/shockwaves
    this.devicesGroup = new THREE.Group();
    this.cablesGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.devicesGroup, this.cablesGroup, this.fxGroup);

    // Rubber-band connection preview tube
    this.rubberMesh = null;
    this.cursorWorld = V(0, 0.2, 0);

    // Packet animation state + comet trail
    this.packetAnim = null;
    this.packetGroup = this._createPacketMesh();
    this.packetGroup.visible = false;
    this.fxGroup.add(this.packetGroup);

    // Raycasting & Pointer Dragging State
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(V(0, 1, 0), 0);
    this.dragState = null;

    this._bindEvents();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((en) => { this.visible = en[0]?.isIntersecting ?? true; });
    this.io.observe(container);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  _createPacketMesh() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42, depthWrite: false })
    );
    // Two counter-rotating 3D gyro energy rings around the packet core
    const gyro1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.012, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, depthWrite: false })
    );
    const gyro2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.01, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false })
    );
    gyro2.rotation.x = Math.PI / 2;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.27, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(core, halo, gyro1, gyro2, ring);

    // 10-segment comet particle trail
    const trail = [];
    for (let i = 0; i < 10; i++) {
      const ratio = 1 - i / 10;
      const tm = new THREE.Mesh(
        new THREE.SphereGeometry(0.085 * ratio, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.55 * ratio,
          depthWrite: false,
        })
      );
      tm.visible = false;
      tm.userData.noPick = true;
      this.fxGroup.add(tm);
      trail.push(tm);
    }

    g.userData = { core, halo, gyro1, gyro2, ring, trail, noPick: true };
    return g;
  }

  /** Spawns an expanding 3D floor/port shockwave ring that fades out smoothly. */
  spawnShockwave(pos, color = 0x38bdf8, maxRadius = 1.15, dur = 0.65) {
    if (this.reduced) return;
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.22, 36), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, Math.max(0.028, pos.y), pos.z);
    mesh.userData.noPick = true;
    this.fxGroup.add(mesh);
    this.shockwaves.push({ mesh, mat, t: 0, dur, maxScale: maxRadius / 0.2 });
  }

  _stepShockwaves(dt) {
    if (!this.shockwaves.length) return;
    for (const sw of this.shockwaves) {
      sw.t += dt;
      const k = clamp01(sw.t / sw.dur);
      const e = 1 - Math.pow(1 - k, 3);
      sw.mesh.scale.setScalar(1 + (sw.maxScale - 1) * e);
      sw.mat.opacity = 0.85 * (1 - k);
    }
    const expired = this.shockwaves.filter((sw) => sw.t >= sw.dur);
    for (const sw of expired) {
      this.fxGroup.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      sw.mat.dispose();
    }
    this.shockwaves = this.shockwaves.filter((sw) => sw.t < sw.dur);
  }

  // ---------- Pointer & Drag Interactions ----------
  _updatePointer(e) {
    const b = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
  }

  _intersectFloor() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const pt = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.floorPlane, pt) ? pt : null;
  }

  _pickScene() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const devHits = this.raycaster.intersectObjects(this.devicesGroup.children, true);
    for (const h of devHits) {
      if (h.object.userData?.noPick) continue;
      let o = h.object;
      while (o && o !== this.devicesGroup) {
        if (o.userData?.kind === 'port' && o.userData?.portId && o.userData?.deviceId) {
          return { type: 'port', deviceId: o.userData.deviceId, portId: o.userData.portId };
        }
        o = o.parent;
      }
      o = h.object;
      while (o && o !== this.devicesGroup) {
        if (o.userData?.deviceId) {
          return { type: 'dev', id: o.userData.deviceId };
        }
        o = o.parent;
      }
    }
    const cableHits = this.raycaster.intersectObjects(this.cablesGroup.children, true);
    for (const h of cableHits) {
      let o = h.object;
      while (o && o !== this.cablesGroup) {
        if (o.userData?.linkId) {
          return { type: 'link', id: o.userData.linkId };
        }
        o = o.parent;
      }
    }
    return null;
  }

  _bindEvents() {
    const dom = this.renderer.domElement;

    this._onPointerDown = (e) => {
      if (e.button !== 0) return;
      this._updatePointer(e);
      const hit = this._pickScene();
      this.downInfo = { x: e.clientX, y: e.clientY, hit };

      if (hit?.type === 'dev' && this.toolMode === 'select' && !this.conn) {
        const node = this.devNodes.get(hit.id);
        const floorPt = this._intersectFloor();
        if (node && floorPt) {
          this.controls.enabled = false;
          this.dragState = {
            devId: hit.id,
            offset: node.group.position.clone().sub(floorPt),
            startClient: { x: e.clientX, y: e.clientY },
            moved: false,
          };
          dom.style.cursor = 'grabbing';
        }
      }
    };

    this._onPointerMove = (e) => {
      this._updatePointer(e);
      const floorPt = this._intersectFloor();
      if (floorPt) {
        this.cursorWorld.copy(floorPt);
        this.cursorWorld.y = 0.25;
      }

      if (this.dragState) {
        const dist = Math.hypot(e.clientX - this.dragState.startClient.x, e.clientY - this.dragState.startClient.y);
        if (dist > 4) this.dragState.moved = true;
        if (this.dragState.moved && floorPt) {
          const node = this.devNodes.get(this.dragState.devId);
          if (node) {
            let nx = floorPt.x + this.dragState.offset.x;
            let nz = floorPt.z + this.dragState.offset.z;
            if (this.snapGrid && !e.shiftKey) {
              nx = Math.round(nx * 4) / 4;
              nz = Math.round(nz * 4) / 4;
            }
            nx = Math.max(-11.4, Math.min(11.4, nx));
            nz = Math.max(-7.2, Math.min(7.2, nz));
            node.group.position.set(nx, node.group.position.y, nz);
            node.group.updateMatrixWorld(true);
            this._updateCablesForDevice(this.dragState.devId);
          }
        }
        return;
      }

      const hit = this._pickScene();
      this.hover = hit;
      dom.style.cursor = hit ? 'pointer' : '';
      this._refreshVisualStates();
    };

    this._onPointerUp = (e) => {
      if (this.dragState) {
        const { devId, moved } = this.dragState;
        this.dragState = null;
        this.controls.enabled = true;
        dom.style.cursor = '';
        if (moved) {
          const node = this.devNodes.get(devId);
          if (node) {
            this.spawnShockwave(V(node.group.position.x, 0.03, node.group.position.z), 0x38bdf8, 0.95, 0.45);
            this.cbs.onMoveDevice?.(devId, { x: node.group.position.x, y: 0, z: node.group.position.z });
          }
          return;
        }
      }

      if (!this.downInfo) return;
      const moved = Math.hypot(e.clientX - this.downInfo.x, e.clientY - this.downInfo.y);
      const hit = this.downInfo.hit;
      this.downInfo = null;
      if (moved > 6) return;

      if (!hit) {
        this.cbs.onSelect?.(null);
        return;
      }

      if (hit.type === 'port') {
        const pPos = this.getPortWorldPosition(hit.deviceId, hit.portId);
        this.spawnShockwave(pPos, 0x34d399, 0.45, 0.4);
        this.cbs.onPortClick?.(hit.deviceId, hit.portId);
        return;
      }

      if (hit.type === 'dev') {
        const node = this.devNodes.get(hit.id);
        if (node) {
          this.spawnShockwave(V(node.group.position.x, 0.03, node.group.position.z), 0x38bdf8, 1.0, 0.5);
        }
        if (this.toolMode === 'connect' || this.conn) {
          this.cbs.onDeviceConnectClick?.(hit.id);
        } else {
          this.cbs.onSelect?.({ type: 'dev', id: hit.id });
        }
        return;
      }

      if (hit.type === 'link') {
        this.cbs.onSelect?.({ type: 'link', id: hit.id });
      }
    };

    dom.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  screenToFloor(clientX, clientY) {
    const b = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - b.left) / b.width) * 2 - 1, -((clientY - b.top) / b.height) * 2 + 1);
    const pt = this._intersectFloor();
    if (!pt) return { x: 0, y: 0, z: 0 };
    return {
      x: Math.max(-11.0, Math.min(11.0, Math.round(pt.x * 2) / 2)),
      y: 0,
      z: Math.max(-6.8, Math.min(6.8, Math.round(pt.z * 2) / 2)),
    };
  }

  // ---------- Synchronize Topology Model with 3D Scene ----------
  sync({
    model,
    cfgs,
    conflicts = [],
    sel,
    conn,
    toolMode = 'select',
    cableType = 'auto',
    showLabels = true,
    showGrid = true,
    snapGrid = true,
    liveTraffic = true,
    followPacket = false,
    autoOrbit = false,
    animSpeed = 1.0,
    failDevId = null,
  }) {
    const isFirstSync = this.devNodes.size === 0;
    this.model = model;
    this.cfgs = cfgs;
    this.conflicts = conflicts;
    this.sel = sel;
    this.conn = conn;
    this.toolMode = toolMode;
    this.cableType = cableType;
    this.showLabels = showLabels;
    this.showGrid = showGrid;
    this.snapGrid = snapGrid;
    this.liveTraffic = liveTraffic;
    this.followPacket = followPacket;
    this.autoOrbit = autoOrbit;
    this.animSpeed = animSpeed;
    this.failDevId = failDevId;

    if (this.gridHelper) this.gridHelper.visible = showGrid;

    // 1. Reconcile 3D device nodes
    const currentDevIds = new Set(model.devices.map((d) => d.id));
    for (const [id, node] of this.devNodes.entries()) {
      if (!currentDevIds.has(id)) {
        this.devicesGroup.remove(node.group);
        disposeTree(node.group);
        this.devNodes.delete(id);
        const lbl = this.labelEls.get(id);
        if (lbl) { lbl.remove(); this.labelEls.delete(id); }
      }
    }

    for (const d of model.devices) {
      let node = this.devNodes.get(d.id);
      const isNew = !node || node.type !== d.type;
      if (isNew) {
        if (node) {
          this.devicesGroup.remove(node.group);
          disposeTree(node.group);
        }
        node = buildNetDevice3D(d);
        this.devNodes.set(d.id, node);
        this.devicesGroup.add(node.group);
      }
      const p3 = d.pos3d || S.xyTo3d(d.x, d.y);
      if (!this.dragState || this.dragState.devId !== d.id) {
        node.group.position.x = p3.x;
        node.group.position.z = p3.z;
      }
      node.group.rotation.y = d.rotY || 0;
      node.group.updateMatrixWorld(true);
      if (isNew && !isFirstSync) {
        this.spawnShockwave(V(p3.x, 0.03, p3.z), 0x38bdf8, 1.35, 0.65);
      }
    }

    // 2. Reconcile 3D cables
    const currentLinkIds = new Set(model.links.map((l) => l.id));
    for (const [id, lnode] of this.linkNodes.entries()) {
      if (!currentLinkIds.has(id)) {
        this.cablesGroup.remove(lnode.group);
        disposeTree(lnode.group);
        this.linkNodes.delete(id);
      }
    }

    for (const l of model.links) {
      this._buildOrUpdateCable(l, isFirstSync);
    }

    this._refreshVisualStates();
    this._rebuildLabelsDOM();
  }

  getPortWorldPosition(devId, portId) {
    const node = this.devNodes.get(devId);
    if (!node) return V(0, 0.2, 0);
    const local = node.portAnchors[portId] || V(0, 0.2, 0);
    // Calculate world position at rest (y=0) so cables don't jitter when device levitates on hover
    const savedY = node.group.position.y;
    node.group.position.y = 0;
    node.group.updateMatrixWorld(true);
    const wp = node.group.localToWorld(local.clone());
    node.group.position.y = savedY;
    node.group.updateMatrixWorld(true);
    return wp;
  }

  getPortWorldNormal(devId, portId) {
    const node = this.devNodes.get(devId);
    if (!node) return V(0, 0, 1);
    const localN = node.portNormals[portId] || V(0, 0, 1);
    return localN.clone().applyQuaternion(node.group.quaternion).normalize();
  }

  _computeCableCurve(l) {
    const pA = this.getPortWorldPosition(l.a.d, l.a.p);
    const pB = this.getPortWorldPosition(l.b.d, l.b.p);
    const nA = this.getPortWorldNormal(l.a.d, l.a.p);
    const nB = this.getPortWorldNormal(l.b.d, l.b.p);
    const dist = pA.distanceTo(pB);

    if (l.kind === 'wifi') {
      const mid = pA.clone().lerp(pB, 0.5);
      mid.y = Math.max(pA.y, pB.y) + Math.min(1.4, 0.35 + dist * 0.14);
      return new THREE.CatmullRomCurve3([pA, mid, pB], false, 'catmullrom', 0.5);
    }

    const stub = Math.min(0.32, Math.max(0.14, dist * 0.12));
    const outA = pA.clone().addScaledVector(nA, stub);
    const outB = pB.clone().addScaledVector(nB, stub);
    outA.y = Math.max(0.05, pA.y * 0.55);
    outB.y = Math.max(0.05, pB.y * 0.55);

    const hash = l.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const sideOffset = ((hash % 7) - 3) * 0.035;
    const dir = pB.clone().sub(pA);
    const perp = V(-dir.z, 0, dir.x).normalize();

    const floorA = pA.clone().lerp(pB, 0.25).addScaledVector(perp, sideOffset);
    floorA.y = 0.032;
    const floorMid = pA.clone().lerp(pB, 0.5).addScaledVector(perp, sideOffset * 1.3);
    floorMid.y = 0.028;
    const floorB = pA.clone().lerp(pB, 0.75).addScaledVector(perp, sideOffset);
    floorB.y = 0.032;

    return new THREE.CatmullRomCurve3([pA, outA, floorA, floorMid, floorB, outB, pB], false, 'catmullrom', 0.45);
  }

  _buildOrUpdateCable(l, instant = false) {
    const pA = this.getPortWorldPosition(l.a.d, l.a.p);
    const pB = this.getPortWorldPosition(l.b.d, l.b.p);
    const sig = `${pA.x.toFixed(3)},${pA.y.toFixed(3)},${pA.z.toFixed(3)}|${pB.x.toFixed(3)},${pB.y.toFixed(3)},${pB.z.toFixed(3)}|${l.cableType}`;

    let lnode = this.linkNodes.get(l.id);
    if (lnode && lnode.sig === sig) return;

    const wasExisting = !!lnode;
    if (lnode) {
      this.cablesGroup.remove(lnode.group);
      disposeTree(lnode.group);
    }

    const group = new THREE.Group();
    group.userData = { kind: 'link', linkId: l.id };
    const curve = this._computeCableCurve(l);

    const isWifi = l.kind === 'wifi';
    const radius = isWifi ? 0.018 : 0.026;
    const baseColor = CABLE_COLORS[l.cableType] || (isWifi ? 0x38bdf8 : 0x2563eb);

    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: isWifi ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
      emissiveIntensity: isWifi ? 0.55 : 0,
      roughness: isWifi ? 0.25 : 0.45,
      metalness: isWifi ? 0.1 : 0.15,
      transparent: isWifi,
      opacity: isWifi ? 0.72 : 1.0,
    });

    const tubeGeo = new THREE.TubeGeometry(curve, isWifi ? 40 : 64, radius, 10, false);
    const totalIdx = tubeGeo.index ? tubeGeo.index.count : Infinity;
    const tubeMesh = new THREE.Mesh(tubeGeo, mat);
    tubeMesh.castShadow = !isWifi;
    tubeMesh.receiveShadow = !isWifi;
    tubeMesh.userData = { kind: 'link', linkId: l.id };
    group.add(tubeMesh);

    const hitGeo = new THREE.TubeGeometry(curve, 28, 0.09, 6, false);
    const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.userData = { kind: 'link', linkId: l.id };
    group.add(hitMesh);

    if (!isWifi) {
      const bootMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.4, metalness: 0.2 });
      for (const [pos, norm] of [[pA, this.getPortWorldNormal(l.a.d, l.a.p)], [pB, this.getPortWorldNormal(l.b.d, l.b.p)]]) {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.11), bootMat);
        boot.position.copy(pos).addScaledVector(norm, 0.045);
        boot.quaternion.setFromUnitVectors(V(0, 0, 1), norm);
        boot.userData = { kind: 'link', linkId: l.id };
        group.add(boot);
      }
    }

    // Ambient data-stream light pulse orb that glides along active links
    const flowOrbMat = new THREE.MeshBasicMaterial({
      color: isWifi ? 0x7dd3fc : 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const flowOrb = new THREE.Mesh(new THREE.SphereGeometry(isWifi ? 0.045 : 0.042, 12, 12), flowOrbMat);
    flowOrb.userData.noPick = true;
    group.add(flowOrb);

    const hash = l.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const drawProgress = (instant || wasExisting || this.reduced) ? 1.0 : 0.01;
    if (drawProgress < 1 && tubeGeo.index) {
      tubeGeo.setDrawRange(0, Math.floor((totalIdx * drawProgress) / 3) * 3);
      this.spawnShockwave(pA, baseColor, 0.55, 0.45);
      this.spawnShockwave(pB, baseColor, 0.55, 0.45);
    }

    this.cablesGroup.add(group);
    this.linkNodes.set(l.id, {
      id: l.id,
      group,
      tubeMesh,
      tubeGeo,
      totalIdx,
      drawProgress,
      mat,
      curve,
      kind: l.kind,
      cableType: l.cableType,
      baseColor,
      sig,
      flowOrb,
      flowOrbMat,
      flowPhase: (hash % 13) * 0.17,
    });
  }

  _updateCablesForDevice(devId) {
    for (const l of this.model.links) {
      if (l.a.d === devId || l.b.d === devId) {
        this._buildOrUpdateCable(l, true);
      }
    }
    this._refreshVisualStates();
  }

  _stepCablesAnimation(t, dt) {
    for (const l of this.model.links) {
      const lnode = this.linkNodes.get(l.id);
      if (!lnode) continue;

      // 1. Progressive plug-in draw animation for newly wired cables
      if (lnode.drawProgress < 1) {
        lnode.drawProgress = Math.min(1, lnode.drawProgress + dt * 2.8);
        if (lnode.tubeGeo.index) {
          const e = ease(lnode.drawProgress);
          lnode.tubeGeo.setDrawRange(0, Math.floor((lnode.totalIdx * e) / 3) * 3);
        }
      }

      // 2. Continuous ambient data-stream pulse along active links
      const up = S.isLinkUp(this.model, l);
      if (up && this.liveTraffic && lnode.drawProgress >= 1) {
        lnode.flowOrb.visible = true;
        const speed = lnode.kind === 'wifi' ? 0.55 : lnode.cableType === 'fiber' ? 0.95 : 0.72;
        const raw = (t * speed + lnode.flowPhase) % 2;
        const u = raw <= 1 ? raw : 2 - raw; // bi-directional ping-pong traffic flow
        lnode.flowOrb.position.copy(lnode.curve.getPointAt(u));
        const pulse = 0.85 + 0.35 * Math.sin(t * 10 + lnode.flowPhase * 6);
        lnode.flowOrb.scale.setScalar(pulse);
      } else {
        lnode.flowOrb.visible = false;
      }
    }
  }

  _refreshVisualStates() {
    const conflictDevIds = new Set(this.conflicts.map((c) => c.deviceId));

    for (const d of this.model.devices) {
      const node = this.devNodes.get(d.id);
      if (!node) continue;
      const portStates = {};
      for (const p of d.ports) {
        const link = this.model.links.find((l) => (l.a.d === d.id && l.a.p === p.id) || (l.b.d === d.id && l.b.p === p.id));
        const up = link ? S.isLinkUp(this.model, link) : false;
        const canConn = this.conn
          ? S.canConnect(this.model, { d: this.conn.d, p: this.conn.p }, { d: d.id, p: p.id }, this.cableType).ok
          : false;
        portStates[p.id] = {
          linked: !!link,
          up,
          adminUp: p.adminUp !== false,
          isSourcePort: !!(this.conn && this.conn.d === d.id && this.conn.p === p.id),
          canConnect: canConn,
        };
      }
      node.setState({
        selected: this.sel?.type === 'dev' && this.sel?.id === d.id,
        hovered: (this.hover?.type === 'dev' && this.hover?.id === d.id) || (this.hover?.type === 'port' && this.hover?.deviceId === d.id),
        failed: this.failDevId === d.id || conflictDevIds.has(d.id),
        hot: this.hotDevs.has(d.id),
        on: d.on,
        portStates,
        connectMode: !!this.conn || this.toolMode === 'connect',
      });
    }

    for (const l of this.model.links) {
      const lnode = this.linkNodes.get(l.id);
      if (!lnode) continue;
      const up = S.isLinkUp(this.model, l);
      const isSel = this.sel?.type === 'link' && this.sel?.id === l.id;
      const isHov = this.hover?.type === 'link' && this.hover?.id === l.id;
      const isHot = this.hotLinks.has(l.id);

      if (!up) {
        lnode.mat.color.setHex(0xef4444);
        lnode.mat.emissive.setHex(0x7f1d1d);
        lnode.mat.emissiveIntensity = 0.45;
      } else if (isSel || isHot) {
        lnode.mat.color.setHex(0x38bdf8);
        lnode.mat.emissive.setHex(0x0ea5e9);
        lnode.mat.emissiveIntensity = 0.9;
      } else if (isHov) {
        lnode.mat.color.setHex(0x7dd3fc);
        lnode.mat.emissive.setHex(0x0284c7);
        lnode.mat.emissiveIntensity = 0.55;
      } else {
        lnode.mat.color.setHex(lnode.baseColor);
        lnode.mat.emissive.setHex(lnode.kind === 'wifi' ? 0x0284c7 : 0x000000);
        lnode.mat.emissiveIntensity = lnode.kind === 'wifi' ? 0.45 : 0;
      }
    }
  }

  // ---------- Floating 3D Device Labels & Interactive Port Pills ----------
  _rebuildLabelsDOM() {
    const conflictDevIds = new Set(this.conflicts.map((c) => c.deviceId));
    for (const d of this.model.devices) {
      let el = this.labelEls.get(d.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'net3d-tag';
        this.labelLayer.appendChild(el);
        this.labelEls.set(d.id, el);
      }
      const isSel = this.sel?.type === 'dev' && this.sel?.id === d.id;
      const isFail = this.failDevId === d.id || conflictDevIds.has(d.id);
      const isHot = this.hotDevs.has(d.id);
      const cf = d.kind === 'host' ? this.cfgs.get(d.id) : null;
      const ipText = d.kind === 'host'
        ? (cf?.ip ? `${cf.ip}${cf.source === 'dhcp' ? ' (DHCP)' : cf.source === 'apipa' ? ' (APIPA)' : ''}` : 'No IP')
        : d.kind === 'router'
          ? d.ports.filter((p) => p.ip && p.adminUp !== false).map((p) => `${p.id}:${p.ip}`).slice(0, 2).join(' · ')
          : d.type === 'switch'
            ? `L2 Switch · ${d.ports.filter((p) => this.model.links.some((l) => (l.a.d === d.id && l.a.p === p.id) || (l.b.d === d.id && l.b.p === p.id))).length}/${d.ports.length} up`
            : d.type === 'ap'
              ? `SSID: ${d.ssid || S.DEFAULT_SSID}`
              : S.INTERNET_HOST;

      const showPorts = isSel || this.toolMode === 'connect' || !!this.conn;
      el.className = `net3d-tag ${isSel ? 'is-sel' : ''} ${isFail ? 'is-fail' : ''} ${isHot ? 'is-hot' : ''} ${!d.on ? 'is-off' : ''}`;

      const portsHtml = showPorts
        ? `<div class="net3d-ports">${d.ports.map((p) => {
            const linked = this.model.links.some((l) => (l.a.d === d.id && l.a.p === p.id) || (l.b.d === d.id && l.b.p === p.id));
            const isFrom = this.conn && this.conn.d === d.id && this.conn.p === p.id;
            const canC = this.conn ? S.canConnect(this.model, { d: this.conn.d, p: this.conn.p }, { d: d.id, p: p.id }, this.cableType).ok : true;
            const cls = [
              'net3d-port-btn',
              p.kind,
              linked ? 'linked' : 'free',
              p.adminUp === false ? 'shut' : '',
              isFrom ? 'from' : '',
              this.conn ? (canC ? 'cand-ok' : 'cand-no') : '',
            ].filter(Boolean).join(' ');
            const vlanBadge = d.type === 'switch' && (p.vlan || 1) !== 1 ? ` · V${p.vlan}` : '';
            return `<button type="button" class="${cls}" data-dev="${d.id}" data-port="${p.id}" title="${d.name} · ${p.id}">${p.id}${vlanBadge}</button>`;
          }).join('')}</div>`
        : '';

      el.innerHTML = `
        <div class="net3d-head" data-dev-select="${d.id}">
          <span class="net3d-dot ${!d.on ? 'off' : isFail ? 'fail' : 'on'}"></span>
          <span class="net3d-name">${this._escape(d.name)}</span>
          ${!d.on ? '<span class="net3d-off-pill">OFF</span>' : ''}
        </div>
        <div class="net3d-ip">${this._escape(ipText)}</div>
        ${portsHtml}
      `;

      const head = el.querySelector('[data-dev-select]');
      if (head) {
        head.onclick = (ev) => {
          ev.stopPropagation();
          if (this.toolMode === 'connect' || this.conn) {
            this.cbs.onDeviceConnectClick?.(d.id);
          } else {
            this.cbs.onSelect?.({ type: 'dev', id: d.id });
          }
        };
      }
      el.querySelectorAll('[data-port]').forEach((btn) => {
        btn.onclick = (ev) => {
          ev.stopPropagation();
          this.cbs.onPortClick?.(btn.getAttribute('data-dev'), btn.getAttribute('data-port'));
        };
      });
    }
  }

  _escape(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _updateLabelsProjection() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const v = new THREE.Vector3();

    for (const d of this.model.devices) {
      const el = this.labelEls.get(d.id);
      const node = this.devNodes.get(d.id);
      if (!el || !node) continue;
      const isSel = this.sel?.type === 'dev' && this.sel?.id === d.id;
      const isHov = (this.hover?.type === 'dev' && this.hover?.id === d.id) || (this.hover?.type === 'port' && this.hover?.deviceId === d.id);
      const visible = this.showLabels || isSel || isHov || !!this.conn || this.toolMode === 'connect';
      if (!visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }
      v.copy(node.labelAnchor).applyMatrix4(node.group.matrixWorld).project(this.camera);
      const inFrustum = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      el.style.opacity = inFrustum ? '1' : '0';
      el.style.pointerEvents = inFrustum ? 'auto' : 'none';
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
    }

    // Project floating packet protocol HUD badge if active
    if (this.packetGroup.visible && this.packetAnim) {
      v.copy(this.packetGroup.position).add(V(0, 0.34, 0)).project(this.camera);
      const inF = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      this.packetHudEl.style.opacity = inF ? '1' : '0';
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      this.packetHudEl.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
    } else if (this.packetHudEl.dataset.fadeOut !== '1') {
      this.packetHudEl.style.opacity = '0';
    }
  }

  // ---------- 3D Rubber-Band Connection Preview ----------
  _updateRubberBand() {
    if (this.rubberMesh) {
      this.fxGroup.remove(this.rubberMesh);
      this.rubberMesh.geometry.dispose();
      this.rubberMesh.material.dispose();
      this.rubberMesh = null;
    }
    if (!this.conn) return;
    const pA = this.getPortWorldPosition(this.conn.d, this.conn.p);
    let pB = this.cursorWorld.clone();
    if (this.hover?.type === 'port') {
      pB = this.getPortWorldPosition(this.hover.deviceId, this.hover.portId);
    } else if (this.hover?.type === 'dev' && this.hover.id !== this.conn.d) {
      const hNode = this.devNodes.get(this.hover.id);
      if (hNode) pB = hNode.group.position.clone().add(V(0, 0.3, 0));
    }
    if (pA.distanceTo(pB) < 0.05) return;
    const mid = pA.clone().lerp(pB, 0.5);
    mid.y = Math.max(pA.y, pB.y) + 0.35;
    const curve = new THREE.CatmullRomCurve3([pA, mid, pB]);
    const geo = new THREE.TubeGeometry(curve, 28, 0.02, 8, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    this.rubberMesh = new THREE.Mesh(geo, mat);
    this.rubberMesh.userData.noPick = true;
    this.fxGroup.add(this.rubberMesh);
  }

  // ---------- Multi-Layered 3D Packet Simulation & Protocol Visualizer ----------
  playPacketAnimation(anim) {
    const { trail } = this.packetGroup.userData;
    if (!anim) {
      this.packetAnim = null;
      this.packetGroup.visible = false;
      trail.forEach((tm) => { tm.visible = false; });
      this.packetHudEl.style.opacity = '0';
      this.hotDevs = new Set();
      this.hotLinks = new Set();
      this._refreshVisualStates();
      return;
    }

    // Even if path has < 2 hops (e.g. immediate source failure like bad IP / admin down / conflict),
    // trigger a diagnostic failure shockwave on the failing device!
    if (!anim.path || anim.path.length < 2) {
      const fId = anim.failDev || anim.path?.[0];
      const fNode = fId ? this.devNodes.get(fId) : null;
      if (fNode) {
        const fPos = V(fNode.group.position.x, 0.04, fNode.group.position.z);
        this.spawnShockwave(fPos, 0xf87171, 1.5, 0.75);
        setTimeout(() => { if (!this.disposed) this.spawnShockwave(fPos, 0xef4444, 1.85, 0.85); }, 180);
      }
      return;
    }

    const buildLegSegments = (ids, isReply = false) => {
      const segs = [];
      for (let i = 0; i < ids.length - 1; i++) {
        const aId = ids[i], bId = ids[i + 1];
        const devA = S.getDevice(this.model, aId);
        const devB = S.getDevice(this.model, bId);
        const link = S.linkBetween(this.model, aId, bId);
        const lnode = link ? this.linkNodes.get(link.id) : null;

        let proto = isReply ? 'ICMP Echo Reply' : 'ICMP Echo Req';
        if (devB?.kind === 'internet' || devA?.kind === 'internet') proto = isReply ? 'WAN NAT Reply' : 'NAT + WAN Out';
        else if (link?.kind === 'wifi') proto = isReply ? '802.11 Wi-Fi Reply' : '802.11 Wi-Fi Data';
        else if (devB?.type === 'switch' || devA?.type === 'switch') proto = isReply ? 'L2 Frame · Reply' : 'L2 Ethernet Frame';

        const label = `${proto} · ${devA?.name || aId} → ${devB?.name || bId}`;
        if (lnode?.curve) {
          const forward = link.a.d === aId;
          segs.push({ curve: lnode.curve, forward, linkId: link.id, fromId: aId, toId: bId, label, proto });
        } else {
          const pA = this.devNodes.get(aId)?.group.position.clone().add(V(0, 0.3, 0)) || V();
          const pB = this.devNodes.get(bId)?.group.position.clone().add(V(0, 0.3, 0)) || V();
          segs.push({ curve: new THREE.LineCurve3(pA, pB), forward: true, linkId: link?.id, fromId: aId, toId: bId, label, proto });
        }
      }
      return segs;
    };

    const fwdSegs = buildLegSegments(anim.path, false);
    const backSegs = anim.back?.length > 1 ? buildLegSegments(anim.back, true) : [];
    const legs = [{ segs: fwdSegs, color: 0x38bdf8, tone: 'fwd' }];
    if (backSegs.length > 0) {
      legs.push({ segs: backSegs, color: anim.ok ? 0x34d399 : 0xfbbf24, tone: anim.ok ? 'ok' : 'warn' });
    }

    this.hotDevs = new Set([anim.path[0]]);
    this.hotLinks = new Set();
    this._refreshVisualStates();
    this._rebuildLabelsDOM();

    // Spawn initial launch shockwave at source device
    const srcNode = this.devNodes.get(anim.path[0]);
    if (srcNode) {
      this.spawnShockwave(V(srcNode.group.position.x, 0.03, srcNode.group.position.z), 0x38bdf8, 1.35, 0.65);
    }

    this.packetAnim = {
      legs,
      legIdx: 0,
      segIdx: 0,
      u: 0,
      ok: anim.ok,
      failDev: anim.failDev,
      history: [],
    };
    this.packetGroup.visible = true;
    this.packetHudEl.dataset.fadeOut = '0';
  }

  _stepPacketAnimation(dt) {
    if (!this.packetAnim) return;
    const pa = this.packetAnim;
    const leg = pa.legs[pa.legIdx];
    const { core, halo, gyro1, gyro2, ring, trail } = this.packetGroup.userData;

    if (!leg || !leg.segs.length) {
      this.packetAnim = null;
      this.packetGroup.visible = false;
      trail.forEach((tm) => { tm.visible = false; });
      return;
    }

    const seg = leg.segs[pa.segIdx];
    const baseSpeed = this.reduced ? 4.5 : 1.35 * (this.animSpeed || 1.0);
    const prevU = pa.u;
    pa.u += dt * baseSpeed;

    // Trigger segment start effects
    if (prevU === 0) {
      if (seg.linkId) this.hotLinks.add(seg.linkId);
      this.hotDevs.add(seg.fromId);
      this._refreshVisualStates();
      this._rebuildLabelsDOM();
      this.packetHudEl.className = `net3d-packet-hud tone-${leg.tone}`;
      this.packetHudEl.textContent = seg.label;
    }

    core.material.color.setHex(0xffffff);
    halo.material.color.setHex(leg.color);
    gyro1.material.color.setHex(leg.color);

    const t = Math.min(1, pa.u);
    const curveU = seg.forward ? t : 1 - t;
    const pos = seg.curve.getPointAt(curveU);
    this.packetGroup.position.copy(pos);

    // Rotate 3D gyro energy rings around the packet
    gyro1.rotation.y += dt * 7.5;
    gyro1.rotation.x += dt * 4.2;
    gyro2.rotation.z -= dt * 6.8;
    const pulse = 1 + 0.28 * Math.sin(this.clock.elapsedTime * 16);
    ring.scale.setScalar(pulse);

    // Update 10-sphere comet trail
    pa.history.unshift(pos.clone());
    if (pa.history.length > 24) pa.history.pop();
    for (let i = 0; i < trail.length; i++) {
      const hPt = pa.history[Math.min(pa.history.length - 1, (i + 1) * 2)];
      if (hPt) {
        trail[i].visible = true;
        trail[i].position.copy(hPt);
        trail[i].material.color.setHex(leg.color);
      }
    }

    // Optional Smooth Camera Follow Mode
    if (this.followPacket && !this.dragState) {
      const desiredTarget = pos.clone().add(V(0, 0.25, 0));
      this.controls.target.lerp(desiredTarget, Math.min(1, dt * 5.5));
    }

    if (pa.u >= 1) {
      pa.u = 0;
      this.hotDevs.add(seg.toId);
      this._refreshVisualStates();
      this._rebuildLabelsDOM();

      // Arrival shockwave at intermediate or final node
      const arrNode = this.devNodes.get(seg.toId);
      if (arrNode) {
        const arrPos = V(arrNode.group.position.x, 0.035, arrNode.group.position.z);
        this.spawnShockwave(arrPos, leg.color, 1.15, 0.55);
      }

      pa.segIdx += 1;
      if (pa.segIdx >= leg.segs.length) {
        pa.segIdx = 0;
        pa.legIdx += 1;
        if (pa.legIdx >= pa.legs.length) {
          // End of entire packet journey
          if (!pa.ok) {
            const failId = pa.failDev || seg.toId;
            const fNode = this.devNodes.get(failId);
            if (fNode) {
              const fPos = V(fNode.group.position.x, 0.04, fNode.group.position.z);
              this.spawnShockwave(fPos, 0xf87171, 1.6, 0.8);
              setTimeout(() => { if (!this.disposed) this.spawnShockwave(fPos, 0xef4444, 2.0, 0.9); }, 160);
            }
            this.packetHudEl.className = 'net3d-packet-hud tone-bad';
            this.packetHudEl.textContent = '✕ PACKET DROPPED';
          } else {
            this.packetHudEl.className = 'net3d-packet-hud tone-ok';
            this.packetHudEl.textContent = '✓ ECHO REPLY OK';
          }
          this.packetHudEl.dataset.fadeOut = '1';
          this.packetAnim = null;
          setTimeout(() => {
            if (!this.disposed && !this.packetAnim) {
              this.packetGroup.visible = false;
              trail.forEach((tm) => { tm.visible = false; });
              this.packetHudEl.style.opacity = '0';
              this.packetHudEl.dataset.fadeOut = '0';
              this.hotDevs = new Set();
              this.hotLinks = new Set();
              this._refreshVisualStates();
              this._rebuildLabelsDOM();
            }
          }, 950);
        }
      }
    }
  }

  // ---------- Camera Presets & Smooth Tweening ----------
  tween(dur, fn, key) {
    if (this.reduced) dur = 0.001;
    this.tweens = this.tweens.filter((x) => !(key && x.key === key));
    this.tweens.push({ t: 0, dur, fn, key });
  }

  flyTo(targetPos, camPos, dur = 0.9) {
    const t0 = this.controls.target.clone();
    const p0 = this.camera.position.clone();
    this.tween(dur, (k) => {
      const e = ease(k);
      this.controls.target.lerpVectors(t0, targetPos, e);
      this.camera.position.lerpVectors(p0, camPos, e);
    }, 'cam');
  }

  resetView() {
    this.flyTo(this.homeTarget, this.homePos, 0.95);
  }

  setViewPreset(preset) {
    if (preset === 'top') {
      this.flyTo(V(0, 0, 0), V(0, 18.5, 0.8), 0.9);
    } else if (preset === 'front') {
      this.flyTo(V(0, 0.4, 0), V(0, 3.8, 16.5), 0.9);
    } else {
      this.resetView();
    }
  }

  focusDevice(devId) {
    const node = this.devNodes.get(devId);
    if (!node) return;
    const target = V(node.group.position.x, 0.45, node.group.position.z);
    const offset = V(-2.2, 2.4, 3.6);
    this.flyTo(target, target.clone().add(offset), 0.85);
  }

  zoomBy(factor = 0.8) {
    const dir = this.camera.position.clone().sub(this.controls.target);
    const nextLen = THREE.MathUtils.clamp(dir.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    dir.setLength(nextLen);
    this.flyTo(this.controls.target.clone(), this.controls.target.clone().add(dir), 0.35);
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.9 ? 48 : 40;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;

    if (this.tweens.length) {
      for (const tw of this.tweens) {
        tw.t += dt;
        tw.fn(clamp01(tw.t / tw.dur));
      }
      this.tweens = this.tweens.filter((tw) => tw.t < tw.dur);
    }

    // Animate all 3D hardware devices (fans, LEDs, Wi-Fi ripples, ISP globe, spring pop-in, radar rings)
    if (!this.reduced) {
      for (const node of this.devNodes.values()) {
        node.animate?.(t, dt);
      }
      if (this.borderLineMat) {
        this.borderLineMat.opacity = 0.55 + 0.25 * Math.sin(t * 1.8);
      }
    }

    if (this.autoOrbit && !this.dragState && !this.packetAnim && !this.reduced) {
      const off = this.camera.position.clone().sub(this.controls.target);
      off.applyAxisAngle(V(0, 1, 0), dt * 0.22);
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.controls.update();
    this._updateRubberBand();
    this._stepCablesAnimation(t, dt);
    this._stepPacketAnimation(dt);
    this._stepShockwaves(dt);
    this._updateLabelsProjection();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.controls.dispose();
    for (const node of this.devNodes.values()) disposeTree(node.group);
    for (const lnode of this.linkNodes.values()) disposeTree(lnode.group);
    disposeTree(this.floorGroup);
    disposeTree(this.fxGroup);
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    dom.remove();
    this.labelLayer.remove();
  }
}
