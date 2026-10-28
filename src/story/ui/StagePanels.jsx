import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { Icon } from '../../components/ui.jsx';
import { S } from './strings.js';
import { ASSETS, SCHOOL } from '../config/assets.js';
import { DESK_RUNS, STUDENT_COUNT } from '../config/labLayout.js';
import { SOFTWARE_STEPS, SOFTWARE_CHECKS } from '../config/software.js';
import { RACK_UNITS, RACK_PARTS, checkLink, linkKind, label, UPLINK_PORT } from '../config/network.js';
import { DEVICES, PLAN, rackFits, rackComplete, networkReport, finalChecklist, STAGES } from '../storyState.js';
import { makeRules } from '../../lab/assemblyRules.js';
import { playStamp, playUiClick, playPostBeep } from '../sfx.js';

const fmt = (o, vars) => { let s = o; for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v); return s; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function TitleScreen({ hasSave, onStart, onContinue }) {
  const { c } = useI18n();
  return (
    <div className="st-screen">
      <div className="st-titlecard">
        <div className="st-school">{c(SCHOOL)}</div>
        <h1>{c(S.title)}</h1>
        <p>{c(S.subtitle)}</p>
        <div className="st-cast">
          {['abuAnis', 'yasser', 'alaa'].map((k) => (<figure key={k}><img src={ASSETS[k].file} alt="" /><figcaption>{c(ASSETS[k].name)}</figcaption></figure>))}
        </div>
        <div className="st-row" style={{ justifyContent: 'center' }}>
          {hasSave && <button className="st-btn primary" onClick={onContinue}><Icon name="play" size={16} />{c(S.cont)}</button>}
          <button className={`st-btn ${hasSave ? '' : 'primary'}`} onClick={onStart}><Icon name={hasSave ? 'reset' : 'play'} size={16} />{c(hasSave ? S.newGame : S.start)}</button>
        </div>
      </div>
    </div>
  );
}

