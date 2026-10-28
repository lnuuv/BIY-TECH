import React from 'react';
import { useI18n } from '../i18n/index.jsx';
import { Icon } from './ui.jsx';

export default function MinimizeButton({ minimized, onToggle }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="btn sm icon ghost panel-minimize"
      onClick={onToggle}
      aria-expanded={!minimized}
      aria-label={t(minimized ? 'panel.restore' : 'panel.minimize')}
      title={t(minimized ? 'panel.restore' : 'panel.minimize')}
    >
      <Icon name={minimized ? 'maximize' : 'minimize'} size={15} />
    </button>
  );
}
