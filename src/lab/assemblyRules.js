// Generic dependency rules for any assembly sequence (tower PC builder, Tiny PC in the story, rack units…).
// A step is { id, requires: [ids], title: {en, ar}, why?: {en, ar} }.
const O = (en, ar) => ({ en, ar });

export function makeRules(steps) {
  const STEP = Object.fromEntries(steps.map((s) => [s.id, s]));
  const names = (ids, lang) => ids.map((i) => STEP[i].title[lang]).join(lang === 'ar' ? '، ' : ', ');
  function canInstall(id, installed) {
    const s = STEP[id];
    if (!s) return { ok: false, reason: O('Unknown part.', 'قطعة غير معروفة.') };
    if (installed.has(id)) return { ok: false, reason: O('Already installed. Use "Remove" if you want to take it out.', 'مركّب بالفعل. استخدم "فك" إن أردت إزالته.') };
    const missing = s.requires.filter((r) => !installed.has(r));
    if (missing.length) return { ok: false, missing, reason: O(`Not yet — first: ${names(missing, 'en')}. ${s.why?.en || ''}`.trim(), `ليس بعد — أولاً: ${names(missing, 'ar')}. ${s.why?.ar || ''}`.trim()) };
    return { ok: true };
  }
  function canRemove(id, installed) {
    if (!installed.has(id)) return { ok: false, reason: O('This part is not installed.', 'هذه القطعة غير مركّبة.') };
    const blockers = steps.filter((s) => installed.has(s.id) && s.requires.includes(id)).map((s) => s.id);
    if (blockers.length) return { ok: false, blockers, reason: O(`Remove first: ${names(blockers, 'en')}.`, `فك أولاً: ${names(blockers, 'ar')}.`) };
    return { ok: true };
  }
  /** steps whose prerequisites are met and that are not yet installed */
  const available = (installed) => steps.filter((s) => !installed.has(s.id) && s.requires.every((r) => installed.has(r))).map((s) => s.id);
  return { STEP, canInstall, canRemove, available };
}
