import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { PARTS } from '../../shared/content/parts.js';
import { actions } from '../store/progress.js';
import { Icon, PageHead, toast } from '../components/ui.jsx';
import ModelCanvas from '../three/ModelCanvas.jsx';
import { STEPS, PARTS_BY_PHASE, canInstall, canRemove, runPost, scoreFor } from '../lab/assembly.js';

const builders = () => import('../three/models.js');
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export default function Assembly() {
  const { t, c } = useI18n();
  const [mode, setMode] = useState('assemble'); // assemble | disassemble
  const [installed, setInstalled] = useState(() => new Set());
  const [feedback, setFeedback] = useState(null);
  const [post, setPost] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [asked, setAsked] = useState({});
  const [ready, setReady] = useState(false);
  const B = useRef(null); const viewer = useRef(null); const pendingBoard = useRef(false); const awarded = useRef(false);
  useEffect(() => { builders().then((m) => { B.current = m; setReady(true); }); }, []);

  // phase 1 = motherboard on the bench, phase 2 = inside the case.
  const boardIn = installed.has('board');
  const phase = mode === 'assemble' ? (boardIn ? 'case' : 'bench') : (installed.has('board') ? 'case' : 'bench');
  const modelKey = phase;
  const build = useCallback(() => {
    const m = B.current;
    if (phase === 'bench') {
      const init = {}; for (const id of PARTS_BY_PHASE.bench) init[id] = installed.has(id) ? 0 : 1;
      return m.buildMotherboard({ bench: true, init });
    }
    const init = { board: installed.has('board') && !pendingBoard.current ? 0 : 1, psu: installed.has('psu') ? 0 : 1, gpu: installed.has('gpu') ? 0 : 1, sidepanel: installed.has('sidepanel') ? 0 : 1, cable24: installed.has('cable24') ? 0 : 1, cableEps: installed.has('cableEps') ? 0 : 1, cablePcie: installed.has('cablePcie') ? 0 : 1 };
    return m.buildPC({ mode: 'assembly', init });
  }, [phase, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReady = useCallback((v) => { viewer.current = v; v.opts.autoRotate = true; if (pendingBoard.current && v.parts.board) { pendingBoard.current = false; setTimeout(() => v.setPartFactor('board', 0, 1.5), 350); } }, []);
  const set = (next) => setInstalled(new Set(next));

  const animate = (id, on) => { const v = viewer.current; if (v?.parts[id]) v.setPartFactor(id, on ? 0 : 1, id.startsWith('cable') ? 1.4 : 1.1); };

  const install = (id) => {
    const r = canInstall(id, installed);
    if (!r.ok) { setMistakes((m) => m + 1); setFeedback({ ok: false, msg: r.reason }); return; }
    if (id === 'board') { pendingBoard.current = true; const n = new Set(installed); n.add('board'); setInstalled(n); setFeedback({ ok: true, id }); return; }
    const n = new Set(installed); n.add(id); setInstalled(n); animate(id, true); setFeedback({ ok: true, id });
  };
  const remove = (id) => {
    const r = canRemove(id, installed);
    if (!r.ok) { setFeedback({ ok: false, msg: r.reason }); return; }
    const n = new Set(installed); n.delete(id);
    if (id === 'board') { viewer.current?.setPartFactor('board', 1, 1.2); setTimeout(() => setInstalled(n), 1300); setFeedback({ ok: true, id, removed: true }); return; }
    setInstalled(n); animate(id, false); setFeedback({ ok: true, id, removed: true });
  };
  const act = (id) => (mode === 'assemble' ? (installed.has(id) ? remove(id) : install(id)) : (installed.has(id) ? remove(id) : install(id)));

  const target = mode === 'assemble' ? STEPS.find((s) => !installed.has(s.id)) : [...STEPS].reverse().find((s) => installed.has(s.id));
  useEffect(() => {
    const v = viewer.current; if (!v || !target) return;
    for (const id of Object.keys(v.parts)) if (STEPS.some((s) => s.id === id)) v.parts[id].fTarget = installed.has(id) ? 0 : 1;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const showMe = () => { if (target) act(target.id); };
  const reset = (m = mode) => { pendingBoard.current = false; awarded.current = false; setMode(m); setFeedback(null); setPost(null); setMistakes(0); setAsked({}); set(m === 'assemble' ? [] : STEPS.map((s) => s.id)); };
  const complete = installed.size === STEPS.length && mode === 'assemble';
  const empty = installed.size === 0 && mode === 'disassemble';
  const doPost = () => {
    const r = runPost(installed); setPost(r);
    if (r.ok && !awarded.current) { awarded.current = true; actions.assemblyDone(scoreFor(mistakes)); toast(t('asm.xp'), 'chip'); }
    else if (!r.ok) setMistakes((m) => m + 1);
  };
  useEffect(() => { if (complete) setTimeout(() => viewer.current?.centerAssembled?.(), 1300); }, [complete]);
  useEffect(() => { if (empty) { actions.disassembled(); toast(t('asm.xp2'), 'power'); } }, [empty]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneCount = mode === 'assemble' ? installed.size : STEPS.length - installed.size;
  const labelText = (id, forced) => { const st = STEPS.find((x) => x.id === id); if (st && !installed.has(id)) return c(st.title); return forced && PARTS[id] ? c(PARTS[id].name) : ''; };
  const pick = (id) => { if (!id) { viewer.current?.select(null); return; } const s = STEPS.find((x) => x.id === id); if (s) act(id); else viewer.current?.select(id); };
  const partsList = [...PARTS_BY_PHASE.bench, ...PARTS_BY_PHASE.case];
  const q = target?.ask;
  const qOptions = useMemo(() => {
    if (!q) return [];
    return shuffle(q.options.map((o, idx) => ({ o, idx })));
  }, [target?.id, q]);

  return (
    <div className="content wide">
      <PageHead eyebrow={t('asm.eyebrow')} title={t('asm.title')}>{t('asm.lead')}</PageHead>
      <div className="row between wrap" style={{ marginBottom: 14 }}>
        <div className="seg" role="group" aria-label={t('asm.mode')}>
          <button aria-pressed={mode === 'assemble'} onClick={() => reset('assemble')}><Icon name="plus" size={14} /> {t('asm.assemble')}</button>
          <button aria-pressed={mode === 'disassemble'} onClick={() => reset('disassemble')}><Icon name="power" size={14} /> {t('asm.disassemble')}</button>
        </div>
        <div className="row"><span className="chip accent">{t('asm.phase')}: {t(phase === 'bench' ? 'asm.bench' : 'asm.case')}</span><span className="chip">{doneCount}/{STEPS.length}</span></div>
      </div>
      <div className="viewer-layout">
        <div className="viewer-main">
          {ready && (
            <ModelCanvas modelKey={modelKey} build={build} labels onReady={onReady} onPick={pick} labelText={labelText} ariaLabel="PC assembly 3D">
              <div className="stage-tools">
                <button className="btn sm primary" onClick={showMe} disabled={!target || complete}><Icon name="play" size={16} />{t('asm.showme')}</button>
                <button className="btn sm" onClick={() => reset()}><Icon name="reset" size={16} />{t('asm.restart')}</button>
              </div>
              <div className="stage-hint">{t('asm.clickhint')}</div>
            </ModelCanvas>
          )}
          <div className="card tight steps" style={{ marginTop: 12 }}>
            <ol className="steplist">
              {STEPS.map((s, i) => { const on = installed.has(s.id); const cur = target?.id === s.id; return (<li key={s.id} className={`${on ? 'on' : ''} ${cur ? 'cur' : ''}`}><i>{on ? <Icon name="check" size={13} /> : i + 1}</i><span>{c(s.title)}</span></li>); })}
            </ol>
          </div>
        </div>
        <aside className="viewer-side">
          <div className="card info-panel" aria-live="polite">
            {complete ? (
              <div className="info-in">
                <span className="chip ok"><Icon name="check" size={14} />{t('asm.built')}</span>
                <h2 style={{ marginTop: 10 }}>{t('asm.power.t')}</h2>
                <p className="muted small">{t('asm.power.d')}</p>
                <Link className="btn primary" to="/ar?m=pc" style={{ marginBlock: '4px 10px' }}><Icon name="camera" size={16} />{t('ar.built')}</Link>
                {post?.ok && <div className="callout ok"><Icon name="star" /><div><b>{t('asm.score', { n: scoreFor(mistakes) })}</b> {t('asm.mistakes', { n: mistakes })}</div></div>}
              </div>
            ) : empty ? (
              <div className="info-in"><span className="chip ok"><Icon name="check" size={14} />{t('asm.dis.done')}</span><h2 style={{ marginTop: 10 }}>{t('asm.dis.t')}</h2><p className="muted small">{t('asm.dis.d')}</p></div>
            ) : target ? (
              <div key={target.id + mode} className="info-in">
                <span className="chip accent">{t('asm.step', { n: STEPS.indexOf(target) + 1 })}</span>
                <h2 style={{ marginTop: 10 }}>{c(mode === 'assemble' ? target.title : target.undo)}</h2>
                <p>{c(mode === 'assemble' ? target.how : target.undoHow)}</p>
                <div className="callout tip small"><Icon name="info" size={18} /><div>{c(target.why)}</div></div>
                {mode === 'assemble' && <div className="callout warn small" style={{ marginTop: 8 }}><Icon name="shield" size={18} /><div>{c(target.safety)}</div></div>}
                <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={() => act(target.id)}>{t(mode === 'assemble' ? 'asm.install' : 'asm.remove')}</button></div>
                {mode === 'assemble' && q && !asked[target.id] && (
                  <div className="mini-q"><b>{t('asm.quick')}</b><div>{c(q.q)}</div>
                    <div className="row wrap" style={{ marginTop: 6 }}>{qOptions.map(({ o, idx }) => (<button key={idx} className="btn sm" onClick={() => { const ok = idx === q.ans; setAsked({ ...asked, [target.id]: ok ? 'ok' : 'bad' }); actions.answer(`asm-${target.id}`, ok); toast(ok ? t('quiz.correct') : t('quiz.wrong'), ok ? 'check' : 'info'); }}>{c(o)}</button>))}</div></div>
                )}
                {asked[target.id] && <div className={`callout ${asked[target.id] === 'ok' ? 'ok' : 'bad'} small`} style={{ marginTop: 8 }}>{c(q.exp)}</div>}
              </div>
            ) : null}
            {feedback && !feedback.ok && <div className="callout bad shake" role="alert" style={{ marginTop: 12 }}><Icon name="x" /><div>{c(feedback.msg)}</div></div>}
          </div>
          {mode === 'assemble' && (
            <div className="card tight">
              <div className="row between"><h4 style={{ margin: 0 }}>{t('asm.post.t')}</h4><button className="btn sm primary" onClick={doPost} disabled={installed.size === 0}><Icon name="power" size={15} />{t('asm.power')}</button></div>
              <p className="tiny muted" style={{ margin: '6px 0 0' }}>{t('asm.post.d')}</p>
              {post && (<ul className="post">{post.lines.map((l, i) => (<li key={i} className={l.ok ? 'ok' : 'bad'}><Icon name={l.ok ? 'check' : 'x'} size={15} />{c(l.msg)}</li>))}</ul>)}
            </div>
          )}
          <div className="card tight">
            <h4>{t('asm.tray')}</h4>
            <div className="part-list">
              {partsList.map((id) => { const s = STEPS.find((x) => x.id === id); const on = installed.has(id); return (<button key={id} className={`part-btn ${on ? 'seen' : ''}`} onClick={() => act(id)}><i className={on ? 'dot seen' : 'dot'} />{c(s.title)}<span className="muted tiny" style={{ marginInlineStart: 'auto' }}>{on ? t('asm.installed') : t('asm.waiting')}</span></button>); })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
