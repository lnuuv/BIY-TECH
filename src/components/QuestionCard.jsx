import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { LESSON_BY_ID } from '../../shared/content/lessons.js';
import { Icon } from './ui.jsx';

/** Multiple-choice question with instant feedback. Options are shuffled once per question instance. */
export default function QuestionCard({ q, index, total, onAnswer, onNext, last, timeLimit }) {
  const { t, c } = useI18n();
  const [remaining, setRemaining] = useState(timeLimit);
  const [expired, setExpired] = useState(false);
  const answerRef = useRef(onAnswer);
  const doneRef = useRef(false);
  answerRef.current = onAnswer;
  const order = useMemo(() => {
    if (q.optionOrder) return q.optionOrder;
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState(null);
  const done = picked !== null;
  const ok = done && picked === q.ans;
  doneRef.current = done;
  useEffect(() => {
    if (!timeLimit) return undefined;
    let left = timeLimit;
    let submitted = false;
    setRemaining(timeLimit);
    setExpired(false);
    const timer = window.setInterval(() => {
      if (doneRef.current || submitted) {
        window.clearInterval(timer);
        return;
      }
      left -= 1;
      setRemaining(left);
      if (left <= 0) {
        submitted = true;
        window.clearInterval(timer);
        setExpired(true);
        setPicked(-1);
        answerRef.current?.(false);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [q.id, timeLimit]);
  const choose = (i) => { if (done) return; setPicked(i); onAnswer?.(i === q.ans); };
  const lesson = LESSON_BY_ID[q.lesson];
  return (
    <div className={`qcard ${done ? (ok ? 'is-ok' : 'is-bad') : ''}`}>
      <div className="row between small muted" style={{ marginBottom: 8 }}>
        {total ? <span>{t('quiz.qof', { n: index + 1, m: total })}</span> : <span />}
        {lesson && <span className="chip">{c(lesson.title)}</span>}
        {timeLimit && <span className={`chip quiz-countdown ${remaining <= 5 ? 'warn' : ''}`} role="timer" aria-live="off">{t('quiz.timer', { seconds: remaining })}</span>}
      </div>
      {timeLimit && <div className="quiz-timer-track" aria-hidden="true"><i className={remaining <= 5 ? 'urgent' : ''} style={{ width: `${Math.max(0, (remaining / timeLimit) * 100)}%` }} /></div>}
      <h3 id={`q-${q.id}`} className="qtext">{c(q.q)}</h3>
      <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="opts">
        {order.map((oi, n) => {
          const state = !done ? '' : oi === q.ans ? 'right' : oi === picked ? 'wrong' : 'dim';
          return (
            <button key={oi} role="radio" aria-checked={picked === oi} className={`opt ${state}`} onClick={() => choose(oi)} disabled={done} aria-disabled={done}>
              <span className="opt-key">{String.fromCharCode(65 + n)}</span><span className="grow">{c(q.options[oi])}</span>
              {state === 'right' && <Icon name="check" size={18} />}{state === 'wrong' && <Icon name="x" size={18} />}
            </button>
          );
        })}
      </div>
      {done && (
        <div className={`callout ${ok ? 'ok' : 'bad'} fb`} role="status">
          <Icon name={ok ? 'check' : 'info'} />
          <div><b>{expired ? t('quiz.timeup') : ok ? t('quiz.correct') : t('quiz.wrong')}</b> {c(q.exp)}</div>
        </div>
      )}
      {done && onNext && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}><button className="btn primary" onClick={onNext}>{last ? t('quiz.finish') : t('quiz.next')}<Icon name="arrow" size={16} className="flip-rtl" /></button></div>}
    </div>
  );
}
