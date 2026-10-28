import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { PAIRS, SPRINT, SORTS } from '../../shared/content/games.js';
import { QUESTIONS } from '../../shared/content/quizzes.js';
import { actions, useProgress } from '../store/progress.js';
import { Icon, PageHead, toast } from '../components/ui.jsx';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

function Pairs() {
  const { t, lang } = useI18n();
  const [deck, setDeck] = useState(() => mk());
  const [open, setOpen] = useState([]); const [matched, setMatched] = useState(new Set()); const [moves, setMoves] = useState(0);
  const t0 = useRef(Date.now()); const [final, setFinal] = useState(null);
  function mk() { const ps = shuffle(PAIRS).slice(0, 6); return shuffle(ps.flatMap((p) => [{ key: `${p.id}t`, id: p.id, kind: 'term', text: p.term }, { key: `${p.id}d`, id: p.id, kind: 'def', text: p }])); }
  const flip = (card) => {
    if (open.length === 2 || open.includes(card.key) || matched.has(card.id) || final) return;
    const next = [...open, card.key]; setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((k) => deck.find((x) => x.key === k));
      if (a.id === b.id) { setTimeout(() => { const m = new Set(matched).add(a.id); setMatched(m); setOpen([]); if (m.size === 6) { const secs = Math.round((Date.now() - t0.current) / 1000); const sc = Math.max(40, 600 - (moves + 1 - 6) * 25 - secs * 2); setFinal({ sc, secs }); actions.score('pairs', sc); toast(t('games.xp'), 'trophy'); } }, 450); }
      else setTimeout(() => setOpen([]), 900);
    }
  };
  const restart = () => { setDeck(mk()); setOpen([]); setMatched(new Set()); setMoves(0); setFinal(null); t0.current = Date.now(); };
  return (
    <div>
      <div className="row between wrap" style={{ marginBottom: 12 }}><p className="muted small" style={{ margin: 0 }}>{t('games.pairs.d')}</p><div className="row"><span className="chip">{t('games.moves')}: {moves}</span><button className="btn sm" onClick={restart}><Icon name="reset" size={15} />{t('games.restart')}</button></div></div>
      <div className="memory">
        {deck.map((card) => { const shown = open.includes(card.key) || matched.has(card.id); return (
          <button key={card.key} className={`mem ${shown ? 'shown' : ''} ${matched.has(card.id) ? 'matched' : ''} ${card.kind}`} onClick={() => flip(card)} aria-label={shown ? (card.kind === 'term' ? card.text : card.text[lang]) : t('games.card')}>
            <span className="face back"><Icon name="cube" size={22} /></span>
            <span className="face front">{card.kind === 'term' ? <b>{card.text}</b> : <span>{card.text[lang]}</span>}</span>
          </button>); })}
      </div>
      {final && <div className="callout ok" style={{ marginTop: 14 }}><Icon name="trophy" /><div><b>{t('games.done')}</b> {t('games.score', { n: final.sc })} · {final.secs}s</div></div>}
    </div>
  );
}

