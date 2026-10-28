// Stylised, procedurally animated 3D characters built from the reference photos' visible features.
// Includes synchronized procedural footstep triggers, seated desk-work animation, 3D phone-call pose, held printed paper sheet, and dual squeegees for Abdullah Al-Dajjah.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex } from './props.js';
import { playFootstep, playCrouch, playJump, playLand } from '../../story/sfx.js';

const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.65, ...o });
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

function limb(len, rTop, rBot, mat) {
  const g = new THREE.CylinderGeometry(rTop, rBot, len, 14);
  g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function rbox(w, h, d, mat, r = 0.04) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}

function buildSqueegee(side = 1) {
  const g = new THREE.Group();
  const stickMat = M({ color: 0xc89d66, roughness: 0.55 });
  const headMat = M({ color: side > 0 ? 0x2563eb : 0x0ea5e9, roughness: 0.4 });
  const rubberMat = M({ color: 0x1e293b, roughness: 0.85 });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10), stickMat);
  stick.position.set(0, -0.36, 0.24);
  stick.rotation.x = 0.52;
  g.add(stick);
  const head = rbox(0.42, 0.032, 0.045, headMat, 0.008);
  head.position.set(0, -0.81, 0.50);
  g.add(head);
  const blade = rbox(0.44, 0.024, 0.022, rubberMat, 0.004);
  blade.position.set(0, -0.835, 0.505);
  g.add(blade);
  return g;
}

function buildPrintedPaperProp() {
  const g = new THREE.Group();
  const paperMat = new THREE.MeshStandardMaterial({
    map: canvasTex('held-print-page', 256, 360, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(22, 24, w - 44, 18);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('BTEC IT LAB - TEST PAGE', 26, 66);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(24, 80, 90, 12);
      ctx.fillStyle = '#475569';
      for (let y = 112; y < h - 40; y += 18) {
        ctx.fillRect(24, y, w - (y % 36 === 0 ? 78 : 48), 6);
      }
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, w - 20, h - 20);
    }),
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), paperMat);
  g.add(sheet);
  return g;
}

