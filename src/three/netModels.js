// Realistic 3D hardware models for the Networking Lab (Three.js PBR) with real-time hardware animations.
// Every model represents recognizable physical hardware with real port positions, status LEDs, spinning fans,
//无线/Wi-Fi signal waves, orbital telemetry cores, and interactive port sockets.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat } from './models.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const hasDOM = typeof document !== 'undefined';

function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0.015) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}

function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 24) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}

function makeLedMat(color = 0x34d399, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color: 0x090d14,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.1,
  });
}

function makeFanRotor(radius = 0.11, blades = 7, color = 0x38bdf8) {
  const rotor = new THREE.Group();
  const hub = cyl(radius * 0.26, radius * 0.26, radius * 0.18, mat('dark'), 0, 0, 0, 16);
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.3,
  });
  for (let i = 0; i < blades; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / blades) * Math.PI * 2;
    const b = box(radius * 0.62, radius * 0.02, radius * 0.24, bladeMat, radius * 0.54, 0, 0, 0.002);
    b.rotation.x = 0.48;
    pivot.add(b);
    rotor.add(pivot);
  }
  rotor.userData.noHighlight = true;
  return rotor;
}

function screenTex(title, sub, accent = '#38bdf8', bg = '#071324') {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, '#0b1f3a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 320);

  // Top status bar
  g.fillStyle = 'rgba(15, 23, 42, 0.85)';
  g.fillRect(0, 0, 512, 36);
  g.fillStyle = '#34d399';
  g.beginPath();
  g.arc(22, 18, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#94a3b8';
  g.font = '600 15px Inter, monospace, sans-serif';
  g.fillText('UNIT-1 OS · NET-LAB', 38, 23);

  // Terminal window frame
  g.fillStyle = 'rgba(2, 6, 23, 0.78)';
  g.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  g.lineWidth = 2;
  g.fillRect(28, 56, 456, 228);
  g.strokeRect(28, 56, 456, 228);

  g.fillStyle = accent;
  g.font = '700 26px Inter, monospace, sans-serif';
  g.fillText(title, 48, 106);

  g.fillStyle = '#e2e8f0';
  g.font = '500 18px monospace, sans-serif';
  g.fillText(sub, 48, 144);

  // Network activity bars
  for (let i = 0; i < 12; i++) {
    const bh = 24 + ((i * 19) % 58);
    g.fillStyle = i % 3 === 0 ? accent : 'rgba(52, 211, 153, 0.7)';
    g.fillRect(48 + i * 34, 256 - bh, 22, bh);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function badgeTex(text, fg = '#7dd3fc', bg = '#111927') {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = fg;
  g.font = '700 24px Inter, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Creates a physical RJ45 or Wi-Fi port assembly on a device model and registers its anchor, normal, LED, and interactive socket. */
function addPortAssembly(ctx, portId, kind, pos, normal, shroudColor = 0x1e293b) {
  const { group, deviceId, portAnchors, portNormals, portLeds, portSockets } = ctx;
  portAnchors[portId] = pos.clone();
  portNormals[portId] = normal.clone().normalize();

  const portGroup = new THREE.Group();
  portGroup.position.copy(pos);
  // Orient portGroup so local +Z points along `normal`
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), normal.clone().normalize());
  portGroup.quaternion.copy(q);

  const ledMat = makeLedMat(0x64748b, 0.25);
  portLeds[portId] = ledMat;

  let waveMesh = null;
  if (kind === 'eth') {
    // Metallic RJ45 shield collar
    const collar = box(0.13, 0.105, 0.04, mat('steel'), 0, 0, 0, 0.006);
    // Shroud & dark socket cavity
    const shroud = box(0.11, 0.085, 0.044, new THREE.MeshStandardMaterial({ color: shroudColor, roughness: 0.45, metalness: 0.2 }), 0, 0, 0.002, 0.004);
    const cavity = box(0.082, 0.06, 0.048, mat('black', { color: 0x030508 }), 0, -0.004, 0.004, 0.002);
    // Gold contact pins
    const pins = box(0.06, 0.012, 0.01, mat('gold'), 0, 0.016, 0.022, 0);
    // Port status LED right above the RJ45 jack
    const ledMesh = box(0.036, 0.018, 0.016, ledMat, 0, 0.068, 0.012, 0.003);
    ledMesh.userData.noHighlight = true;
    portGroup.add(collar, shroud, cavity, pins, ledMesh);
  } else {
    // Wireless transceiver indicator node + glowing wave ring
    const ringMat = ledMat;
    const dome = cyl(0.055, 0.055, 0.025, ringMat, 0, 0, 0, 20);
    dome.rotation.x = Math.PI / 2;
    dome.userData.noHighlight = true;
    waveMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.011, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    waveMesh.userData.noHighlight = true;
    portGroup.add(dome, waveMesh);
  }

  // Interactive pick sphere + halo ring so users can easily click ports in 3D
  const hitMat = new THREE.MeshBasicMaterial({
    color: kind === 'wifi' ? 0x3b82f6 : 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), hitMat);
  hitSphere.position.set(0, 0, 0.03);
  hitSphere.userData = { kind: 'port', deviceId, portId, portKind: kind, noHighlight: true };

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.12, 24), haloMat);
  halo.position.set(0, 0, 0.035);
  halo.userData = { kind: 'port', deviceId, portId, portKind: kind, noHighlight: true };
  portGroup.add(hitSphere, halo);

  portGroup.traverse((o) => {
    o.userData.deviceId = deviceId;
    if (!o.userData.kind) {
      o.userData.kind = 'port';
      o.userData.portId = portId;
      o.userData.portKind = kind;
    }
  });

  portSockets[portId] = { group: portGroup, hitMat, haloMat, halo, ledMat, kind, waveMesh };
  group.add(portGroup);
}

