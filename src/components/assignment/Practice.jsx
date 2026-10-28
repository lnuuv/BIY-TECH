import React, { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { COMMAND_WORDS } from '../../../shared/content/assignment.js';
import { actions } from '../../store/progress.js';
import { Chip, Icon } from '../ui.jsx';
import { Notice, Src, cwLabel } from './parts.jsx';
import { activitiesOf } from './Tasks.jsx';

// deterministic shuffle so the order is stable between renders
const shuffle = (arr, seed) => { const a = arr.map((v, i) => ({ v, k: Math.sin(seed * 9301 + i * 49297) })); return a.sort((x, y) => x.k - y.k).map((x) => x.v); };
const seedOf = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100003, 7);

function Feedback({ ok, text }) {
  const { t } = useI18n();
  return (<div className={`callout ${ok ? 'ok' : 'bad'} small`} role="status"><Icon name={ok ? 'check' : 'x'} size={18} /><div><b>{ok ? t('asg.p.correct') : t('asg.p.wrong')}</b>{text && <> — <span dir="auto">{text}</span></>}</div></div>);
}

function Classify({ ex, onDone }) {
  const { t } = useI18n();
  const [i, setI] = useState(0); const [ok, setOk] = useState(0); const [picked, setPicked] = useState(null);
  const items = ex.items; const it = items[i];
  if (!it) return (<Notice tone="ok" icon="check" actions={<button className="btn sm" onClick={() => { setI(0); setOk(0); setPicked(null); }}>{t('asg.p.again')}</button>}><b>{t('asg.p.done', { ok, n: items.length })}</b></Notice>);
  const choose = (cat) => { if (picked) return; const good = cat === it.category; setPicked({ cat, good }); if (good) setOk((o) => o + 1); };
  const next = () => { const last = i + 1 === items.length; setPicked(null); setI(i + 1); if (last) onDone(ok, items.length); };
  return (
    <div className="stack">
      <p className="muted small" style={{ margin: 0 }}>{ex.prompt} ({i + 1}/{items.length})</p>
      <div className={`sort-card ${picked ? (picked.good ? 'ok' : 'bad') : ''}`} dir="auto">{it.text}</div>
      <div className="grid c2">{ex.categories.map((k) => <button key={k} className={`btn ${picked && k === it.category ? 'primary' : ''}`} disabled={!!picked} onClick={() => choose(k)} dir="auto">{k}</button>)}</div>
      {picked && (<><Feedback ok={picked.good} text={it.explanation || (picked.good ? '' : `${t('asg.p.answer')}: ${it.category}`)} /><button className="btn sm" onClick={next} style={{ justifySelf: 'start' }}>{t('asg.p.next')}</button></>)}
    </div>
  );
}

