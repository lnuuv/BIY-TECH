import React, { useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS } from '../../shared/content/lessons.js';
import { QUIZ_BANK } from '../../shared/content/quizzes.js';
import { createQuizSet } from '../../shared/quiz-session.js';
import { actions, useProgress } from '../store/progress.js';
import { Icon, PageHead, Ring, toast } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function Practice() {
  const { t, c, nf } = useI18n();
  const prog = useProgress();
  const [session, setSession] = useState(null);
  const [flow, setFlow] = useState(null);
  const [stage, setStage] = useState('lesson');
  const [lessonId, setLessonId] = useState('all');
  const [difficulty, setDifficulty] = useState('easy');
  const [mode, setMode] = useState('mixed');
  const [weakCount, setWeakCount] = useState(null);
  const previousSequence = useRef([]);
  const previousOptions = useRef({});

  const weakByDifficulty = useMemo(() => {
    const weak = { easy: new Set(), hard: new Set() };
    for (const [id, answer] of Object.entries(prog.answers || {})) {
      if (answer?.byDifficulty?.easy === false) weak.easy.add(id);
      if (answer?.byDifficulty?.hard === false) weak.hard.add(id);
    }
    return weak;
  }, [prog.answers]);
  const weakQuestions = useMemo(() => ({
    all: QUIZ_BANK.filter((question) => weakByDifficulty.easy.has(question.id) || weakByDifficulty.hard.has(question.id)),
    easy: QUIZ_BANK.filter((question) => weakByDifficulty.easy.has(question.id)),
    hard: QUIZ_BANK.filter((question) => weakByDifficulty.hard.has(question.id)),
  }), [weakByDifficulty]);
  const weakCountOptions = useMemo(() => {
    const build = (total) => {
      if (!total) return [];
      if (total <= 10) return [total];
      const options = [10];
      if (total >= 15) options.push(15);
      for (const step of [20, 30, 50, 100, 200]) {
        if (total >= step && !options.includes(step)) options.push(step);
      }
      if (!options.includes(total)) options.push(total);
      return [...new Set(options.filter((n) => n > 0 && n <= total))].sort((a, b) => a - b);
    };
    return {
      easy: build(weakQuestions.easy.length),
      hard: build(weakQuestions.hard.length),
    };
  }, [weakQuestions]);
  const answered = Object.values(prog.answers).length;
  const right = Object.values(prog.answers).filter((answer) => answer.best).length;

  const startSet = (source = 'lesson', overrides = {}) => {
    const targetDifficulty = overrides.difficulty || difficulty;
    const weakIds = source === 'weak'
      ? (overrides.weakIds || Array.from(weakByDifficulty[targetDifficulty] || []))
      : weakQuestions.all.map((question) => question.id);
    const settings = {
      lessonId,
      mode,
      difficulty,
      source,
      weakIds,
      ...overrides,
    };
    if (source === 'weak') {
      settings.count = Math.min(settings.count || weakIds.length, weakIds.length || Number.MAX_SAFE_INTEGER);
    }
    const questions = createQuizSet(settings);
    if (!questions.length) {
      toast(t('quiz.none'), 'info');
      return;
    }

    const sequence = questions.map((question) => question.id);
    if (sequence.length > 1 && sequence.every((id, i) => id === previousSequence.current[i])) {
      questions.push(questions.shift());
    }
    previousSequence.current = questions.map((question) => question.id);
    const randomized = questions.map((question) => {
      const order = shuffle(question.options.map((_, i) => i));
      const previous = previousOptions.current[question.id];
      if (previous && order.every((index, i) => index === previous[i])) order.push(order.shift());
      previousOptions.current[question.id] = order;
      return { ...question, optionOrder: order };
    });
    setSession({
      qs: randomized,
      i: 0,
      results: [],
      seconds: settings.difficulty === 'hard' ? 15 : 30,
      source: settings.source,
      lessonId: settings.lessonId,
      mode: settings.mode,
      difficulty: settings.difficulty,
      weakIds: settings.weakIds,
    });
  };

  const startFreshRound = () => {
    actions.quizRun();
    startSet(session.source, {
      lessonId: session.lessonId,
      mode: session.mode,
      difficulty: session.difficulty,
      weakIds: session.weakIds,
      count: session.qs.length,
      excludeIds: session.qs.map((question) => question.id),
    });
  };

  const beginWeakRound = (selectedDifficulty) => {
    const nextWeakIds = Array.from(weakByDifficulty[selectedDifficulty] || []);
    if (!nextWeakIds.length) {
      toast(t('quiz.none'), 'info');
      return;
    }
    const options = weakCountOptions[selectedDifficulty] || [nextWeakIds.length];
    setDifficulty(selectedDifficulty);
    setWeakCount(options[0] || nextWeakIds.length);
    setStage('questions');
  };

  if (session && session.i >= session.qs.length) {
    const ok = session.results.filter(Boolean).length;
    const total = session.qs.length;
    const pct = ok / total;
    const by = {};
    session.qs.forEach((question, index) => {
      if (!question.lesson) return;
      (by[question.lesson] ||= { ok: 0, n: 0 }).n++;
      if (session.results[index]) by[question.lesson].ok++;
    });
    return (
      <div className="content">
        <div className="card result">
          <Ring pct={pct} size={120} stroke={10} label={`${ok}/${total}`} />
          <h1 style={{ marginTop: 16 }}>{t(pct >= 0.8 ? 'quiz.r.great' : pct >= 0.5 ? 'quiz.r.good' : 'quiz.r.keep')}</h1>
          <p className="muted">{t('quiz.r.score', { ok, total })}</p>
          <div className="grid c2" style={{ textAlign: 'start', marginTop: 12 }}>
            {Object.entries(by).map(([id, value]) => {
              const lesson = LESSONS.find((item) => item.id === id);
              return lesson && (
                <div key={id} className="row between card tight flat">
                  <span className="small">{c(lesson.title)}</span>
                  <span className={`chip ${value.ok === value.n ? 'ok' : 'warn'}`}>{value.ok}/{value.n}</span>
                </div>
              );
            })}
          </div>
          <div className="row wrap quiz-result-actions">
            <button className="btn quiz-change-level" onClick={() => { setSession(null); setStage('difficulty'); }}>
              <Icon name="arrow" size={16} />{t('quiz.changeDifficulty')}
            </button>
            <button className="btn quiz-fresh-round" onClick={startFreshRound}>
              <Icon name="reset" size={16} />{t('quiz.freshRound')}
            </button>
            <button className="btn primary" onClick={() => { actions.quizRun(); setSession(null); setFlow(null); }}>
              {t('quiz.again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    const question = session.qs[session.i];
    const recordAnswer = (correct) => {
      actions.answer(question.id, correct, session.difficulty);
      setSession((current) => ({ ...current, results: [...current.results, correct] }));
    };
    return (
      <div className="content quiz-run">
        <div className="row between" style={{ marginBottom: 12 }}>
          <button className="btn sm ghost" onClick={() => setSession(null)}><Icon name="x" size={15} />{t('quiz.exit')}</button>
          <span className="chip">{nf(session.i + 1)}/{nf(session.qs.length)}</span>
        </div>
        <div className="bar" style={{ marginBottom: 18 }}><i style={{ width: `${(session.i / session.qs.length) * 100}%` }} /></div>
        <div className="card">
          <QuestionCard
            key={`${question.id}-${session.i}`}
            q={question}
            index={session.i}
            total={session.qs.length}
            timeLimit={session.seconds}
            onAnswer={recordAnswer}
            onNext={() => setSession((current) => ({ ...current, i: current.i + 1 }))}
            last={session.i === session.qs.length - 1}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <PageHead eyebrow={t('quiz.eyebrow')} title={t('quiz.title')}>{t('quiz.lead')}</PageHead>

      {!flow ? (
        <div className="grid c2 quiz-entry-grid">
          <button className="card interactive mode quiz-entry" onClick={() => { setFlow('lesson'); setStage('lesson'); setDifficulty('easy'); setMode('mixed'); setLessonId('all'); }}>
            <span className="feature-ic"><Icon name="book" size={22} /></span>
            <h2>{t('quiz.entry.lesson')}</h2>
            <p className="muted">{t('quiz.entry.lesson.d')}</p>
            <span className="btn primary">{t('quiz.entry.start')}</span>
          </button>
          <button className="card interactive mode quiz-entry" onClick={() => { setFlow('weak'); setStage('difficulty'); setDifficulty('easy'); setMode('mixed'); }}>
            <span className="feature-ic"><Icon name="reset" size={22} /></span>
            <h2>{t('quiz.entry.weak')} <span className="chip warn">{nf(weakQuestions.all.length)}</span></h2>
            <p className="muted">{t('quiz.entry.weak.d')}</p>
            <span className="btn">{t('quiz.entry.start')}</span>
          </button>
        </div>
      ) : (
        <section className={`card quiz-builder quiz-stage-${stage}`} aria-labelledby="quiz-builder-title">
          <div className="row between wrap">
            <div>
              <div className="eyebrow">{t(`quiz.builder.step.${stage}`)}</div>
              <h2 id="quiz-builder-title">{t(stage === 'lesson' ? 'quiz.builder.lesson' : stage === 'difficulty' ? 'quiz.builder.difficulty' : 'quiz.builder.questions')}</h2>
              <p className="muted quiz-stage-lead">{t(stage === 'lesson' ? 'quiz.builder.lesson.d' : stage === 'difficulty' ? 'quiz.builder.difficulty.d' : 'quiz.builder.questions.d')}</p>
            </div>
            <button className="btn sm ghost" onClick={() => {
              if (flow === 'weak' || stage === 'lesson') setFlow(null);
              else setStage(stage === 'questions' ? 'difficulty' : 'lesson');
            }}><Icon name="arrow" size={16} className="flip" />{t(stage === 'lesson' || flow === 'weak' && stage === 'difficulty' ? 'quiz.exit' : 'quiz.back')}</button>
          </div>

          {stage === 'lesson' ? (
            <>
              <label className="quiz-lesson-label" htmlFor="quiz-lesson">{t('quiz.builder.lesson')}</label>
              <select id="quiz-lesson" className="input quiz-lesson-select" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
                <option value="all">{t('quiz.builder.allLessons')}</option>
                {LESSONS.map((lesson) => <option key={lesson.id} value={lesson.id}>{c(lesson.title)}</option>)}
              </select>
              <div className="row between wrap quiz-builder-footer">
                <span className="small muted">{t('quiz.builder.lesson.hint')}</span>
                <button className="btn primary lg" onClick={() => setStage('difficulty')}><Icon name="arrow" size={17} className="flip" />{t('quiz.continue')}</button>
              </div>
            </>
          ) : null}

          {stage === 'difficulty' ? (
            <>
              {flow === 'weak' && <div className="callout warn quiz-weak-summary"><Icon name="reset" /><div><b>{t('quiz.entry.weak')}</b><p style={{ margin: '4px 0 0' }}>{t('quiz.entry.weak.scope', { count: nf(weakQuestions.all.length) })}</p></div></div>}
              <div className="grid c2 quiz-difficulties">
                {[
                  ['easy', 'quiz.difficulty.easy', '30', '12', '01'],
                  ['hard', 'quiz.difficulty.hard', '15', '20', '02'],
                ].map(([id, label, seconds, count, number]) => (
                  <button
                    key={id}
                    className={`card quiz-choice difficulty-choice difficulty-${id}`}
                    onClick={() => {
                      if (flow === 'weak') {
                        beginWeakRound(id);
                        return;
                      }
                      setDifficulty(id);
                      setStage('questions');
                    }}
                    disabled={flow === 'weak' && weakQuestions[id].length === 0}
                  >
                    <span className="difficulty-orb" aria-hidden="true" />
                    <span className="difficulty-number">{number}</span>
                    <span className="difficulty-kicker">{t(`quiz.difficulty.${id}.tag`)}</span>
                    <b>{t(label)}</b>
                    <span className="small muted">{t(`${label}.d`)}</span>
                    <span className="difficulty-meta"><span>{t('quiz.builder.questionCount', { count: nf(Number(count)) })}</span><span>{t('quiz.builder.time', { seconds: nf(Number(seconds)) })}</span></span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {stage === 'questions' ? (
            <>
              {flow === 'weak' ? (
                <>
                  <h3 className="quiz-section-title">{t('quiz.builder.questionCount', { count: nf(weakQuestions[difficulty].length) })}</h3>
                  <div className="grid c3 quiz-modes">
                    {(weakCountOptions[difficulty] || [weakQuestions[difficulty].length]).map((countOption) => (
                      <button key={countOption} className={`card quiz-choice question-set-choice ${weakCount === countOption ? 'selected' : ''}`} aria-pressed={weakCount === countOption} onClick={() => setWeakCount(countOption)}>
                        <span className="question-set-index">{nf(countOption)}</span>
                        <span className="feature-ic"><Icon name="list" size={20} /></span>
                        <b>{nf(countOption)}</b>
                        <span className="small muted">{t('quiz.builder.questionCount', { count: nf(countOption) })}</span>
                      </button>
                    ))}
                  </div>
                  <div className="row between wrap quiz-builder-footer">
                    <span className="small muted">{t('quiz.builder.questionCount', { count: nf(weakCount || weakQuestions[difficulty].length) })} · {t('quiz.builder.time', { seconds: nf(difficulty === 'hard' ? 15 : 30) })}</span>
                    <button className="btn primary lg" onClick={() => startSet('weak', { difficulty, mode: 'mixed', count: weakCount || weakQuestions[difficulty].length, weakIds: Array.from(weakByDifficulty[difficulty] || []) })}>
                      <Icon name="play" size={17} />{t('quiz.start')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="quiz-section-title">{t('quiz.builder.mode')}</h3>
                  <div className="grid c3 quiz-modes">
                    {[
                      ['book', 'quiz.mode.book', 'book'],
                      ['mixed', 'quiz.mode.mixed', 'bolt'],
                      ['shortcuts', 'quiz.mode.shortcuts', 'tag'],
                    ].map(([id, label, icon], index) => {
                      const availableWeak = flow !== 'weak' || createQuizSet({
                        source: 'weak', mode: id, lessonId: 'all', weakIds: weakQuestions.all.map((question) => question.id), count: 1,
                      }).length > 0;
                      return (
                        <button key={id} className={`card quiz-choice question-set-choice ${mode === id ? 'selected' : ''}`} aria-pressed={mode === id} disabled={!availableWeak} onClick={() => setMode(id)}>
                          <span className="question-set-index">{nf(index + 1)}</span>
                          <span className="feature-ic"><Icon name={icon} size={20} /></span>
                          <b>{t(label)}</b>
                          <span className="small muted">{t(`${label}.d`)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="row between wrap quiz-builder-footer">
                    <span className="small muted">{t('quiz.builder.questionCount', { count: nf(difficulty === 'hard' ? 20 : 12) })} · {t('quiz.builder.time', { seconds: nf(difficulty === 'hard' ? 15 : 30) })}</span>
                    <button className="btn primary lg" disabled={flow === 'weak' && weakQuestions.all.length === 0} onClick={() => startSet(flow === 'weak' ? 'weak' : 'lesson', { difficulty, mode, count: difficulty === 'hard' ? 20 : 12 })}>
                      <Icon name="play" size={17} />{t('quiz.start')}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : null}
        </section>
      )}

      {!flow && <div className="card quiz-bank" style={{ marginTop: 20 }}>
        <h3>{t('quiz.stats')}</h3>
        <div className="row wrap" style={{ gap: 28 }}>
          <div><b style={{ fontSize: 28 }}>{nf(answered)}</b><div className="small muted">{t('quiz.s.answered')}</div></div>
          <div><b style={{ fontSize: 28 }}>{nf(right)}</b><div className="small muted">{t('quiz.s.mastered')}</div></div>
          <div><b style={{ fontSize: 28 }}>{nf(QUIZ_BANK.length)}</b><div className="small muted">{t('quiz.s.bank')}</div></div>
        </div>
      </div>}
    </div>
  );
}