// ===================================================================================
// 1. DESKTOP PC (Widescreen Monitor + Stand + Keyboard + Mouse + Animated Mid-Tower Case)
// ===================================================================================
function buildDesktopPC(ctx) {
  const { group, powerMaterials, animators } = ctx;

  // --- Monitor (left-center)
  const monX = -0.28, monZ = -0.08;
  group.add(box(0.56, 0.025, 0.34, mat('alu'), monX, 0.0125, monZ + 0.04, 0.008));
  group.add(box(0.11, 0.42, 0.06, mat('alu'), monX, 0.22, monZ - 0.08, 0.01));
  const panelW = 1.18, panelH = 0.68;
  group.add(box(panelW, panelH, 0.045, mat('black', { color: 0x121721 }), monX, 0.68, monZ, 0.015));
  group.add(box(panelW - 0.04, panelH - 0.04, 0.01, mat('black', { color: 0x05070b }), monX, 0.68, monZ + 0.022, 0.004));

  const scrMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex('WORKSTATION PC', 'NIC: eth0 · 1000BASE-T', '#38bdf8', '#08182e'),
    emissive: new THREE.Color(0x1e3a5f),
    emissiveIntensity: 0.58,
    roughness: 0.18,
  });
  const scr = box(panelW - 0.07, panelH - 0.07, 0.006, scrMat, monX, 0.685, monZ + 0.026, 0);
  scr.userData.noHighlight = true;
  group.add(scr);
  powerMaterials.push({ mat: scrMat, onEmissive: 0x1e3a5f, onIntensity: 0.58 });

  // Monitor power LED
  const monLed = makeLedMat(0x34d399, 1.4);
  const monLedMesh = box(0.025, 0.012, 0.01, monLed, monX + panelW / 2 - 0.08, 0.355, monZ + 0.026, 0.002);
  monLedMesh.userData.noHighlight = true;
  group.add(monLedMesh);
  powerMaterials.push({ mat: monLed, onEmissive: 0x34d399, onIntensity: 1.4 });

  // --- Keyboard & Mouse
  const kb = new THREE.Group();
  kb.position.set(monX, 0.018, 0.36);
  kb.rotation.x = 0.06;
  kb.add(box(0.76, 0.026, 0.26, mat('dark', { color: 0x1e2532 }), 0, 0, 0, 0.008));
  for (let r = 0; r < 4; r++) {
    kb.add(box(0.68, 0.012, 0.036, mat('black', { color: 0x0c1017 }), 0, 0.016, -0.075 + r * 0.05, 0.003));
  }
  group.add(kb);
  group.add(box(0.11, 0.034, 0.17, mat('dark', { color: 0x1e2532 }), monX + 0.52, 0.017, 0.36, 0.016));

  // --- Mid-Tower PC Chassis (right side)
  const tx = 0.56, tz = -0.02, tw = 0.42, th = 0.92, td = 0.86;
  group.add(box(tw, th, td, mat('black', { color: 0x12161f }), tx, th / 2, tz, 0.02));
  group.add(box(tw - 0.06, th - 0.1, 0.02, mat('dark', { color: 0x1c2433 }), tx, th / 2, tz + td / 2 + 0.005, 0.008));
  const pcLed = makeLedMat(0x22d3ee, 1.6);
  const pcStrip = box(0.024, th - 0.16, 0.016, pcLed, tx - tw / 2 + 0.05, th / 2, tz + td / 2 + 0.014, 0.004);
  pcStrip.userData.noHighlight = true;
  group.add(pcStrip);
  powerMaterials.push({ mat: pcLed, onEmissive: 0x22d3ee, onIntensity: 1.6 });

  // Tempered glass window + internal spinning CPU & front cooling fans
  const glassPane = box(0.015, th - 0.14, td - 0.14, new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, roughness: 0.05 }), tx - tw / 2 - 0.004, th / 2, tz, 0);
  glassPane.userData.noHighlight = true;
  group.add(glassPane);

  const coolerRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 10, 28), pcLed);
  coolerRing.rotation.y = Math.PI / 2;
  coolerRing.position.set(tx - 0.13, th * 0.62, tz - 0.05);
  coolerRing.userData.noHighlight = true;
  group.add(coolerRing);

  const cpuFan = makeFanRotor(0.11, 7, 0x38bdf8);
  cpuFan.rotation.y = Math.PI / 2;
  cpuFan.position.set(tx - 0.13, th * 0.62, tz - 0.05);
  group.add(cpuFan);

  const frontFan = makeFanRotor(0.11, 7, 0x22d3ee);
  frontFan.position.set(tx, th * 0.56, tz + td / 2 + 0.018);
  group.add(frontFan);

  animators.push((t, dt, on) => {
    if (!on) return;
    cpuFan.rotation.x += dt * 9.5;
    frontFan.rotation.z += dt * 8.0;
    pcLed.emissiveIntensity = 1.25 + 0.55 * Math.sin(t * 3.2);
  });

  // Physical NIC port (eth0)
  addPortAssembly(ctx, 'eth0', 'eth', V(tx + 0.06, 0.16, tz + td / 2 + 0.022), V(0, 0, 1), 0x1b6fd1);
}

