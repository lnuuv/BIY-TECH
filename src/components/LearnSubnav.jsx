import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS } from '../../shared/content/lessons.js';
import { SHORTCUTS } from '../../shared/content/shortcuts.js';
import { SOFTWARE_SECTIONS } from '../../shared/content/softwareTopic.js';
import { Chip, Icon } from './ui.jsx';

/** Sub-navigation shared by the Learn pages: lessons · Software topic · shortcuts glossary */
export default function LearnSubnav({ active }) {
  const { t, nf } = useI18n();
  const items = [
    ['lessons', '/learn', 'book', t('learn.title'), LESSONS.length],
    ['software', '/learn/topic/software', 'cube', t('sw.nav'), SOFTWARE_SECTIONS.length],
    ['shortcuts', '/shortcuts', 'tag', t('sc.title'), SHORTCUTS.length],
  ];
  return (
    <div className="learn-subnav" role="navigation" aria-label={t('nav.learn')}>
      {items.map(([k, to, icon, label, n]) => (
        <Link key={k} to={to} className={`learn-subnav-link ${active === k ? 'active' : ''}`} aria-current={active === k ? 'page' : undefined}>
          <Icon name={icon} size={18} /><span>{label}</span><Chip tone={active === k ? 'accent' : ''}>{nf(n)}</Chip>
        </Link>
      ))}
    </div>
  );
}
