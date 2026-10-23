// Close-up model of the teacher's Tiny PC for the interactive assembly, in the format of the existing
// engine (src/three/engine.js): { group, parts, home, float }. Units: 1 = 10 cm (same as models.js).
// Slots are pickable drop targets; components appear/animate when installed.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, emissive: 0x000000, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0, r = 0) => { const o = new THREE.Mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const cyl = (r, h, m, x = 0, y = 0, z = 0, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); return o; };
const tube = (pts, r, m) => { const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3); return new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 8, false), m); };

const MAT = {
  chassis: M({ color: 0x17191d, roughness: 0.5 }),
  inner: M({ color: 0x8c949e, metalness: 0.75, roughness: 0.35 }),
  pcb: M({ color: 0x14382a, roughness: 0.5 }),
  socket: M({ color: 0x22252b, roughness: 0.4 }),
  gold: M({ color: 0xd5ad4a, metalness: 1, roughness: 0.3 }),
  steel: M({ color: 0xb8c0ca, metalness: 0.95, roughness: 0.25 }),
  cpu: M({ color: 0x9aa3ad, metalness: 0.95, roughness: 0.28 }),
  fin: M({ color: 0xc4ccd5, metalness: 0.9, roughness: 0.3 }),
  black: M({ color: 0x0c0d10, roughness: 0.6 }),
  ram: M({ color: 0x1b5e3a, roughness: 0.45 }),
  chip: M({ color: 0x101114, roughness: 0.35 }),
  ssd: M({ color: 0x1b1d22, roughness: 0.4 }),
  label: M({ color: 0xe5e7eb, roughness: 0.6 }),
  red: M({ color: 0xa3121b, roughness: 0.5 }),
  monitor: M({ color: 0x1c1e22, roughness: 0.5 }),
  cableBlack: M({ color: 0x111215, roughness: 0.6 }),
  cableBlue: M({ color: 0x2563eb, roughness: 0.5 }),
  desk: M({ color: 0x6d6862, roughness: 0.6 }),
  port: M({ color: 0x050506, roughness: 0.5 }),
  usb: M({ color: 0x1d4ed8, roughness: 0.5 }),
  ghost: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0, depthWrite: false }),
};

