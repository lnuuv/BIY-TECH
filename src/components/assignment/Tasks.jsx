import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { LESSON_BY_ID } from '../../../shared/content/lessons.js';
import { actions, useProgress } from '../../store/progress.js';
import { Bar, Chip, Icon } from '../ui.jsx';
import { Bullets, CodeChip, Notice, Section, Src, cwLabel } from './parts.jsx';

export const activitiesOf = (result) => {
  const st = result.structure;
  return st.activities.length ? st.activities : [{ id: 'all', title: st.title || '', hours: null, requirements: [], deliverables: [], criteria: st.criteria.map((c) => c.code), commandWords: st.commandWords, quote: '', verified: false }];
};

function ActivityTabs({ acts, value, onChange }) {
  const { t, nf } = useI18n();
  if (acts.length < 2) return null;
  return (<div className="tabs" role="tablist" style={{ marginBottom: 14 }}>{acts.map((a, i) => <button key={a.id} role="tab" aria-selected={value === a.id} onClick={() => onChange(a.id)}>{/^\d+$/.test(a.id) ? t('asg.activity', { n: nf(a.id) }) : `${i + 1}`}</button>)}</div>);
}

export function CriteriaCard({ result }) {
  const { t } = useI18n();
  const { criteria } = result.structure; const acts = activitiesOf(result);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t('asg.crit.t')} <Src kind="doc" /></h3>
      {!criteria.length ? <p className="muted">{t('asg.crit.none')}</p> : (
        <ul className="asg-crit">
          {criteria.map((cr) => {
            const used = acts.filter((a) => a.criteria.includes(cr.code));
            return (
              <li key={cr.code}>
                <CodeChip code={cr.code} />
                <div className="grow">
                  <div className="tiny muted">{t(`asg.crit.level.${cr.level}`)}</div>
                  {cr.text && <div dir="auto">{cr.text}</div>}
                  {used.length > 0 && <div className="tiny muted" style={{ marginTop: 2 }}>{t('asg.crit.used')}: {used.map((a) => (/^\d+$/.test(a.id) ? t('asg.activity', { n: a.id }) : a.title)).join(' · ')}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LessonLinks({ ids, whyBy }) {
  const p = useProgress(); const { c } = useI18n();
  const valid = ids.filter((id) => LESSON_BY_ID[id]);
  if (!valid.length) return null;
  return (<div className="stack" style={{ gap: 6 }}>{valid.map((id) => (<Link key={id} to={`/learn/${id}`} className="part-btn asg-lesson"><i className={p.lessons[id] ? 'dot seen' : 'dot'} /><span className="grow"><b>{c(LESSON_BY_ID[id].title)}</b>{whyBy[id] && <span className="tiny muted" style={{ display: 'block' }}>{whyBy[id]}</span>}</span></Link>))}</div>);
}

export function Tasks({ result, initial }) {
  const { t, nf, lang } = useI18n();
  const acts = activitiesOf(result);
  const [id, setId] = useState(acts.find((a) => a.id === initial)?.id || acts[0].id);
  const a = acts.find((x) => x.id === id) || acts[0];
  const g = result.guidance.activities[a.id];
  const basic = result.mode === 'basic';
  const whyBy = Object.fromEntries((g?.lessons || []).map((l) => [l.lessonId, l.why]));
  const title = /^\d+$/.test(a.id) ? `${t('asg.activity', { n: nf(a.id) })} — ${a.title}` : a.title;
  const cwNotes = g?.commandWordNotes || [];

  return (
    <div className="stack lg">
      <CriteriaCard result={result} />
      <ActivityTabs acts={acts} value={a.id} onChange={setId} />
      <div className="card">
        <div className="row between wrap"><h2 style={{ margin: 0 }} dir="auto">{title}</h2>{a.hours && <Chip>{t('asg.hours', { n: nf(a.hours) })}</Chip>}</div>
        <div className="row wrap" style={{ gap: 6, margin: '10px 0' }}>{a.criteria.map((x) => <CodeChip key={x} code={x} />)}{a.commandWords.map((w) => <Chip key={w} className="cw" dir="auto">{cwLabel(w, lang)}</Chip>)}</div>
        {a.quote ? <p className="asg-quote" dir="auto"><span className="tiny muted">{t('asg.t.quote')}: </span>“{a.quote}”</p> : (!a.synthetic && a.id !== 'all' && !basic && <p className="tiny muted">{t('asg.t.unverified')}</p>)}
        {!g && <Notice tone="warn" icon="info">{basic ? t('asg.t.nogen') : t('asg.t.noguide')}</Notice>}
        {g?.firstStep && <div className="asg-first"><div className="row" style={{ gap: 8 }}><Icon name="bolt" size={18} /><b>{t('asg.t.first')}</b><Src kind="ai" /></div><p dir="auto">{g.firstStep}</p></div>}
        <div className="stack" style={{ gap: 8, marginTop: 12 }}>
          {(a.requirements.length > 0 || a.deliverables.length > 0) && (
            <Section title={t('asg.t.asks')} src="doc" open>
              <Bullets items={a.requirements} />
              {a.deliverables.length > 0 && <><h5 className="asg-h5">{t('asg.t.deliv')}</h5><Bullets items={a.deliverables} /></>}
            </Section>
          )}
          {g?.plainExplanation && <Section title={t('asg.t.plain')} src="ai" open><p dir="auto" style={{ margin: 0 }}>{g.plainExplanation}</p></Section>}
          {g?.whatToInvestigate?.length > 0 && <Section title={t('asg.t.invest')} src="ai"><Bullets items={g.whatToInvestigate} /></Section>}
          {g?.conceptsNeeded?.length > 0 && <Section title={t('asg.t.concepts')} src="gen"><div className="row wrap" style={{ gap: 6 }}>{g.conceptsNeeded.map((x) => <Chip key={x} dir="auto">{x}</Chip>)}</div></Section>}
          {cwNotes.length > 0 && <Section title={t('asg.t.cw')} src="gen"><ul className="facts">{cwNotes.map((n) => <li key={n.word}><b dir="auto">{cwLabel(n.word, lang)}</b> — {n.meaning}</li>)}</ul></Section>}
          {g?.criteriaMeaning?.length > 0 && <Section title={t('asg.t.crit')} src="ai"><ul className="facts">{g.criteriaMeaning.map((m) => <li key={m.code}><CodeChip code={m.code} /> {m.meaning}</li>)}</ul></Section>}
          {g?.evidence?.length > 0 && <Section title={t('asg.t.evidence')} src="ai"><Bullets items={g.evidence} /></Section>}
          {g?.startingStructure?.length > 0 && <Section title={t('asg.t.struct')} src="ai"><ol className="facts">{g.startingStructure.map((x, i) => <li key={i}>{x}</li>)}</ol></Section>}
          {g?.starterQuestions?.length > 0 && <Section title={t('asg.t.questions')} src="ai"><Bullets items={g.starterQuestions} /></Section>}
          {g?.pitfalls?.length > 0 && <Section title={t('asg.t.pitfalls')} src="ai"><Bullets items={g.pitfalls} /></Section>}
          {g?.lessons?.length > 0 && <Section title={t('asg.t.lessons')} src="ai" open><LessonLinks ids={g.lessons.map((l) => l.lessonId)} whyBy={whyBy} /></Section>}
        </div>
      </div>
    </div>
  );
}

export function Plan({ result }) {
  const { t, nf } = useI18n();
  const p = useProgress();
  const acts = activitiesOf(result);
  const [id, setId] = useState(acts[0].id);
  const a = acts.find((x) => x.id === id) || acts[0];
  const items = result.guidance.activities[a.id]?.checklist || [];
  const keyOf = (i) => `asg:${result.id}:${a.id}:${i}`;
  const done = items.filter((_, i) => p.checks[keyOf(i)]).length;
  const review = result.guidance.global?.reviewChecklist || [];
  return (
    <div className="stack lg">
      <ActivityTabs acts={acts} value={a.id} onChange={setId} />
      <div className="card">
        <div className="row between wrap"><h3 style={{ margin: 0 }}>{t('asg.plan')} <Src kind="doc" /></h3><span className="tiny muted">{t('asg.c.progress', { done: nf(done), n: nf(items.length) })}</span></div>
        {items.length > 0 && <div style={{ margin: '10px 0' }}><Bar pct={done / items.length} label={t('asg.plan')} /></div>}
        {!items.length ? <p className="muted">{t('asg.c.empty')}</p> : (
          <ul className="checks">{items.map((it, i) => { const key = keyOf(i); return (<li key={key}><label className="check"><input type="checkbox" checked={!!p.checks[key]} onChange={(e) => actions.check(key, e.target.checked)} /><span dir="auto">{it.text}{it.criteria && <> <CodeChip code={it.criteria} /></>}</span></label></li>); })}</ul>
        )}
        <p className="tiny muted" style={{ marginBottom: 0 }}>{t('asg.plan.hint')}</p>
      </div>
      {review.length > 0 && (
        <div className="card"><h4 style={{ marginTop: 0 }}>{t('asg.c.review')} <Src kind="ai" /></h4>
          <ul className="checks">{review.map((x, i) => { const key = `asg:${result.id}:review:${i}`; return (<li key={key}><label className="check"><input type="checkbox" checked={!!p.checks[key]} onChange={(e) => actions.check(key, e.target.checked)} /><span dir="auto">{x}</span></label></li>); })}</ul>
        </div>
      )}
    </div>
  );
}