export function ApprovalPanel({ onCall, onDone }) {
  const { c } = useI18n();
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const [called, setCalled] = useState(false);
  const doStep = async () => {
    const n = step + 1;
    setStep(n);
    playStamp();
    if (n === 3) { await sleep(1400); playStamp(); setApproved(true); }
  };
  return (
    <div className="st-panel">
      <h2>{c(S.apTitle)}</h2>
      <div className="st-doc">
        <div style={{ textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #d1d5db', paddingBottom: 6, marginBottom: 8 }}>{c(SCHOOL)}</div>
        <h4>{c(S.apDoc)}</h4>
        <div>25 × {c({ en: 'student workstations', ar: 'محطة طالب' })} · 1 × {c({ en: 'teacher workstation', ar: 'محطة معلم' })}</div>
        <div>{c({ en: 'Network cabinet, structured cabling, printer, UPS, interactive display', ar: 'كبينة شبكة، تمديدات منظمة، طابعة، UPS، شاشة تفاعلية' })}</div>
        <div style={{ marginTop: 6, color: '#6b7280' }}>{c({ en: 'Requested by: Teacher Yasser · Signed: Principal Abu Anis', ar: 'مقدم الطلب: الأستاذ ياسر · التوقيع: المدير أبو أنيس' })}</div>
        {step >= 2 && <span className={`st-stamp ${approved ? '' : 'pending'}`}>{c(approved ? S.apApproved : S.apPending)}</span>}
        <div style={{ height: 26 }} />
      </div>
      <ul className="st-list">
        {S.apSteps.map((t, i) => (<li key={i} className={i < step ? 'ok' : i === step ? 'cur' : ''}><span className={`st-dot ${i < step ? 'ok' : ''}`}>{i < step ? '✓' : i + 1}</span><span style={{ flex: 1 }}>{c(t)}</span></li>))}
      </ul>
      <div className="st-row" style={{ marginTop: 12 }}>
        {step < 3 && <button className="st-btn primary" onClick={doStep}>{c(S.apDo)}</button>}
        {approved && !called && <button className="st-btn primary" onClick={() => { setCalled(true); onCall(); }}><Icon name="phone" size={16} />{c(S.apCall)}</button>}
        {called && <button className="st-btn primary" onClick={onDone}>{c(S.next)} ›</button>}
      </div>
      {called && <div className="st-msg info">{c(S.phone)}</div>}
    </div>
  );
}

export function EnterPanel({ onGo }) {
  const { c } = useI18n();
  return (
    <div className="st-dialogue"><div className="st-dbox"><img className="st-portrait" src={ASSETS.alaa.file} alt="" /><div>
      <div className="st-speaker">{c(ASSETS.alaa.name)}</div><div className="st-line">{c(S.enterLine)}</div>
      <div className="st-dfoot"><button className="st-btn primary" onClick={onGo}>{c(S.startFurniture)} ›</button></div>
    </div></div></div>
  );
}

export function FurniturePanel({ state, onPreview, onConfirm, onStepAlaa, onManualStep, onNext, progress, manualCount = 0 }) {
  const { c, nf } = useI18n();
  const [prev, setPrev] = useState(false);
  const stepFn = onStepAlaa || onManualStep;
  const total = DESK_RUNS.reduce((a, r) => a + r.count, 0);
  const autoPlacing = progress != null && !state.furniture.placed;
  const shownCount = autoPlacing
    ? progress
    : state.furniture.placed
    ? STUDENT_COUNT
    : (state.furniture.placedCount ?? manualCount ?? 0);
  return (
    <div className="st-panel">
      <h2>{c(S.fuTitle)}</h2>
      <p>{c(S.fuLead)}</p>
      <ul className="st-list">
        {DESK_RUNS.map((r) => (<li key={r.id}><span className="st-dot">{nf(r.count)}</span><span>{c(S.walls[r.wall])}</span></li>))}
        <li><span className="st-dot">1</span><span>{c(S.teacherDesk)}</span></li>
        <li className={shownCount === STUDENT_COUNT ? 'ok' : ''}><span className={`st-dot ${shownCount === STUDENT_COUNT ? 'ok' : ''}`}>{shownCount === STUDENT_COUNT ? '✓' : nf(shownCount)}</span><span>{c(S.total)}: <b>{nf(shownCount)}</b> / {nf(STUDENT_COUNT)}</span></li>
      </ul>
      <div className="st-bar" style={{ marginTop: 10 }}><i style={{ width: `${(shownCount / STUDENT_COUNT) * 100}%` }} /></div>
      {!state.furniture.placed && !autoPlacing && (
        <>
          <div className="st-msg info" style={{ marginTop: 10 }}>
            {fmt(c(S.fuManualHint), { n: nf(shownCount), t: nf(STUDENT_COUNT) })}
            <div className="st-row" style={{ marginTop: 8, justifyContent: 'center', gap: 6 }}>
              <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(0, -1.1); }}>↑ W</button>
              <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(-1.1, 0); }}>← A</button>
              <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(0, 1.1); }}>↓ S</button>
              <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(1.1, 0); }}>→ D</button>
            </div>
          </div>
          <div className="st-row" style={{ marginTop: 10 }}>
            <button className="st-btn" onClick={(e) => { e.currentTarget.blur(); playUiClick('click'); setPrev(!prev); onPreview(!prev); }}><Icon name="eye" size={16} />{c(prev ? S.hidePreview : S.preview)}</button>
            <button className="st-btn primary" onClick={(e) => { e.currentTarget.blur(); onConfirm(); }} disabled={total !== STUDENT_COUNT}><Icon name="check" size={16} />{c(S.confirm)}</button>
          </div>
        </>
      )}
      {autoPlacing && (<p className="st-small" style={{ marginTop: 6 }}>{fmt(c(S.placing), { n: nf(shownCount), t: nf(STUDENT_COUNT) })}</p>)}
      {state.furniture.placed && (<><div className="st-msg ok" style={{ marginTop: 10 }}>{c(S.placed)}</div><button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toTeacher)} ›</button></>)}
    </div>
  );
}