function Sprint() {
  const { t, lang } = useI18n();
  const [duration, setDuration] = useState(30); // 30s Challenge (default) or 60s Sprint
  const [state, setState] = useState('idle');
  const [left, setLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(null);
  const [stats, setStats] = useState({ ok: 0, n: 0 });

  const combinedPool = useMemo(() => {
    const courseItems = QUESTIONS.map((q) => ({
      id: `q-${q.id}`,
      q: q.q,
      answer: q.options[q.ans][lang],
      options: q.options.map((o) => o[lang]),
    }));
    return [...SPRINT, ...courseItems];
  }, [lang]);

  const deck = useMemo(() => shuffle(combinedPool), [state === 'idle', combinedPool]); // eslint-disable-line
  useEffect(() => {
    if (state !== 'play') return undefined;
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(id); setState('end'); return 0; } return l - 1; }), 1000);
    return () => clearInterval(id);
  }, [state]);
  useEffect(() => { if (state === 'end') { actions.score('sprint', score); toast(t('games.xp'), 'trophy'); } }, [state]); // eslint-disable-line

  const q = deck[i % deck.length];
  const opts = useMemo(() => shuffle(q.options), [i, state, q]); // eslint-disable-line
  const go = (o) => {
    const ok = o === q.answer;
    setFlash(ok ? 'ok' : 'bad');
    setStats((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
    if (ok) { setScore((s) => s + Math.round(10 * (1 + Math.min(streak, 5) * 0.25))); setStreak((s) => s + 1); }
    else setStreak(0);
    setTimeout(() => { setFlash(null); setI((x) => x + 1); }, 280);
  };

  if (state === 'idle') {
    return (
      <div className="center card flat">
        <Icon name="bolt" size={34} style={{ color: 'var(--accent)' }} />
        <h2>{t('games.sprint.t')}</h2>
        <p className="muted">{t('games.sprint.d')}</p>
        <div className="seg" style={{ margin: '10px auto 16px' }}>
          <button aria-pressed={duration === 30} onClick={() => setDuration(30)}>{t('games.sprint.30s')}</button>
          <button aria-pressed={duration === 60} onClick={() => setDuration(60)}>{t('games.sprint.60s')}</button>
        </div>
        <button className="btn primary lg" onClick={() => { setState('play'); setLeft(duration); setScore(0); setStreak(0); setI(0); setStats({ ok: 0, n: 0 }); }}>
          <Icon name="play" size={18} />{t('games.start')}
        </button>
      </div>
    );
  }
  if (state === 'end') {
    return (
      <div className="center card flat">
        <Icon name="trophy" size={34} style={{ color: 'var(--warn)' }} />
        <h2>{t('games.score', { n: score })}</h2>
        <p className="muted">{stats.ok}/{stats.n} {t('games.correct')}</p>
        <button className="btn primary" onClick={() => setState('idle')}>{t('games.again')}</button>
      </div>
    );
  }
  return (
    <div className={`sprint ${flash || ''}`}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="chip accent"><Icon name="bolt" size={14} />{score}</span>
        <span className="chip warn">×{(1 + Math.min(streak, 5) * 0.25).toFixed(2)}</span>
        <span className={`chip ${left <= 10 ? 'bad' : ''}`}>{left}s</span>
      </div>
      <div className="bar" style={{ marginBottom: 16 }}>
        <i style={{ width: `${(left / duration) * 100}%`, transition: 'width 1s linear' }} />
      </div>
      <h2 className="qtext" style={{ textAlign: 'center' }}>{q.q[lang]}</h2>
      <div className="grid c2" style={{ marginTop: 14 }}>
        {opts.map((o, idx) => <button key={`${i}-${idx}`} className="btn lg opt-btn" onClick={() => go(o)}>{o}</button>)}
      </div>
    </div>
  );
}

function Sort() {
  const { t, lang } = useI18n();
  const [setKey, setSetKey] = useState('threats');
  const [items, setItems] = useState(() => shuffle(SORTS[setKey].items).slice(0, 12)); const [bucketOrder, setBucketOrder] = useState(() => shuffle(SORTS[setKey].buckets)); const [i, setI] = useState(0); const [ok, setOk] = useState(0); const [fb, setFb] = useState(null); const [done, setDone] = useState(false);
  const reset = (k = setKey) => { setSetKey(k); setItems(shuffle(SORTS[k].items).slice(0, 12)); setBucketOrder(shuffle(SORTS[k].buckets)); setI(0); setOk(0); setFb(null); setDone(false); };
  const cur = items[i];
  const choose = (b) => { if (fb) return; const good = cur[2] === b; setFb({ good, answer: cur[2] }); const o = ok + (good ? 1 : 0); if (good) setOk(o); setTimeout(() => { setFb(null); if (i + 1 >= items.length) { setDone(true); const sc = o * 15; actions.score('sort', sc); toast(t('games.xp'), 'trophy'); } else setI(i + 1); }, 900); };
  return (
    <div>
      <div className="row between wrap" style={{ marginBottom: 12 }}><div className="seg">{Object.keys(SORTS).map((k) => <button key={k} aria-pressed={setKey === k} onClick={() => reset(k)}>{SORTS[k].title[lang]}</button>)}</div><span className="chip">{Math.min(i + 1, items.length)}/{items.length}</span></div>
      {done ? (<div className="center card flat"><Icon name="trophy" size={34} style={{ color: 'var(--warn)' }} /><h2>{t('games.score', { n: ok * 15 })}</h2><p className="muted">{ok}/{items.length} {t('games.correct')}</p><button className="btn primary" onClick={() => reset()}>{t('games.again')}</button></div>) : (
        <div className="sortgame">
          <div key={i} className={`sort-card ${fb ? (fb.good ? 'ok' : 'bad') : ''}`}>{lang === 'ar' ? cur[1] : cur[0]}</div>
          <div className="grid c2">{bucketOrder.map((b) => <button key={b.id} className={`btn lg bucket ${fb && fb.answer === b.id ? 'right' : ''}`} onClick={() => choose(b.id)}>{b[lang]}</button>)}</div>
          <p className="muted small center" role="status">{fb ? (fb.good ? t('quiz.correct') : t('quiz.wrong')) : t('games.sort.hint')}</p>
        </div>)}
    </div>
  );
}

export default function Games() {
  const { t } = useI18n();
  const p = useProgress();
  const [tab, setTab] = useState('pairs');
  const tabs = [['pairs', 'games.pairs', 'cube'], ['sprint', 'games.sprint', 'bolt'], ['sort', 'games.sort', 'tag']];
  return (
    <div className="content">
      <PageHead eyebrow={t('games.eyebrow')} title={t('games.title')}>{t('games.lead')}</PageHead>
      <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(l)}{p.scores[k] ? <span className="chip" style={{ marginInlineStart: 8, height: 18 }}>{t('games.best')} {p.scores[k]}</span> : null}</button>)}</div>
      <div className="card">{tab === 'pairs' ? <Pairs /> : tab === 'sprint' ? <Sprint /> : <Sort />}</div>
    </div>
  );
}
