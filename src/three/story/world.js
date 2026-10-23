// Full 3D world for the story mode: school exterior, principal's office and the BTEC classroom,
// with the four characters (Abu Anis, Yasser, Alaa, Abdullah Al-Dajjah), camera director, and interactive lab objects.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOM, FIXTURES, HALF, outletFor } from '../../story/config/labLayout.js';
import { CHARACTERS, SCHOOL } from '../../story/config/assets.js';
import { RACK_UNITS, RACK_PARTS } from '../../story/config/network.js';
import { STATIONS } from '../../story/storyState.js';
import { disposeTree } from '../engine.js';
import { Character } from './characters.js';
import {
  V, MAT, box, buildRoom, buildDeskSegment, buildChair, buildTeacherChair, buildTeacherDesk, buildWorkstation, buildCabinet, buildRackPart,
  buildAC, buildDisplay, buildPrinter, buildUPS, buildBoxStack, buildOffice, buildExterior, makeGhost, trunk, liveTex, canvasTex,
} from './props.js';
import {
  playDoor, playPlaceFurniture, playPartSnap, playPhoneCallSfx, playPrinter,
} from '../../story/sfx.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const OFFICE = V(-40, 0, 0);
const EXTERIOR = V(0, 0, 60);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class StoryWorld {
  constructor(container, { onEvent } = {}) {
    this.container = container;
    this.onEvent = onEvent || (() => {});
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.disposed = false; this.paused = false;
    this.clock = new THREE.Clock();
    this.tweens = []; this.token = 0;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.cssText = 'display:block;width:100%;height:100%;outline:none';
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d131f);
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    this.scene.environment = this.envTex; this.scene.environmentIntensity = 0.55;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.08, 180);
    this.camTarget = V(0, 1.3, 0);
    this.driftOn = false; this.driftAmp = 0.15; this.driftT = 0;

    this.setupLights();
    this.buildSets();
    this.buildCast();
    this.buildLab();

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container); this.resize();
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xf6f3ea, 0x3b352c, 0.75));
    const sun = (this.sun = new THREE.DirectionalLight(0xfff6e5, 2.2));
    sun.position.set(-7, 11, -4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 28 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun, sun.target);
    for (const z of [-2.4, 2.2]) { const p = new THREE.PointLight(0xfffbf0, 0.85, 9, 1.6); p.position.set(0, ROOM.height - 0.15, z); this.scene.add(p); }
    // Bright corridor lighting so the hallway outside the classroom door is always clearly visible
    for (const z of [-3.6, -7.2, -10.8]) {
      const cp = new THREE.PointLight(0xfffbf2, 1.1, 8, 1.4);
      cp.position.set(HALF.w + 1.4, ROOM.height - 0.18, z);
      this.scene.add(cp);
    }
    const op = new THREE.PointLight(0xfff4df, 1.5, 10, 1.3); op.position.set(OFFICE.x, 3.1, OFFICE.z); this.scene.add(op);
  }

  buildSets() {
    this.exterior = buildExterior(SCHOOL); this.exterior.position.copy(EXTERIOR); this.scene.add(this.exterior);
    this.office = buildOffice(); this.office.position.copy(OFFICE); this.scene.add(this.office);
    const room = buildRoom(ROOM, FIXTURES); this.scene.add(room.group); this.room = room;
    const ac = buildAC(); ac.position.set(FIXTURES.ac.x, FIXTURES.ac.y, HALF.d - 0.12); ac.rotation.y = Math.PI; this.scene.add(ac);
  }
  buildCast() {
    this.cast = {};
    for (const [id, cfg] of Object.entries(CHARACTERS)) { const c = new Character(id, cfg); c.root.visible = false; this.scene.add(c.root); this.cast[id] = c; }
  }
  buildLab() {
    const lab = (this.lab = new THREE.Group()); this.scene.add(lab);
    this.pile = new THREE.Group(); lab.add(this.pile);
    this.stations = STATIONS.map((st, i) => {
      const g = new THREE.Group(); g.add(buildDeskSegment(st.width, 0.6));
      const ch = buildChair(); ch.position.set(0, 0, 0.55); g.add(ch);
      const target = { pos: V(st.x, 0, st.z), rot: st.rotY };
      const col = i % 5, row = Math.floor(i / 5);
      const start = { pos: V(-1.2 + col * 0.6, 0, -1.5 + row * 0.75), rot: 0 };
      g.position.copy(start.pos); g.visible = false; g.userData.placed = false; lab.add(g);
      const ghost = makeGhost(buildDeskSegment(st.width, 0.6)); ghost.position.copy(target.pos); ghost.rotation.y = target.rot; ghost.visible = false; lab.add(ghost);
      return { st, g, target, start, ghost, ws: null };
    });
    const T = FIXTURES.teacherDesk;
    const td = (this.teacherDesk = new THREE.Group()); td.add(buildTeacherDesk(T.w, T.d));
    const tch = buildTeacherChair(); tch.position.set(-0.36, 0, -0.52); tch.rotation.y = Math.PI; td.add(tch);
    td.userData.target = { pos: V(T.x, 0, T.z), rot: 0 }; td.userData.start = { pos: V(1.6, 0, -2.4), rot: 0.3 };
    td.position.copy(td.userData.start.pos); td.visible = false; td.userData.placed = false; lab.add(td);
    this.teacherGhost = makeGhost(buildTeacherDesk(T.w, T.d)); this.teacherGhost.position.set(T.x, 0, T.z); this.teacherGhost.visible = false; lab.add(this.teacherGhost);

    // screens
    this.desktopMat = new THREE.MeshBasicMaterial({ map: canvasTex('desktop', 512, 288, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0b3b8c'); gr.addColorStop(1, '#3aa0e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(w * 0.62, h * 0.5, 120, 80, 0.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(10,15,25,.85)'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) g.fillRect(w / 2 - 66 + i * 22, h - 17, 14, 12);
    }) });
    const live = liveTex(1024, 576); this.teacherScreen = live; this.teacherScreenMat = new THREE.MeshBasicMaterial({ map: live.tex });
    this.drawTeacherScreen({ mode: 'off' });

    this.teacherWS = buildWorkstation({ screen: this.teacherScreenMat });
    this.teacherWS.position.set(-0.34, 0, 0);
    this.teacherWS.rotation.y = Math.PI;
    this.teacherWS.visible = false;
    td.add(this.teacherWS);

    this.boxes = buildBoxStack(8); this.boxes.position.set(0.6, 0, 1.2); this.boxes.visible = false; lab.add(this.boxes);

    // cabinet
    const cab = (this.cabinet = buildCabinet(RACK_UNITS.length));
    const cd = cab.userData; this.cabMounted = { pos: V(FIXTURES.cabinet.x, FIXTURES.cabinet.y, HALF.d - cd.D / 2 - 0.01), rot: Math.PI };
    this.cabFloor = { pos: V(-1.4, cd.H / 2, 3.4), rot: Math.PI * 0.85 };
    cab.position.copy(this.cabFloor.pos); cab.rotation.y = this.cabFloor.rot; cab.visible = false; lab.add(cab);
    const cabLight = new THREE.PointLight(0xdbeafe, 0.9, 1.2, 1.5); cabLight.position.set(0, 0, cd.D / 2 - 0.05); cab.add(cabLight);
    this.rackMeshes = {};
    // trunking & outlets
    this.trunking = new THREE.Group(); this.trunking.visible = false; lab.add(this.trunking);
    const tm = new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 0.5 });
    const hw = HALF.w - 0.03, hd = HALF.d - 0.03;
    for (const [x, z, ry, len] of [[0, -hd, 0, ROOM.width], [0, hd, 0, ROOM.width], [-hw, 0, Math.PI / 2, ROOM.depth], [hw, 0.6, Math.PI / 2, ROOM.depth - 3.4]]) { const b = box(len, 0.06, 0.04, tm, x, 0.3, z); b.rotation.y = ry; this.trunking.add(b); }
    const riser = box(0.06, 1.3, 0.04, tm, FIXTURES.cabinet.x - 0.2, 0.95, hd); this.trunking.add(riser);
    this.outlets = {};
    const allDevs = [
      ...STATIONS.map((s) => ({ id: s.id, o: outletFor(s) })),
      { id: 'T', o: { x: FIXTURES.teacherDesk.x, y: 0.32, z: -HALF.d + 0.02 } },
      { id: 'PRN', o: { x: FIXTURES.printer.x + 0.45, y: 0.32, z: -HALF.d + 0.02 } },
      { id: 'DSP', o: { x: 0.6, y: 0.32, z: -HALF.d + 0.02 } },
    ];
    for (const d of allDevs) {
      const face = box(0.08, 0.08, 0.015, MAT.white, d.o.x, d.o.y + 0.1, d.o.z);
      if (Math.abs(d.o.x) > HALF.w - 0.1) face.rotation.y = Math.PI / 2;
      this.trunking.add(face); this.outlets[d.id] = d.o;
    }
    this.cables = new THREE.Group(); lab.add(this.cables); this.cableMeshes = {};

    // peripherals
    const P = FIXTURES.printer; this.printer = buildPrinter(); this.printer.userData.target = { pos: V(P.x, 0, P.z), rot: P.rotY || 0 }; this.printer.userData.start = { pos: V(HALF.w + 1.2, 0, FIXTURES.door.z), rot: -Math.PI / 2 };
    this.printer.visible = false; lab.add(this.printer);
    const U = FIXTURES.ups[0]; this.ups = buildUPS(); this.ups.userData.target = { pos: V(U.x, 0, U.z), rot: U.rotY || 0 }; this.ups.userData.start = { pos: V(HALF.w + 1.2, 0, FIXTURES.door.z), rot: -Math.PI / 2 };
    this.ups.visible = false; lab.add(this.ups);
    const D = FIXTURES.display; this.display = buildDisplay(D.w, D.h); this.display.userData.target = { pos: V(D.x, D.y, -HALF.d + 0.04), rot: 0 }; this.display.userData.start = { pos: V(D.x, 0.7, -HALF.d + 0.9), rot: 0 };
    this.display.visible = false; lab.add(this.display);
    const dl = liveTex(1024, 576); this.displayLive = dl; this.display.userData.screen.material = new THREE.MeshBasicMaterial({ map: dl.tex });
    this.displayMode = 'off';
    this.drawDisplay('off');
    if (typeof Image !== 'undefined') {
      const bgImg = new Image();
      const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
      bgImg.onload = () => {
        this.displayBgImg = bgImg;
        if (!this.disposed) this.drawDisplay(this.displayMode || 'on');
      };
      bgImg.src = `${base}story/refs/iboard-bg.jpg`;
    }
    this.upsLcd = this.ups.userData.lcd;
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 40), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    this.marker.rotation.x = -Math.PI / 2; this.marker.position.y = 0.012; this.marker.visible = false; this.scene.add(this.marker);
  }

  // ---------- screens ----------
  drawTeacherScreen(s) {
    const { ctx: g, canvas, tex } = this.teacherScreen; if (!g) return; const w = canvas.width, h = canvas.height;
    if (s.mode === 'off') { g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h); }
    else if (s.mode === 'post') { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9e2ec'; g.font = '28px monospace'; (s.lines || []).forEach((l, i) => g.fillText(l, 40, 70 + i * 40)); }
    else if (s.mode === 'install') {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0a2a6b'); gr.addColorStop(1, '#1565c0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(170, 120, w - 340, h - 240);
      g.fillStyle = '#0f172a'; g.font = '600 34px Inter, Arial'; g.fillText(s.title || 'Setup', 210, 190);
      g.font = '24px Inter, Arial'; g.fillStyle = '#334155'; g.fillText(s.sub || '', 210, 236);
      g.fillStyle = '#e2e8f0'; g.fillRect(210, 300, w - 420, 22); g.fillStyle = '#2563eb'; g.fillRect(210, 300, (w - 420) * (s.pct || 0), 22);
      g.fillStyle = '#334155'; g.fillText(`${Math.round((s.pct || 0) * 100)}%`, 210, 360);
    } else if (s.mode === 'desktop') {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0b3b8c'); gr.addColorStop(1, '#3aa0e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(10,15,25,.85)'; g.fillRect(0, h - 44, w, 44); g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) g.fillRect(w / 2 - 130 + i * 44, h - 34, 28, 24);
      g.font = '22px Inter, Arial'; g.fillText(s.note || '', 30, 50);
    }
    tex.needsUpdate = true;
  }
  drawDisplay(mode) {
    this.displayMode = mode;
    const { ctx: g, canvas, tex } = this.displayLive; if (!g) return; const w = canvas.width, h = canvas.height;
    if (mode === 'off') {
      g.fillStyle = '#05070c';
      g.fillRect(0, 0, w, h);
    } else if (mode === 'nosignal') {
      g.fillStyle = '#070c18';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1e293b';
      g.lineWidth = 4;
      g.strokeRect(w / 2 - 220, h / 2 - 70, 440, 140);
      g.fillStyle = '#38bdf8';
      g.font = 'bold 30px Inter, Arial';
      g.textAlign = 'center';
      g.fillText('HDMI 1 — STANDBY', w / 2, h / 2 - 12);
      g.fillStyle = '#94a3b8';
      g.font = '22px "IBM Plex Sans Arabic", Inter, Arial';
      g.fillText('اضغط «فحص الإشارة (HDMI 1)» لتشغيل الشاشة', w / 2, h / 2 + 34);
      g.textAlign = 'start';
    } else {
      // Full, unobstructed BTEC class group photo (`iboard-bg.jpg`) shown after HDMI 1 check passes
      if (this.displayBgImg) {
        g.drawImage(this.displayBgImg, 0, 0, w, h);
      } else {
        const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1e3a5f'); sky.addColorStop(0.55, '#47688a'); sky.addColorStop(1, '#1e293b'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      }
    }
    tex.needsUpdate = true;
  }

  // ---------- camera ----------
  clampOfficeCam(pos) {
    if (Math.abs(pos.x - OFFICE.x) < 6 && Math.abs(pos.z - OFFICE.z) < 6) {
      pos.x = THREE.MathUtils.clamp(pos.x, OFFICE.x - 2.75, OFFICE.x + 2.75);
      pos.z = THREE.MathUtils.clamp(pos.z, OFFICE.z - 2.35, OFFICE.z + 2.35);
    }
    return pos;
  }
  cut({ pos, target, fov = 42 }) {
    this.cancel('cam');
    this.clampOfficeCam(pos);
    this.camera.position.copy(pos);
    this.camTarget.copy(target);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }
  move({ pos, target, fov }, dur = 2.5) {
    this.clampOfficeCam(pos);
    const p0 = this.camera.position.clone(), t0 = this.camTarget.clone(), f0 = this.camera.fov;
    return this.tween(dur, (k) => { const e = ease(k); this.camera.position.lerpVectors(p0, pos, e); this.camTarget.lerpVectors(t0, target, e); if (fov) { this.camera.fov = f0 + (fov - f0) * e; this.camera.updateProjectionMatrix(); } }, 'cam');
  }
  drift(on, amp = 0.15) { this.driftOn = on; this.driftAmp = amp; }
  shotOn(charId, { side = 1, dist = 1.9, height = null, over = null, fov = 34 } = {}) {
    const c = this.cast[charId]; const p = c.root.position; const f = c.facing;
    const fwd = V(Math.sin(f), 0, Math.cos(f)); const right = V(Math.cos(f), 0, -Math.sin(f));
    const headY = c.sitting ? c.cfg.height * 0.74 : c.cfg.height * 0.93;
    const head = V(p.x, headY, p.z);
    const target = head.clone().add(V(0, -0.24, 0));
    let pos = head.clone().addScaledVector(fwd, dist).addScaledVector(right, side * 0.65); pos.y = height ?? head.y + 0.06;
    if (over) {
      const oc = this.cast[over]; const o = oc.root.position; const of = oc.facing;
      const or = V(Math.cos(of), 0, -Math.sin(of));
      const oHeadY = oc.sitting ? oc.cfg.height * 0.77 : oc.cfg.height * 0.96;
      pos = V(o.x, oHeadY, o.z).addScaledVector(V(Math.sin(of), 0, Math.cos(of)), -0.52).addScaledVector(or, side * 0.42);
    }
    return { pos: this.clampOfficeCam(pos), target, fov };
  }
  twoShot(a, b, { dist = 3.0, height = 1.48, fov = 38 } = {}) {
    const pa = this.cast[a].root.position, pb = this.cast[b].root.position;
    const mid = V((pa.x + pb.x) / 2, 1.12, (pa.z + pb.z) / 2);
    const dir = V(pb.z - pa.z, 0, -(pb.x - pa.x)).normalize();
    return { pos: this.clampOfficeCam(mid.clone().addScaledVector(dir, dist).setY(height)), target: mid, fov };
  }
  groupShot(ids) {
    const ps = ids.map((i) => this.cast[i].root.position);
    const mid = ps.reduce((a, p) => a.add(p.clone()), V()).multiplyScalar(1 / ps.length); mid.y = 1.15;
    return { pos: V(mid.x - 1.6, 1.55, mid.z + 2.5), target: mid, fov: 40 };
  }

  // ---------- dialogue staging ----------
  speak(id, gesture = 'talk') {
    for (const c of Object.values(this.cast)) c.setTalking(c.id === id);
    const c = this.cast[id]; if (!c) return;
    if (gesture && gesture !== 'talk') c.play(gesture, gesture === 'nod' ? 1.2 : 1.8);
    for (const o of Object.values(this.cast)) if (o !== c && o.root.visible) o.lookAt(c.head);
    c.lookAt(null);
  }
  react(id, gesture) { this.cast[id]?.play(gesture, 1.3); }
  silence() { for (const c of Object.values(this.cast)) c.setTalking(false); }

  /**
   * Manual walking control for Teacher Alaa ONLY during furniture & PC deployment stages.
   * As Alaa walks through the classroom, nearby unplaced desks or PCs are distributed.
   */
  stepAlaaDistribute(dx, dz, stage, onDistribute) {
    if (stage !== 'furniture' && stage !== 'deploy') return;
    const L = this.cast.alaa;
    if (!L) return;
    L.root.visible = true;
    L.sitting = false;
    const curX = L.path && L.path.length ? L.path[L.path.length - 1].x : L.root.position.x;
    const curZ = L.path && L.path.length ? L.path[L.path.length - 1].z : L.root.position.z;
    const nx = THREE.MathUtils.clamp(curX + dx, -HALF.w + 0.85, HALF.w - 0.85);
    const nz = THREE.MathUtils.clamp(curZ + dz, -HALF.d + 0.85, HALF.d - 0.85);
    L.walk([[nx, nz]], 2.2);

    if (stage === 'furniture') {
      if (!this.teacherDesk.userData.placed) {
        this.teacherDesk.userData.placed = true;
        this.teacherDesk.visible = true;
        this.moveObj(this.teacherDesk, this.teacherDesk.userData.target, 0.65, 0.05);
      }
      const unplaced = this.stations
        .filter((k) => !k.g.userData.placed)
        .sort((a, b) => a.target.pos.distanceTo(V(nx, 0, nz)) - b.target.pos.distanceTo(V(nx, 0, nz)));
      const pick = unplaced.slice(0, 2);
      for (const k of pick) {
        k.g.userData.placed = true;
        k.g.visible = true;
        this.moveObj(k.g, k.target, 0.65, 0.06);
        playPlaceFurniture();
      }
      const placedCount = this.stations.filter((k) => k.g.userData.placed).length;
      onDistribute?.('furniture', placedCount, placedCount >= this.stations.length);
    } else if (stage === 'deploy') {
      this.boxes.visible = true;
      const undeployed = this.stations
        .filter((k) => !k.ws)
        .sort((a, b) => a.target.pos.distanceTo(V(nx, 0, nz)) - b.target.pos.distanceTo(V(nx, 0, nz)));
      const pick = undeployed.slice(0, 2);
      for (const k of pick) {
        const ws = buildWorkstation({ screen: this.desktopMat });
        k.g.add(ws);
        k.ws = ws;
        ws.position.y = 0.85;
        ws.scale.setScalar(0.6);
        this.tween(0.42, (q) => { const e = ease(q); ws.position.y = 0.85 * (1 - e); ws.scale.setScalar(0.6 + 0.4 * e); });
        playPartSnap();
      }
      const allDeployedIds = this.stations.filter((k) => !!k.ws).map((k) => k.st.id);
      if (allDeployedIds.length >= this.stations.length) this.boxes.visible = false;
      onDistribute?.('deploy', allDeployedIds, allDeployedIds.length >= this.stations.length);
    }
  }

  // ---------- locations / stage setups ----------
  newToken() {
    this.token += 1;
    // Resolve and clear all active tweens so interrupted stage transitions never glitch
    const pending = [...this.tweens];
    this.tweens = [];
    for (const tw of pending) tw.res?.();
    this.driftOn = false;
    for (const c of Object.values(this.cast)) c.resetState();
    return this.token;
  }
  alive(tok) { return tok === this.token && !this.disposed; }
  show(ids) { for (const [k, c] of Object.entries(this.cast)) c.root.visible = ids.includes(k); }
  officePos(x, z) { return [OFFICE.x + x, OFFICE.z + z]; }

  /** Scene 1: school exterior → office → Yasser enters and walks to the principal's desk */
  async playOpening(tok) {
    this.show(['abuAnis', 'yasser']);
    const A = this.cast.abuAnis, Y = this.cast.yasser;
    A.place(...this.officePos(0, -1.80), 0); A.setSitting(true, true); A.setWorking(false); A.setPhoneCall(false);
    Y.place(...this.officePos(2.8, 1.3), -Math.PI / 2);
    this.office.userData.door.setOpen(0);
    this.scene.background.setHex(0xbcd6ee);
    this.cut({ pos: V(-14, 3.2, EXTERIOR.z + 24), target: V(0, 3.8, EXTERIOR.z) });
    await this.move({ pos: V(0, 2.6, EXTERIOR.z + 13), target: V(0, 3.9, EXTERIOR.z), fov: 38 }, 2.4);
    if (!this.alive(tok)) return;
    this.onEvent({ type: 'fade' }); await sleep(420);
    if (!this.alive(tok)) return;
    this.scene.background.setHex(0x0d131f);
    await this.officeEntrance(tok);
  }
  async officeEntrance(tok) {
    const Y = this.cast.yasser; const A = this.cast.abuAnis;
    this.cut({ pos: V(OFFICE.x - 2.2, 1.9, OFFICE.z + 1.9), target: V(OFFICE.x + 0.6, 1.1, OFFICE.z - 0.6) });
    this.office.userData.door.setOpen(1);
    playDoor(true);
    await Y.walk([this.officePos(2.4, 1.3), this.officePos(0.6, 0.2), this.officePos(0.25, -0.35)], 1.05);
    if (!this.alive(tok)) return;
    this.office.userData.door.setOpen(0);
    playDoor(false);
    Y.face(Math.PI); A.lookAt(Y.head); Y.lookAt(A.head);
    await this.move(this.twoShot('abuAnis', 'yasser'), 1.5);
  }
  async playApproval(tok) {
    this.scene.background.setHex(0x0d131f);
    this.show(['abuAnis']);
    const A = this.cast.abuAnis;
    A.place(...this.officePos(0, -1.80), 0);
    A.setSitting(true, true);
    A.setPhoneCall(false);
    A.setWorking(true);
    this.cut({ pos: V(OFFICE.x - 1.15, 1.38, OFFICE.z - 0.95), target: V(OFFICE.x + 0.05, 0.98, OFFICE.z - 1.68), fov: 36 });
    this.drift(true, 0.05);
    if (!this.alive(tok)) return;
  }
  async playPhoneCall(tok) {
    const A = this.cast.abuAnis;
    A.place(...this.officePos(0, -1.80), 0);
    A.setSitting(true, true);
    A.setWorking(false);
    A.face(-0.18);
    A.setPhoneCall(true);
    playPhoneCallSfx();
    this.drift(false);
    // Clear, unobstructed front-right view looking directly at Principal Abu Anis holding the phone in his hand and speaking to Teacher Alaa
    await this.move({ pos: V(OFFICE.x - 0.72, 1.32, OFFICE.z - 0.78), target: V(OFFICE.x - 0.06, 1.08, OFFICE.z - 1.78), fov: 30 }, 1.0);
    if (!this.alive(tok)) return;
  }
  async playAssignEntrance(tok) {
    this.scene.background.setHex(0x0d131f);
    this.show(['abuAnis', 'alaa']);
    const A = this.cast.abuAnis, L = this.cast.alaa;
    A.place(...this.officePos(0, -1.80), 0); A.setSitting(true, true); A.setWorking(false); A.setPhoneCall(false);
    L.place(...this.officePos(2.8, 1.3), -Math.PI / 2);
    this.cut({ pos: V(OFFICE.x - 2.2, 1.9, OFFICE.z + 1.9), target: V(OFFICE.x + 0.6, 1.1, OFFICE.z - 0.6) });
    this.office.userData.door.setOpen(1);
    playDoor(true);
    await L.walk([this.officePos(2.4, 1.3), this.officePos(0.6, 0.2), this.officePos(0.25, -0.35)], 1.2);
    if (!this.alive(tok)) return;
    this.office.userData.door.setOpen(0);
    playDoor(false);
    L.face(Math.PI); A.lookAt(L.head); L.lookAt(A.head);
    await this.move(this.twoShot('abuAnis', 'alaa'), 1.5);
  }
  dialogueCam(speaker, cast) {
    if (cast.length === 2) {
      const other = cast.find((c) => c !== speaker);
      if (speaker === 'abuAnis' && this.cast.abuAnis.sitting) {
        return this.move({ pos: V(OFFICE.x - 0.88, 1.32, OFFICE.z - 0.82), target: V(OFFICE.x, 1.04, OFFICE.z - 1.76), fov: 34 }, 0.9);
      }
      return this.move(this.shotOn(speaker, { over: other, side: speaker === 'abuAnis' ? 1 : -1, fov: 34 }), 0.9);
    }
    const visCast = cast.filter((id) => this.cast[id]?.root.visible);
    return this.move(this.groupShot(visCast.length ? visCast : cast), 1.2);
  }

  /** Scene 4: Alaa walks along the school corridor, opens the classroom door, steps into the empty room and looks around */
  async playEnter(tok) {
    this.scene.background.setHex(0x0d131f);
    this.show(['alaa']);
    const L = this.cast.alaa;
    L.place(HALF.w + 1.35, FIXTURES.door.z - 2.2, 0);
    this.room.door.setOpen(0);
    // Camera looks from inside the classroom toward the door & exterior corridor behind Alaa
    this.cut({ pos: V(-2.8, 1.65, 2.2), target: V(HALF.w + 1.2, 1.3, FIXTURES.door.z) });
    await L.walk([[HALF.w + 1.1, FIXTURES.door.z]], 1.2);
    if (!this.alive(tok)) return;
    L.face(-Math.PI / 2);
    playDoor(true);
    await this.tween(0.85, (k) => this.room.door.setOpen(ease(k)), 'door');
    await L.walk([[HALF.w + 0.25, FIXTURES.door.z], [2.8, FIXTURES.door.z + 0.5], [1.2, -1.4]], 1.15);
    if (!this.alive(tok)) return;
    L.faceTowards(0, 3);
    await this.move({ pos: V(-3.9, 2.9, 4.9), target: V(0.6, 0.6, -2.5), fov: 50 }, 3.0); if (!this.alive(tok)) return;
    await this.move({ pos: V(0, 9.5, 8.6), target: V(0.5, 0, -0.4), fov: 48 }, 3.0); if (!this.alive(tok)) return;
    await this.move(this.shotOn('alaa', { dist: 2.2, side: 1, height: 1.7, fov: 40 }), 1.8);
  }
  titleIdle() { this.scene.background = new THREE.Color(0xbcd6ee); this.show([]); this.cut({ pos: V(-12, 3.2, EXTERIOR.z + 22), target: V(0, 4, EXTERIOR.z) }); this.drift(true, 1.2); }
  cablingShot() { return { pos: V(3.4, 11.5, 6.4), target: V(3.0, 0, 0.1), fov: 52 }; }
  wideTop() { return { pos: V(0.4, 9.4, 9.2), target: V(0.4, 0, -0.2), fov: 48 }; }

  /** reflect the saved state in the 3D lab (used on load and after each change) */
  sync(s, { animate = false } = {}) {
    this.scene.background.setHex(s.stage === 'title' ? 0xbcd6ee : 0x0d131f);
    const fp = s.furniture.placed;
    for (const k of this.stations) {
      k.g.visible = s.furniture.confirmed || fp || k.g.userData.placed || k.g.visible;
      if (fp && !animate) {
        k.g.position.copy(k.target.pos);
        k.g.rotation.y = k.target.rot;
        k.g.userData.placed = true;
      } else if (!fp && s.stage === 'furniture' && !s.furniture.confirmed && !(s.furniture.placedCount > 0)) {
        k.g.position.copy(k.start.pos);
        k.g.rotation.y = 0;
        k.g.userData.placed = false;
      }
    }
    this.teacherDesk.visible = this.stations[0].g.visible;
    if (fp && !animate) {
      this.teacherDesk.position.copy(this.teacherDesk.userData.target.pos);
      this.teacherDesk.rotation.y = 0;
      this.teacherDesk.userData.placed = true;
    } else if (!fp && s.stage === 'furniture' && !s.furniture.confirmed) {
      this.teacherDesk.position.copy(this.teacherDesk.userData.start.pos);
      this.teacherDesk.rotation.y = this.teacherDesk.userData.start.rot;
      this.teacherDesk.userData.placed = false;
    }
    const asm = new Set(s.asm.installed);
    this.teacherWS.visible = asm.has('vesa');
    // deployment
    const dep = new Set(s.deploy.deployed);
    for (const k of this.stations) {
      if (dep.has(k.st.id) && !k.ws) { k.ws = buildWorkstation({ screen: this.desktopMat }); k.g.add(k.ws); }
      if (!dep.has(k.st.id) && k.ws) { k.g.remove(k.ws); disposeTree(k.ws); k.ws = null; }
    }
    // cabinet
    const rackStarted = s.reached && ['rack', 'cabling', 'periph', 'verify', 'finale', 'credits'].includes(s.reached);
    this.cabinet.visible = rackStarted;
    if (rackStarted && !animate && s.rack.mounted) { this.cabinet.position.copy(this.cabMounted.pos); this.cabinet.rotation.y = this.cabMounted.rot; }
    for (const r of RACK_UNITS) {
      const pid = s.rack.placed[r.u]; const have = this.rackMeshes[r.u];
      if (pid && !have) { const m = buildRackPart(RACK_PARTS[pid].kind); m.position.set(0, this.cabinet.userData.unitY(r.u), this.cabinet.userData.D / 2 - 0.08); this.cabinet.add(m); this.rackMeshes[r.u] = m; }
      if (!pid && have) { this.cabinet.remove(have); disposeTree(have); delete this.rackMeshes[r.u]; }
    }
    this.cabinet.userData.setDoor(s.rack.doorOpen === false ? 0 : (s.stage === 'rack' ? 1 : 0));
    // cabling
    this.trunking.visible = ['cabling', 'periph', 'verify', 'finale', 'credits'].includes(s.reached);
    this.syncCables(s);
    // peripherals
    const P = s.periph;
    for (const [k, o] of [['printer', this.printer], ['ups', this.ups], ['display', this.display]]) {
      o.visible = P[k].placed; if (P[k].placed && !animate) { o.position.copy(o.userData.target.pos); o.rotation.y = o.userData.target.rot; }
    }
    this.drawDisplay(P.display.ok ? 'on' : P.display.placed ? 'nosignal' : 'off');
    this.upsLcd.material.emissiveIntensity = P.ups.ok ? 1.4 : 0;
    const sw = new Set(s.sw.done);
    if (s.sw.verified) this.drawTeacherScreen({ mode: 'desktop', note: '' });
    else if (sw.has('os')) this.drawTeacherScreen({ mode: 'desktop', note: '' });
    else if (s.asm.postOk) this.drawTeacherScreen({ mode: 'post', lines: ['POST OK', 'CPU / iGPU ........ OK', 'Memory ............ OK', 'NVMe .............. OK'] });
  }

  devicePathPoints(id) {
    const o = this.outlets[id]; if (!o) return null;
    const y = 0.3; const cx = FIXTURES.cabinet.x - 0.2; const hd = HALF.d - 0.06, hw = HALF.w - 0.06;
    const pts = [V(o.x, o.y + 0.1, o.z)];
    const isLeft = o.x < -hw + 0.1, isRight = o.x > hw - 0.1, isBack = o.z > hd - 0.1, isFront = o.z < -hd + 0.1;
    if (isFront) { pts.push(V(o.x, y, -hd), V(-hw, y, -hd), V(-hw, y, hd)); }
    else if (isLeft) { pts.push(V(-hw, y, o.z), V(-hw, y, hd)); }
    else if (isRight) { pts.push(V(hw, y, o.z), V(hw, y, hd)); }
    else if (isBack) { pts.push(V(o.x, y, hd)); }
    pts.push(V(cx, y, hd), V(cx, FIXTURES.cabinet.y - 0.15, hd));
    return pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.02);
  }
  syncCables(s) {
    const color = { pending: 0xf59e0b, ok: 0x22c55e, bad: 0xef4444 };
    const want = new Map();
    for (const l of s.links) {
      const outEnd = [l.a, l.b].find((x) => x.startsWith('out:')); const ppEnd = [l.a, l.b].find((x) => x.startsWith('pp:'));
      if (outEnd && ppEnd) want.set(outEnd.slice(4), l.state || 'pending');
    }
    for (const [id, m] of Object.entries(this.cableMeshes)) if (!want.has(id)) { this.cables.remove(m); m.geometry.dispose(); m.material.dispose(); delete this.cableMeshes[id]; }
    for (const [id, st] of want) {
      let m = this.cableMeshes[id];
      if (!m) { const pts = this.devicePathPoints(id); if (!pts) continue; m = trunk(pts, color[st], 0.008); this.cables.add(m); this.cableMeshes[id] = m; }
      m.material.color.setHex(color[st]); m.material.emissive.setHex(this.inspectId === id ? 0x38bdf8 : 0x000000); m.material.emissiveIntensity = this.inspectId === id ? 0.9 : 0;
    }
  }
  inspect(id) { this.inspectId = id; for (const [k, m] of Object.entries(this.cableMeshes)) { m.material.emissive.setHex(k === id ? 0x38bdf8 : 0); m.material.emissiveIntensity = k === id ? 0.9 : 0; } const o = this.outlets[id]; if (o) { this.marker.visible = true; this.marker.position.set(THREE.MathUtils.clamp(o.x, -HALF.w + 0.6, HALF.w - 0.6), 0.012, THREE.MathUtils.clamp(o.z, -HALF.d + 0.6, HALF.d - 0.6)); } else this.marker.visible = false; }

  // furniture
  showGhosts(on) { for (const k of this.stations) k.ghost.visible = on; this.teacherGhost.visible = on; }
  async deliverFurniture() {
    for (const k of this.stations) {
      k.g.visible = true;
      if (!k.g.userData.placed) { k.g.position.copy(k.start.pos); k.g.rotation.y = 0; }
    }
    this.teacherDesk.visible = true;
  }
  async placeFurniture(tok, onProgress) {
    this.showGhosts(true);
    this.move({ pos: V(0.4, 10.5, 7.5), target: V(0.4, 0, -0.3), fov: 50 }, 1.8);
    const L = this.cast.alaa;
    L.walk([[-1.2, -3.2]], 1.4);
    await this.moveObj(this.teacherDesk, this.teacherDesk.userData.target, 1.1, 0.05);
    this.teacherDesk.userData.placed = true;
    playPlaceFurniture();
    let n = this.stations.filter((k) => k.g.userData.placed).length;
    onProgress?.(n);
    for (const run of ['L', 'B', 'R']) {
      if (!this.alive(tok)) return false;
      const grp = this.stations.filter((k) => k.st.run === run && !k.g.userData.placed);
      if (!grp.length) continue;
      const c = grp[Math.floor(grp.length / 2)].target.pos; L.walk([[c.x * 0.55, c.z * 0.6]], 1.6);
      await Promise.all(grp.map((k, i) => sleep(i * 110).then(() => this.moveObj(k.g, k.target, 1.2, 0.08)).then(() => { k.g.userData.placed = true; n += 1; playPlaceFurniture(); onProgress?.(n); })));
    }
    this.showGhosts(false);
    return true;
  }

  // assembly / software focus
  async focusTeacherDesk(tok) {
    const L = this.cast.alaa; const T = FIXTURES.teacherDesk;
    await L.walk([[T.x + 1.3, T.z + 0.9], [T.x + 0.2, T.z - 0.62]], 1.3);
    if (!this.alive(tok)) return; L.face(0); L.setWorking(true);
    await this.move({ pos: V(T.x + 0.9, 1.6, T.z + 1.6), target: V(T.x - 0.2, 0.95, T.z), fov: 40 }, 1.8);
  }
  async focusTeacherScreen() {
    const T = FIXTURES.teacherDesk; const L = this.cast.alaa;
    L.place(T.x + 1.0, T.z - 0.5, -0.9); L.setWorking(false); L.lookAt(this.teacherWS);
    await this.move({ pos: V(T.x - 0.5, 1.36, T.z - 1.02), target: V(T.x - 0.3, 1.12, T.z + 0.2), fov: 40 }, 1.6);
  }

  async deploy(tok, ids, onOne) {
    const L = this.cast.alaa; L.setWorking(false);
    this.boxes.visible = true;
    this.move({ pos: V(0.5, 7.5, 9.0), target: V(0, 0.4, 0), fov: 52 }, 1.6);
    for (const id of ids) {
      if (!this.alive(tok)) return false;
      const k = this.stations.find((x) => x.st.id === id); if (!k || k.ws) { onOne?.(id, false); continue; }
      const ws = buildWorkstation({ screen: this.desktopMat }); k.g.add(ws); k.ws = ws;
      ws.position.y = 0.9; ws.scale.setScalar(0.6);
      this.tween(0.5, (q) => { const e = ease(q); ws.position.y = 0.9 * (1 - e); ws.scale.setScalar(0.6 + 0.4 * e); });
      const wp = k.g.getWorldPosition(V()); L.walk([[wp.x * 0.7, wp.z * 0.75]], 3.2);
      playPartSnap();
      onOne?.(id, true);
      await sleep(this.reduced ? 20 : 190);
    }
    this.boxes.visible = false;
    return true;
  }

  async mountCabinet(tok) {
    const cab = this.cabinet; cab.visible = true; cab.position.copy(this.cabFloor.pos); cab.rotation.y = this.cabFloor.rot;
    const L = this.cast.alaa; L.setWorking(false);
    await this.move({ pos: V(-1.2, 2.2, 1.6), target: V(-2.3, 1.4, 4.9), fov: 44 }, 1.5);
    await L.walk([[-3.25, 3.75]], 1.3);
    if (!this.alive(tok)) return;
    L.faceTowards(-2.55, 5.2); L.play('place', 1.6);
    await this.moveObj(cab, this.cabMounted, 2.0, 0.2);
    playPlaceFurniture();
    playDoor(true);
    await this.tween(0.85, (k) => cab.userData.setDoor(ease(k)), 'cabdoor');
    await this.focusCabinet();
  }
  focusCabinet() { const p = this.cabMounted.pos; return this.move({ pos: V(p.x - 0.5, p.y + 0.12, p.z - 1.75), target: V(p.x - 0.45, p.y - 0.06, p.z), fov: 42 }, 1.4); }
  animateRackPart(u) {
    const m = this.rackMeshes[u]; if (!m) return;
    playPartSnap();
    const z1 = m.position.z; m.position.z = z1 + 0.5; this.tween(0.75, (k) => { m.position.z = z1 + 0.5 * (1 - ease(k)); });
  }

  async bringPeripheral(kind) {
    const o = this[kind]; o.visible = true;
    if (kind === 'display') {
      const L = this.cast.alaa; L.walk([[0.3, -3.6]], 1.4);
      o.position.copy(o.userData.start.pos); o.rotation.y = 0;
      await this.move({ pos: V(1.6, 1.6, -1.8), target: V(0, 1.4, -5), fov: 46 }, 1.2);
      await this.moveObj(o, o.userData.target, 1.4, 0.1);
      playPlaceFurniture();
      return;
    }
    if (kind === 'ups') {
      playDoor(false);
      await this.tween(0.6, (k) => this.room.door.setOpen(1 - ease(k)), 'door');
    }
    o.position.copy(o.userData.start.pos); o.rotation.y = o.userData.start.rot;
    const t = o.userData.target.pos;
    const camX = t.x < 0 ? t.x + 2.6 : t.x - 2.4;
    await this.move({ pos: V(camX, 1.85, t.z + 2.5), target: V(t.x, 0.65, t.z), fov: 44 }, 1.2);
    const mid = { pos: V(HALF.w - 0.9, 0, FIXTURES.door.z + 0.4), rot: o.userData.target.rot };
    await this.moveObj(o, mid, 1.1); await this.moveObj(o, o.userData.target, 0.95);
    playPlaceFurniture();
    if (kind === 'ups') {
      playDoor(true);
      await this.tween(0.8, (k) => this.room.door.setOpen(ease(k) * 0.95), 'door');
    }
  }
  printTest() { playPrinter(); const p = this.printer.userData.paper; p.visible = true; const z0 = 0.05; this.tween(1.6, (k) => { p.position.z = z0 + 0.35 * k; p.position.y = 0.835 - 0.03 * k; }); }

  /** Finale interactive sequence: Teacher Yasser walks to the teacher PC, sends a print job while Abu Anis & Alaa watch, and checks the printed sheet at the printer */
  async playYasserPrintTest(tok) {
    const L = this.cast.alaa, A = this.cast.abuAnis, Y = this.cast.yasser;
    const T = FIXTURES.teacherDesk, P = FIXTURES.printer;
    this.silence();
    this.teacherDesk.visible = true;
    this.teacherDesk.position.copy(this.teacherDesk.userData.target.pos);
    this.teacherWS.visible = true;
    this.printer.visible = true;
    this.printer.position.copy(this.printer.userData.target.pos);

    // Abu Anis and Alaa turn and watch Yasser walk to the teacher workstation
    A.lookAt(Y.head);
    L.lookAt(Y.head);
    A.faceTowards(T.x, T.z);
    L.faceTowards(T.x, T.z);

    // Wide shot showing Abu Anis & Alaa watching Yasser walk over to the teacher PC
    this.move({ pos: V(1.6, 1.85, 0.25), target: V(T.x, 1.02, T.z - 0.2), fov: 44 }, 1.3);
    await Y.walk([[0.4, -2.1], [T.x + 0.15, T.z - 0.58]], 1.45);
    if (!this.alive(tok)) return;

    // Yasser uses the teacher PC to send a test page to the network printer
    Y.face(0);
    Y.lookAt(this.teacherWS);
    Y.setWorking(true);
    this.drawTeacherScreen({ mode: 'install', title: 'Print — Brother Laser Printer', sub: 'Sending test page over network (Outlet B-03)...', pct: 0.92 });
    await sleep(950);
    if (!this.alive(tok)) return;
    Y.setWorking(false);
    this.drawTeacherScreen({ mode: 'desktop' });

    // Camera frames the printer table beside the teacher desk while Abu Anis & Alaa look toward the printer
    A.faceTowards(P.x, P.z);
    L.faceTowards(P.x, P.z);
    this.move({ pos: V(P.x + 2.25, 1.62, P.z + 2.05), target: V(P.x + 0.2, 0.92, P.z + 0.1), fov: 40 }, 1.0);
    this.printTest();
    await Y.walk([[P.x + 0.62, P.z + 0.45]], 1.2);
    if (!this.alive(tok)) return;
    Y.faceTowards(P.x, P.z);
    Y.play('place', 0.9);
    await sleep(650);
    if (!this.alive(tok)) return;
    if (this.printer.userData.paper) this.printer.userData.paper.visible = false;
    Y.setHoldingPaper(true);
    Y.play('nod', 1.0);
    await sleep(450);
    if (!this.alive(tok)) return;

    // Yasser walks back to Abu Anis and Alaa holding the printed paper in his hand
    this.move(this.groupShot(['alaa', 'abuAnis', 'yasser']), 1.3);
    await Y.walk([[0.5, -2.0], [2.2, -1.15]], 1.45);
    if (!this.alive(tok)) return;
    A.faceTowards(L.root.position.x, L.root.position.z);
    Y.faceTowards(L.root.position.x, L.root.position.z);
    L.faceTowards(2.3, -1.5);
  }

  /** Abdullah Al-Dajjah enters the classroom from the corridor holding two floor squeegees (قشاطتين) to mop the classroom floor */
  async playAbdullahEntrance(tok) {
    const D = this.cast.abdullah, L = this.cast.alaa, A = this.cast.abuAnis, Y = this.cast.yasser;
    if (!D) return;
    D.root.visible = true;
    D.place(HALF.w + 1.4, FIXTURES.door.z - 1.8, 0);
    D.setMopping(false);
    this.room.door.setOpen(0.95);
    playDoor(true);

    // Teachers look toward the door as Abdullah arrives from the corridor
    A.lookAt(D.head);
    Y.lookAt(D.head);
    L.lookAt(D.head);
    this.move({ pos: V(-1.4, 1.72, 1.1), target: V(HALF.w - 0.2, 1.1, FIXTURES.door.z + 0.2), fov: 44 }, 1.1);

    await D.walk([[HALF.w + 0.4, FIXTURES.door.z], [2.5, FIXTURES.door.z + 0.35], [0.8, -0.5]], 1.35);
    if (!this.alive(tok)) return;
    D.faceTowards(0, 1.8);
    D.play('wave', 1.2);
    D.setMopping(true);
    await sleep(750);
    if (!this.alive(tok)) return;
    await D.walk([[0.1, 0.8], [-0.4, 1.6]], 1.15);
    if (!this.alive(tok)) return;
    D.faceTowards(1.5, -1.5);
    this.move(this.groupShot(['alaa', 'abuAnis', 'yasser', 'abdullah']), 1.2);
  }

  async playFinale(tok) {
    this.scene.background.setHex(0x0d131f);
    const L = this.cast.alaa, A = this.cast.abuAnis, Y = this.cast.yasser;
    this.show(['alaa', 'abuAnis', 'yasser']);
    L.place(1.0, -2.2, Math.PI / 2); L.setWorking(false);
    A.place(HALF.w + 1.2, FIXTURES.door.z, -Math.PI / 2); Y.place(HALF.w + 1.4, FIXTURES.door.z - 1.5, 0);
    this.room.door.setOpen(0.95);
    playDoor(true);
    this.cut({ pos: V(-2.2, 1.7, 1.2), target: V(HALF.w, 1.3, FIXTURES.door.z) });
    const a = A.walk([[HALF.w - 0.6, FIXTURES.door.z + 0.3], [2.4, -2.0]], 1.05);
    await sleep(650);
    const y = Y.walk([[HALF.w - 0.6, FIXTURES.door.z + 0.3], [2.3, -1.1]], 1.05);
    await Promise.all([a, y]); if (!this.alive(tok)) return;
    A.faceTowards(L.root.position.x, L.root.position.z); Y.faceTowards(L.root.position.x, L.root.position.z); L.faceTowards(2.4, -1.5);
    await this.move(this.groupShot(['alaa', 'abuAnis', 'yasser']), 1.4);
  }
  async playCredits(tok) {
    this.show(['alaa', 'abuAnis', 'yasser', 'abdullah']);
    this.cast.alaa.place(0.8, -1.8, 0.3);
    this.cast.abuAnis.place(2.0, -1.9, -0.4);
    this.cast.yasser.place(1.8, -1.0, -0.6);
    if (this.cast.abdullah) {
      this.cast.abdullah.place(-0.3, 1.2, 0.2);
      this.cast.abdullah.setMopping(true);
    }
    this.drift(true, 0.6);
    await this.move({ pos: V(0.4, 8.8, 8.8), target: V(0.4, 0.4, -0.3), fov: 46 }, 3.5);
    if (!this.alive(tok)) return;
  }

  // ---------- helpers ----------
  tween(dur, fn, key) {
    const d = this.reduced ? Math.min(dur, 0.05) : dur;
    if (key) this.cancel(key);
    return new Promise((res) => { this.tweens.push({ t: 0, dur: Math.max(0.001, d), fn, key, res }); });
  }
  cancel(key) { this.tweens = this.tweens.filter((t) => { if (t.key === key) { t.res(); return false; } return true; }); }
  moveObj(obj, { pos, rot }, dur = 1.4, arc = 0) {
    const p0 = obj.position.clone(), r0 = obj.rotation.y;
    return this.tween(dur, (k) => { const e = ease(k); obj.position.lerpVectors(p0, pos, e); obj.position.y += Math.sin(k * Math.PI) * arc; if (rot != null) obj.rotation.y = r0 + (rot - r0) * e; });
  }
  resize() { const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  setPaused(p) { this.paused = p; this.clock.getDelta(); }
  loop() {
    if (this.disposed) return; this.raf = requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta(); if (this.paused || document.hidden) return;
    const dt = Math.min(0.25, raw) * ((typeof window !== 'undefined' && window.__storySpeed) || 1);
    if (this.tweens.length) { for (const tw of this.tweens) { tw.t += dt; tw.fn(Math.min(1, tw.t / tw.dur)); } this.tweens = this.tweens.filter((tw) => { if (tw.t >= tw.dur) { tw.res(); return false; } return true; }); }
    for (const c of Object.values(this.cast)) if (c.root.visible) c.update(dt);
    const look = this.camTarget.clone();
    if (this.driftOn && !this.reduced) { this.driftT += dt; look.x += Math.sin(this.driftT * 0.35) * this.driftAmp * 0.3; this.camera.position.x += Math.cos(this.driftT * 0.25) * dt * this.driftAmp * 0.25; }
    this.camera.lookAt(look);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.ro.disconnect();
    disposeTree(this.scene); this.envTex.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss?.(); this.renderer.domElement.remove();
  }
}
