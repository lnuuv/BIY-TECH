import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { DICT } from '../i18n/dict.js';
import { assignmentActions, useAssignments } from '../store/assignment.js';
import { ApiError, discardDoc, precheck, startAnalysis, uploadFile, waitForJob } from '../assignment/api.js';
import { usePageContext } from '../assistant/pageContext.js';
import { Chip, Icon, PageHead, toast } from '../components/ui.jsx';
import UploadPanel, { Stages } from '../components/assignment/UploadPanel.jsx';
import Workspace from '../components/assignment/Workspace.jsx';
import { Notice } from '../components/assignment/parts.jsx';

const STAGE_IDS = ['reading', 'identify', 'connect', 'prepare'];
const initStages = () => STAGE_IDS.map((id) => ({ id, state: id === 'reading' ? 'done' : 'pending' }));

export default function Assignment() {
  const { t, lang } = useI18n();
  const store = useAssignments();
  const active = store.active ? store.items[store.active] : null;
  const [phase, setPhase] = useState('idle');          // idle | uploading | processing | ready | analysing | error
  const [pct, setPct] = useState(0);
  const [file, setFile] = useState(null);
  const [up, setUp] = useState(null);
  const [stages, setStages] = useState(initStages);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState('overview');
  const [taskId, setTaskId] = useState(null);
  const ctl = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);

  usePageContext(active ? { page: 'assignment studio', assignment: active.result.structure.title, tab, task: taskId } : { page: 'assignment studio', state: phase });

  const msg = (e) => { const k = `asg.err.${e?.code}`; return DICT[k] ? t(k) : (e?.message || t('asg.err.generic')); };

  const reset = useCallback(() => { ctl.current?.abort(); setFile(null); setUp(null); setErr(null); setPhase('idle'); setPct(0); setStages(initStages()); }, []);

  const pick = useCallback(async (f) => {
    ctl.current?.abort();
    if (up?.docId) discardDoc(up.docId);
    setErr(null); setUp(null); setFile(f);
    const bad = precheck(f);
    if (bad) { setErr(bad); setPhase('error'); return; }
    const c = new AbortController(); ctl.current = c;
    setPhase('uploading'); setPct(0);
    try {
      const r = await uploadFile(f, { signal: c.signal, onProgress: setPct, onProcessing: () => setPhase('processing') });
      setUp(r); setPhase('ready');
    } catch (e) { if (e.code === 'aborted') return; setErr(e); setPhase('error'); }
  }, [up]);

  const analyse = useCallback(async (basic = false, docId = up?.docId, meta = null) => {
    if (!docId) return;
    const c = new AbortController(); ctl.current = c;
    setErr(null); setStages(initStages()); setPhase('analysing');
    try {
      const first = await startAnalysis(docId, lang, basic);
      const result = await waitForJob(first, { signal: c.signal, onUpdate: (s) => setStages(s) });
      assignmentActions.save(result, { docId, name: meta?.name || up?.file?.name || file?.name, size: meta?.size || up?.file?.size || file?.size });
      setTab('overview'); setTaskId(null); reset();
      toast(t('asg.up.ready'), 'check');
    } catch (e) { if (e.code === 'aborted') return; setErr(e); setPhase(up ? 'ready' : 'error'); }
  }, [up, file, lang, reset, t]);

  const retryable = err && (err.retryable || ['rate_limited', 'upstream', 'timeout', 'network', 'empty', 'invalid_ai_output'].includes(err.code));
  const canRetryAnalysis = !!up?.docId && err && !['too_large', 'unsupported', 'legacy_doc', 'scanned_pdf', 'empty_text', 'empty_file', 'encrypted', 'corrupt', 'doc_expired'].includes(err.code);

  /* ----- header notice: kept exactly as the original highlighted banner (text updated in place) ----- */
  const notice = <div className="callout warn" style={{ marginBottom: 18 }}><Icon name="shield" /><div>{t('asg.integrity')}</div></div>;

  const errorBox = err && (
    <Notice tone="bad" icon="info" actions={<>
      {canRetryAnalysis && retryable && <button className="btn sm primary" onClick={() => analyse(false)}>{t('asg.retry')}</button>}
      {canRetryAnalysis && (err.canUseBasic || err.code === 'no_api_key') && <button className="btn sm" onClick={() => analyse(true)}>{t('asg.basic')}</button>}
      {!canRetryAnalysis && file && <button className="btn sm" onClick={reset}>{t('asg.up.remove')}</button>}
    </>}>
      <b>{msg(err)}</b>
      {(err.canUseBasic || err.code === 'no_api_key') && <div className="tiny muted" style={{ marginTop: 4 }}>{t('asg.basic.note')}</div>}
    </Notice>
  );

  /* ----- workspace for an analysed assignment ----- */
  if (active && phase === 'idle') {
    const r = active.result; const wrongLang = r.lang !== lang;
    const regen = async () => {
      const c = new AbortController(); ctl.current = c; setStages(initStages()); setPhase('analysing'); setErr(null);
      try {
        const first = await startAnalysis(active.docId, lang, r.mode === 'basic');
        const result = await waitForJob(first, { signal: c.signal, onUpdate: setStages });
        assignmentActions.save(result, { docId: active.docId, name: active.name, size: active.size }); setPhase('idle');
      } catch (e) { if (e.code === 'aborted') return; setErr(e); setPhase('idle'); }
    };
    return (
      <div className="content">
        <PageHead eyebrow={t('asg.eyebrow')} title={t('asg.title')}>{t('asg.lead')}</PageHead>
        {notice}
        <div className="row between wrap" style={{ marginBottom: 14 }}>
          <div className="row wrap" style={{ gap: 8 }}><Icon name="doc" size={18} /><b dir="auto">{active.name}</b>{r.mode === 'basic' && <Chip>Basic</Chip>}</div>
          <div className="row wrap" style={{ gap: 8 }}>
            <Link to="/assistant" className="btn sm"><Icon name="bot" size={15} />{t('asg.ask')}</Link>
            <button className="btn sm" onClick={() => assignmentActions.close()}><Icon name="plus" size={15} />{t('asg.new')}</button>
          </div>
        </div>
        {r.mode === 'basic' && <div style={{ marginBottom: 12 }}><Notice tone="warn" icon="info">{t('asg.mode.basic')}</Notice></div>}
        {wrongLang && <div style={{ marginBottom: 12 }}><Notice icon="globe" actions={<button className="btn sm" onClick={regen}>{t('asg.lang.regen')}</button>}>{t('asg.lang.note', { lang: t(`asg.lang.${r.lang}`) })}</Notice></div>}
        {r.warnings.filter((w) => DICT[`asg.w.${w}`]).map((w) => <div key={w} style={{ marginBottom: 8 }}><Notice tone="warn" icon="info" actions={w === 'partial_result' && <button className="btn sm primary" onClick={regen}>{t('asg.retry')}</button>}>{t(`asg.w.${w}`)}</Notice></div>)}
        {err && <div style={{ marginBottom: 12 }}><Notice tone="bad" icon="info">{msg(err)}</Notice></div>}
        <Workspace result={r} tab={tab} setTab={setTab} taskId={taskId} setTaskId={setTaskId} />
        <div className="callout tip" style={{ marginTop: 18 }}><Icon name="bot" /><div>{t('asg.ask.hint')} <Link to="/assistant">{t('asg.ask')}</Link></div></div>
      </div>
    );
  }
  if (active && phase === 'analysing') {
    return (<div className="content"><PageHead eyebrow={t('asg.eyebrow')} title={t('asg.title')} />{notice}<div className="card"><h3 style={{ marginTop: 0 }}>{t('asg.analysing')}</h3><Stages stages={stages} busy /></div></div>);
  }

  /* ----- upload ----- */
  const saved = Object.values(store.items).sort((a, b) => b.at - a.at);
  return (
    <div className="content">
      <PageHead eyebrow={t('asg.eyebrow')} title={t('asg.title')}>{t('asg.lead')}</PageHead>
      {notice}
      <div className="stack lg">
        <UploadPanel phase={phase} pct={pct} file={file} up={up} stages={stages} onPick={pick} onRemove={() => { if (up?.docId) discardDoc(up.docId); reset(); }} onStart={analyse} />
        {errorBox}
        {up?.warnings?.filter((w) => DICT[`asg.w.${w}`]).map((w) => <Notice key={w} tone="warn" icon="info">{t(`asg.w.${w}`)}</Notice>)}
        {saved.length > 0 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t('asg.recent')}</h3>
            <ul className="asg-recent">{saved.map((s) => (
              <li key={s.id}><Icon name="doc" size={18} /><div className="grow"><b dir="auto">{s.result.structure.title || s.name}</b><div className="tiny muted" dir="auto">{s.name} · {new Date(s.at).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB')}</div></div>
                <button className="btn sm primary" onClick={() => { setTab('overview'); setTaskId(null); assignmentActions.open(s.id); }}>{t('asg.open')}</button>
                <button className="btn sm ghost danger icon" aria-label={t('asg.delete')} onClick={() => assignmentActions.remove(s.id)}><Icon name="trash" size={15} /></button></li>))}</ul>
            <p className="tiny muted" style={{ marginBottom: 0 }}>{t('asg.saved.note')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
