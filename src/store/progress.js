import { useSyncExternalStore } from 'react';

const KEY = 'u1.progress.v1';
const fresh = () => ({ xp: 0, lessons: {}, answers: {}, scores: {}, missions: {}, assembly: { runs: 0, best: 0, disassembled: 0 }, parts: {}, checks: {}, streak: { last: '', count: 0 }, quizRuns: 0, log: [] });
let state = (() => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return fresh(); } })();
const subs = new Set();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } };
const set = (fn) => { state = fn(structuredClone(state)); save(); subs.forEach((f) => f()); };
const today = () => new Date().toISOString().slice(0, 10);

export const useProgress = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => state, () => state);
export const getProgress = () => state;

function touchStreak(s) {
  const t = today();
  if (s.streak.last === t) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  s.streak = { last: t, count: s.streak.last === y ? s.streak.count + 1 : 1 };
}
const addXp = (s, n, why) => { if (n > 0) { s.xp += n; s.log = [{ t: Date.now(), n, why }, ...s.log].slice(0, 30); } touchStreak(s); };

export const actions = {
  award: (n, why) => set((s) => (addXp(s, n, why), s)),
  completeLesson: (id) => set((s) => { if (!s.lessons[id]) { s.lessons[id] = Date.now(); addXp(s, 40, 'lesson'); } return s; }),
  answer: (qid, ok, difficulty = 'mixed') => set((s) => {
    const prev = s.answers[qid] || {};
    const byDifficulty = { ...(prev.byDifficulty || {}) };
    if (difficulty && difficulty !== 'mixed') byDifficulty[difficulty] = !!ok;
    s.answers[qid] = {
      ok: !!ok,
      n: (prev?.n || 0) + 1,
      best: prev?.best || ok,
      byDifficulty,
    };
    if (difficulty && difficulty !== 'mixed') {
      s.answers[qid][difficulty] = !!ok;
    }
    if (ok && !prev?.best) addXp(s, 10, 'quiz'); else addXp(s, 0);
    return s;
  }),
  quizRun: () => set((s) => { s.quizRuns += 1; return s; }),
  score: (game, n) => set((s) => { const prev = s.scores[game] || 0; s.scores[game] = Math.max(prev, n); addXp(s, Math.min(60, Math.round(n / 10)), 'game'); return s; }),
  mission: (id) => set((s) => { if (!s.missions[id]) { s.missions[id] = Date.now(); addXp(s, 80, 'mission'); } return s; }),
  inspect: (model, part) => set((s) => { const k = `${model}:${part}`; if (!s.parts[k]) { s.parts[k] = 1; addXp(s, 3, 'inspect'); } return s; }),
  assemblyDone: (score) => set((s) => { s.assembly.runs += 1; s.assembly.best = Math.max(s.assembly.best, score); addXp(s, 100, 'assembly'); return s; }),
  disassembled: () => set((s) => { s.assembly.disassembled += 1; addXp(s, 40, 'disassembly'); return s; }),
  check: (key, v) => set((s) => { s.checks[key] = v; if (v) addXp(s, 5, 'checklist'); return s; }),
  reset: () => set(() => fresh()),
};

export const levelOf = (xp) => { const level = Math.floor(Math.sqrt(xp / 40)) + 1; const lo = 40 * (level - 1) ** 2, hi = 40 * level ** 2; return { level, into: xp - lo, span: hi - lo, pct: (xp - lo) / (hi - lo) }; };

export const ACHIEVEMENTS = [
  { id: 'first', icon: 'star', en: 'First steps', ar: 'الخطوات الأولى', dEn: 'Earn your first XP', dAr: 'اجمع أول نقاط XP', ok: (s) => s.xp > 0 },
  { id: 'reader', icon: 'book', en: 'Bookworm', ar: 'دودة كتب', dEn: 'Complete 5 lessons', dAr: 'أكمل 5 دروس', ok: (s) => Object.keys(s.lessons).length >= 5 },
  { id: 'explorer', icon: 'cube', en: 'Hardware explorer', ar: 'مستكشف العتاد', dEn: 'Inspect 15 parts in 3D', dAr: 'افحص 15 قطعة في 3D', ok: (s) => Object.keys(s.parts).length >= 15 },
  { id: 'builder', icon: 'chip', en: 'PC builder', ar: 'مجمّع الحواسيب', dEn: 'Finish a PC assembly', dAr: 'أنهِ تجميع حاسوب', ok: (s) => s.assembly.runs > 0 },
  { id: 'taker', icon: 'power', en: 'Careful technician', ar: 'فني حذر', dEn: 'Complete a disassembly', dAr: 'أكمل فك حاسوب', ok: (s) => s.assembly.disassembled > 0 },
  { id: 'netop', icon: 'network', en: 'Network operator', ar: 'مشغّل شبكات', dEn: 'Complete 2 lab missions', dAr: 'أكمل مهمتين في المختبر', ok: (s) => Object.keys(s.missions).length >= 2 },
  { id: 'fixer', icon: 'wrench', en: 'Troubleshooter', ar: 'مصلح الأعطال', dEn: 'Fix the Leshev network', dAr: 'أصلح شبكة Leshev', ok: (s) => !!s.missions.m5 },
  { id: 'scholar', icon: 'trophy', en: 'Quiz scholar', ar: 'متفوق الاختبارات', dEn: 'Answer 25 questions correctly', dAr: 'أجب عن 25 سؤالاً بشكل صحيح', ok: (s) => Object.values(s.answers).filter((a) => a.best).length >= 25 },
  { id: 'gamer', icon: 'gamepad', en: 'Game on', ar: 'لاعب محترف', dEn: 'Score in all three games', dAr: 'سجّل نقاطاً في الألعاب الثلاث', ok: (s) => ['pairs', 'sprint', 'sort'].every((g) => s.scores[g] > 0) },
  { id: 'streak', icon: 'bolt', en: '3-day streak', ar: 'سلسلة 3 أيام', dEn: 'Study 3 days in a row', dAr: 'ادرس 3 أيام متتالية', ok: (s) => s.streak.count >= 3 },
];
