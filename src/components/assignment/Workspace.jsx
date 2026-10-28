import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { LESSON_BY_ID } from '../../../shared/content/lessons.js';
import { useProgress } from '../../store/progress.js';
import { Chip, Icon } from '../ui.jsx';
import { Bullets, Notice, Section, Src } from './parts.jsx';
import { activitiesOf, Plan, Tasks } from './Tasks.jsx';
import { CommandWords, Practice } from './Practice.jsx';

function Overview({ result, goTask }) {
  const { t, nf } = useI18n();
  const { structure: st, guidance } = result; const g = guidance.global; const sc = st.scenario;
  const acts = activitiesOf(result);
  return (
    <div className="stack lg">
      <div className="card">
        <div className="row between wrap"><h2 style={{ margin: 0 }} dir="auto">{st.title || t('asg.title')}</h2><Chip>{t('asg.ov.counts', { a: nf(st.activities.length), c: nf(st.criteria.length) })}</Chip></div>
        <div className="row wrap tiny muted" style={{ gap: 12, margin: '8px 0 12px' }}>
          {st.organisation && <span><b>{t('asg.ov.org')}:</b> <span dir="auto">{st.organisation}</span></span>}
          {st.subject && <span><b>{t('asg.ov.subject')}:</b> <span dir="auto">{st.subject}</span></span>}
        </div>
        {g?.summaryPlain && <><h4 className="asg-h5">{t('asg.ov.summary')} <Src kind="ai" /></h4><p dir="auto" style={{ marginTop: 4 }}>{g.summaryPlain}</p></>}
        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          {sc.summary && <Section title={t('asg.ov.doc')} src="doc" open={!g?.summaryPlain}><p dir="auto" style={{ margin: 0 }}>{sc.summary}</p></Section>}
          {sc.needs.length > 0 && <Section title={t('asg.ov.needs')} src="doc" count={sc.needs.length}><Bullets items={sc.needs} /></Section>}
          {sc.stakeholders.length > 0 && <Section title={t('asg.ov.stake')} src="doc" count={sc.stakeholders.length}><ul className="facts">{sc.stakeholders.map((s, i) => <li key={i}><b dir="auto">{s.name}</b>{s.need && <> — <span dir="auto">{s.need}</span></>}</li>)}</ul></Section>}
          {sc.background.length > 0 && <Section title={t('asg.ov.background')} src="doc"><Bullets items={sc.background} /></Section>}
          {sc.constraints.length > 0 && <Section title={t('asg.ov.constraints')} src="doc"><Bullets items={sc.constraints} /></Section>}
          {st.evidenceRequired.length > 0 && <Section title={t('asg.ov.evidence')} src="doc"><Bullets items={st.evidenceRequired} /></Section>}
          {g?.keyFacts?.length > 0 && <Section title={t('asg.ov.facts')} src="ai"><Bullets items={g.keyFacts} /></Section>}
        </div>
      </div>
      {acts.length > 0 && (
        <div className="card"><h3 style={{ marginTop: 0 }}>{t('asg.tab.tasks')}</h3>
          <div className="stack" style={{ gap: 8 }}>{acts.map((a) => (
            <button key={a.id} className="asg-act" onClick={() => goTask(a.id)}>
              <span className="grow" dir="auto"><b>{/^\d+$/.test(a.id) ? t('asg.activity', { n: nf(a.id) }) + ' — ' : ''}{a.title}</b>{guidance.activities[a.id]?.firstStep && <span className="tiny muted" style={{ display: 'block' }} dir="auto">{guidance.activities[a.id].firstStep}</span>}</span>
              <span className="row wrap" style={{ gap: 4 }}>{a.criteria.slice(0, 4).map((c) => <Chip key={c} className="mono">{c}</Chip>)}</span><Icon name="chevron" size={16} />
            </button>))}</div>
        </div>
      )}
      {(st.missing.length > 0 || st.ambiguities.length > 0) && (
        <div className="card">
          {st.missing.length > 0 && <><h4 style={{ marginTop: 0 }}>{t('asg.ov.missing')} <Src kind="notfound" /></h4><Bullets items={st.missing} /></>}
          {st.ambiguities.length > 0 && <><h4>{t('asg.ov.ambig')}</h4><Bullets items={st.ambiguities} /></>}
        </div>
      )}
    </div>
  );
}