// ===================================================================================
// 2. LAPTOP (Unibody Aluminum Clamshell Laptop with eth0 + wifi0)
// ===================================================================================
function buildLaptop(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 0.98, d = 0.66, h = 0.038;

  group.add(box(w, h, d, mat('alu'), 0, h / 2, 0.05, 0.012));
  group.add(box(w - 0.12, 0.008, d * 0.52, mat('black', { color: 0x0d1118 }), 0, h + 0.002, -0.04, 0.004));
  for (let r = 0; r < 4; r++) {
    group.add(box(w - 0.16, 0.008, 0.052, mat('dark', { color: 0x1b2230 }), 0, h + 0.006, -0.16 + r * 0.075, 0.003));
  }
  group.add(box(0.28, 0.004, 0.16, mat('steel'), 0, h + 0.002, 0.24, 0.004));

  const lid = new THREE.Group();
  lid.position.set(0, h, -d / 2 + 0.06);
  lid.rotation.x = -0.32;
  lid.add(box(w, 0.62, 0.024, mat('alu'), 0, 0.31, 0, 0.01));
  lid.add(box(w - 0.05, 0.57, 0.008, mat('black', { color: 0x070a10 }), 0, 0.31, 0.011, 0.004));

  const scrMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex('LAPTOP CLIENT', 'eth0 + wifi0 (802.11ax)', '#34d399', '#071b26'),
    emissive: new THREE.Color(0x0f2f3f),
    emissiveIntensity: 0.55,
    roughness: 0.18,
  });
  const scr = box(w - 0.08, 0.53, 0.005, scrMat, 0, 0.31, 0.015, 0);
  scr.userData.noHighlight = true;
  lid.add(scr);
  powerMaterials.push({ mat: scrMat, onEmissive: 0x0f2f3f, onIntensity: 0.55 });
  group.add(lid);

  animators.push((t, _dt, on) => {
    if (!on) return;
    scrMat.emissiveIntensity = 0.5 + 0.12 * Math.sin(t * 2.4);
  });

  addPortAssembly(ctx, 'eth0', 'eth', V(-w / 2 - 0.015, 0.06, -0.05), V(-1, 0, 0), 0x1b6fd1);
  addPortAssembly(ctx, 'wifi0', 'wifi', V(w / 2 + 0.015, 0.28, -0.18), V(1, 0.25, 0));
}

// ===================================================================================
// 3. SMARTPHONE (Modern Smartphone on Desk Stand with OLED Display & wifi0)
// ===================================================================================
function buildSmartphone(ctx) {
  const { group, powerMaterials, animators } = ctx;

  group.add(box(0.32, 0.022, 0.32, mat('alu'), 0, 0.011, 0, 0.008));
  const stem = box(0.12, 0.28, 0.03, mat('alu'), 0, 0.14, -0.06, 0.006);
  stem.rotation.x = 0.25;
  group.add(stem);

  const phone = new THREE.Group();
  phone.position.set(0, 0.26, 0.02);
  phone.rotation.x = -0.38;

  const pw = 0.36, ph = 0.68, pd = 0.036;
  phone.add(box(pw, ph, pd, mat('steel', { color: 0x334155 }), 0, 0, 0, 0.02));
  phone.add(box(pw - 0.03, ph - 0.03, 0.008, mat('black', { color: 0x04070d }), 0, 0, pd / 2 + 0.002, 0.015));

  const scrMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex('MOBILE OS', 'Wi-Fi 6 · wifi0', '#38bdf8', '#09152b'),
    emissive: new THREE.Color(0x162c4f),
    emissiveIntensity: 0.62,
    roughness: 0.12,
  });
  const scr = box(pw - 0.05, ph - 0.06, 0.005, scrMat, 0, 0, pd / 2 + 0.006, 0.01);
  scr.userData.noHighlight = true;
  phone.add(scr);
  powerMaterials.push({ mat: scrMat, onEmissive: 0x162c4f, onIntensity: 0.62 });

  animators.push((t, _dt, on) => {
    if (!on) return;
    scrMat.emissiveIntensity = 0.55 + 0.15 * Math.sin(t * 2.8 + 1.0);
  });

  group.add(phone);
  addPortAssembly(ctx, 'wifi0', 'wifi', V(0, 0.58, -0.06), V(0, 0.8, 0.6));
}

