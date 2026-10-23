import React, { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { ASSETS, CHARACTERS } from '../config/assets.js';
import { S } from './strings.js';

/** shows one dialogue line (from the NPC or the player's own chosen line) and up to 4 reply choices */
export default function DialoguePanel({ line, onChoose, onContinue, onPlayVoice }) {
  const { c } = useI18n();
  const first = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea,button,a,select')) return;
      if (line.choices) { const n = parseInt(e.key, 10); if (n >= 1 && n <= line.choices.length) { e.preventDefault(); onChoose(n - 1); } }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onContinue(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [line, onChoose, onContinue]);
  useEffect(() => { first.current?.focus({ preventScroll: true }); }, [line]);
  const a = ASSETS[CHARACTERS[line.speaker]?.asset];
  return (
    <div className="st-dialogue" role="dialog" aria-live="polite" aria-label={c(a?.name)}>
      <div className="st-dbox">
        <img className="st-portrait" src={a?.file} alt={c(a?.name)} />
        <div>
          <div className="st-speaker-row">
            <div className="st-speaker">{c(a?.name)}{line.isPlayer ? ` · ${c(S.you)}` : ''}</div>
            <button className="st-btn sm" onClick={onPlayVoice} aria-label={c({ en: 'Play voice', ar: 'تشغيل الصوت' })} title={c({ en: 'Play voice', ar: 'تشغيل الصوت' })}>▶</button>
          </div>
          <div className="st-line">{c(line.text)}</div>
          {line.choices ? (
            <div className="st-choices" role="group" aria-label={c(S.choose)}>
              {line.choices.map((ch, i) => (
                <button key={i} ref={i === 0 ? first : null} className="st-choice" onClick={() => onChoose(ch.i)}><kbd>{i + 1}</kbd><span>{c(ch.text)}</span></button>
              ))}
            </div>
          ) : (
            <div className="st-dfoot"><small>{line.choices ? '' : 'Enter ↵'}</small><button ref={first} className="st-btn primary sm" onClick={onContinue}>{c(S.next)} ›</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
