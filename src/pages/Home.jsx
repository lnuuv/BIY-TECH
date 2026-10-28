import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS, OUTCOMES } from '../../shared/content/lessons.js';
import { QUIZ_BANK } from '../../shared/content/quizzes.js';
import { actions, useProgress, levelOf } from '../store/progress.js';
import { Icon, Ring, Chip } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import ModelCanvas from '../three/ModelCanvas.jsx';

function Hero3D() {
  const [b, setB] = useState(null);
  useEffect(() => {
    const go = () => import('../three/models.js').then((m) => setB(() => m.buildRack));
    const saver = navigator.connection?.saveData;
    if (saver) return undefined;
    const id = window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 300);
    return () => (window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  const build = useCallback(() => b(), [b]);
  if (!b) return <div className="stage hero-stage"><div className="stage-overlay"><div className="spinner" /></div></div>;
  return <ModelCanvas className="hero-stage" modelKey="hero" build={build} autoRotate ariaLabel="Server rack 3D" />;
}

export default function Home() {
  const { t, c, nf } = useI18n();
  const p = useProgress();
  const lv = levelOf(p.xp);
  const next = LESSONS.find((l) => !p.lessons[l.id]) || LESSONS[0];
  const day = Math.floor(Date.now() / 864e5);
  const dq = QUIZ_BANK[day % QUIZ_BANK.length];
  const [dqDone, setDqDone] = useState(false);
  const aim = (k) => { const ls = LESSONS.filter((l) => l.outcome === k); return ls.filter((l) => p.lessons[l.id]).length / ls.length; };
  const features = [
    { to: '/story', icon: 'play', k: 'story' },
    { to: '/infrastructure', icon: 'layers', k: 'infrastructure' },
    { to: '/ar', icon: 'camera', k: 'ar' },
    { to: '/models', icon: 'cube', k: 'models' },
    { to: '/lab', icon: 'network', k: 'lab' },
    { to: '/assistant', icon: 'bot', k: 'assistant' },
    { to: '/practice', icon: 'trophy', k: 'practice' },
    { to: '/platform', icon: 'cloud', k: 'platform' },
    { to: '/games', icon: 'gamepad', k: 'games' },
  ];
  return (
    <div className="content wide home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{t('home.eyebrow')}</div>
          <h1>{t('home.title')}</h1>
          <p className="lead">{t('home.lead')}</p>
          <div className="row wrap" style={{ gap: 12 }}>
            <Link className="btn primary lg" to="/story"><Icon name="play" size={18} />{t('nav.story')}</Link>
            <Link className="btn lg" to="/ar"><Icon name="camera" size={18} />{t('nav.ar')}</Link>
            <Link className="btn lg" to="/infrastructure"><Icon name="layers" size={18} />{t('nav.infrastructure')}</Link>
            <Link className="btn lg" to={`/learn/${next.id}`}><Icon name="book" size={18} />{p.xp ? t('home.continue') : t('home.start')}</Link>
          </div>
          <div className="row wrap hero-stats" style={{ gap: 28 }}>
            <div><b>{nf(LESSONS.length)}</b><span>{t('home.s.lessons')}</span></div>
            <div><b>{nf(QUIZ_BANK.length)}</b><span>{t('home.s.questions')}</span></div>
            <div><b>{nf(5)}</b><span>{t('home.s.models')}</span></div>
            <div><b>{nf(5)}</b><span>{t('home.s.missions')}</span></div>
          </div>
        </div>
        <Hero3D />
      </section>

      <section className="grid c3 dash" aria-label={t('home.dash')}>
        <div className="card">
          <div className="row between"><h3 style={{ margin: 0 }}>{t('home.progress')}</h3><Chip tone="accent">{t('side.level', { n: lv.level })}</Chip></div>
          <div className="row" style={{ gap: 18, marginTop: 18, justifyContent: 'space-around' }}>
            {['A', 'B', 'C'].map((k) => (<div key={k} className="center"><Ring pct={aim(k)} label={k} /><div className="tiny muted" style={{ marginTop: 6 }}>{t('home.aim', { k })}</div></div>))}
          </div>
          <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>{c(OUTCOMES.A)}</p>
        </div>
        <Link to={`/learn/${next.id}`} className="card interactive">
          <div className="eyebrow">{t('home.next')}</div>
          <h3>{c(next.title)}</h3>
          <p className="muted small">{c(next.summary)}</p>
          <div className="row wrap" style={{ gap: 6 }}><Chip>{t('learn.pages', { a: next.pages[0], b: next.pages[1] })}</Chip>{next.criteria.map((x) => <Chip key={x} className="mono">{x}</Chip>)}</div>
        </Link>
        <div className="card">
          <div className="eyebrow">{t('home.daily')}</div>
          <QuestionCard key={dq.id} q={dq} onAnswer={(ok) => { actions.answer(dq.id, ok); setDqDone(true); }} />
          {dqDone && <p className="tiny muted" style={{ marginTop: 8, marginBottom: 0 }}>{t('home.daily.back')}</p>}
        </div>
      </section>

      <section aria-label={t('home.features')} style={{ marginTop: 28 }}>
        <div className="grid c3">
          {features.map((f) => (
            <Link key={f.k} to={f.to} className="card interactive feature">
              <span className="feature-ic"><Icon name={f.icon} size={22} /></span>
              <h3>{t(`home.f.${f.k}.t`)}</h3><p className="muted small" style={{ marginBottom: 0 }}>{t(`home.f.${f.k}.d`)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