// ===================================================================================
// 4. FILE SERVER (Enterprise Pedestal / Rack Server with 6 Blinking Hot-Swap Bays & Fans)
// ===================================================================================
function buildServer(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 0.78, h = 1.12, d = 1.05;

  group.add(box(w, h, d, mat('dark', { color: 0x151c28 }), 0, h / 2, 0, 0.022));
  group.add(box(w + 0.02, 0.05, d - 0.08, mat('steel'), 0, h - 0.03, 0, 0.008));
  const fz = d / 2 + 0.012;
  group.add(box(w - 0.04, h - 0.06, 0.03, mat('black', { color: 0x0d121a }), 0, h / 2, fz, 0.012));

  // Top diagnostic LCD readout panel
  const lcdMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: badgeTex('POWEREDGE SRV · OK', '#38bdf8', '#071a2e'),
    emissive: new THREE.Color(0x0c4a6e),
    emissiveIntensity: 0.85,
  });
  const lcd = box(w - 0.16, 0.11, 0.015, lcdMat, 0, h - 0.14, fz + 0.015, 0.004);
  lcd.userData.noHighlight = true;
  group.add(lcd);
  powerMaterials.push({ mat: lcdMat, onEmissive: 0x0c4a6e, onIntensity: 0.85 });

  // 6 Hot-Swap 3.5" SAS/NVMe Drive Caddies with independent I/O activity LEDs
  const driveLeds = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const bx = -0.17 + c * 0.34;
      const by = 0.42 + r * 0.17;
      group.add(box(0.29, 0.135, 0.025, mat('dark', { color: 0x1e2636 }), bx, by, fz + 0.014, 0.006));
      group.add(box(0.22, 0.024, 0.02, mat('alu'), bx - 0.02, by, fz + 0.024, 0.003));
      const dLed = makeLedMat(0x34d399, 1.3);
      const dLedMesh = box(0.02, 0.02, 0.016, dLed, bx + 0.11, by + 0.035, fz + 0.026, 0.002);
      dLedMesh.userData.noHighlight = true;
      group.add(dLedMesh);
      powerMaterials.push({ mat: dLed, onEmissive: 0x34d399, onIntensity: 1.3 });
      driveLeds.push({ mat: dLed, phase: (r * 2 + c) * 1.37, speed: 6 + (r + c) * 2.3 });
    }
  }

  // Dual rear/side visible cooling fan rotors
  const srvFan1 = makeFanRotor(0.13, 7, 0x38bdf8);
  srvFan1.position.set(-0.18, 0.32, -d / 2 - 0.012);
  const srvFan2 = makeFanRotor(0.13, 7, 0x38bdf8);
  srvFan2.position.set(0.18, 0.32, -d / 2 - 0.012);
  group.add(srvFan1, srvFan2);

  animators.push((t, dt, on) => {
    if (!on) return;
    srvFan1.rotation.z += dt * 11.0;
    srvFan2.rotation.z += dt * 11.0;
    for (const dl of driveLeds) {
      const pulse = Math.sin(t * dl.speed + dl.phase) * Math.cos(t * (dl.speed * 0.63) + dl.phase);
      dl.mat.emissiveIntensity = pulse > 0.05 ? 2.1 : 0.45;
    }
  });

  // Lower front NIC I/O bay + eth0 RJ45 port
  group.add(box(w - 0.14, 0.18, 0.02, mat('steel', { color: 0x475569 }), 0, 0.18, fz + 0.012, 0.006));
  addPortAssembly(ctx, 'eth0', 'eth', V(0, 0.18, fz + 0.03), V(0, 0, 1), 0x1b6fd1);
}

// ===================================================================================
// 5. NETWORK PRINTER (Enterprise Office Laser Printer with Paper Tray & LCD)
// ===================================================================================
function buildPrinter(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 0.88, h = 0.64, d = 0.78;

  group.add(box(w, 0.24, d, mat('dark', { color: 0x263040 }), 0, 0.12, 0, 0.018));
  group.add(box(w, 0.40, d - 0.04, mat('white', { color: 0xdbe3ee }), 0, 0.43, -0.01, 0.022));
  group.add(box(w * 0.62, 0.04, d * 0.55, mat('dark', { color: 0x1e2634 }), 0, h - 0.01, 0.02, 0.006));
  const page = box(w * 0.48, 0.008, d * 0.42, mat('white', { color: 0xffffff }), 0, h + 0.012, 0.04, 0);
  group.add(page);
  group.add(box(0.28, 0.045, 0.025, mat('steel'), 0, 0.12, d / 2 + 0.01, 0.006));

  const ctrl = new THREE.Group();
  ctrl.position.set(0.26, h + 0.03, d / 2 - 0.14);
  ctrl.rotation.x = -0.55;
  ctrl.add(box(0.26, 0.16, 0.025, mat('black', { color: 0x111827 }), 0, 0, 0, 0.008));
  const lcdMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: badgeTex('READY · IP PRN', '#34d399', '#06202b'),
    emissive: new THREE.Color(0x065f46),
    emissiveIntensity: 0.75,
  });
  const lcd = box(0.21, 0.11, 0.008, lcdMat, 0, 0, 0.014, 0.003);
  lcd.userData.noHighlight = true;
  ctrl.add(lcd);
  powerMaterials.push({ mat: lcdMat, onEmissive: 0x065f46, onIntensity: 0.75 });
  group.add(ctrl);

  animators.push((t, _dt, on) => {
    if (!on) return;
    lcdMat.emissiveIntensity = 0.65 + 0.25 * Math.sin(t * 2.5);
  });

  addPortAssembly(ctx, 'eth0', 'eth', V(-0.26, 0.15, d / 2 + 0.016), V(0, 0, 1), 0x1b6fd1);
}