function Match({ ex, onDone }) {
  const { t } = useI18n();
  const rights = useMemo(() => shuffle(ex.pairs.map((p) => p.right), seedOf(ex.title + ex.prompt)), [ex]);
  const [sel, setSel] = useState({}); const [checked, setChecked] = useState(false);
  const okCount = ex.pairs.filter((p, i) => sel[i] === p.right).length;
  const check = () => { setChecked(true); onDone(okCount, ex.pairs.length); };
  return (
    <div className="stack">
      <p className="muted small" style={{ margin: 0 }}>{ex.prompt}</p>
      {ex.pairs.map((p, i) => {
        const good = checked && sel[i] === p.right;
        return (
          <div key={i} className={`asg-match ${checked ? (good ? 'ok' : 'bad') : ''}`}>
            <span dir="auto">{p.left}</span>
            <select className="input" value={sel[i] ?? ''} disabled={checked} aria-label={p.left} onChange={(e) => setSel({ ...sel, [i]: e.target.value })} dir="auto"><option value="">{t('asg.p.pick')}</option>{rights.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            {checked && <div className="tiny" style={{ gridColumn: '1 / -1' }}><b>{good ? t('asg.p.correct') : `${t('asg.p.answer')}: ${p.right}`}</b>{p.explanation && <> — {p.explanation}</>}</div>}
          </div>
        );
      })}
      {!checked ? <button className="btn primary sm" style={{ justifySelf: 'start' }} disabled={Object.keys(sel).length < ex.pairs.length || Object.values(sel).some((v) => !v)} onClick={check}>{t('asg.p.check')}</button>
        : <Notice tone="ok" icon="check" actions={<button className="btn sm" onClick={() => { setSel({}); setChecked(false); }}>{t('asg.p.again')}</button>}><b>{t('asg.p.done', { ok: okCount, n: ex.pairs.length })}</b></Notice>}
    </div>
  );
}

function Mcq({ ex, onDone }) {
  const { t } = useI18n();
  const [pick, setPick] = useState(null);
  const choose = (i) => { if (pick !== null) return; setPick(i); onDone(i === ex.answer ? 1 : 0, 1); };
  return (
    <div className="stack">
      {ex.prompt && <p className="muted small" style={{ margin: 0 }}>{ex.prompt}</p>}
      <p style={{ margin: 0, fontWeight: 600 }} dir="auto">{ex.question}</p>
      <div className="stack" style={{ gap: 8 }}>{ex.options.map((o, i) => <button key={i} className={`btn ${pick !== null && i === ex.answer ? 'primary' : ''}`} style={{ justifyContent: 'flex-start', height: 'auto', minHeight: 40, padding: '8px 14px', textAlign: 'start' }} disabled={pick !== null} onClick={() => choose(i)} dir="auto">{o}</button>)}</div>
      {pick !== null && <><Feedback ok={pick === ex.answer} text={ex.explanation} /><button className="btn sm" style={{ justifySelf: 'start' }} onClick={() => setPick(null)}>{t('asg.p.again')}</button></>}
    </div>
  );
}

export function Practice({ result }) {
  const { t } = useI18n();
  const list = result.guidance.global?.exercises || [];
  const [awarded] = useState(() => new Set());
  if (!list.length) return <div className="card"><p className="muted" style={{ margin: 0 }}>{t('asg.p.none')}</p></div>;
  const done = (key) => (ok, n) => { if (!awarded.has(key) && ok >= Math.ceil(n / 2)) { awarded.add(key); actions.award(15, 'mapper'); } };
  return (
    <div className="stack lg">
      <p className="tiny muted" style={{ margin: 0 }}><Src kind="ai" /> {t('asg.p.ai')}</p>
      {list.map((ex, i) => (
        <div className="card" key={i}>
          <h3 style={{ marginTop: 0 }} dir="auto">{ex.title || t('asg.p.title')}</h3>
          {ex.type === 'classify' && <Classify ex={ex} onDone={done(`${result.id}:${i}`)} />}
          {ex.type === 'match' && <Match ex={ex} onDone={done(`${result.id}:${i}`)} />}
          {ex.type === 'mcq' && <Mcq ex={ex} onDone={done(`${result.id}:${i}`)} />}
        </div>
      ))}
    </div>
  );
}

const STATIC = Object.fromEntries(COMMAND_WORDS.map((w) => [w.id, w]));
export function CommandWords({ result }) {
  const { t, lang } = useI18n();
  const st = result.structure; const acts = activitiesOf(result);
  const guides = result.guidance.global?.commandWordGuides || [];
  const have = new Set(guides.map((g) => g.word));
  const rows = [...guides, ...st.commandWords.filter((w) => !have.has(w) && STATIC[w]).map((w) => ({ word: w, definition: lang === 'ar' ? STATIC[w].defAr : STATIC[w].defEn, demonstrate: '', structure: [], example: lang === 'ar' ? STATIC[w].exAr : STATIC[w].exEn, generic: true }))];
  if (!rows.length) return <div className="card"><p className="muted" style={{ margin: 0 }}>{t('asg.cw.none')}</p></div>;
  return (
    <div className="grid c2 asg-cw">
      {rows.map((g) => {
        const lv = STATIC[g.word]?.level; const where = acts.filter((a) => a.commandWords.includes(g.word));
        return (
          <div className="card tight" key={g.word}>
            <div className="row" style={{ gap: 8 }}>{lv && <Chip tone={lv === 'D' ? 'warn' : lv === 'M' ? 'accent' : ''} className="mono">{lv}</Chip>}<b style={{ fontSize: 17 }} dir="auto">{cwLabel(g.word, lang)}</b><span className="grow" />{g.generic ? <Src kind="gen" /> : <Src kind="ai" />}</div>
            <p className="small" style={{ margin: '8px 0 4px' }} dir="auto"><b>{t('asg.cw.def')}: </b>{g.definition}</p>
            {g.demonstrate && <p className="small" style={{ margin: '0 0 4px' }} dir="auto"><b>{t('asg.cw.demo')}: </b>{g.demonstrate}</p>}
            {g.structure?.length > 0 && <p className="small" style={{ margin: '0 0 4px' }} dir="auto"><b>{t('asg.cw.struct')}: </b>{g.structure.join(' → ')}</p>}
            {g.example && <p className="small asg-example" dir="auto"><Src kind="example" /><br />“{g.example}”</p>}
            {where.length > 0 && <p className="tiny muted" style={{ margin: '6px 0 0' }}>{t('asg.cw.in')}: {where.map((a) => (/^\d+$/.test(a.id) ? t('asg.activity', { n: a.id }) : a.title)).join(' · ')}</p>}
          </div>
        );
      })}
    </div>
  );
}