export class Character {
  constructor(id, cfg) {
    this.id = id; this.cfg = cfg;
    this.root = new THREE.Group(); this.root.name = `char-${id}`;
    const s = cfg.height / 1.72;
    const thin = cfg.build === 'thin' ? 0.88 : cfg.build === 'short' ? 1.06 : 1;
    const skin = M({ color: cfg.skin, roughness: 0.55 });
    const shirt = M({ color: cfg.shirt, roughness: 0.75 });
    const outer = cfg.jacket ? M({ color: cfg.jacket, roughness: 0.7 }) : shirt;
    const trousers = M({ color: cfg.trousers, roughness: 0.8 });
    const shoes = M({ color: cfg.shoes, roughness: 0.4 });

    const legLen = 0.86 * s, thigh = legLen * 0.5, shin = legLen * 0.5;
    this.baseHipY = legLen;
    this.seatHipY = 0.53 * s;
    const hips = (this.hips = new THREE.Group()); hips.position.y = legLen; this.root.add(hips);
    const pelvis = rbox(0.34 * thin, 0.16 * s, 0.2, trousers, 0.06); pelvis.position.y = 0.02; hips.add(pelvis);
    // legs
    this.leg = {};
    for (const [side, x] of [[-1, -0.095 * thin], [1, 0.095 * thin]]) {
      const hip = new THREE.Group(); hip.position.set(x, 0, 0); hips.add(hip);
      hip.add(limb(thigh, 0.078 * thin, 0.065 * thin, trousers));
      const knee = new THREE.Group(); knee.position.y = -thigh; hip.add(knee);
      knee.add(limb(shin, 0.062 * thin, 0.05 * thin, trousers));
      const foot = rbox(0.1, 0.06, 0.22, shoes, 0.025); foot.position.set(0, -shin + 0.03, 0.05); knee.add(foot);
      this.leg[side] = { hip, knee };
    }
    // spine & torso
    const spine = (this.spine = new THREE.Group()); spine.position.y = 0.06; hips.add(spine);
    const torsoH = 0.52 * s;
    const chest = rbox(0.38 * thin, torsoH, 0.22 * thin, outer, 0.07); chest.position.y = torsoH / 2; spine.add(chest);
    const belly = rbox(0.35 * thin, torsoH * 0.5, 0.21 * thin + 0.02, outer, 0.09); belly.position.y = torsoH * 0.26; spine.add(belly);
    const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * thin + 0.01, 0.3 * thin, 6, 12), outer); shoulders.rotation.z = Math.PI / 2; shoulders.position.y = torsoH - 0.06; shoulders.castShadow = true; spine.add(shoulders);
    if (cfg.jacket) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.34), M({ color: cfg.shirt })); v.position.set(0, torsoH - 0.17, 0.127 * thin + 0.012); spine.add(v);
      if (!cfg.noTie) {
        const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.26), M({ map: canvasTex('tie', 32, 256, (g, w, h) => { g.fillStyle = '#2c3a66'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9d2e8'; g.lineWidth = 3; for (let y = -w; y < h; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + w); g.stroke(); } }) }));
        tie.position.set(0, torsoH - 0.18, 0.127 * thin + 0.014); spine.add(tie);
      } else {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.068, 0.055, 16), M({ color: cfg.shirt }));
        collar.position.set(0, torsoH + 0.015, 0);
        spine.add(collar);
      }
    } else if (cfg.stripes) {
      const st = rbox(0.385 * thin, torsoH * 0.96, 0.225 * thin, M({ map: canvasTex('stripes-' + id, 64, 256, (g, w, h) => {
        g.fillStyle = '#' + cfg.shirt.toString(16).padStart(6, '0'); g.fillRect(0, 0, w, h);
        const cols = cfg.stripes.map((c) => '#' + c.toString(16).padStart(6, '0'));
        [44, 78, 128, 162, 206].forEach((y, i) => { g.fillStyle = cols[i % cols.length]; g.fillRect(0, y, w, i % 2 ? 12 : 22); });
      }), roughness: 0.8 }), 0.07);
      st.position.y = torsoH / 2; spine.add(st);
    }
    // neck & head
    const neck = (this.neck = new THREE.Group()); neck.position.y = torsoH + 0.02; spine.add(neck);
    neck.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.09, 14), skin));
    const head = (this.head = new THREE.Group()); head.position.y = 0.06; neck.add(head);
    const hs = 0.115 * (cfg.build === 'short' ? 1.04 : 1);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(hs, 28, 22), skin); skull.scale.set(0.9, 1.05, 1); skull.position.y = hs; skull.castShadow = true; head.add(skull);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.82, 20, 14), skin); jaw.scale.set(0.95, 0.85, 0.95); jaw.position.set(0, hs * 0.62, 0.012); head.add(jaw);
    const dark = M({ color: 0x1a1412, roughness: 0.4 });
    for (const sd of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 12, 10), M({ color: 0xf4f1ea, roughness: 0.3 })); white.scale.set(1.25, 0.8, 0.6); white.position.set(sd * 0.036, hs * 1.08, hs * 0.845); head.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 8), dark); pupil.position.set(sd * 0.036, hs * 1.08, hs * 0.895); head.add(pupil);
      const brow = rbox(0.034, 0.007, 0.012, dark, 0.003); brow.position.set(sd * 0.037, hs * 1.24, hs * 0.84); brow.rotation.z = sd * -0.06; head.add(brow);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skin); ear.scale.set(0.45, 1, 0.7); ear.position.set(sd * hs * 0.91, hs * 0.98, 0); head.add(ear);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 10), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, hs * 0.92, hs * 0.98); head.add(nose);
    const mouth = (this.mouth = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.008, 0.01, 2, 0.003), M({ color: 0x7a3a33 }))); mouth.position.set(0, hs * 0.62, hs * 0.86); head.add(mouth);
    if (cfg.hair) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(hs * 1.035, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), M({ color: cfg.hair, roughness: 0.95, transparent: !!cfg.hairThin, opacity: cfg.hairThin ? 0.92 : 1 }));
      cap.scale.set(0.9, 1.05, 1); cap.position.y = hs * 1.04; cap.rotation.x = -0.25; head.add(cap);
    } else {
      skull.material = M({ color: cfg.skin, roughness: 0.32 });
    }
    if (cfg.beard) {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.845, 24, 16, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.5, Math.PI * 0.42), M({ color: cfg.beard, roughness: 1, transparent: true, opacity: cfg.beardAmount, depthWrite: false }));
      beard.scale.set(0.96, 0.86, 0.96); beard.position.set(0, hs * 0.62, 0.014); head.add(beard);
      const lip = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.012, 0.012, 2, 0.005), M({ color: cfg.beard, roughness: 1, transparent: true, opacity: Math.min(0.9, cfg.beardAmount * 1.4), depthWrite: false }));
      lip.position.set(0, hs * 0.72, hs * 0.86); head.add(lip);
    }
    if (cfg.glasses) {
      const gm = M({ color: 0x22201d, metalness: 0.85, roughness: 0.25 });
      const gl = new THREE.Group(); gl.position.set(0, hs * 1.08, hs * 0.88); head.add(gl);
      for (const sd of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.003, 8, 24), gm); ring.position.x = sd * 0.036; gl.add(ring);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.095), gm); arm.position.set(sd * 0.061, 0, -0.045); gl.add(arm);
      }
      gl.add(new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.003), gm));
    }
    // arms
    this.arm = {};
    const upper = 0.30 * s, fore = 0.27 * s;
    for (const [side, x] of [[-1, -0.22 * thin], [1, 0.22 * thin]]) {
      const sh = new THREE.Group(); sh.position.set(x, torsoH - 0.06, 0); spine.add(sh);
      sh.add(limb(upper, 0.056 * thin, 0.048 * thin, outer));
      const el = new THREE.Group(); el.position.y = -upper; sh.add(el);
      el.add(limb(fore, 0.045 * thin, 0.04 * thin, outer));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), skin); hand.scale.set(0.8, 1.1, 0.6); hand.position.y = -fore - 0.03; el.add(hand);
      this.arm[side] = { sh, el, hand };
    }

    // 3D Smartphone / Handset held in the right hand (`arm[-1]`) during phone calls
    const phoneProp = (this.phoneProp = new THREE.Group());
    phoneProp.position.set(0.018, -fore - 0.035, 0.025);
    phoneProp.rotation.set(0.35, 0.2, 0.15);
    const phoneBody = rbox(0.016, 0.145, 0.072, M({ color: 0x111318, roughness: 0.25, metalness: 0.4 }), 0.006);
    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.062, 0.128),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85, roughness: 0.2 })
    );
    phoneScreen.rotation.y = Math.PI / 2;
    phoneScreen.position.x = 0.0085;
    phoneProp.add(phoneBody, phoneScreen);
    phoneProp.visible = false;
    this.arm[-1].el.add(phoneProp);

    // 3D Printed Test Page held in the hand (`arm[-1]`) after Yasser tests the printer
    const paperProp = (this.paperProp = buildPrintedPaperProp());
    paperProp.position.set(0.06, -fore - 0.04, 0.11);
    paperProp.rotation.set(0.25, 0.15, -0.18);
    paperProp.visible = false;
    this.arm[-1].el.add(paperProp);

    // Dual floor squeegees (قشاطتين) for Abdullah Al-Dajjah
    this.squeegeeProps = [];
    if (cfg.squeegees) {
      for (const sd of [-1, 1]) {
        const sq = buildSqueegee(sd);
        sq.position.set(sd * 0.02, -fore - 0.02, 0.02);
        this.arm[sd].el.add(sq);
        this.squeegeeProps.push(sq);
      }
    }

    this.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });

    // animation state
    this.state = 'idle'; this.gesture = null; this.gT = 0; this.walkPhase = 0; this.speed = 1.25;
    this.path = null; this.onArrive = null; this.lookTarget = null; this.facing = 0; this.talkLevel = 0; this.workLevel = 0;
    this.sitting = false; this.sitLevel = 0;
    this.onPhone = false; this.phoneLevel = 0;
    this.holdingPaper = false; this.paperLevel = 0;
    this.mopping = false; this.mopLevel = 0;
    this.crouching = false; this.crouchLevel = 0;
    this.jumpY = 0; this.jumpVel = 0;
    this.lastStepIdx = 0;
    this.t = Math.random() * 10;
  }

  surfaceAt() {
    if (this.root.position.x < -20) return 'wood';
    if (this.root.position.z > 40) return 'stone';
    return 'tile';
  }

  resetState() {
    if (this.onArrive) {
      const cb = this.onArrive;
      this.onArrive = null;
      cb();
    }
    this.path = null;
    this.state = 'idle';
    this.faceTarget = null;
    this.lookTarget = null;
    this.gesture = null;
    this.gT = 0;
    this.talking = false;
    this.talkLevel = 0;
    this.working = false;
    this.workLevel = 0;
    this.sitting = false;
    this.sitLevel = 0;
    this.onPhone = false;
    this.phoneLevel = 0;
    this.holdingPaper = false;
    this.paperLevel = 0;
    this.mopping = false;
    this.mopLevel = 0;
    if (this.phoneProp) this.phoneProp.visible = false;
    if (this.paperProp) this.paperProp.visible = false;
    this.crouching = false;
    this.crouchLevel = 0;
    this.jumpY = 0;
    this.jumpVel = 0;
    this.root.position.y = 0;
  }

  place(x, z, ry = 0) {
    this.resetState();
    this.root.position.set(x, 0, z);
    this.facing = ry;
    this.root.rotation.y = ry;
    this.update(0.016);
  }
  face(ry) { this.faceTarget = ry; }
  faceTowards(x, z) { this.faceTarget = Math.atan2(x - this.root.position.x, z - this.root.position.z); }
  lookAt(obj) { this.lookTarget = obj; }
  /** walk along [ [x,z], ... ]; resolves when arrived */
  walk(points, speed = 1.25) {
    if (this.onArrive) {
      const prevCb = this.onArrive;
      this.onArrive = null;
      prevCb();
    }
    this.sitting = false;
    this.onPhone = false;
    return new Promise((res) => { this.path = points.map(([x, z]) => new THREE.Vector3(x, 0, z)); this.speed = speed; this.state = 'walk'; this.onArrive = res; });
  }
  play(g, dur = 1.8) { this.gesture = g; this.gT = 0; this.gDur = dur; }
  setTalking(on) { this.talking = on; }
  setWorking(on) { this.working = on; if (on) this.onPhone = false; }
  setMopping(on) { this.mopping = !!on; }
  setHoldingPaper(on) {
    this.holdingPaper = !!on;
    if (this.paperProp) this.paperProp.visible = !!on;
  }
  setSitting(on, snap = false) {
    this.sitting = !!on;
    if (snap) {
      this.sitLevel = this.sitting ? 1 : 0;
      this.update(0.016);
    }
  }
  setPhoneCall(on) {
    this.onPhone = !!on;
    this.talking = !!on;
    if (this.phoneProp) this.phoneProp.visible = !!on;
  }
  toggleCrouch(force) {
    if (this.sitting) return false;
    const next = typeof force === 'boolean' ? force : !this.crouching;
    if (next !== this.crouching) {
      this.crouching = next;
      playCrouch(next);
    }
    return this.crouching;
  }
  jump() {
    if (this.sitting || this.jumpY > 0.01 || this.jumpVel > 0.05) return false;
    if (this.crouching) { this.crouching = false; }
    this.jumpVel = 3.25;
    playJump();
    return true;
  }

  update(dt) {
    this.t += dt;
    const r = this.root;
    // locomotion
    let moving = false;
    if (this.path && this.path.length) {
      const target = this.path[0];
      const d = new THREE.Vector3(target.x - r.position.x, 0, target.z - r.position.z);
      const dist = d.length();
      if (dist < 0.05) {
        this.path.shift();
        if (!this.path.length) { this.path = null; this.state = 'idle'; const cb = this.onArrive; this.onArrive = null; cb?.(); }
      } else {
        moving = true;
        const effSpeed = this.crouching ? this.speed * 0.62 : this.speed;
        const step = Math.min(dist, effSpeed * dt);
        r.position.addScaledVector(d.normalize(), step);
        const want = Math.atan2(d.x, d.z);
        this.facing = lerpAngle(this.facing, want, 1 - Math.exp(-dt * 10));
        r.rotation.y = this.facing;
        this.walkPhase += dt * effSpeed * 5.2;
        const curStepIdx = Math.floor(this.walkPhase / Math.PI);
        if (curStepIdx > this.lastStepIdx && this.jumpY <= 0.01 && r.visible) {
          this.lastStepIdx = curStepIdx;
          playFootstep(this.surfaceAt(), curStepIdx);
        }
      }
    } else if (this.faceTarget != null) {
      this.facing = lerpAngle(this.facing, this.faceTarget, 1 - Math.exp(-dt * 6));
      r.rotation.y = this.facing;
      if (Math.abs(((this.faceTarget - this.facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.01) this.faceTarget = null;
    }

    // Jump & land vertical physics
    if (this.jumpY > 0 || this.jumpVel !== 0) {
      this.jumpY += this.jumpVel * dt;
      this.jumpVel -= 9.8 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVel = 0;
        if (r.visible) playLand(this.surfaceAt());
      }
      r.position.y = this.jumpY;
    } else {
      r.position.y = 0;
    }

    const phoneActive = this.onPhone || this.gesture === 'phone';
    if (this.phoneProp) this.phoneProp.visible = phoneActive;
    if (this.paperProp) this.paperProp.visible = this.holdingPaper && !phoneActive;

    this.walkMix = (this.walkMix ?? 0) + ((moving ? 1 : 0) - (this.walkMix ?? 0)) * (1 - Math.exp(-dt * 8));
    this.talkLevel += ((this.talking ? 1 : 0) - this.talkLevel) * (1 - Math.exp(-dt * 6));
    this.workLevel += ((this.working ? 1 : 0) - this.workLevel) * (1 - Math.exp(-dt * 5));
    this.sitLevel += ((this.sitting ? 1 : 0) - this.sitLevel) * (1 - Math.exp(-dt * 8));
    this.phoneLevel += ((phoneActive ? 1 : 0) - this.phoneLevel) * (1 - Math.exp(-dt * 8));
    this.paperLevel += ((this.holdingPaper ? 1 : 0) - this.paperLevel) * (1 - Math.exp(-dt * 8));
    this.mopLevel += ((this.mopping ? 1 : 0) - this.mopLevel) * (1 - Math.exp(-dt * 6));
    this.crouchLevel += ((this.crouching ? 1 : 0) - this.crouchLevel) * (1 - Math.exp(-dt * 9));
    const w = this.walkMix; const p = this.walkPhase; const cr = this.crouchLevel; const sit = this.sitLevel;
    const phn = this.phoneLevel;
    const pap = this.paperLevel;
    const mop = this.mopLevel;
    const hasSq = this.cfg.squeegees ? 1 : 0;
    const standWork = this.workLevel * (1 - sit);
    const sitWork = this.workLevel * sit * (1 - phn);
    const breath = Math.sin(this.t * 1.6) * 0.012;

    // base pose + seated / crouch stance
    this.hips.position.y = this.baseHipY - sit * (this.baseHipY - this.seatHipY) - cr * 0.28 + Math.abs(Math.sin(p)) * 0.025 * w;
    this.spine.rotation.x = 0.04 * w + breath * 0.5 + standWork * 0.25 + sit * 0.06 + sitWork * 0.08 + cr * 0.36 + mop * 0.14;
    this.spine.rotation.y = Math.sin(p) * 0.08 * w + sitWork * Math.sin(this.t * 1.2) * 0.03 + mop * Math.sin(this.t * 3.2) * 0.12;
    for (const sd of [-1, 1]) {
      const L = this.leg[sd]; const ph = p + (sd > 0 ? Math.PI : 0);
      L.hip.rotation.x = Math.sin(ph) * 0.5 * w - sit * 1.48 - cr * 0.68;
      L.hip.rotation.z = sd * sit * 0.04;
      L.knee.rotation.x = Math.max(0, -Math.cos(ph)) * 0.7 * w + sit * 1.48 + cr * 1.25;
      const A = this.arm[sd];
      const typeOsc = Math.sin(this.t * 8.5 + (sd > 0 ? 0 : 1.9)) * 0.055 + Math.sin(this.t * 13.0 + sd) * 0.025;
      const sitArmShX = sit * (-0.28) + sitWork * (-0.28 + typeOsc * 0.35);
      const sitArmElX = sit * (-0.62) + sitWork * (-0.58 + typeOsc);
      const sqHoldShX = hasSq * (-0.42 + mop * Math.sin(this.t * 3.4 + (sd > 0 ? 0 : Math.PI)) * 0.22);
      const sqHoldElX = hasSq * (-0.38 + mop * Math.cos(this.t * 3.4 + (sd > 0 ? 0 : Math.PI)) * 0.18);
      A.sh.rotation.x = -Math.sin(ph) * 0.3 * w * (1 - hasSq * 0.5) - standWork * (0.9 + Math.sin(this.t * 3 + sd) * 0.12) + sitArmShX + sqHoldShX - cr * 0.35;
      A.sh.rotation.y = -sd * sitWork * 0.22 + sd * hasSq * (-0.12);
      A.sh.rotation.z = sd * (0.06 + breath - sitWork * 0.03 + hasSq * 0.08);
      A.el.rotation.x = -0.15 - 0.25 * w * (1 - hasSq * 0.5) - standWork * (0.7 + Math.sin(this.t * 4 + sd * 2) * 0.15) + sitArmElX + sqHoldElX - cr * 0.45;
      A.el.rotation.z = 0;
    }

    // Holding printed test page in hand (`arm[-1]`)
    if (pap > 0.01 && phn < 0.01) {
      const RArm = this.arm[-1];
      RArm.sh.rotation.x = RArm.sh.rotation.x * (1 - pap) + (-0.52) * pap;
      RArm.sh.rotation.y = RArm.sh.rotation.y * (1 - pap) + (-0.18) * pap;
      RArm.sh.rotation.z = RArm.sh.rotation.z * (1 - pap) + (-0.12) * pap;
      RArm.el.rotation.x = RArm.el.rotation.x * (1 - pap) + (-1.05) * pap;
    }

    // Dedicated right-hand phone call pose (`arm[-1]` holds `this.phoneProp` up to the right ear)
    if (phn > 0.01) {
      const RArm = this.arm[-1];
      RArm.sh.rotation.x = RArm.sh.rotation.x * (1 - phn) + (-1.35) * phn;
      RArm.sh.rotation.y = RArm.sh.rotation.y * (1 - phn) + (-0.28) * phn;
      RArm.sh.rotation.z = RArm.sh.rotation.z * (1 - phn) + (0.22) * phn;
      RArm.el.rotation.x = RArm.el.rotation.x * (1 - phn) + (-1.92) * phn;
      RArm.el.rotation.z = RArm.el.rotation.z * (1 - phn) + (-0.32) * phn;
      this.head.rotation.z = -0.06 * phn;
    } else if (!this.gesture) {
      this.head.rotation.z = 0;
    }

    // talking & seated screen-reading head motion
    const tl = this.talkLevel;
    this.head.rotation.x = Math.sin(this.t * 3.1) * 0.04 * tl + sitWork * (0.14 + Math.sin(this.t * 1.7) * 0.025) - cr * 0.22;
    this.head.rotation.y = Math.sin(this.t * 1.3) * 0.08 * tl + sitWork * Math.sin(this.t * 0.85) * 0.07;
    this.mouth.scale.y = 1 + (tl > 0.3 ? Math.abs(Math.sin(this.t * 14)) * 2.2 * tl : 0);
    if (tl > 0.02 && phn < 0.2 && !hasSq) {
      this.arm[1].sh.rotation.x += -0.35 * tl - Math.sin(this.t * 2.6) * 0.12 * tl;
      this.arm[1].el.rotation.x += -0.6 * tl;
      this.arm[1].sh.rotation.z += 0.12 * tl;
    }
    // look at
    if (this.lookTarget && !moving) {
      const wp = this.lookTarget.isVector3 ? this.lookTarget : this.lookTarget.getWorldPosition(new THREE.Vector3());
      const hp = this.head.getWorldPosition(new THREE.Vector3());
      const yaw = Math.atan2(wp.x - hp.x, wp.z - hp.z) - this.facing;
      const yy = ((yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.neck.rotation.y += (THREE.MathUtils.clamp(yy, -0.7, 0.7) - this.neck.rotation.y) * (1 - Math.exp(-dt * 5));
    } else this.neck.rotation.y *= Math.exp(-dt * 4);

    // one-shot gestures layered on top
    if (this.gesture) {
      this.gT += dt; const k = Math.min(1, this.gT / this.gDur); const env = Math.sin(Math.PI * k);
      const R = this.arm[1], Lf = this.arm[-1];
      switch (this.gesture) {
        case 'wave': R.sh.rotation.x += -2.6 * env; R.sh.rotation.z += 0.3 * env; R.el.rotation.z = Math.sin(this.gT * 10) * 0.5 * env; break;
        case 'point': R.sh.rotation.x += -1.45 * env; R.el.rotation.x += 0.4 * env; break;
        case 'nod': this.head.rotation.x += Math.sin(this.gT * 9) * 0.18 * env; break;
        case 'think': R.sh.rotation.x += -1.2 * env; R.el.rotation.x += -1.9 * env; R.sh.rotation.z += -0.35 * env; this.head.rotation.x += 0.12 * env; this.head.rotation.z = 0.08 * env; break;
        case 'shrug': R.sh.rotation.z += 0.5 * env; Lf.sh.rotation.z -= 0.5 * env; R.el.rotation.x += -0.9 * env; Lf.el.rotation.x += -0.9 * env; this.spine.position.y = 0.06 + 0.03 * env; break;
        case 'phone': break;
        case 'talk': R.sh.rotation.x += -0.5 * env; Lf.sh.rotation.x += -0.35 * env; R.el.rotation.x += -0.6 * env; Lf.el.rotation.x += -0.5 * env; break;
        case 'place': R.sh.rotation.x += -1.1 * env; Lf.sh.rotation.x += -1.1 * env; this.spine.rotation.x += 0.35 * env; break;
        default: break;
      }
      if (k >= 1) { this.gesture = null; if (!this.onPhone) this.head.rotation.z = 0; this.spine.position.y = 0.06; R.el.rotation.z = 0; }
    }
  }
}
