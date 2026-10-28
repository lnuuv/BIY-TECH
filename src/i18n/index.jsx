import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICT } from './dict.js';

const Ctx = createContext(null);
const KEY = 'u1.settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

export function I18nProvider({ children }) {
  const init = load();
  const [lang, setLang] = useState(init.lang === 'ar' ? 'ar' : 'en');
  const [theme, setTheme] = useState(init.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  useEffect(() => {
    const d = document.documentElement;
    d.lang = lang; d.dir = lang === 'ar' ? 'rtl' : 'ltr'; d.dataset.theme = theme;
    try { localStorage.setItem(KEY, JSON.stringify({ lang, theme })); } catch { /* ignore */ }
  }, [lang, theme]);
  const t = useCallback((key, vars) => {
    const e = DICT[key];
    let s = e ? e[lang === 'ar' ? 1 : 0] : key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [lang]);
  /** pick a bilingual content value: {en, ar} → string */
  const c = useCallback((o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? ''), [lang]);
  const nf = useCallback((n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n), [lang]);
  const value = useMemo(() => ({ lang, setLang, theme, setTheme, t, c, nf, dir: lang === 'ar' ? 'rtl' : 'ltr' }), [lang, theme, t, c, nf]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
