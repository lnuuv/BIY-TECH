// Realistic procedural Web Audio API sound effects engine for the 3D Story Game.
// Safe in headless/Node test environments and respects browser autoplay policies + user mute/volume controls.

const MUTE_KEY = 'u1.story.muted';
const VOL_KEY = 'u1.story.volume';

let ctx = null;
let masterGain = null;
let noiseBuffer = null;

let muted = (() => {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();

let volume = (() => {
  try {
    const v = typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem(VOL_KEY)) : NaN;
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.75;
  } catch { return 0.75; }
})();

function ensureCtx() {
  if (muted || typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(ctx.destination);
      noiseBuffer = null;
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getNoiseBuffer(ac) {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  const len = ac.sampleRate * 1.0;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.950 * b2 + white * 0.048;
    data[i] = (white * 0.35 + b0 + b1 + b2) * 0.5;
  }
  noiseBuffer = buf;
  return buf;
}

export function isSfxMuted() {
  return muted;
}

export function setSfxMuted(nextMuted) {
  muted = !!nextMuted;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(muted ? 0 : volume, ctx.currentTime);
  }
  return muted;
}

export function getSfxVolume() {
  return volume;
}

export function setSfxVolume(nextVol) {
  volume = Math.max(0, Math.min(1, Number(nextVol) || 0));
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(VOL_KEY, String(volume)); } catch { /* ignore */ }
  if (masterGain && ctx && !muted) {
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  }
  return volume;
}

/** Realistic footstep impact (varies by left/right foot and floor surface: 'tile' | 'wood' | 'stone') */
export function playFootstep(surface = 'tile', stepIndex = 0) {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const isRight = stepIndex % 2 === 1;
  const jitter = 0.95 + Math.random() * 0.1;

  // 1. Low-end heel thump
  const osc = ac.createOscillator();
  const thumpGain = ac.createGain();
  const baseFreq = surface === 'wood' ? 95 : surface === 'stone' ? 110 : 125;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq * (isRight ? 1.04 : 0.97) * jitter, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.075);
  thumpGain.gain.setValueAtTime(0.18, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(thumpGain);
  thumpGain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.085);

  // 2. High-mid sole/tile click
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(
    (surface === 'tile' ? 1850 : surface === 'wood' ? 1100 : 1450) * (isRight ? 1.06 : 0.95) * jitter,
    now
  );
  filter.Q.value = surface === 'tile' ? 3.2 : 2.1;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.001, now);
  clickGain.gain.linearRampToValueAtTime(surface === 'tile' ? 0.16 : 0.12, now + 0.008);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  src.connect(filter);
  filter.connect(clickGain);
  clickGain.connect(masterGain);
  src.start(now, Math.random() * 0.5, 0.075);
}

/** Realistic clothing rustle & stance shift when crouching or standing up */
export function playCrouch(crouching = true) {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(crouching ? 950 : 620, now);
  filter.frequency.exponentialRampToValueAtTime(crouching ? 520 : 1050, now + 0.16);
  filter.Q.value = 1.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.14, now + 0.035);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(now, Math.random() * 0.4, 0.18);
}

/** Realistic shoe push-off + air/cloth whoosh when jumping */
export function playJump() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  playFootstep('tile', 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, now + 0.01);
  osc.frequency.exponentialRampToValueAtTime(290, now + 0.13);
  g.gain.setValueAtTime(0.08, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now + 0.01);
  osc.stop(now + 0.15);
}

/** Realistic double-impact heel-toe thud when landing from a jump */
export function playLand(surface = 'tile') {
  const ac = ensureCtx();
  if (!ac) return;
  playFootstep(surface, 0);
  setTimeout(() => playFootstep(surface, 1), 42);
}

/** Door latch & swing sound */
export function playDoor(open = true) {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  // Latch click
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(open ? 520 : 180, now);
  osc.frequency.exponentialRampToValueAtTime(open ? 240 : 65, now + 0.09);
  g.gain.setValueAtTime(0.18, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.11);
}

/** Desk / furniture placement thump */
export function playPlaceFurniture() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(115 + Math.random() * 25, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** Crisp mechanical snap when installing a PC part or rack unit */
export function playPartSnap() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(780, now);
  osc.frequency.exponentialRampToValueAtTime(1450, now + 0.045);
  g.gain.setValueAtTime(0.16, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.065);
}

/** RJ45 network cable latch click */
export function playCableClick() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1900, now);
  osc.frequency.exponentialRampToValueAtTime(920, now + 0.03);
  g.gain.setValueAtTime(0.09, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.04);
}

/** Motherboard POST beep (ok = single short 1kHz beep; fail = two low error beeps) */
export function playPostBeep(ok = true) {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  if (ok) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, now);
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  } else {
    [0, 0.2].forEach((offset) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now + offset);
      g.gain.setValueAtTime(0.1, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  }
}

/** Laser printer feed & print mechanical whir */
export function playPrinter() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  [0, 0.28, 0.56].forEach((t, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190 + i * 35, now + t);
    osc.frequency.linearRampToValueAtTime(240 + i * 35, now + t + 0.22);
    g.gain.setValueAtTime(0.05, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.24);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now + t);
    osc.stop(now + t + 0.25);
  });
}

/** Official approval stamp thud */
export function playStamp() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
  g.gain.setValueAtTime(0.24, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.14);
}

/** Office phone dial/ring tone */
export function playPhoneCallSfx() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  [0, 0.12, 0.24].forEach((t, idx) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 + idx * 110, now + t);
    g.gain.setValueAtTime(0.08, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.09);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now + t);
    osc.stop(now + t + 0.1);
  });
}

/** Subtle UI / dialogue interaction chime */
export function playUiClick(tone = 'click') {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  if (tone === 'ok') {
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.07);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  } else {
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.03);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export function disposeSfx() {
  if (ctx && ctx.state !== 'closed') {
    ctx.close().catch(() => {});
  }
  ctx = null;
  masterGain = null;
  noiseBuffer = null;
}
