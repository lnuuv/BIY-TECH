import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { SOFTWARE_TOPIC, SOFTWARE_SECTIONS, SOFTWARE_NEEDS } from '../../shared/content/softwareTopic.js';
import { LESSON_BY_ID } from '../../shared/content/lessons.js';
import { QUESTIONS_BY_LESSON } from '../../shared/content/quizzes.js';
import { actions } from '../store/progress.js';
import { Chip, Icon } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import LearnSubnav from '../components/LearnSubnav.jsx';

/** in-page jumps without touching the URL hash (the app may run on a HashRouter) */
const jump = (e, id) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
const CHECK = [...(QUESTIONS_BY_LESSON.software || []), ...(QUESTIONS_BY_LESSON.files || [])];

function Section({ s, n, open, onToggle }) {
  const { t, c, lang } = useI18n();
  const regionId = `sw-more-${s.id}`;
  return (
    <section id={`sw-${s.id}`} className={`card sw-sec ${open ? 'is-open' : ''}`} aria-labelledby={`sw-h-${s.id}`}>
      <header className="sw-sec-head">
        <span className="sw-sec-no" aria-hidden="true">{String(n).padStart(2, '0')}</span>
        <div className="grow">
          <h2 id={`sw-h-${s.id}`}>{c(s.title)}</h2>
          <div className="row wrap" style={{ gap: 6 }}><Chip>{t('learn.pages', { a: s.pages[0], b: s.pages[1] })}</Chip></div>
        </div>
        <span className="feature-ic sw-sec-ic" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
      </header>
      <p className="sw-summary">{c(s.core.summary)}</p>
      <ul className="sw-points">{s.core.points.map((p, i) => <li key={i}>{c(p)}</li>)}</ul>
      <button type="button" className="btn sm sw-toggle" aria-expanded={open} aria-controls={regionId} onClick={onToggle}>
        <Icon name="chevron" size={15} className="sw-chev" />{t(open ? 'sc.detail.close' : 'sc.detail.open')}
      </button>
      {open && (
        <div id={regionId} className="sw-more" role="region" aria-label={t('sw.more')}>
          <div className="sw-block">
            <div className="sw-kicker">{t('sc.detail.explanation')}</div>
            {s.more.paras.map((p, i) => <p key={i}>{c(p)}</p>)}
          </div>
          <div className="sw-block sw-apply">
            <div className="sw-kicker">{t('sw.apply')}</div>
            <p>{c(s.more.org)}</p>
          </div>
          <div className="sw-block">
            <div className="sw-kicker">{t('sc.detail.exam')}</div>
            <p>{c(s.more.exam)}</p>
          </div>
          <div className="sw-terms">
            <span className="sw-kicker">{t('lesson.terms')}</span>
            {s.terms.map(([en, ar]) => <span key={en} className="chip"><b>{lang === 'ar' ? ar : en}</b><span className="muted" lang={lang === 'ar' ? 'en' : 'ar'}>· {lang === 'ar' ? en : ar}</span></span>)}
          </div>
        </div>
      )}
    </section>
  );
}

export default function SoftwareTopic() {
  const { t, c } = useI18n();
  const [open, setOpen] = useState(() => new Set());
  const [qi, setQi] = useState(0);
  const all = open.size === SOFTWARE_SECTIONS.length;
  const toggle = (id) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const T = SOFTWARE_TOPIC;
  return (
    <div className="content sw-topic">
      <LearnSubnav active="software" />
      <nav className="small muted" aria-label="breadcrumb" style={{ marginBottom: 12 }}><Link to="/learn">{t('nav.learn')}</Link> / <span>{c(T.title)}</span></nav>
      <header className="lesson-head">
        <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
          <Chip tone="accent">{t('learn.book', { a: T.pages[0], b: T.pages[1] })}</Chip>
          {T.criteria.map((x) => <Chip key={x} className="mono">{x}</Chip>)}
        </div>
        <div className="eyebrow">{t('sw.eyebrow')}</div>
        <h1>{c(T.title)}</h1>
        <p className="lead">{c(T.lead)}</p>
      </header>

      <div className="lesson-grid">
        <div className="stack lg">
          <div className="callout tip"><Icon name="cap" /><div>{c(T.aim)}</div></div>

          <div className="row between wrap">
            <h2 style={{ margin: 0, fontSize: 19 }}>{t('sw.core')}</h2>
            <button type="button" className="btn sm" aria-pressed={all} onClick={() => setOpen(all ? new Set() : new Set(SOFTWARE_SECTIONS.map((s) => s.id)))}>
              <Icon name="explode" size={15} />{t(all ? 'sw.collapseAll' : 'sw.expandAll')}
            </button>
          </div>
          {SOFTWARE_SECTIONS.map((s, i) => <Section key={s.id} s={s} n={i + 1} open={open.has(s.id)} onToggle={() => toggle(s.id)} />)}

          <section className="card" aria-labelledby="sw-needs">
            <h2 id="sw-needs" style={{ marginTop: 0 }}>{t('sw.needs.t')}</h2>
            <p className="muted small">{t('sw.needs.d')}</p>
            <div className="sw-table-wrap">
              <table className="sw-table">
                <thead><tr><th>{t('sw.col.need')}</th><th>{t('sw.col.who')}</th><th>{t('sw.col.sw')}</th></tr></thead>
                <tbody>{SOFTWARE_NEEDS.map((r, i) => (
                  <tr key={i}><td>{c(r.need)}</td><td>{c(r.who)}</td><td><a href={`#sw-${r.sec}`} onClick={(e) => jump(e, `sw-${r.sec}`)}>{c(r.sw)}</a></td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          {CHECK.length > 0 && (
            <section aria-label={t('lesson.check')}>
              <h2>{t('lesson.check')}</h2>
              {qi < CHECK.length ? (
                <QuestionCard key={CHECK[qi].id} q={CHECK[qi]} index={qi} total={CHECK.length} onAnswer={(ok) => actions.answer(CHECK[qi].id, ok)} onNext={() => setQi(qi + 1)} last={qi === CHECK.length - 1} />
              ) : (
                <div className="callout ok"><Icon name="check" /><div><b>{t('lesson.checkdone')}</b> <button className="btn sm" style={{ marginInlineStart: 8 }} onClick={() => setQi(0)}>{t('quiz.retry')}</button></div></div>
              )}
            </section>
          )}
        </div>

        <aside className="stack sw-aside">
          <nav className="card tight" aria-label={t('sw.toc')}>
            <h4>{t('sw.toc')}</h4>
            <ol className="sw-toc">{SOFTWARE_SECTIONS.map((s) => <li key={s.id}><a href={`#sw-${s.id}`} onClick={(e) => jump(e, `sw-${s.id}`)}>{c(s.title)}</a></li>)}<li><a href="#sw-needs" onClick={(e) => jump(e, 'sw-needs')}>{t('sw.needs.t')}</a></li></ol>
          </nav>
          {['software', 'files'].map((id) => LESSON_BY_ID[id] && (
            <Link key={id} to={`/learn/${id}`} className="card tight interactive"><div className="row"><Icon name="book" /><div><b>{c(LESSON_BY_ID[id].title)}</b><div className="small muted">{t('sw.shortLesson')}</div></div></div></Link>
          ))}
          <Link to="/assistant" className="card tight interactive"><div className="row"><Icon name="bot" /><div><b>{t('lesson.ask')}</b><div className="small muted">{t('lesson.askhint')}</div></div></div></Link>
        </aside>
      </div>
    </div>
  );
}
