import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { actions } from '../store/progress.js';
import { getTutorContext } from '../store/assignment.js';
import { Icon, PageHead } from '../components/ui.jsx';

/** minimal safe markdown: **bold**, `code`, "- " lists, paragraphs, and [S#] citation chips (no HTML injection) */
function Rich({ text, onCite }) {
  const inline = (s, k) => s.split(/(\*\*[^*]+\*\*|`[^`]+`|\[S\d+\])/g).map((part, i) => {
    if (/^\*\*.+\*\*$/.test(part)) return <strong key={`${k}${i}`}>{part.slice(2, -2)}</strong>;
    if (/^`.+`$/.test(part)) return <code key={`${k}${i}`}>{part.slice(1, -1)}</code>;
    const m = part.match(/^\[S(\d+)\]$/); if (m) return <button key={`${k}${i}`} className="cite" onClick={() => onCite(+m[1])} aria-label={`source ${m[1]}`}>{m[1]}</button>;
    return part;
  });
  const blocks = []; let list = null;
  text.split('\n').forEach((line, i) => {
    const li = line.match(/^\s*[-*•]\s+(.*)$/) || line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (li) { (list ||= []).push(<li key={i}>{inline(li[1], i)}</li>); return; }
    if (list) { blocks.push(<ul key={`u${i}`}>{list}</ul>); list = null; }
    if (line.trim()) blocks.push(<p key={i}>{inline(line.replace(/^#+\s*/, ''), i)}</p>);
  });
  if (list) blocks.push(<ul key="uend">{list}</ul>);
  return <div className="rich">{blocks}</div>;
}

export default function Assistant() {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);
  const end = useRef(null);
  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false })); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' }); }, [msgs, busy]);

  const ask = async (text, base = msgs) => {
    const q = text.trim(); if (!q || busy) return;
    const next = [...base, { role: 'user', content: q }];
    setMsgs(next); setInput(''); setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, assignmentContext: getTutorContext(), messages: next.map(({ role, content }) => ({ role, content })) }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.error === 'no_api_key' && data.sources?.length) { setMsgs([...next, { role: 'assistant', content: '', offline: true, sources: data.sources, cited: [] }]); }
        else { setErr({ text: data.message || t('chat.err.generic'), q, base }); setMsgs(next); }
      } else { setMsgs([...next, { role: 'assistant', content: data.answer, sources: data.sources, cited: data.cited }]); actions.award(2, 'chat'); }
    } catch { setErr({ text: t('chat.err.net'), q, base }); setMsgs(next); }
    setBusy(false);
  };
  const suggestions = [t('chat.s1'), t('chat.s2'), t('chat.s3'), t('chat.s4')];
  const jump = (mi, n) => { setOpen(`${mi}-${n}`); setTimeout(() => document.getElementById(`src-${mi}-${n}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30); };

  return (
    <div className="content chat-page">
      <PageHead eyebrow={t('chat.eyebrow')} title={t('chat.title')}>{t('chat.lead')}</PageHead>
      <div className="card chat">
        <div className="chat-head">
          <div className="row"><span className="bot-ic"><Icon name="bot" size={20} /></span><div><b>{t('chat.name')}</b><div className="tiny muted"><i className={`status ${health?.ai ? 'on' : 'off'}`} />{health == null ? t('chat.status.check') : health.ai ? t('chat.status.on') : t('chat.status.off')}</div></div></div>
          <button className="btn sm" onClick={() => { setMsgs([]); setErr(null); setOpen(null); }} disabled={!msgs.length}><Icon name="plus" size={15} />{t('chat.new')}</button>
        </div>
        <div className="chat-body" role="log" aria-live="polite" aria-busy={busy}>
          {msgs.length === 0 && (
            <div className="chat-empty">
              <Icon name="bot" size={40} style={{ color: 'var(--accent)' }} /><h2>{t('chat.empty.t')}</h2><p className="muted">{t('chat.empty.d')}</p>
              <div className="sugg">{suggestions.map((s) => <button key={s} className="btn" onClick={() => ask(s)}>{s}</button>)}</div>
              {health && !health.ai && <div className="callout warn small" style={{ marginTop: 16, textAlign: 'start' }}><Icon name="info" size={18} /><div>{t('chat.offline.note')}</div></div>}
            </div>
          )}
          {msgs.map((m, mi) => (
            <div key={mi} className={`msg ${m.role}`}>
              {m.role === 'assistant' && <span className="bot-ic sm"><Icon name="bot" size={16} /></span>}
              <div className="bubble">
                {m.role === 'user' ? <p>{m.content}</p> : m.offline ? <div><p><b>{t('chat.offline.t')}</b></p><p className="muted small">{t('chat.offline.d')}</p></div> : <Rich text={m.content} onCite={(n) => jump(mi, n)} />}
                {m.role === 'assistant' && m.sources?.length > 0 && (
                  <details className="sources" open={m.offline || open?.startsWith(`${mi}-`)}>
                    <summary>{m.offline ? t('chat.src.related') : m.cited?.length ? t('chat.src.cited', { n: m.cited.length }) : t('chat.src.none')} <span className="muted">({m.sources.length})</span></summary>
                    <ol>
                      {m.sources.map((s) => { const used = m.cited?.includes(s.n); if (!m.offline && m.cited?.length && !used && open !== `${mi}-${s.n}`) return null; return (
                        <li key={s.n} id={`src-${mi}-${s.n}`} className={open === `${mi}-${s.n}` ? 'hl' : ''}>
                          <div className="row between wrap"><span className="chip mono">S{s.n}</span><span className="chip accent">{s.label}</span>{s.lesson && <Link to={`/learn/${s.lesson}`} className="tiny">{t('chat.src.open')}</Link>}</div>
                          <p className="small muted" dir={s.kind === 'book' ? 'rtl' : undefined} lang={s.kind === 'book' ? 'ar' : undefined}>{s.excerpt}</p>
                        </li>); })}
                    </ol>
                    {m.sources.some((s) => s.kind === 'book') && <p className="tiny muted" style={{ margin: '6px 0 0' }}>{t('chat.src.note')}</p>}
                  </details>
                )}
              </div>
            </div>
          ))}
          {busy && (<div className="msg assistant"><span className="bot-ic sm"><Icon name="bot" size={16} /></span><div className="bubble typing" aria-label={t('chat.thinking')}><i /><i /><i /></div></div>)}
          {err && (<div className="callout bad" role="alert"><Icon name="x" /><div><b>{err.text}</b><div style={{ marginTop: 8 }}><button className="btn sm" onClick={() => ask(err.q, err.base)}><Icon name="reset" size={14} />{t('chat.retry')}</button></div></div></div>)}
          <div ref={end} />
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <textarea className="input" rows={1} value={input} placeholder={t('chat.placeholder')} aria-label={t('chat.placeholder')} maxLength={6000} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
          <button className="btn primary icon" type="submit" disabled={busy || !input.trim()} aria-label={t('chat.send')}><Icon name="send" size={18} className="flip-rtl" /></button>
        </form>
      </div>
    </div>
  );
}
