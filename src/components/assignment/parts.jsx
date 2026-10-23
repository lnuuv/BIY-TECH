import React from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { COMMAND_WORDS } from '../../../shared/content/assignment.js';
import { Chip, Icon } from '../ui.jsx';

const CW = Object.fromEntries(COMMAND_WORDS.map((w) => [w.id, w]));
/** canonical ids (explain, evaluate…) are shown in the interface language; words quoted from the document are shown as written */
export const cwLabel = (word, lang) => (CW[word] ? (lang === 'ar' ? `${CW[word].ar} (${CW[word].en})` : CW[word].en) : word);

/** where a piece of content comes from: the student's document, AI guidance, a general explanation, or an example */
export function Src({ kind }) {
  const { t } = useI18n();
  const icon = { doc: 'doc', ai: 'bot', gen: 'book', example: 'info', notfound: 'search' }[kind] || 'info';
  return <span className={`asg-src ${kind}`}><Icon name={icon} size={12} stroke={2} />{t(`asg.src.${kind}`)}</span>;
}

export function Section({ title, src, children, open = false, count }) {
  return (
    <details className="asg-det" open={open}>
      <summary><span className="grow">{title}{count != null && <span className="muted tiny"> ({count})</span>}</span>{src && <Src kind={src} />}<Icon name="chevron" size={16} className="chev" /></summary>
      <div className="asg-det-body">{children}</div>
    </details>
  );
}

export const Bullets = ({ items }) => (items?.length ? <ul className="facts">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : null);

export const levelTone = (code) => { const l = (code.split('.')[1] || '')[0]; return l === 'D' ? 'warn' : l === 'M' ? 'accent' : ''; };
export const CodeChip = ({ code }) => <Chip tone={levelTone(code)} className="mono">{code}</Chip>;

export function Notice({ tone = 'tip', icon = 'info', children, actions }) {
  return (<div className={`callout ${tone}`}><Icon name={icon} /><div className="grow">{children}{actions && <div className="row wrap" style={{ marginTop: 8 }}>{actions}</div>}</div></div>);
}