export function buildTinyAssembly() {
  const group = new THREE.Group();
  const parts = {};
  const add = (id, g, { pickable = true, anchor = V(0, 0.3, 0), parent = group } = {}) => {
    g.userData.partId = id; parent.add(g);
    // own material instances so hover highlighting never bleeds into other parts
    g.traverse((o) => { if (o.isMesh && o.material?.emissive) o.material = o.material.clone(); });
    parts[id] = { id, group: g, home: g.position.clone(), anchor, pickable };
    return parts[id];
  };

  // desk surface
  const desk = box(14, 0.3, 7, MAT.desk, 2.2, -0.35, 0.2); desk.userData.noPick = true; group.add(desk);

  // ----- chassis (bench) -----
  const chassis = new THREE.Group(); group.add(chassis);
  const shell = new THREE.Group(); // side walls + front + rear = the 'open chassis' target for refitting the cover
  const W = 1.8, H = 0.37, D = 1.83;
  chassis.add(box(W, 0.03, D, MAT.inner, 0, 0.015, 0));
  shell.add(box(0.03, H, D, MAT.chassis, -W / 2, H / 2, 0), box(0.03, H, D, MAT.chassis, W / 2, H / 2, 0));
  // front bezel (honeycomb look via small dark hexes) and red accent
  shell.add(box(W, H, 0.04, MAT.chassis, 0, H / 2, D / 2));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) shell.add(box(0.06, 0.06, 0.01, MAT.black, -0.8 + i * 0.094 + (r % 2) * 0.047, 0.1 + r * 0.09, D / 2 + 0.021));
  shell.add(box(0.03, H - 0.04, D * 0.8, MAT.red, W / 2 + 0.016, H / 2, 0));
  // rear panel with ports
  shell.add(box(W, H, 0.04, MAT.chassis, 0, H / 2, -D / 2));
  // motherboard
  const board = box(1.68, 0.03, 1.7, MAT.pcb, 0, 0.05, 0); chassis.add(board);
  for (let i = 0; i < 26; i++) chassis.add(box(0.05 + (i % 3) * 0.03, 0.02, 0.05, MAT.chip, -0.75 + (i * 0.37) % 1.5, 0.075, -0.75 + ((i * 0.53) % 1.5)));

  // slot: CPU socket (LGA) with lever
  const socket = new THREE.Group(); socket.position.set(-0.2, 0.07, 0.15);
  socket.add(box(0.52, 0.04, 0.52, MAT.socket, 0, 0.02, 0), box(0.42, 0.012, 0.42, MAT.gold, 0, 0.046, 0));
  const lever = box(0.02, 0.02, 0.5, MAT.steel, 0.3, 0.05, 0); socket.add(lever);
  socket.add(box(0.06, 0.01, 0.06, MAT.gold, -0.19, 0.055, 0.19)); // triangle mark area
  add('socket', socket, { anchor: V(0, 0.15, 0), parent: chassis });
  // slot: SO-DIMM (two stacked, flat)
  const sod = new THREE.Group(); sod.position.set(0.52, 0.07, -0.1);
  sod.add(box(0.14, 0.06, 0.95, MAT.black, -0.25, 0.03, 0), box(0.14, 0.06, 0.95, MAT.black, -0.25, 0.1, 0));
  sod.add(box(0.06, 0.06, 0.06, MAT.steel, 0.32, 0.05, 0.46), box(0.06, 0.06, 0.06, MAT.steel, 0.32, 0.05, -0.46));
  add('sodimm', sod, { anchor: V(0, 0.2, 0), parent: chassis });
  // slot: M.2
  const m2s = new THREE.Group(); m2s.position.set(-0.25, 0.07, -0.6);
  m2s.add(box(0.24, 0.05, 0.08, MAT.black, -0.38, 0.03, 0), cyl(0.025, 0.05, MAT.gold, 0.42, 0.03, 0, 12));
  m2s.add(box(0.8, 0.004, 0.22, MAT.ghost, 0.02, 0.02, 0));
  add('m2slot', m2s, { anchor: V(0, 0.15, 0), parent: chassis });

  // components (hidden until installed)
  const cpu = new THREE.Group(); cpu.position.set(-0.2, 0.13, 0.15);
  cpu.add(box(0.4, 0.035, 0.4, MAT.pcb, 0, 0, 0), box(0.32, 0.03, 0.32, MAT.cpu, 0, 0.03, 0, 0.01));
  add('cpu', cpu, { pickable: false, parent: chassis });
  // slot on top of the CPU for the cooler (invisible pad, pickable once the CPU is in)
  const cpuTop = box(0.46, 0.06, 0.46, MAT.ghost, -0.2, 0.2, 0.15); cpuTop.userData.noHighlight = true;
  const cpuTopG = new THREE.Group(); cpuTopG.add(cpuTop); add('cpuTop', cpuTopG, { pickable: false, anchor: V(-0.2, 0.3, 0.15), parent: chassis });
  const cooler = new THREE.Group(); cooler.position.set(-0.25, 0.17, 0.2);
  cooler.add(box(0.6, 0.04, 0.6, MAT.steel, 0.05, 0, 0));
  for (let i = 0; i < 12; i++) cooler.add(box(0.02, 0.14, 0.55, MAT.fin, -0.22 + i * 0.045, 0.09, -0.05));
  const fanHouse = box(0.55, 0.16, 0.55, MAT.black, 0.62, 0.08, 0.05, 0.04); cooler.add(fanHouse);
  const fan = cyl(0.21, 0.02, M({ color: 0x2a2d33 }), 0.62, 0.17, 0.05, 20); cooler.add(fan); cooler.userData.fan = fan;
  add('cooler', cooler, { pickable: false, parent: chassis });
  const ram = new THREE.Group(); ram.position.set(0.52, 0.11, -0.1);
  for (const dy of [0, 0.07]) { const st = new THREE.Group(); st.position.y = dy; st.add(box(0.6, 0.012, 0.95, MAT.ram, 0.06, 0, 0)); for (let i = 0; i < 4; i++) st.add(box(0.15, 0.02, 0.18, MAT.chip, 0.12, 0.012, -0.33 + i * 0.22)); ram.add(st); }
  add('ram', ram, { pickable: false, parent: chassis });
  const ssd = new THREE.Group(); ssd.position.set(-0.23, 0.11, -0.6);
  ssd.add(box(0.8, 0.012, 0.22, MAT.ssd, 0, 0, 0)); ssd.add(box(0.3, 0.016, 0.16, MAT.chip, -0.05, 0.012, 0)); ssd.add(box(0.2, 0.004, 0.18, MAT.label, 0.22, 0.01, 0));
  add('m2', ssd, { pickable: false, parent: chassis });
  // top cover
  const cover = new THREE.Group();
  cover.add(box(W + 0.04, 0.03, D, MAT.chassis, 0, H + 0.015, 0));
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) cover.add(box(0.05, 0.005, 0.05, MAT.black, -0.4 + i * 0.1, H + 0.032, -0.4 + j * 0.1));
  add('chassis', cover, { anchor: V(0, H + 0.25, 0), parent: chassis });
  // the open shell (walls) is the target for putting the cover back
  add('frame', shell, { pickable: false, anchor: V(0, H + 0.2, 0), parent: chassis });

  // rear ports (slots)
  const port = (id, x, w, h, m) => { const g = new THREE.Group(); g.position.set(x, 0.18, -D / 2 - 0.022); g.add(box(w, h, 0.02, m, 0, 0, 0)); add(id, g, { anchor: V(0, 0.15, -0.1), parent: chassis }); };
  port('rearDp', -0.55, 0.2, 0.08, MAT.port);
  port('rearUsb', -0.15, 0.16, 0.1, MAT.usb);
  port('rearLan', 0.25, 0.17, 0.15, MAT.port);
  port('dcIn', 0.7, 0.1, 0.1, M({ color: 0xd4a017 }));

  // ----- monitor (seen from behind): slim panel, neck BEHIND it, VESA bracket on the panel back -----
  const mon = new THREE.Group(); mon.position.set(4.2, 0, -0.6); group.add(mon);
  mon.add(box(2.4, 0.08, 1.7, MAT.monitor, 0, 0.04, 0.1, 0.03));        // base
  mon.add(box(0.5, 2.9, 0.22, MAT.monitor, 0, 1.5, -0.12, 0.05));       // neck (between base and panel back)
  mon.add(box(6.2, 3.6, 0.16, MAT.monitor, 0, 3.4, -0.5, 0.04));        // slim panel
  mon.add(box(3.2, 2.2, 0.3, MAT.monitor, 0, 3.3, -0.3, 0.08));         // rear hump
  mon.children.forEach((c) => { c.userData.noPick = true; });
  // Horizontal VESA snap-in bracket (بالعرض كبس) on the back of the monitor
  const vesa = new THREE.Group(); vesa.position.set(4.95, 3.25, -0.12);
  vesa.add(box(1.9, 0.56, 0.04, MAT.steel, 0, 0, 0));
  vesa.add(
    box(1.92, 0.05, 0.55, MAT.steel, 0, -0.25, 0.27),
    box(1.92, 0.05, 0.55, MAT.steel, 0, 0.25, 0.27),
    box(0.05, 0.56, 0.55, MAT.steel, -0.94, 0, 0.27)
  );
  add('vesa', vesa, { anchor: V(0, 0.45, 0.3) });
  const monDp = box(0.24, 0.1, 0.04, MAT.port, 3.5, 2.6, -0.13); monDp.userData.noPick = true; group.add(monDp);
  const keyboard = box(2.6, 0.12, 0.9, MAT.black, 1.6, 0.06, 2.6, 0.04); keyboard.userData.noPick = true; group.add(keyboard);
  const mouse = box(0.35, 0.12, 0.6, MAT.black, 3.4, 0.06, 2.6, 0.12); mouse.userData.noPick = true; group.add(mouse);
  const brick = box(0.9, 0.3, 0.5, MAT.black, 6.4, 0.15, 0.8, 0.06); brick.userData.noPick = true; group.add(brick);
  const jack = box(0.4, 0.4, 0.1, M({ color: 0xeeeeee }), 7.6, 0.25, -1.9); jack.userData.noPick = true; group.add(jack);

  // horizontal snap-in mounting pose (بالعرض كبس): turn 180° around Y so rear ports face the viewer while staying horizontal
  const mountQuat = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI);
  const mountPos = V(4.95, 3.25 - H / 2, -0.1 + D / 2 + 0.02);
  const cableDest = { display: V(3.5, 2.6, -0.08), usb: V(1.6, 0.12, 2.15), lan: V(7.6, 0.25, -1.82), power: V(6.4, 0.15, 0.8) };
  const cableMat = { display: MAT.cableBlack, usb: MAT.cableBlack, lan: MAT.cableBlue, power: MAT.cableBlack };
  const cablePort = { display: 'rearDp', usb: 'rearUsb', lan: 'rearLan', power: 'dcIn' };
  const cables = {};

  const model = {
    group, parts, float: false,
    home: { dir: V(0.15, 1.15, 1.0), target: V(0, 0.15, 0), dist: 4.2 },
    mountPos, mountQuat, cableDest, cableMat, cablePort,
    chassis, cables,
    update(t) { if (cooler.visible) fan.rotation.y = t * 8; },
  };
  return model;
}

