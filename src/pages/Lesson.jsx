import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS, LESSON_BY_ID, OUTCOMES } from '../../shared/content/lessons.js';
import { QUESTIONS_BY_LESSON } from '../../shared/content/quizzes.js';
import { actions, useProgress } from '../store/progress.js';
import { Chip, Icon, toast } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';

export default function Lesson() {
  const { id } = useParams();
  const { t, c, lang, nf } = useI18n();
  const p = useProgress();
  const [qi, setQi] = useState(0);
  const lesson = LESSON_BY_ID[id];
  if (!lesson) return <Navigate to="/learn" replace />;
  const idx = LESSONS.indexOf(lesson);
  const prev = idx > 0 ? LESSONS[idx - 1] : null;
  const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
  const qs = QUESTIONS_BY_LESSON[id] || [];
  const done = !!p.lessons[id];

  return (
    <div className="content lesson">
      <nav className="small muted" aria-label="breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/learn">{t('nav.learn')}</Link> / <span>{c(OUTCOMES[lesson.outcome] || OUTCOMES.A)}</span>
      </nav>
      <header className="lesson-head">
        <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
          {lesson.topic && <Chip tone="accent" dir="ltr">{lesson.topic}</Chip>}
          <Chip>{t('learn.book', { a: lesson.pages[0], b: lesson.pages[1] })}</Chip>
          {(lesson.criteria || []).map((x) => <Chip key={x} className="mono">{x}</Chip>)}
        </div>
        <h1>{c(lesson.title)}</h1>
        {lesson.idea ? (
          <div className="callout tip" style={{ marginTop: 10 }}>
            <Icon name="bolt" />
            <div>
              <b>{lesson.idea}</b>
              <p style={{ margin: '4px 0 0' }}>{lesson.text}</p>
            </div>
          </div>
        ) : (
          <p className="lead">{c(lesson.summary)}</p>
        )}
      </header>
      <div className="lesson-grid">
        <div className="stack lg">
          <section aria-label={t('lesson.notes')}>
            <div className="stack">
              {lesson.points.map((pt, i) => (
                <div className="point card tight" key={i}>
                  <span className="point-no">{nf(i + 1)}</span>
                  <p style={{ margin: 0 }}>{c(pt)}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="callout tip">
            <Icon name="cap" />
            <div>
              <b>{t('lesson.exam')}</b>
              <br />
              {c(lesson.tip)}
            </div>
          </div>

          {qs.length > 0 && (
            <section aria-label={t('lesson.check')}>
              <h2>{t('lesson.check')}</h2>
              {qi < qs.length ? (
                <QuestionCard
                  key={qs[qi].id}
                  q={qs[qi]}
                  index={qi}
                  total={qs.length}
                  onAnswer={(ok) => actions.answer(qs[qi].id, ok)}
                  onNext={() => setQi(qi + 1)}
                  last={qi === qs.length - 1}
                />
              ) : (
                <div className="callout ok">
                  <Icon name="check" />
                  <div>
                    <b>{t('lesson.checkdone')}</b>{' '}
                    <button className="btn sm" style={{ marginInlineStart: 8 }} onClick={() => setQi(0)}>
                      {t('quiz.retry')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="row between wrap">
            <button
              className="btn primary lg"
              disabled={done}
              onClick={() => {
                actions.completeLesson(id);
                toast(t('lesson.xp'), 'check');
              }}
            >
              <Icon name="check" />
              {done ? t('lesson.completed') : t('lesson.complete')}
            </button>
            <div className="row">
              {prev && (
                <Link className="btn" to={`/learn/${prev.id}`}>
                  <Icon name="arrow" size={16} className="flip" />
                  {t('lesson.prev')}
                </Link>
              )}
              {next && (
                <Link className="btn" to={`/learn/${next.id}`}>
                  {t('lesson.next')}
                  <Icon name="arrow" size={16} className="flip-rtl" />
                </Link>
              )}
            </div>
          </div>
        </div>
        <aside className="stack">
          <div className="card tight">
            <h4>{t('lesson.terms')}</h4>
            <dl className="terms">
              {(lesson.terms || []).map(([en, ar]) => (
                <React.Fragment key={en}>
                  <dt>{lang === 'ar' ? ar : en}</dt>
                  <dd className="muted">{lang === 'ar' ? en : ar}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
          <Link to="/shortcuts" className="card tight interactive">
            <div className="row">
              <Icon name="tag" />
              <div>
                <b>{t('sc.title')}</b>
                <div className="small muted">{lang === 'ar' ? 'استعرض قاموس الاختصارات التقنية' : 'Browse technical shortcuts'}</div>
              </div>
            </div>
          </Link>
          <Link to="/lab" className="card tight interactive">
            <div className="row">
              <Icon name="network" />
              <div>
                <b>{t('lesson.trylab')}</b>
                <div className="small muted">{t('lesson.tryhint')}</div>
              </div>
            </div>
          </Link>
          <Link to="/assistant" className="card tight interactive">
            <div className="row">
              <Icon name="bot" />
              <div>
                <b>{t('lesson.ask')}</b>
                <div className="small muted">{t('lesson.askhint')}</div>
              </div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