// ===================================================================================
// 6. NETWORK SWITCH (Cisco Catalyst-Style 1U Enterprise Switch with fa1..fa6 RJ45 Ports)
// ===================================================================================
function buildSwitch(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 1.62, h = 0.24, d = 0.88;

  for (const sx of [-0.68, 0.68]) for (const sz of [-0.34, 0.34]) {
    group.add(cyl(0.045, 0.045, 0.03, mat('rubber'), sx, 0.015, sz, 12));
  }
  const y0 = 0.15;
  group.add(box(w, h, d, mat('dark', { color: 0x17253b, metalness: 0.65, roughness: 0.38 }), 0, y0, 0, 0.018));
  const topPlate = box(w - 0.12, 0.012, d - 0.16, mat('alu', { map: badgeTex('CISCO-STYLE L2 SWITCH · 6x GE', '#7dd3fc', '#132033') }), 0, y0 + h / 2 + 0.004, 0, 0.004);
  group.add(topPlate);

  const fz = d / 2 + 0.008;
  group.add(box(w - 0.04, h - 0.04, 0.02, mat('black', { color: 0x0b121e }), 0, y0, fz, 0.008));
  const stripeMat = makeLedMat(0x38bdf8, 1.2);
  const stripe = box(w - 0.08, 0.016, 0.012, stripeMat, 0, y0 + h / 2 - 0.032, fz + 0.01, 0.003);
  stripe.userData.noHighlight = true;
  group.add(stripe);
  powerMaterials.push({ mat: stripeMat, onEmissive: 0x38bdf8, onIntensity: 1.2 });

  const sysLeds = [];
  for (let i = 0; i < 3; i++) {
    const sLed = makeLedMat(i === 0 ? 0x34d399 : 0x38bdf8, 1.3);
    const m = box(0.025, 0.025, 0.012, sLed, -w / 2 + 0.14, y0 + 0.03 - i * 0.04, fz + 0.012, 0.003);
    m.userData.noHighlight = true;
    group.add(m);
    powerMaterials.push({ mat: sLed, onEmissive: i === 0 ? 0x34d399 : 0x38bdf8, onIntensity: 1.3 });
    sysLeds.push({ mat: sLed, phase: i * 1.4 });
  }

  animators.push((t, _dt, on) => {
    if (!on) return;
    stripeMat.emissiveIntensity = 0.95 + 0.35 * Math.sin(t * 3.0);
    for (const sl of sysLeds) {
      sl.mat.emissiveIntensity = 0.8 + 0.8 * (0.5 + 0.5 * Math.sin(t * 4.5 + sl.phase));
    }
  });

  const startX = -0.48, stepX = 0.21;
  for (let i = 0; i < 6; i++) {
    const pid = `fa${i + 1}`;
    const px = startX + i * stepX;
    addPortAssembly(ctx, pid, 'eth', V(px, y0 - 0.015, fz + 0.018), V(0, 0, 1), 0x1e293b);
  }
}

// ===================================================================================
// 7. ROUTER (Enterprise ISR Multi-Interface Gigabit Router with LAN1, LAN2, WAN & 4 Antennas)
// ===================================================================================
function buildRouter(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 1.36, h = 0.28, d = 0.92;
  const y0 = 0.16;

  group.add(box(w, h, d, mat('black', { color: 0x141b26, metalness: 0.55, roughness: 0.42 }), 0, y0, 0, 0.024));
  group.add(box(w - 0.18, 0.016, d - 0.22, mat('alu', { map: badgeTex('ISR EDGE ROUTER · L3', '#38bdf8', '#162030') }), 0, y0 + h / 2 + 0.005, 0, 0.006));

  // 4 Articulated High-Gain Dipole Antennas with glowing tips
  const antTips = [];
  for (const [ax, tilt] of [[-0.52, 0.18], [-0.18, 0.06], [0.18, -0.06], [0.52, -0.18]]) {
    group.add(cyl(0.032, 0.032, 0.08, mat('gold'), ax, y0 + 0.08, -d / 2 - 0.02, 12));
    const ant = cyl(0.02, 0.03, 0.68, mat('black', { color: 0x0f141d }), ax, y0 + 0.44, -d / 2 - 0.03, 14);
    ant.rotation.z = tilt;
    group.add(ant);
    const tipMat = makeLedMat(0x38bdf8, 1.2);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), tipMat);
    tip.position.set(ax - Math.sin(tilt) * 0.34, y0 + 0.78, -d / 2 - 0.03);
    tip.userData.noHighlight = true;
    group.add(tip);
    powerMaterials.push({ mat: tipMat, onEmissive: 0x38bdf8, onIntensity: 1.2 });
    antTips.push(tipMat);
  }

  const fz = d / 2 + 0.008;
  group.add(box(w - 0.06, h - 0.05, 0.02, mat('black', { color: 0x090d14 }), 0, y0, fz, 0.008));

  const pwrLed = makeLedMat(0x34d399, 1.5);
  const pwrMesh = box(0.035, 0.035, 0.014, pwrLed, -0.52, y0 + 0.02, fz + 0.012, 0.004);
  pwrMesh.userData.noHighlight = true;
  group.add(pwrMesh);
  powerMaterials.push({ mat: pwrLed, onEmissive: 0x34d399, onIntensity: 1.5 });

  animators.push((t, _dt, on) => {
    if (!on) return;
    antTips.forEach((tm, idx) => {
      tm.emissiveIntensity = 0.7 + 1.1 * (0.5 + 0.5 * Math.sin(t * 4.0 + idx * 0.8));
    });
  });

  addPortAssembly(ctx, 'LAN1', 'eth', V(-0.22, y0 - 0.015, fz + 0.018), V(0, 0, 1), 0x1d4ed8);
  addPortAssembly(ctx, 'LAN2', 'eth', V(0.08, y0 - 0.015, fz + 0.018), V(0, 0, 1), 0x0f766e);
  addPortAssembly(ctx, 'WAN', 'eth', V(0.42, y0 - 0.015, fz + 0.018), V(0, 0, 1), 0xd97706);
}