function Lessons({ result }) {
  const { t, c } = useI18n(); const p = useProgress();
  const acts = activitiesOf(result); const gaps = result.guidance.global?.knowledgeGaps || [];
  const title = (id) => { const a = acts.find((x) => x.id === id); return a ? (/^\d+$/.test(a.id) ? t('asg.activity', { n: a.id }) : a.title) : ''; };
  return (
    <div className="stack lg">
      {!result.lessons.length && <Notice icon="info">{t('asg.l.none')}</Notice>}
      {result.lessons.length > 0 && (
        <div className="grid c2">
          {result.lessons.filter((l) => LESSON_BY_ID[l.id]).map((l) => (
            <Link key={l.id} to={`/learn/${l.id}`} className="card interactive tight">
              <div className="row" style={{ gap: 8 }}><i className={p.lessons[l.id] ? 'dot seen' : 'dot'} /><b className="grow">{c(LESSON_BY_ID[l.id].title)}</b><Icon name="chevron" size={16} /></div>
              {l.why ? <p className="small" style={{ margin: '8px 0 4px' }} dir="auto"><b>{t('asg.l.why')}: </b>{l.why}</p> : <p className="small muted" style={{ margin: '8px 0 4px' }}>{l.matchedBy === 'criteria' ? t('asg.l.match.criteria') : t('asg.l.match.search')}{l.criteria?.length ? ` (${l.criteria.join(', ')})` : ''}</p>}
              <div className="row wrap tiny muted" style={{ gap: 6 }}>{l.source === 'ai' ? <Src kind="ai" /> : null}{l.activities.length > 0 && <span>{t('asg.l.for', { acts: l.activities.map(title).join(' · ') })}</span>}</div>
            </Link>
          ))}
        </div>
      )}
      {gaps.length > 0 && (
        <div className="card"><h3 style={{ marginTop: 0 }}>{t('asg.l.gaps')} <Src kind="gen" /></h3>
          <ul className="facts">{gaps.map((x, i) => <li key={i}><b dir="auto">{x.topic}</b> — <span dir="auto">{x.explanation}</span></li>)}</ul></div>
      )}
    </div>
  );
}

function More({ result }) {
  const { t } = useI18n(); const g = result.guidance.global;
  const acts = activitiesOf(result);
  const empty = !g || !(g.terminology.length || g.commonMistakes.length || g.reportStructure.length || g.evidenceTips.length || g.studyPlan.length);
  if (empty) return <div className="card"><p className="muted" style={{ margin: 0 }}>{t('asg.m.none')}</p></div>;
  const actName = (id) => { const a = acts.find((x) => x.id === id); return a ? (/^\d+$/.test(a.id) ? t('asg.activity', { n: a.id }) : a.title) : ''; };
  return (
    <div className="stack lg">
      {g.studyPlan.length > 0 && <div className="card"><h3 style={{ marginTop: 0 }}>{t('asg.m.study')} <Src kind="ai" /></h3><ol className="facts">{g.studyPlan.map((s, i) => <li key={i}><b dir="auto">{s.step}</b>{s.focus && <> — <span dir="auto">{s.focus}</span></>}{s.activityId && <> <Chip>{actName(s.activityId)}</Chip></>}</li>)}</ol></div>}
      <div className="grid c2">
        {g.reportStructure.length > 0 && <div className="card tight"><h4 style={{ marginTop: 0 }}>{t('asg.m.report')} <Src kind="ai" /></h4><ol className="facts">{g.reportStructure.map((x, i) => <li key={i}>{x}</li>)}</ol></div>}
        {g.evidenceTips.length > 0 && <div className="card tight"><h4 style={{ marginTop: 0 }}>{t('asg.m.evidence')} <Src kind="ai" /></h4><Bullets items={g.evidenceTips} /></div>}
        {g.commonMistakes.length > 0 && <div className="card tight"><h4 style={{ marginTop: 0 }}>{t('asg.m.mistakes')} <Src kind="ai" /></h4><Bullets items={g.commonMistakes} /></div>}
      </div>
      {g.terminology.length > 0 && <div className="card"><h3 style={{ marginTop: 0 }}>{t('asg.m.terms')} <Src kind="gen" /></h3><dl className="asg-terms">{g.terminology.map((x, i) => <React.Fragment key={i}><dt dir="auto">{x.term}</dt><dd dir="auto">{x.meaning}</dd></React.Fragment>)}</dl></div>}
    </div>
  );
}

const TABS = ['overview', 'tasks', 'lessons', 'plan', 'practice', 'words', 'more'];
export default function Workspace({ result, tab, setTab, taskId, setTaskId }) {
  const { t } = useI18n();
  const files = [...new Set((result.refs || []).map((r) => r.file))].slice(0, 3);
  return (
    <div className="stack lg">
      <div className="tabs" role="tablist" aria-label={t('asg.title')}>{TABS.map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`asg.tab.${k}`)}</button>)}</div>
      <div role="tabpanel">
        {tab === 'overview' && <Overview result={result} goTask={(id) => { setTaskId(id); setTab('tasks'); }} />}
        {tab === 'tasks' && <Tasks key={taskId} result={result} initial={taskId} />}
        {tab === 'lessons' && <Lessons result={result} />}
        {tab === 'plan' && <Plan result={result} />}
        {tab === 'practice' && <Practice result={result} />}
        {tab === 'words' && <CommandWords result={result} />}
        {tab === 'more' && <More result={result} />}
      </div>
      {files.length > 0 && result.mode === 'ai' && <p className="tiny muted" dir="auto">{t('asg.m.refs', { files: files.join(', ') })}</p>}
    </div>
  );
}
