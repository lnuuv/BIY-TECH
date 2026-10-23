import { isSfxMuted, getSfxVolume } from './sfx.js';

const VOICE_MAP = {
  request: { n1: 1, n2a: 2, n2a_x: 3, n2b: 4, n2b_x: 5, n2c: 6, n2c_x: 7, n3: 8, n3_x: 9, n4: 10 },
  assign:  { m1: 11, m1_x: 12, m1_y: 13, m2: 14, m2_x: 15, m3: 16, m4: 'alaa/7' },
  finale:  { e1: 'alaa/8', e2: 17, e3: 'yasser/12', e3_x: 'yasser/13', e4: 18, e5: 'yasser/14', e6: 19 },
};

const CHOICE_MAP = {
  request: {
    n1:  ['yasser/1', 'yasser/2', 'yasser/3'],
    n2a: ['yasser/4', 'yasser/5'],
    n2b: ['yasser/6', 'yasser/7'],
    n2c: ['yasser/8', 'yasser/9'],
    n3:  ['yasser/10', 'yasser/11'],
  },
  assign: { m1: ['alaa/1', 'alaa/2', 'alaa/3'], m2: ['alaa/4', 'alaa/5'], m3: ['alaa/6'] },
  finale: { e3: ['alaa/9', 'alaa/10'], e4: ['alaa/11', 'alaa/12'] },
};

let current = null;

function playFile(num, lang) {
  stopVoice();
  if (!num || isSfxMuted()) return;
  const folder = lang === 'en' ? 'en' : 'ar';
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const src = `${base}voices/voices/${folder}/${num}.mp3`;
  if (typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(src);
    audio.volume = getSfxVolume();
    current = audio;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    // Ignore audio errors in headless environments
  }
}

export function syncVoiceMute() {
  if (!current) return;
  if (isSfxMuted()) {
    try { current.pause(); } catch { /* ignore */ }
  } else {
    current.volume = getSfxVolume();
  }
}

export function playVoice(scene, nodeId, lang = 'ar') {
  playFile(VOICE_MAP[scene]?.[nodeId], lang);
}

export function playChoiceVoice(scene, nodeId, choice, lang = 'ar') {
  playFile(CHOICE_MAP[scene]?.[nodeId]?.[choice], lang);
}

export function stopVoice() {
  if (current) {
    try {
      current.pause();
      current.currentTime = 0;
    } catch { /* ignore */ }
    current = null;
  }
}