// ===================================================================================
// 8. WIRELESS ACCESS POINT (Ubiquiti UniFi Dome AP with Expanding 3D Wi-Fi Signal Ripples)
// ===================================================================================
function buildAccessPoint(ctx) {
  const { group, powerMaterials, animators } = ctx;

  group.add(cyl(0.46, 0.50, 0.06, mat('dark', { color: 0x1e293b }), 0, 0.03, 0, 36));
  group.add(cyl(0.54, 0.58, 0.11, mat('white', { color: 0xf1f5f9, roughness: 0.28 }), 0, 0.11, 0, 48));
  group.add(cyl(0.42, 0.54, 0.045, mat('white', { color: 0xf8fafc, roughness: 0.25 }), 0, 0.185, 0, 48));

  const ringMat = makeLedMat(0x22d3ee, 1.8);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.016, 10, 48), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.212;
  ring.userData.noHighlight = true;
  group.add(ring);
  powerMaterials.push({ mat: ringMat, onEmissive: 0x22d3ee, onIntensity: 1.8 });

  // 3 Concentric Expanding 3D Holographic Wi-Fi Signal Ripples
  const wifiWaves = [];
  for (let i = 0; i < 3; i++) {
    const wMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const wMesh = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.255, 48), wMat);
    wMesh.rotation.x = -Math.PI / 2;
    wMesh.position.y = 0.22;
    wMesh.userData = { noPick: true, noHighlight: true };
    group.add(wMesh);
    wifiWaves.push({ mesh: wMesh, mat: wMat, offset: i / 3 });
  }

  animators.push((t, _dt, on) => {
    for (const w of wifiWaves) {
      if (!on) {
        w.mat.opacity = 0;
        continue;
      }
      const u = (t * 0.48 + w.offset) % 1;
      const scale = 1 + u * 2.9;
      w.mesh.scale.setScalar(scale);
      w.mesh.position.y = 0.22 + u * 0.36;
      w.mat.opacity = (1 - u) * 0.52;
    }
    if (on) {
      ringMat.emissiveIntensity = 1.4 + 0.6 * Math.sin(t * 3.5);
    }
  });

  addPortAssembly(ctx, 'eth0', 'eth', V(0, 0.08, 0.56), V(0, 0, 1), 0x1b6fd1);
  addPortAssembly(ctx, 'radio', 'wifi', V(0, 0.26, 0), V(0, 1, 0));
}

// ===================================================================================
// 9. INTERNET / ISP CORE GATEWAY (Rotating 3D Globe + Counter-Rotating Orbital Rings)
// ===================================================================================
function buildInternetGateway(ctx) {
  const { group, powerMaterials, animators } = ctx;
  const w = 1.28, h = 0.36, d = 0.92;
  const y0 = 0.18;

  group.add(box(w, h, d, mat('dark', { color: 0x0f172a, metalness: 0.7, roughness: 0.3 }), 0, y0, 0, 0.024));
  group.add(box(w - 0.1, 0.02, d - 0.1, mat('alu', { map: badgeTex('ISP CORE · 93.184.216.34', '#38bdf8', '#091526') }), 0, y0 + h / 2 + 0.005, 0, 0.006));

  // Glowing rotating wireframe globe + orbital telemetry rings above the chassis
  const globeGroup = new THREE.Group();
  globeGroup.position.set(0, y0 + h / 2 + 0.38, -0.04);
  const coreMat = makeLedMat(0x38bdf8, 1.6);
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 22), new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.75,
    wireframe: true,
    transparent: true,
    opacity: 0.88,
  }));
  coreSphere.userData.noHighlight = true;
  const innerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18), coreMat);
  innerSphere.userData.noHighlight = true;

  // Two tilted orbital rings with satellite data nodes
  const orbit1 = new THREE.Group();
  orbit1.rotation.x = 0.62;
  orbit1.rotation.z = 0.35;
  const ring1Mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.008, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
  );
  ring1Mesh.userData.noHighlight = true;
  const sat1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), makeLedMat(0x34d399, 2.0));
  sat1.position.set(0.34, 0, 0);
  sat1.userData.noHighlight = true;
  orbit1.add(ring1Mesh, sat1);

  const orbit2 = new THREE.Group();
  orbit2.rotation.x = -0.58;
  orbit2.rotation.z = -0.42;
  const ring2Mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.007, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.5 })
  );
  ring2Mesh.userData.noHighlight = true;
  const sat2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), makeLedMat(0x38bdf8, 2.0));
  sat2.position.set(-0.39, 0, 0);
  sat2.userData.noHighlight = true;
  orbit2.add(ring2Mesh, sat2);

  globeGroup.add(coreSphere, innerSphere, orbit1, orbit2);
  group.add(globeGroup);
  powerMaterials.push({ mat: coreMat, onEmissive: 0x38bdf8, onIntensity: 1.6 });

  animators.push((t, dt, on) => {
    if (!on) return;
    coreSphere.rotation.y += dt * 0.85;
    coreSphere.rotation.x = Math.sin(t * 0.7) * 0.18;
    orbit1.rotation.z += dt * 1.9;
    orbit2.rotation.z -= dt * 1.45;
    globeGroup.position.y = y0 + h / 2 + 0.38 + Math.sin(t * 2.2) * 0.035;
  });

  const fz = d / 2 + 0.008;
  addPortAssembly(ctx, 'eth0', 'eth', V(0, y0 - 0.02, fz + 0.018), V(0, 0, 1), 0x10b981);
}

