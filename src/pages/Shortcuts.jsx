import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { SHORTCUT_CATEGORIES, SHORTCUTS } from '../../shared/content/shortcuts.js';
import { LESSONS } from '../../shared/content/lessons.js';
import { actions, useProgress } from '../store/progress.js';
import { Bar, Chip, Icon, PageHead, toast } from '../components/ui.jsx';
import { usePageContext } from '../assistant/pageContext.js';

function normalizeCode(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getExactTokens(code) {
  const raw = normalizeCode(code);
  const parts = raw
    .split(/\s*\/\s*|\s*\(\s*|\s*\)\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return Array.from(new Set([raw, ...parts]));
}

export default function Shortcuts() {
  const { t, c, lang, nf } = useI18n();
  const p = useProgress();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [filter, setFilter] = useState('all'); // all | unmastered | mastered
  const [view, setView] = useState('table'); // table | cards | flashcards
  const [fcIdx, setFcIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState(null);

  const isMastered = (id) => !!p.checks[`sc:${id}`];
  const masteredCount = useMemo(
    () => SHORTCUTS.filter((s) => p.checks[`sc:${s.id}`]).length,
    [p.checks]
  );

  const toggleMastered = (s) => {
    const next = !isMastered(s.id);
    actions.check(`sc:${s.id}`, next);
    if (next) toast(t('sc.xp'), 'check');
  };

  const filtered = useMemo(() => {
    const query = normalizeCode(q);
    const basePool = SHORTCUTS.filter((s) => {
      if (cat !== 'all' && s.cat !== cat) return false;
      if (filter === 'unmastered' && isMastered(s.id)) return false;
      if (filter === 'mastered' && !isMastered(s.id)) return false;
      return true;
    });

    if (!query) return basePool;

    // 1. Check if the user typed a complete, exact shortcut code (e.g., "LAN", "NAD", "WAN", "IEEE 802.11", "IP").
    // Prioritise standalone exact code matches so only that exact shortcut is shown by itself.
    const exactPrimary = basePool.filter((s) => normalizeCode(s.code) === query);
    if (exactPrimary.length > 0) {
      return [exactPrimary[0]];
    }

    // Check secondary sub-token exact match (if a code is "A / B" and no standalone existed)
    const exactToken = basePool.filter((s) => getExactTokens(s.code).includes(query));
    if (exactToken.length > 0) {
      return [exactToken[0]];
    }

    // Check exact full English name or exact Arabic title match
    const exactTitle = basePool.filter(
      (s) => normalizeCode(s.full) === query || normalizeCode(s.ar) === query
    );
    if (exactTitle.length === 1) {
      return exactTitle;
    }

    // 2. Otherwise (incomplete letters / partial search), return close matches ranked by closeness:
    // code prefix matches first, then code substring / word-prefix matches, then full/Arabic matches.
    const scored = [];
    for (const s of basePool) {
      const codeNorm = normalizeCode(s.code);
      const tokens = getExactTokens(s.code);
      const fullNorm = normalizeCode(s.full);
      const arNorm = normalizeCode(s.ar);
      const descAr = normalizeCode(s.desc?.ar);
      const descEn = normalizeCode(s.desc?.en);

      let score = 0;
      if (codeNorm.startsWith(query) || tokens.some((tk) => tk.startsWith(query))) {
        score = 100 - Math.abs(codeNorm.length - query.length);
      } else if (codeNorm.includes(query)) {
        score = 75 - Math.abs(codeNorm.length - query.length);
      } else if (fullNorm.split(/\s+/).some((w) => w.startsWith(query)) || arNorm.includes(query)) {
        score = 55;
      } else if (fullNorm.includes(query)) {
        score = 40;
      } else if (query.length >= 3 && (descAr.includes(query) || descEn.includes(query))) {
        score = 20;
      }

      if (score > 0) {
        scored.push({ s, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.s);
  }, [q, cat, filter, p.checks]);

  const activeCategories = useMemo(
    () => SHORTCUT_CATEGORIES.filter((cg) => cat === 'all' || cg.id === cat),
    [cat]
  );

  const currentCard = filtered[fcIdx] || filtered[0] || null;
  const modalShortcut = selectedShortcut && SHORTCUTS.find((s) => s.id === selectedShortcut.id);

  const getShortcutDetail = (shortcut) => {
    if (!shortcut) return null;

    const isArabic = lang === 'ar';
    const descText = isArabic ? (shortcut.desc?.ar || shortcut.ar || '') : (shortcut.desc?.en || shortcut.full || '');
    const meaningText = isArabic ? (shortcut.ar || '') : (shortcut.desc?.en || shortcut.full || '');
    const fullName = shortcut.full;

    const baseUseCase = shortcut.example
      ? c(shortcut.example)
      : isArabic
      ? `${shortcut.ar || ''} يُستخدم عند وصف شبكة أو نظام أو معيار تقني ضمن بيئة المؤسسة.`
      : `${shortcut.full} is used when describing a network, system, or technical standard within an organisation.`;

    return {
      summary: descText,
      meaning: meaningText,
      useCase: baseUseCase,
      comparison: shortcut.comparison
        ? c(shortcut.comparison)
        : isArabic
        ? `مقارنةً بـ ${shortcut.code === 'WAN' ? 'LAN' : 'WAN'}، يختلف هذا المصطلح في النطاق والوظيفة والتطبيق العملي.`
        : `Compared with ${shortcut.code === 'WAN' ? 'LAN' : 'WAN'}, this term differs in scope, role, and practical application.`,
      related: SHORTCUTS.filter((s) => s.cat === shortcut.cat && s.id !== shortcut.id).slice(0, 4).map((s) => s.code),
      full: descText,
      exam: isArabic
        ? `في إجابة الامتحان، اذكر أن ${fullName} يصف ${shortcut.ar || ''}، ثم اربطه بسياق المؤسسة أو الحالة المعطاة.`
        : `In an exam answer, state that ${fullName} describes ${shortcut.full}, then connect it to the scenario.`,
    };
  };

  const modalSectionLabels = {
    meaning: lang === 'ar' ? 'المعنى والشرح' : 'Meaning & explanation',
    useCase: lang === 'ar' ? 'أين يُستخدم / مثال عملي' : 'Where it is used / example',
    comparison: lang === 'ar' ? 'مقارنة سريعة' : 'Quick comparison',
    related: lang === 'ar' ? 'اختصارات ذات صلة في هذا القسم' : 'Related shortcuts in this section',
  };

  usePageContext({
    page: 'shortcuts',
    category: cat,
    filter,
    view,
    searchQuery: q,
    totalShortcuts: SHORTCUTS.length,
    masteredCount,
    matchingCount: filtered.length,
    sampleShortcuts: filtered.slice(0, 12).map((s) => ({
      code: s.code,
      full: s.full,
      ar: s.ar,
      desc: s.desc[lang] || s.desc.ar,
    })),
  });

  const selectedDetail = getShortcutDetail(modalShortcut);

  return (
    <div className="content wide">
      {modalShortcut && selectedDetail && (
        <div
          className="sc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sc-modal-title"
          onClick={() => {
            setSelectedShortcut(null);
          }}
        >
          <div className="sc-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="btn sm ghost sc-modal-close"
              onClick={() => setSelectedShortcut(null)}
              aria-label={t('common.close')}
            >
              <Icon name="x" size={16} />
            </button>

            <div className="sc-modal-header">
              <span className="sc-code-pill" dir="ltr">{modalShortcut.code}</span>
              <h3 id="sc-modal-title" dir="ltr">{modalShortcut.full}</h3>
              <div className="sc-modal-subtitle">{modalShortcut.ar}</div>
            </div>

            <div className="sc-modal-body sc-modal-body-structured">
              <div className="sc-modal-section sc-modal-summary">
                <div className="sc-modal-kicker">{modalSectionLabels.meaning}</div>
                <p>{selectedDetail.summary}</p>
              </div>

              <div className="sc-modal-section">
                <div className="sc-modal-kicker">{modalSectionLabels.useCase}</div>
                <p>{selectedDetail.useCase}</p>
              </div>

              <div className="sc-modal-section">
                <div className="sc-modal-kicker">{modalSectionLabels.comparison}</div>
                <p>{selectedDetail.comparison}</p>
              </div>

              <div className="sc-modal-section">
                <div className="sc-modal-kicker">{modalSectionLabels.related}</div>
                <div className="sc-related-list">
                  {(selectedDetail.related || []).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="sc-related-pill"
                      onClick={() => {
                        const nextShortcut = SHORTCUTS.find((s) => s.code === item);
                        if (nextShortcut) {
                          setSelectedShortcut(nextShortcut);
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sc-modal-actions">
              <button type="button" className={`btn ${isMastered(modalShortcut.id) ? '' : 'primary'}`} onClick={() => toggleMastered(modalShortcut)}>
                <Icon name="check" size={16} />
                {isMastered(modalShortcut.id) ? t('sc.saved') : t('sc.markSave')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setSelectedShortcut(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="learn-subnav" role="navigation" aria-label={t('nav.learn')}>
        <Link to="/learn" className="learn-subnav-link">
          <Icon name="book" size={18} />
          <span>{t('learn.title')}</span>
          <Chip>{nf(LESSONS.length)}</Chip>
        </Link>
        <Link to="/shortcuts" className="learn-subnav-link active" aria-current="page">
          <Icon name="tag" size={18} />
          <span>{t('sc.title')}</span>
          <Chip tone="accent">{nf(SHORTCUTS.length)}</Chip>
        </Link>
      </div>

      <PageHead eyebrow={t('sc.eyebrow')} title={t('sc.title')}>
        {t('sc.lead', { n: nf(SHORTCUTS.length) })}
      </PageHead>

      <div className="stack lg">
        <div className="card tight">
          <div className="row between wrap" style={{ marginBottom: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <Icon name="star" size={20} style={{ color: 'var(--accent)' }} />
              <b>{t('sc.progress')}</b>
            </div>
            <Chip tone={masteredCount === SHORTCUTS.length ? 'ok' : 'accent'}>
              {t('sc.masteredCount', { done: nf(masteredCount), total: nf(SHORTCUTS.length) })}
            </Chip>
          </div>
          <Bar pct={masteredCount / SHORTCUTS.length} label={t('sc.progress')} />
        </div>

        <div className="card tight stack">
          <div className="sc-toolbar">
            <div className="sc-search">
              <Icon name="search" size={18} className="sc-search-ic" />
              <input
                type="search"
                className="input"
                value={q}
                onChange={(e) => { setQ(e.target.value); setFcIdx(0); setFlipped(false); }}
                placeholder={t('sc.search')}
                aria-label={t('sc.search')}
              />
              {q && (
                <button className="btn sm ghost sc-clear" onClick={() => { setQ(''); setFcIdx(0); }}>
                  {t('common.clear')}
                </button>
              )}
            </div>

            <div className="seg" role="tablist" aria-label={t('sc.view')}>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'table'}
                onClick={() => setView('table')}
              >
                {t('sc.v.table')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'cards'}
                onClick={() => setView('cards')}
              >
                {t('sc.v.cards')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'flashcards'}
                onClick={() => { setView('flashcards'); setFcIdx(0); setFlipped(false); }}
              >
                {t('sc.v.flash')}
              </button>
            </div>
          </div>

          <div className="tabs" role="tablist" aria-label={t('sc.cats')}>
            <button
              type="button"
              role="tab"
              aria-selected={cat === 'all'}
              onClick={() => { setCat('all'); setFcIdx(0); setFlipped(false); }}
            >
              {t('sc.cat.all')} ({nf(SHORTCUTS.length)})
            </button>
            {SHORTCUT_CATEGORIES.map((cg) => {
              const count = SHORTCUTS.filter((s) => s.cat === cg.id).length;
              return (
                <button
                  key={cg.id}
                  type="button"
                  role="tab"
                  aria-selected={cat === cg.id}
                  onClick={() => { setCat(cg.id); setFcIdx(0); setFlipped(false); }}
                >
                  {c(cg.title)} ({nf(count)})
                </button>
              );
            })}
          </div>

          <div className="row between wrap" style={{ gap: 8 }}>
            <div className="row wrap" style={{ gap: 6 }}>
              {[
                ['all', 'sc.f.all'],
                ['unmastered', 'sc.f.unmastered'],
                ['mastered', 'sc.f.mastered'],
              ].map(([k, labelKey]) => (
                <button
                  key={k}
                  type="button"
                  className="btn sm"
                  aria-pressed={filter === k}
                  onClick={() => { setFilter(k); setFcIdx(0); setFlipped(false); }}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            <span className="small muted">
              {t('sc.showing', { n: nf(filtered.length), total: nf(SHORTCUTS.length) })}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card center" style={{ padding: '42px 20px' }}>
            <Icon name="search" size={32} style={{ color: 'var(--muted)', marginBottom: 8 }} />
            <h3 style={{ margin: '0 0 6px' }}>{t('sc.empty.t')}</h3>
            <p className="muted small" style={{ margin: '0 0 14px' }}>{t('sc.empty.d')}</p>
            <button
              type="button"
              className="btn sm"
              onClick={() => { setQ(''); setCat('all'); setFilter('all'); }}
            >
              {t('common.clear')}
            </button>
          </div>
        ) : view === 'flashcards' && currentCard ? (
          <section className="sc-flash-wrap" aria-label={t('sc.v.flash')}>
            <div className="card sc-flashcard">
              <div className="row between wrap">
                <Chip tone="accent">
                  {nf(fcIdx + 1)} / {nf(filtered.length)}
                </Chip>
                <div className="row" style={{ gap: 6 }}>
                  {currentCard.bookPage && (
                    <Chip>{t('sc.badge.page', { p: currentCard.bookPage })}</Chip>
                  )}
                  <Chip tone={isMastered(currentCard.id) ? 'ok' : ''}>
                    {isMastered(currentCard.id) ? t('sc.saved') : t('sc.unsaved')}
                  </Chip>
                </div>
              </div>

              <button
                type="button"
                className="sc-flash-body"
                onClick={() => setFlipped((f) => !f)}
              >
                <div className="sc-flash-code" dir="ltr">{currentCard.code}</div>
                <div className="sc-flash-full" dir="ltr">{currentCard.full}</div>
                {flipped ? (
                  <div className="sc-flash-answer">
                    <div className="sc-flash-ar">{currentCard.ar}</div>
                    <p className="sc-flash-desc">{c(currentCard.desc)}</p>
                  </div>
                ) : (
                  <div className="sc-flash-hint">
                    <Icon name="eye" size={16} />
                    <span>{t('sc.flip')}</span>
                  </div>
                )}
              </button>

              <div className="row between wrap" style={{ marginTop: 14 }}>
                <div className="row" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={fcIdx === 0}
                    onClick={() => { setFcIdx((i) => Math.max(0, i - 1)); setFlipped(false); }}
                  >
                    <Icon name="arrow" size={16} className="flip" />
                    {t('lesson.prev')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setFlipped((f) => !f)}
                  >
                    <Icon name="rotate" size={16} />
                    {t('sc.flipBtn')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={fcIdx >= filtered.length - 1}
                    onClick={() => { setFcIdx((i) => Math.min(filtered.length - 1, i + 1)); setFlipped(false); }}
                  >
                    {t('lesson.next')}
                    <Icon name="arrow" size={16} className="flip-rtl" />
                  </button>
                </div>

                <button
                  type="button"
                  className={`btn ${isMastered(currentCard.id) ? '' : 'primary'}`}
                  onClick={() => toggleMastered(currentCard)}
                >
                  <Icon name="check" size={16} />
                  {isMastered(currentCard.id) ? t('sc.saved') : t('sc.markSave')}
                </button>
              </div>
            </div>
          </section>
        ) : (
          activeCategories.map((cg) => {
            const items = filtered.filter((s) => s.cat === cg.id);
            if (!items.length) return null;
            const catMastered = items.filter((s) => isMastered(s.id)).length;
            return (
              <section key={cg.id} className="stack" aria-labelledby={`cat-${cg.id}`}>
                <div className="row between wrap">
                  <h2 id={`cat-${cg.id}`} className="sc-cat-title">
                    <Icon name={cg.icon} size={20} style={{ color: 'var(--accent)' }} />
                    <span>{c(cg.title)}</span>
                  </h2>
                  <Chip tone="accent">
                    {nf(catMastered)} / {nf(items.length)}
                  </Chip>
                </div>

                {view === 'table' ? (
                  <div className="card sc-table-wrap">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>{t('sc.col.code')}</th>
                          <th>{t('sc.col.full')}</th>
                          <th>{t('sc.col.ar')}</th>
                          <th>{t('sc.col.desc')}</th>
                          <th className="center">{t('sc.col.save')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((s) => {
                          const saved = isMastered(s.id);
                          return (
                            <tr key={s.id} className={saved ? 'is-saved' : ''}>
                              <td className="sc-td-code">
                                <span className="sc-code-pill" dir="ltr">{s.code}</span>
                              </td>
                              <td className="sc-td-full" dir="ltr">{s.full}</td>
                              <td className="sc-td-ar">{s.ar}</td>
                              <td className="sc-td-desc">
                                <div>{c(s.desc)}</div>
                                {s.bookPage && (
                                  <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                                    <Chip>{t('sc.badge.page', { p: s.bookPage })}</Chip>
                                  </div>
                                )}
                              </td>
                              <td className="sc-td-save center">
                                <button
                                  type="button"
                                  className={`btn sm icon ${saved ? 'primary' : 'ghost'}`}
                                  onClick={() => toggleMastered(s)}
                                  title={saved ? t('sc.saved') : t('sc.markSave')}
                                  aria-label={`${s.code} - ${saved ? t('sc.saved') : t('sc.markSave')}`}
                                >
                                  <Icon name="check" size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid auto">
                    {items.map((s) => {
                      const saved = isMastered(s.id);
                      return (
                        <article key={s.id} className={`card sc-card ${saved ? 'is-saved' : ''}`}>
                          <div className="row between" style={{ alignItems: 'flex-start' }}>
                            <button
                              type="button"
                              className="sc-card-open"
                              onClick={() => setSelectedShortcut(s)}
                            >
                              <span className="sc-code-pill" dir="ltr">{s.code}</span>
                              <span className="sc-card-full" dir="ltr">{s.full}</span>
                            </button>
                            <button
                              type="button"
                              className={`btn sm icon ${saved ? 'primary' : 'ghost'}`}
                              onClick={() => toggleMastered(s)}
                              title={saved ? t('sc.saved') : t('sc.markSave')}
                              aria-label={`${s.code} - ${saved ? t('sc.saved') : t('sc.markSave')}`}
                            >
                              <Icon name="check" size={16} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="sc-card-summary"
                            onClick={() => setSelectedShortcut(s)}
                          >
                            <span className="sc-card-ar">{s.ar}</span>
                            <span className="muted small">{c(s.desc)}</span>
                            <span className="sc-card-hint">
                              {t('sc.detail.open')}
                            </span>
                          </button>
                          {s.bookPage && (
                            <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                              <Chip>{t('sc.badge.page', { p: s.bookPage })}</Chip>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