const SW = makeRules(SOFTWARE_STEPS);
export function SoftwarePanel({ state, onUpdate, onScreen, onNext }) {
  const { c } = useI18n();
  const done = new Set(state.sw.done);
  const [busy, setBusy] = useState(null);
  const [fb, setFb] = useState(null);
  const [checks, setChecks] = useState(state.sw.verified ? SOFTWARE_CHECKS.map((x) => x.id) : []);
  const alive = useRef(true); useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const install = async (st) => {
    const r = SW.canInstall(st.id, done);
    if (!r.ok) { playPostBeep(false); setFb({ ok: false, msg: r.reason }); return; }
    playUiClick('click');
    setFb(null);
    const dur = 1200 + st.mins * 75; const t0 = performance.now();
    while (alive.current) {
      const k = Math.min(1, (performance.now() - t0) / dur);
      setBusy({ id: st.id, pct: k, phase: 'install' }); onScreen({ mode: 'install', title: c(st.title), sub: c(st.detail).slice(0, 80), pct: k });
      if (k >= 1) break; await sleep(60);
    }
    if (st.restart && alive.current) { setBusy({ id: st.id, pct: 1, phase: 'restart' }); onScreen({ mode: 'off' }); await sleep(750); }
    if (!alive.current) return;
    setBusy(null); onScreen({ mode: 'desktop' });
    playUiClick('ok');
    onUpdate({ ...state.sw, done: [...done, st.id] });
    setFb({ ok: true, msg: st.why });
  };
  const verify = async () => {
    setChecks([]);
    for (const ch of SOFTWARE_CHECKS) { await sleep(320); if (!alive.current) return; playUiClick('click'); setChecks((x) => [...x, ch.id]); }
    const ok = SOFTWARE_CHECKS.every((ch) => ch.needs.every((n) => done.has(n)));
    playUiClick(ok ? 'ok' : 'click');
    onUpdate({ ...state.sw, verified: ok });
  };
  const allDone = SOFTWARE_STEPS.every((s) => done.has(s.id));
  const cur = busy && SOFTWARE_STEPS.find((s) => s.id === busy.id);
  return (
    <div className="st-panel">
      <h2>{c(S.swTitle)}</h2>
      <div className="st-screenmock">
        {cur ? (<div className="win"><b>{c(busy.phase === 'restart' ? S.restarting : S.installing)}</b><small>{c(cur.title)}{cur.product ? ` — ${c(cur.product)}` : ''}</small><div className="st-bar"><i style={{ width: `${busy.pct * 100}%` }} /></div></div>)
          : (<div className="win"><b>{allDone ? c({ en: 'Ready', ar: 'جاهز' }) : c(S.swLead)}</b><small>{done.size}/{SOFTWARE_STEPS.length}</small><div className="st-bar"><i style={{ width: `${(done.size / SOFTWARE_STEPS.length) * 100}%` }} /></div></div>)}
      </div>
      <ul className="st-list">
        {SOFTWARE_STEPS.map((s) => { const on = done.has(s.id); return (
          <li key={s.id} className={on ? 'ok' : ''}>
            <span className={`st-dot ${on ? 'ok' : ''}`}>{on ? '✓' : ''}</span>
            <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{c(s.title)}</b><br /><span className="st-small">{c(s.detail)}</span></span>
            {!on && <button className="st-btn sm" disabled={!!busy} onClick={() => install(s)}>{c(S.install)}</button>}
          </li>); })}
      </ul>
      {fb && <div className={`st-msg ${fb.ok ? 'ok' : 'bad'}`}>{c(fb.msg)}</div>}
      {allDone && (<>
        <h3>{c(S.verify)}</h3>
        <button className="st-btn" onClick={verify} disabled={!!busy}><Icon name="search" size={16} />{c(S.verify)}</button>
        <ul className="st-list" style={{ marginTop: 8 }}>{SOFTWARE_CHECKS.filter((ch) => checks.includes(ch.id)).map((ch) => { const ok = ch.needs.every((n) => done.has(n)); return (<li key={ch.id} className={ok ? 'ok' : 'bad'}><span className={`st-dot ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : '!'}</span>{c(ch.text)}</li>); })}</ul>
      </>)}
      {state.sw.verified && !state.sw.imaged && (<><div className="st-msg info">{c(S.imageWhy)}</div><button className="st-btn primary" style={{ marginTop: 10 }} onClick={() => { playUiClick('ok'); onUpdate({ ...state.sw, imaged: true }); }}><Icon name="download" size={16} />{c(S.image)}</button></>)}
      {state.sw.imaged && <button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toDeploy)} ›</button>}
    </div>
  );
}

export function DeployPanel({ state, onDeploy, onStepAlaa, onManualStep, onNext, count }) {
  const { c, nf } = useI18n();
  const stepFn = onStepAlaa || onManualStep;
  const n = new Set(state.deploy.deployed).size;
  const running = count != null && n < STUDENT_COUNT;
  return (
    <div className="st-panel">
      <h2>{c(S.dpTitle)}</h2>
      <p>{c(S.dpLead)}</p>
      <div className="st-msg info">
        {c(S.dpDiff)}
        {n < STUDENT_COUNT && !running && (
          <div className="st-row" style={{ marginTop: 8, justifyContent: 'center', gap: 6 }}>
            <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(0, -1.1); }}>↑ W</button>
            <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(-1.1, 0); }}>← A</button>
            <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(0, 1.1); }}>↓ S</button>
            <button type="button" className="st-btn sm" onClick={(e) => { e.currentTarget.blur(); stepFn?.(1.1, 0); }}>→ D</button>
          </div>
        )}
      </div>
      <div className="st-bar" style={{ marginTop: 12 }}><i style={{ width: `${(n / STUDENT_COUNT) * 100}%` }} /></div>
      <p className="st-small" style={{ marginTop: 6 }}>{fmt(c(S.dpProg), { n: nf(n), t: nf(STUDENT_COUNT) })}</p>
      {n < STUDENT_COUNT && <button className="st-btn primary" disabled={running} onClick={(e) => { e.currentTarget.blur(); onDeploy(); }} style={{ width: '100%' }}><Icon name="pc" size={16} />{c(S.dpGo)}</button>}
      {n === STUDENT_COUNT && (<><div className="st-msg ok">{c(S.dpDone)}</div><button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toRack)} ›</button></>)}
    </div>
  );
}

export function RackPanel({ state, onPlace, onRemove, onNext }) {
  const { c } = useI18n();
  const [sel, setSel] = useState(null);
  const [fb, setFb] = useState(null);
  const placed = state.rack.placed;
  const used = new Set(Object.values(placed));
  const tray = Object.keys(RACK_PARTS).filter((k) => !used.has(k));
  const pickUnit = (u) => {
    if (placed[u]) { playUiClick('click'); setFb({ ok: null, msg: RACK_PARTS[placed[u]].purpose, title: RACK_PARTS[placed[u]].name }); return; }
    if (!sel) { playUiClick('click'); setFb({ ok: null, msg: { en: `U${u} is empty.`, ar: `الوحدة U${u} فارغة.` } }); return; }
    if (rackFits(u, sel)) { onPlace(u, sel); setFb({ ok: true, msg: RACK_PARTS[sel].purpose, title: RACK_PARTS[sel].name }); setSel(null); }
    else {
      playPostBeep(false);
      const want = RACK_PARTS[RACK_UNITS.find((r) => r.u === u).accepts];
      setFb({ ok: false, msg: { en: `U${u} is planned for the ${want.name.en}. ${RACK_PARTS[sel].name.en} belongs elsewhere: ${RACK_PARTS[sel].purpose.en}`, ar: `الوحدة U${u} مخصصة لـ ${want.name.ar}. أما ${RACK_PARTS[sel].name.ar} فمكانها مختلف: ${RACK_PARTS[sel].purpose.ar}` } });
    }
  };
  const complete = rackComplete(placed);
  return (
    <div className="st-panel">
      <h2>{c(S.rkTitle)}</h2>
      <p>{c(S.rkLead)}</p>
      <div className="st-row" style={{ marginBottom: 10 }}>
        {tray.map((k) => (<button key={k} className={`st-btn sm ${sel === k ? 'primary' : ''}`} onClick={() => { playUiClick('click'); setSel(sel === k ? null : k); }}>{c(RACK_PARTS[k].name)}</button>))}
      </div>
      <div className="st-rack">
        {RACK_UNITS.map((r) => { const p = placed[r.u]; return (
          <div key={r.u} className={`st-unit ${p ? 'filled' : ''} ${sel && !p ? 'target' : ''}`} role="button" tabIndex={0} onClick={() => pickUnit(r.u)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pickUnit(r.u)}>
            <b>U{r.u}</b><span>{p ? c(RACK_PARTS[p].name) : <span className="st-small">{c(S.rkEmpty)}</span>}</span>
            {p && !complete && <button className="st-btn sm ghost" onClick={(e) => { e.stopPropagation(); onRemove(r.u); }}>{c(S.rkRemove)}</button>}
          </div>); })}
      </div>
      {fb && <div className={`st-msg ${fb.ok === true ? 'ok' : fb.ok === false ? 'bad' : 'info'}`}>{fb.title && <b>{c(fb.title)}: </b>}{c(fb.msg)}</div>}
      {complete && (<><div className="st-msg ok">{c(S.rkDone)}</div><button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toCabling)} ›</button></>)}
    </div>
  );
}

const nodeName = (n) => {
  const [t, v] = n.split(':');
  if (t === 'dev') return v === 'T' ? 'PC-T' : v === 'PRN' ? 'PRN' : v === 'DSP' ? 'DSP' : `PC-${v}`;
  if (t === 'out') return `${v} · ${label(PLAN[v])}`;
  if (t === 'pp') return label(+v);
  if (t === 'sw') return `SW ${v}`;
  return 'SCHOOL';
};
const MANUAL_N = 3;
const OC = (en, ar) => ({ en, ar });
const CB_STATE = {
  none: { label: OC('Not connected', 'غير موصول'), color: 'rgba(255,255,255,.18)' },
  pending: { label: OC('Connected – not checked yet', 'موصول – لسّا ما انفحص'), color: '#38bdf8' },
  ok: { label: OC('Checked – correct', 'انفحص – صحيح'), color: '#22c55e' },
  bad: { label: OC('Checked – wrong', 'انفحص – غلط'), color: '#ef4444' },
};
const devOfPort = (port) => DEVICES.find((d) => PLAN[d.id] === port)?.id;
function expectedPartners(n) {
  const [t, v] = n.split(':');
  if (t === 'dev') return [`out:${v}`];
  if (t === 'out') return [`dev:${v}`, `pp:${PLAN[v]}`];
  if (t === 'pp') { const d = devOfPort(+v); return [...(d ? [`out:${d}`] : []), `sw:${v}`]; }
  if (t === 'sw') return +v === UPLINK_PORT ? ['up'] : [`pp:${v}`];
  return [`sw:${UPLINK_PORT}`];
}
const partnersNow = (n, links) => links.filter((l) => l.a === n || l.b === n).map((l) => (l.a === n ? l.b : l.a));
function nextManualStep(devs, links) {
  const has = (a, b) => links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  for (const d of devs) {
    const port = PLAN[d.id];
    if (!has(`dev:${d.id}`, `out:${d.id}`)) return { a: `dev:${d.id}`, b: `out:${d.id}`, why: OC('Desk patch cord: the computer plugs into the wall outlet at its own desk.', 'كابل الطاولة: الجهاز بيتوصل بمخرج الجدار اللي على طاولته.') };
    if (!has(`out:${d.id}`, `pp:${port}`)) return { a: `out:${d.id}`, b: `pp:${port}`, why: OC(`Permanent cable inside the wall: outlet ${label(port)} ends on patch-panel port ${label(port)} (same label).`, `الكابل الثابت داخل الجدار: المخرج ${label(port)} بينتهي على منفذ لوحة التوصيل ${label(port)} (نفس الرقم).`) };
    if (!has(`pp:${port}`, `sw:${port}`)) return { a: `pp:${port}`, b: `sw:${port}`, why: OC(`Patch cord in the cabinet: panel port ${label(port)} goes to switch port ${port}.`, `كابل التوصيل بالكبينة: منفذ اللوحة ${label(port)} بيروح على منفذ السويتش ${port}.`) };
  }
  return null;
}
const segmentsWired = (id, links) => { const r = networkReport(links).per.find((p) => p.id === id); return r.steps.every((x) => x.to); };
export function CablingPanel({ state, onLinks, onVerified, onInspect, onNext }) {
  const { c, nf } = useI18n();
  const [selA, setSelA] = useState(null);
  const [fb, setFb] = useState(null);
  const [report, setReport] = useState(null);
  const [inspect, setInspect] = useState(null);
  const [auto, setAuto] = useState(null);
  const links = state.links;
  const linksRef = useRef(links); linksRef.current = links;
  const alive = useRef(true); useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const manualDevs = DEVICES.slice(0, MANUAL_N);
  const autoDevs = DEVICES.slice(MANUAL_N);
  const manualWired = manualDevs.filter((d) => segmentsWired(d.id, links)).length;
  const allWired = DEVICES.every((d) => segmentsWired(d.id, links)) && links.some((l) => [l.a, l.b].includes('up'));
  const pastManual = autoDevs.some((d) => links.some((l) => l.a === `dev:${d.id}` || l.b === `dev:${d.id}`));
  const manualPhase = manualWired < MANUAL_N && !pastManual && !allWired;
  const stateOf = (n) => { const ls = links.filter((l) => l.a === n || l.b === n); if (!ls.length) return 'none'; if (ls.some((l) => l.state === 'bad')) return 'bad'; if (ls.some((l) => l.state === 'pending')) return 'pending'; return 'ok'; };
  const withLinks = (base, newOnes) => {
    let next = [...base];
    for (const l of newOnes) {
      const kind = linkKind(l.a, l.b);
      next = next.filter((x) => !(linkKind(x.a, x.b) === kind && [x.a, x.b].some((e) => e === l.a || e === l.b)));
      next.push({ a: l.a, b: l.b, state: 'pending' });
    }
    return next;
  };
  const addLinks = (newOnes) => { onLinks(withLinks(links, newOnes)); onVerified(false); setReport(null); };
  const autoRun = useRef(0);
  useEffect(() => {
    if (manualPhase || allWired) return undefined;
    const id = ++autoRun.current; const live = () => alive.current && autoRun.current === id;
    const todo = autoDevs.filter((d) => !segmentsWired(d.id, linksRef.current));
    setAuto({ done: 0, total: todo.length });
    (async () => {
      for (let i = 0; i < todo.length; i++) {
        await sleep(160); if (!live()) return;
        const d = todo[i]; const port = PLAN[d.id];
        onLinks(withLinks(linksRef.current, [{ a: `dev:${d.id}`, b: `out:${d.id}` }, { a: `out:${d.id}`, b: `pp:${port}` }, { a: `pp:${port}`, b: `sw:${port}` }]));
        setAuto({ done: i + 1, total: todo.length });
      }
      await sleep(160); if (!live()) return;
      onLinks(withLinks(linksRef.current, [{ a: `sw:${UPLINK_PORT}`, b: 'up' }]));
      onVerified(false); setReport(null); setAuto((x) => ({ ...x, finished: true }));
    })();
    return () => { autoRun.current += 1; };
  }, [manualPhase]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (n) => {
    if (!selA) { playUiClick('click'); setSelA(n); setFb(null); return; }
    if (selA === n) { playUiClick('click'); setSelA(null); return; }
    const kind = linkKind(selA, n);
    if (!kind) { playPostBeep(false); setFb({ ok: false, msg: checkLink(selA, n, PLAN).reason }); setSelA(null); return; }
    addLinks([{ a: selA, b: n }]); setSelA(null);
    const r = checkLink(selA, n, PLAN);
    if (r.ok) setFb({ ok: null, msg: { en: `✓ ${nodeName(selA)} ↔ ${nodeName(n)} matches the plan.`, ar: `✓ ${nodeName(selA)} ↔ ${nodeName(n)} مطابق للخطة.` } });
    else setFb({ ok: false, msg: { en: `This link does not match the plan: ${r.reason.en}`, ar: `هذا الربط مش مطابق للخطة: ${r.reason.ar}` } });
  };
  const verify = () => {
    const nextLinks = links.map((l) => { const r = checkLink(l.a, l.b, PLAN); return { ...l, state: r.ok ? 'ok' : 'bad', reason: r.reason }; });
    onLinks(nextLinks);
    const rep = networkReport(nextLinks);
    playUiClick(rep.ok ? 'ok' : 'click');
    setReport(rep); onVerified(rep.ok, rep.per.filter((p) => !p.ok).length + (rep.uplink ? 0 : 1));
  };
  const removeLink = (n) => { playUiClick('click'); onLinks(links.filter((l) => l.a !== n && l.b !== n)); setSelA(null); onVerified(false); };
  const doInspect = (id) => { playUiClick('click'); setInspect(id); onInspect(id); };
  const guide = manualPhase ? nextManualStep(manualDevs, links) : null;
  const expected = selA ? expectedPartners(selA) : [];
  const nowWith = selA ? partnersNow(selA, links) : [];
  const col = (title, nodes) => (
    <div className="col"><h4 style={{ zIndex: 2, paddingBottom: 4, background: '#0d131f' }}>{title}</h4>{nodes.map((n) => {
      const st = stateOf(n);
      const isTarget = selA ? expected.includes(n) && !nowWith.includes(n) : guide && (n === guide.a || n === guide.b);
      return (
        <button key={n} className={`st-node ${selA === n ? 'sel' : ''}`} onClick={() => pick(n)} title={c(CB_STATE[st].label)}
          style={isTarget ? { borderColor: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,.35)', background: 'rgba(34,197,94,.12)' } : undefined}>
          <span className="st-dot" style={{ background: CB_STATE[st].color }} />{nodeName(n)}{isTarget && <span style={{ marginInlineStart: 'auto', color: '#86efac' }}>●</span>}
        </button>);
    })}</div>
  );
  const shownDevs = manualPhase ? manualDevs : DEVICES;
  const ports = manualPhase ? manualDevs.map((d) => PLAN[d.id]) : DEVICES.map((d) => PLAN[d.id]);
  const failing = report ? report.per.filter((p) => !p.ok) : [];
  const insp = inspect && networkReport(links).per.find((p) => p.id === inspect);
  const running = auto && !auto.finished && !allWired;
  return (
    <div className="st-panel wide">
      <h2>{c(S.cbTitle)}</h2>
      <p>{c(OC(`Path: device → wall outlet → patch panel → switch. Select two points to link them. Wire the first ${MANUAL_N} devices yourself; the rest of the lab is then connected automatically.`, `المسار: الجهاز ← مخرج الجدار ← لوحة التوصيل ← السويتش. اختر نقطتين لربطهما. وصّل أول ${MANUAL_N} أجهزة بنفسك، وبعدها بيكمل توصيل باقي المختبر تلقائياً.`))}</p>
      <div className="st-row st-small" style={{ marginBottom: 8, gap: 14 }}>{['none', 'pending', 'ok', 'bad'].map((k) => (<span key={k} className="st-row" style={{ gap: 6 }}><span className="st-dot" style={{ width: 10, height: 10, background: CB_STATE[k].color }} />{c(CB_STATE[k].label)}</span>))}</div>
      {manualPhase && (<div className="st-msg info" style={{ marginBottom: 8 }}>{fmt(c(S.cbManualN), { n: nf(manualWired), t: nf(MANUAL_N) })}<div className="st-bar" style={{ marginTop: 6 }}><i style={{ width: `${(manualWired / MANUAL_N) * 100}%` }} /></div></div>)}
      {fb && <div style={{ marginBottom: 8 }} className={`st-msg ${fb.ok === false ? 'bad' : 'info'}`}>{c(fb.msg)}</div>}
      {manualPhase && guide && !selA && (
        <div className="st-card" style={{ marginBottom: 8, borderColor: 'rgba(34,197,94,.45)' }}>
          <h4 style={{ fontSize: 14 }}>{c(OC('Next step', 'الخطوة الجاية'))}</h4>
          <div className="st-path" style={{ margin: '4px 0 6px' }}><span className="ok">{nodeName(guide.a)}</span>↔<span className="ok">{nodeName(guide.b)}</span></div>
          <p className="st-small" style={{ margin: '0 0 8px' }}>{c(guide.why)}</p>
          <button className="st-btn sm" onClick={() => pick(guide.a)}>{c(OC('Select the first point for me', 'اختارلي أول نقطة'))}</button>
        </div>
      )}
      {selA && (
        <div className="st-card" style={{ marginBottom: 8, borderColor: 'rgba(56,189,248,.5)' }}>
          <h4 style={{ fontSize: 14 }}>{c(OC('Selected', 'اخترت'))}: {nodeName(selA)}</h4>
          <p className="st-small" style={{ margin: '4px 0' }}>{c(OC('Must connect to', 'لازم يتوصل مع'))}: <b style={{ color: '#86efac' }}>{expected.map(nodeName).join(' + ')}</b></p>
          <p className="st-small" style={{ margin: 0 }}>{c(OC('Connected now to', 'موصول هلّأ مع'))}: {nowWith.length ? nowWith.map(nodeName).join(' + ') : '—'}</p>
          <p className="st-small" style={{ margin: '4px 0 0' }}>{c(OC('Now tap the point marked in green.', 'هلّأ اكبس على النقطة اللي معلّمة بالأخضر.'))}</p>
        </div>
      )}
      {running && (<div className="st-msg info" style={{ marginBottom: 8 }}>{fmt(c(S.cbAuto), { n: nf(auto.done), t: nf(auto.total) })}<div className="st-bar" style={{ marginTop: 6 }}><i style={{ width: `${(auto.done / Math.max(1, auto.total)) * 100}%` }} /></div></div>)}
      {!manualPhase && !running && !state.netVerified && !report && <div className="st-msg ok" style={{ marginBottom: 8 }}>{c(S.cbAutoDone)}</div>}
      <div className="st-cab">
        {col(c(S.cbDevices), shownDevs.map((d) => `dev:${d.id}`))}
        {col(c(S.cbOutlets), shownDevs.map((d) => `out:${d.id}`))}
        {col(c(S.cbPP), ports.map((p) => `pp:${p}`))}
        {col(c(S.cbSW), manualPhase ? ports.map((p) => `sw:${p}`) : [...ports.map((p) => `sw:${p}`), `sw:${UPLINK_PORT}`, 'up'])}
      </div>
      {selA && <div className="st-row" style={{ marginTop: 8 }}><span className="st-chip">{nodeName(selA)}</span>{stateOf(selA) !== 'none' && <button className="st-btn sm ghost" onClick={() => removeLink(selA)}><Icon name="trash" size={14} />{c(S.cbRemove)}</button>}</div>}
      <div className="st-row" style={{ marginTop: 10 }}>
        <button className="st-btn primary" onClick={verify} disabled={!allWired || running}><Icon name="search" size={16} />{c(S.cbVerify)}</button>
      </div>
      {report && (report.ok ? <div className="st-msg ok">{c(S.cbPass)}</div> : (
        <div className="st-msg bad">{fmt(c(S.cbFailN), { n: failing.length + (report.uplink ? 0 : 1) })}
          <div className="st-row" style={{ marginTop: 6 }}>{failing.slice(0, 12).map((p) => (<button key={p.id} className="st-btn sm" onClick={() => doInspect(p.id)}>{c(S.cbInspect)} {p.id}</button>))}</div>
        </div>))}
      {insp && (
        <div className="st-card" style={{ marginTop: 10 }}>
          <h4>{c(S.cbInspect)}: {insp.id}</h4>
          <div className="st-path">
            <span className={insp.steps[0].ok ? 'ok' : 'bad'}>{nodeName(`dev:${insp.id}`)}</span>→
            <span className={insp.steps[0].ok ? 'ok' : 'bad'}>{nodeName(`out:${insp.id}`)}</span>→
            <span className={insp.steps[1].ok ? 'ok' : 'bad'}>{insp.steps[1].to ? nodeName(insp.steps[1].to) : '—'}</span>→
            <span className={insp.steps[2].ok ? 'ok' : 'bad'}>{insp.steps[2].to ? nodeName(insp.steps[2].to) : '—'}</span>
          </div>
          {links.filter((l) => l.state === 'bad' && [l.a, l.b].some((e) => e === `out:${insp.id}` || e === `dev:${insp.id}` || e === insp.steps[1].to)).map((l, i) => (<div key={i} className="st-small" style={{ marginTop: 6 }}>• {c(l.reason)}</div>))}
        </div>
      )}
      {state.netVerified && <button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toPeriph)} ›</button>}
    </div>
  );
}

export function PeriphPanel({ state, onPlace, onTest, onNext, busy }) {
  const { c } = useI18n();
  const [msgs, setMsgs] = useState({});
  const P = state.periph;
  const net = networkReport(state.links);
  const test = (k) => {
    if (k === 'printer') { const ok = net.per.find((p) => p.id === 'PRN')?.ok && state.netVerified; setMsgs({ ...msgs, [k]: ok ? 'ok' : 'fail' }); onTest(k, !!ok); }
    else if (k === 'display') { const ok = state.asm.postOk; setMsgs({ ...msgs, [k]: ok ? 'ok' : 'fail' }); onTest(k, !!ok); }
    else { setMsgs({ ...msgs, [k]: 'ok' }); onTest(k, true); }
  };
  const all = ['printer', 'ups', 'display'].every((k) => P[k].placed && P[k].ok);
  return (
    <div className="st-panel">
      <h2>{c(S.peTitle)}</h2>
      <div className="st-cards">
        {['display', 'printer', 'ups'].map((k) => { const d = S.pe[k]; const st = P[k]; return (
          <div key={k} className="st-card">
            <h4><Icon name={k === 'printer' ? 'printer' : k === 'ups' ? 'bolt' : 'laptop'} size={16} />{c(d.t)}{st.ok && <span className="st-dot ok" style={{ marginInlineStart: 'auto' }}>✓</span>}</h4>
            <p style={{ fontSize: 13, margin: '0 0 8px' }}>{c(d.d)}</p>
            <div className="st-row">
              {!st.placed && <button className="st-btn sm primary" disabled={!!busy} onClick={() => onPlace(k)}>{c(d.place)}</button>}
              {st.placed && !st.ok && <button className="st-btn sm primary" onClick={() => test(k)}>{c(d.test)}</button>}
            </div>
            {(msgs[k] === 'ok' || st.ok) && <div className="st-msg ok">{c(d.ok)}</div>}
            {msgs[k] === 'fail' && <div className="st-msg bad">{c(d.fail)}</div>}
          </div>); })}
      </div>
      {all && <button className="st-btn primary" style={{ marginTop: 12, width: '100%' }} onClick={onNext}>{c(S.toVerify)} ›</button>}
    </div>
  );
}

export function VerifyPanel({ state, onFix, onPass, onNext }) {
  const { c } = useI18n();
  const [shown, setShown] = useState(state.final.ran ? 99 : 0);
  const [running, setRunning] = useState(false);
  const res = useMemo(() => finalChecklist(state), [state]);
  const run = async () => { setRunning(true); setShown(0); for (let i = 1; i <= res.items.length; i++) { await sleep(280); playUiClick('click'); setShown(i); } setRunning(false); playUiClick(res.ok ? 'ok' : 'click'); onPass(res.ok); };
  const failN = res.items.filter((i) => !i.ok).length;
  const stageTitle = (id) => c(STAGES.find((s) => s.id === id)?.title);
  return (
    <div className="st-panel">
      <h2>{c(S.vfTitle)}</h2>
      <p>{c(S.vfLead)}</p>
      <button className="st-btn primary" onClick={run} disabled={running} style={{ width: '100%', marginBottom: 10 }}><Icon name="search" size={16} />{c(S.vfRun)}</button>
      <ul className="st-list">
        {res.items.slice(0, shown).map((i) => (
          <li key={i.id} className={i.ok ? 'ok' : 'bad'}>
            <span className={`st-dot ${i.ok ? 'ok' : 'bad'}`}>{i.ok ? '✓' : '!'}</span>
            <span style={{ flex: 1 }}>{c(i.text)}</span>
            {!i.ok && !running && <button className="st-btn sm" onClick={() => onFix(i.stage)} title={stageTitle(i.stage)}>{c(S.vfFix)}</button>}
          </li>))}
      </ul>
      {!running && shown >= res.items.length && (res.ok ? (<><div className="st-msg ok">{c(S.vfPass)}</div><button className="st-btn primary" style={{ marginTop: 10, width: '100%' }} onClick={onNext}>{c(S.toFinale)} ›</button></>) : <div className="st-msg bad">{fmt(c(S.vfFail), { n: failN })}</div>)}
    </div>
  );
}

export function CreditsScreen({ state, onRestart, onExit }) {
  const { c, nf } = useI18n();
  const fixed = state.netFixes || 0;
  return (
    <div className="st-screen" style={{ placeItems: 'end center', paddingBottom: '9vh' }}>
      <div className="st-menu" style={{ width: 'min(680px,100%)', textAlign: 'center', background: 'rgba(9,13,21,.9)' }}>
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', margin: 0 }}>{c(S.crTitle)}</h1>
        <p style={{ margin: '8px auto' }}>{c(S.crLead)}</p>
        <p className="st-small">{fmt(c(S.crStats), { m: nf(state.asm.mistakes || 0), f: nf(fixed) })}</p>
        <div className="st-row" style={{ justifyContent: 'center' }}>
          <button className="st-btn primary" onClick={onRestart}><Icon name="reset" size={16} />{c(S.restart)}</button>
          <button className="st-btn" onClick={onExit}><Icon name="home" size={16} />{c(S.exit)}</button>
        </div>
      </div>
    </div>
  );
}