const DEVICE_BUILDERS = {
  pc: buildDesktopPC,
  laptop: buildLaptop,
  phone: buildSmartphone,
  server: buildServer,
  printer: buildPrinter,
  switch: buildSwitch,
  router: buildRouter,
  ap: buildAccessPoint,
  internet: buildInternetGateway,
};

/**
 * Builds a complete, interactive, animated 3D hardware node for a topology device.
 * Returns { id, type, group, portAnchors, portNormals, portSockets, portLeds, setState, animate }.
 */
export function buildNetDevice3D(device) {
  const group = new THREE.Group();
  group.userData = { kind: 'device', deviceId: device.id, deviceType: device.type };

  const portAnchors = {};
  const portNormals = {};
  const portLeds = {};
  const portSockets = {};
  const powerMaterials = [];
  const animators = [];

  // Base pad & dual selection/radar rings on the lab floor beneath the device
  const padRadius = device.type === 'switch' ? 0.98 : device.type === 'router' || device.type === 'internet' ? 0.84 : 0.76;
  const basePad = new THREE.Mesh(
    new THREE.CylinderGeometry(padRadius, padRadius * 1.03, 0.018, 36),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.75, metalness: 0.25 })
  );
  basePad.position.y = 0.009;
  basePad.receiveShadow = true;
  group.add(basePad);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const selRing = new THREE.Mesh(new THREE.RingGeometry(padRadius * 0.96, padRadius * 1.08, 48), ringMat);
  selRing.rotation.x = -Math.PI / 2;
  selRing.position.y = 0.02;
  selRing.userData.noHighlight = true;
  group.add(selRing);

  // Outer animated radar halo ring when selected/hovered/hot/failed
  const radarMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const radarRing = new THREE.Mesh(new THREE.RingGeometry(padRadius * 1.12, padRadius * 1.21, 32, 1, 0, Math.PI * 1.35), radarMat);
  radarRing.rotation.x = -Math.PI / 2;
  radarRing.position.y = 0.022;
  radarRing.userData = { noPick: true, noHighlight: true };
  group.add(radarRing);

  const ctx = {
    group,
    deviceId: device.id,
    portAnchors,
    portNormals,
    portLeds,
    portSockets,
    powerMaterials,
    animators,
  };

  const builder = DEVICE_BUILDERS[device.type] || buildDesktopPC;
  builder(ctx);

  // Tag all child meshes with deviceId so raycasting resolves the device cleanly
  group.traverse((o) => {
    if (!o.userData.deviceId) o.userData.deviceId = device.id;
    if (!o.userData.kind) o.userData.kind = 'device';
  });

  // Compute top label anchor height
  const bbox = new THREE.Box3().setFromObject(group);
  const labelHeight = Math.max(0.55, bbox.max.y + 0.24);

  const stateRef = {
    selected: false,
    hovered: false,
    failed: false,
    hot: false,
    on: true,
    portStates: {},
    connectMode: false,
    spawnAge: 0, // drives initial spring pop-in animation
    elevY: 0,
  };

  const setState = ({ selected = false, hovered = false, failed = false, hot = false, on = true, portStates = {}, connectMode = false } = {}) => {
    Object.assign(stateRef, { selected, hovered, failed, hot, on, portStates, connectMode });

    // Update floor ring indicator
    if (failed) {
      ringMat.color.setHex(0xf87171);
      ringMat.opacity = 0.92;
      radarMat.color.setHex(0xf87171);
      radarMat.opacity = 0.78;
    } else if (selected) {
      ringMat.color.setHex(0x38bdf8);
      ringMat.opacity = 0.95;
      radarMat.color.setHex(0x38bdf8);
      radarMat.opacity = 0.72;
    } else if (hot) {
      ringMat.color.setHex(0x34d399);
      ringMat.opacity = 0.9;
      radarMat.color.setHex(0x34d399);
      radarMat.opacity = 0.75;
    } else if (hovered) {
      ringMat.color.setHex(0x7dd3fc);
      ringMat.opacity = 0.68;
      radarMat.color.setHex(0x7dd3fc);
      radarMat.opacity = 0.48;
    } else {
      ringMat.color.setHex(on ? 0x38bdf8 : 0x64748b);
      ringMat.opacity = on ? 0.18 : 0.08;
      radarMat.opacity = 0.0;
    }

    // Update power-dependent screens & status LEDs
    for (const pm of powerMaterials) {
      if (on) {
        pm.mat.emissive.setHex(pm.onEmissive);
        pm.mat.emissiveIntensity = pm.onIntensity;
      } else {
        pm.mat.emissive.setHex(0x000000);
        pm.mat.emissiveIntensity = 0;
      }
    }

    // Update individual port LEDs and connection candidate halos
    for (const [pid, sock] of Object.entries(portSockets)) {
      const ps = portStates[pid] || {};
      if (!on || ps.adminUp === false) {
        sock.ledMat.emissive.setHex(ps.adminUp === false ? 0xf87171 : 0x000000);
        sock.ledMat.emissiveIntensity = ps.adminUp === false ? 1.1 : 0;
      } else if (ps.linked && ps.up) {
        sock.ledMat.emissive.setHex(0x34d399);
        sock.ledMat.emissiveIntensity = 1.6;
      } else if (ps.linked && !ps.up) {
        sock.ledMat.emissive.setHex(0xf87171);
        sock.ledMat.emissiveIntensity = 1.4;
      } else {
        sock.ledMat.emissive.setHex(0x475569);
        sock.ledMat.emissiveIntensity = 0.25;
      }

      if (ps.isSourcePort) {
        sock.haloMat.color.setHex(0x38bdf8);
        sock.haloMat.opacity = 0.95;
      } else if (connectMode && ps.canConnect) {
        sock.haloMat.color.setHex(0x34d399);
        sock.haloMat.opacity = 0.85;
      } else if (connectMode && !ps.canConnect) {
        sock.haloMat.color.setHex(0xf87171);
        sock.haloMat.opacity = 0.25;
      } else if (selected || hovered) {
        sock.haloMat.color.setHex(sock.kind === 'wifi' ? 0x60a5fa : 0x38bdf8);
        sock.haloMat.opacity = 0.45;
      } else {
        sock.haloMat.opacity = 0.0;
      }
    }
  };

  // Real-time per-frame animation tick called by NetLabScene.loop()
  const animate = (t, dt) => {
    // 1. Smooth spring pop-in animation when newly spawned
    if (stateRef.spawnAge < 1) {
      stateRef.spawnAge = Math.min(1, stateRef.spawnAge + dt * 2.8);
      const u = stateRef.spawnAge;
      // damped elastic overshoot
      const s = u === 1 ? 1 : 1 - Math.pow(2, -10 * u) * Math.cos((u * 10 - 0.75) * ((2 * Math.PI) / 3));
      group.scale.setScalar(Math.max(0.01, s));
    }

    // 2. Smooth hover / selection / active levitation
    const targetY = (stateRef.selected || stateRef.hovered || stateRef.hot) ? 0.055 : 0;
    stateRef.elevY += (targetY - stateRef.elevY) * Math.min(1, dt * 12);
    group.position.y = stateRef.elevY;

    // 3. Rotate outer radar ring and pulse halos
    if (radarMat.opacity > 0.01) {
      radarRing.rotation.z -= dt * (stateRef.failed ? 3.4 : 1.8);
      const rScale = 1 + 0.045 * Math.sin(t * 5.0);
      radarRing.scale.setScalar(rScale);
    }

    // 4. Realistic port activity blinking & halo pulsing
    let idx = 0;
    for (const [pid, sock] of Object.entries(portSockets)) {
      idx += 1;
      const ps = stateRef.portStates[pid] || {};
      if (stateRef.on && ps.linked && ps.up && ps.adminUp !== false) {
        // High-frequency network activity flicker
        const activity = Math.sin(t * (11 + idx * 2.7) + idx * 1.9);
        sock.ledMat.emissiveIntensity = stateRef.hot ? 2.4 : (activity > -0.2 ? 1.85 : 0.65);
      }
      if (sock.haloMat.opacity > 0.1) {
        const hScale = 1 + 0.18 * Math.sin(t * 6.5 + idx);
        sock.halo.scale.setScalar(hScale);
      }
      if (sock.waveMesh) {
        sock.waveMesh.scale.setScalar(1 + 0.22 * Math.sin(t * 4.2 + idx));
      }
    }

    // 5. Device-specific hardware animations (fans, RAID LEDs, AP ripples, ISP globe)
    for (const fn of animators) {
      fn(t, dt, stateRef.on);
    }
  };

  return {
    id: device.id,
    type: device.type,
    group,
    portAnchors,
    portNormals,
    portSockets,
    portLeds,
    labelAnchor: V(0, labelHeight, 0),
    setState,
    animate,
  };
}