/** apply an installed-set to the model; `animateId` slides that one in */
export function applyTinyState(viewer, model, installed, animateId) {
  const p = model.parts; const has = (i) => installed.has(i);
  const vis = (id, on) => { if (p[id]) { p[id].group.visible = on; p[id].visible = on; } };
  const coverOn = !has('coverOff') || has('coverOn');
  vis('chassis', coverOn); vis('cpu', has('cpu')); vis('cooler', has('cooler')); vis('ram', has('ram')); vis('m2', has('m2'));
  // which drop targets are active
  p.chassis.pickable = coverOn && !has('coverOff'); p.cpu.pickable = false; p.cooler.pickable = false; p.ram.pickable = false; p.m2.pickable = false;
  p.cpuTop.pickable = has('cpu') && !has('cooler'); p.cpuTop.visible = p.cpuTop.pickable;
  p.frame.pickable = has('coverOff') && !has('coverOn');
  p.socket.pickable = !coverOn; p.sodimm.pickable = !coverOn; p.m2slot.pickable = !coverOn;
  // mounted on the monitor?
  const mounted = has('vesa');
  const ports = ['rearDp', 'rearUsb', 'rearLan', 'dcIn']; for (const id of ports) p[id].pickable = mounted;
  p.vesa.pickable = has('coverOn') && !mounted;
  const target = mounted ? { pos: model.mountPos, q: model.mountQuat } : { pos: V(0, 0, 0), q: new THREE.Quaternion() };
  const land = () => { model.chassis.position.copy(target.pos); model.chassis.quaternion.copy(target.q); model.chassis.updateMatrixWorld(true); syncCables(model, has); };
  if (animateId === 'vesa' && viewer) {
    const p0 = model.chassis.position.clone(), q0 = model.chassis.quaternion.clone();
    for (const c of Object.values(model.cables)) c.visible = false;
    viewer.tween(1.6, (k) => { const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; model.chassis.position.lerpVectors(p0, target.pos, e); model.chassis.position.y += Math.sin(Math.PI * k) * 0.8; model.chassis.quaternion.slerpQuaternions(q0, target.q, e); }, 'mount');
    // animations are cosmetic: always land in the final state even if frames are dropped
    setTimeout(land, 1750);
  } else land();
  // slide-in animation for components
  const compFor = { cpu: 'cpu', cooler: 'cooler', ram: 'ram', m2: 'm2', coverOn: 'chassis' };
  if (viewer && animateId && compFor[animateId]) {
    const g = p[compFor[animateId]].group; const home = p[compFor[animateId]].home.clone();
    g.position.copy(home).add(V(0, 1.2, 0));
    viewer.tween(0.9, (k) => { const e = 1 - Math.pow(1 - k, 3); g.position.copy(home).add(V(0, 1.2 * (1 - e), 0)); }, `in:${animateId}`);
    setTimeout(() => g.position.copy(home), 1000);
  }
  if (viewer && animateId === 'coverOff') {
    const g = p.chassis.group; g.visible = true; const home = p.chassis.home.clone();
    viewer.tween(0.9, (k) => { g.position.copy(home).add(V(0, 0.2 * k, -2.2 * k)); if (k >= 1) { g.visible = false; g.position.copy(home); } }, 'coveroff');
    setTimeout(() => { if (!p.chassis.pickable) { g.visible = false; g.position.copy(home); } }, 1000);
  }
}

/** cables are built from the real port positions of the mounted chassis to their destinations */
function syncCables(model, has) {
  for (const k of Object.keys(model.cableDest)) {
    const on = has(k) && has('vesa');
    if (on && !model.cables[k]) {
      const port = model.parts[model.cablePort[k]].group; const a = port.getWorldPosition(V());
      const dir = V(0, 0, 1).applyQuaternion(model.chassis.quaternion).multiplyScalar(-1); // out of the rear face
      const b = model.cableDest[k];
      const p1 = a.clone().addScaledVector(dir, 0.25); const p2 = V(p1.x + (b.x - p1.x) * 0.3, Math.min(p1.y, b.y) + 0.5, p1.z + (b.z - p1.z) * 0.3);
      const t = tube([a, p1, p2, V(b.x, b.y + 0.4, b.z + 0.2), b], k === 'power' ? 0.04 : 0.032, model.cableMat[k]);
      t.userData.noPick = true; model.group.add(t); model.cables[k] = t;
    }
    if (model.cables[k]) model.cables[k].visible = on;
  }
}
