import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS } from '../../shared/content/lessons.js';
import { SHORTCUTS } from '../../shared/content/shortcuts.js';
import {
  bookSummary,
  commData,
  cloudData,
  securityData,
  compareItems,
  comparePresets,
  slideSummaries,
  summaryGroups,
} from '../../shared/content/indexHtmlStudy.js';
import { actions, useProgress } from '../store/progress.js';
import { Bar, Chip, Icon, PageHead, toast } from '../components/ui.jsx';

const COMM_LABELS = {
  overview: 'نظرة عامة على الاتصال والشبكات',
  networkTypes: 'أنواع الشبكات (LAN / WAN / PAN / MAN)',
  topologies: 'طوبولوجيا الشبكات (Star / Mesh / Bus / Ring)',
  devices: 'أجهزة الشبكة (Router / Switch / AP / Modem)',
  media: 'وسائط النقل السلكية (UTP / STP / Coaxial / Fiber)',
  wireless: 'الاتصالات اللاسلكية (Wi-Fi / Bluetooth / NFC / Cellular)',
  internet: 'بنية الإنترنت ومزودو الخدمة (ISP)',
  addressing: 'العنونة (IPv4 / IPv6 / MAC / DHCP / NAT)',
  tcpip: 'نموذج TCP/IP وطبقاته',
  osi: 'نموذج OSI ذو الطبقات السبع',
  protocols: 'بروتوكولات الشبكة (HTTP/HTTPS/FTP/SMTP/DNS)',
  website: 'كيف يعمل الموقع الإلكتروني والـ URL',
  performance: 'عوامل أداء الشبكة (Bandwidth / Latency / Jitter)',
  connections: 'تقنيات الاتصال بالإنترنت (FTTH / FTTC / DSL / 5G)',
  commands: 'أوامر فحص الشبكة (ping / ipconfig / tracert / nslookup)',
  troubleshooting: 'استكشاف أخطاء الشبكة وإصلاحها',
};

const CLOUD_LABELS = {
  intro: 'مقدمة في الحوسبة السحابية',
  traits: 'الخصائص الأساسية للسحابة',
  models: 'نماذج الخدمة (IaaS / PaaS / SaaS)',
  stack: 'طبقات المسؤولية والتحكم في السحابة',
  deploy: 'نماذج النشر (عامة / خاصة / هجينة / مجتمعية)',
  storage: 'التخزين السحابي ومزامنة الملفات',
  compare: 'مقارنة السحابة بالبنية المحلية (On-Premises)',
  benefits: 'فوائد ومزايا الحوسبة السحابية للمؤسسات',
  risks: 'المخاطر والتحديات والاعتماد على الإنترنت',
};

const SEC_LABELS = {
  intro: 'مقدمة في أمن المعلومات والبيانات',
  flow: 'مسار الحماية والدفاع متعدد الطبقات',
  firewall: 'الجدار الناري (Firewall) وفحص الحزم',
  antivirus: 'مضادات الفيروسات والحماية من البرمجيات الخبيثة',
  malware: 'أنواع البرمجيات الضارة (Virus / Worm / Trojan / Ransomware)',
  more: 'التصيد الاحتيالي والهندسة الاجتماعية والتشفير',
  classify: 'تصنيف التهديدات وإجراءات الوقاية والسياسات',
};

export function SoftwareStudySection() {
  return null;
}

export default function Learn() {
  const { t, c, nf, lang } = useI18n();
  const isAr = lang === 'ar';
  const p = useProgress();

  const [section, setSection] = useState('book'); // book | comm | cloud | security | compare | slides
  const [q, setQ] = useState('');
  const [expandedLessons, setExpandedLessons] = useState(() => new Set(['lesson-1']));
  const [commKey, setCommKey] = useState('overview');
  const [cloudKey, setCloudKey] = useState('intro');
  const [secKey, setSecKey] = useState('intro');
  const [cmpA, setCmpA] = useState(compareItems[0]?.id || 'os');
  const [cmpB, setCmpB] = useState(compareItems[1]?.id || 'app');
  const [cmpNote, setCmpNote] = useState('');

  const doneCount = LESSONS.filter((l) => p.lessons[l.id]).length;

  const filteredLessons = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return LESSONS;
    return LESSONS.filter((l) => {
      const inTitle = l.title.ar.toLowerCase().includes(query) || l.title.en.toLowerCase().includes(query);
      const inSummary = l.summary.ar.toLowerCase().includes(query);
      const inPoints = l.points.some((pt) => pt.ar.toLowerCase().includes(query));
      return inTitle || inSummary || inPoints;
    });
  }, [q]);

  const toggleLessonExpand = (id) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itemA = compareItems.find((x) => x.id === cmpA) || compareItems[0];
  const itemB = compareItems.find((x) => x.id === cmpB) || compareItems[1];

  return (
    <div className="content wide">
      {/* Sub-navigation: Only Lessons and Shortcuts (Software tab removed) */}
      <div className="learn-subnav" role="navigation" aria-label={t('nav.learn')}>
        <Link to="/learn" className="learn-subnav-link active" aria-current="page">
          <Icon name="book" size={18} />
          <span>{t('learn.title')}</span>
          <Chip tone="accent">{nf(LESSONS.length)}</Chip>
        </Link>
        <Link to="/shortcuts" className="learn-subnav-link">
          <Icon name="tag" size={18} />
          <span>{t('sc.title')}</span>
          <Chip>{nf(SHORTCUTS.length)}</Chip>
        </Link>
      </div>

      <PageHead
        eyebrow={isAr ? 'المرجع الدراسي الشامل — الوحدة الأولى' : 'Comprehensive Study Guide — Unit 1'}
        title={t('learn.title')}
      >
        {isAr
          ? 'جميع الدروس والشروحات التفصيلية للأنظمة، والشبكات والاتصالات، والحوسبة السحابية، وأمن المعلومات، والمقارنات التفاعلية.'
          : 'Complete interactive lessons covering Systems, Networking & Communications, Cloud Computing, Information Security, and side-by-side comparisons.'}
      </PageHead>

      <div className="stack lg">
        {/* Progress Card */}
        <div className="card tight">
          <div className="row between wrap" style={{ marginBottom: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <Icon name="book" size={20} style={{ color: 'var(--accent)' }} />
              <b>{isAr ? 'تقدمك في إتمام الدروس' : 'Your Lesson Completion Progress'}</b>
            </div>
            <Chip tone={doneCount === LESSONS.length ? 'ok' : 'accent'}>
              {nf(doneCount)} / {nf(LESSONS.length)}
            </Chip>
          </div>
          <Bar pct={doneCount / LESSONS.length} label={t('learn.title')} />
        </div>

        {/* Study Module Tabs */}
        <div className="card tight stack">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={section === 'book'}
              onClick={() => setSection('book')}
            >
              📘 {isAr ? `شرح دروس الكتاب (${nf(bookSummary.length)})` : `Book Lessons (${bookSummary.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'comm'}
              onClick={() => setSection('comm')}
            >
              🌐 {isAr ? 'الشبكات والاتصالات' : 'Networks & Comms'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'cloud'}
              onClick={() => setSection('cloud')}
            >
              ☁️ {isAr ? 'الحوسبة والتخزين السحابي' : 'Cloud & Storage'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'security'}
              onClick={() => setSection('security')}
            >
              🛡️ {isAr ? 'الأمان والتهديدات والسياسات' : 'Security & Policies'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'compare'}
              onClick={() => setSection('compare')}
            >
              ⚖️ {isAr ? 'المقارنات التفاعلية' : 'Interactive Comparisons'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'slides'}
              onClick={() => setSection('slides')}
            >
              📑 {isAr ? `ملخصات الشرائح (${nf(slideSummaries.length)})` : `Slide Summaries (${slideSummaries.length})`}
            </button>
          </div>

          {section === 'book' && (
            <div className="row between wrap" style={{ gap: 10 }}>
              <div className="sc-search" style={{ flex: 1 }}>
                <Icon name="search" size={18} className="sc-search-ic" />
                <input
                  type="search"
                  className="input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={isAr ? 'ابحث في عناوين الدروس والنقاط التفصيلية...' : 'Search lesson titles and points...'}
                />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => setExpandedLessons(new Set(LESSONS.map((l) => l.id)))}
                >
                  {isAr ? 'فتح كل الشروحات' : 'Expand All'}
                </button>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setExpandedLessons(new Set())}
                >
                  {isAr ? 'طي الكل' : 'Collapse All'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: BOOK LESSONS */}
        {section === 'book' && (
          <div className="stack lg">
            {filteredLessons.map((l, idx) => {
              const isOpen = expandedLessons.has(l.id);
              const isDone = !!p.lessons[l.id];
              return (
                <article key={l.id} className={`card stack ${isDone ? 'done' : ''}`}>
                  <div className="row between wrap" style={{ gap: 10 }}>
                    <div className="row wrap" style={{ gap: 8 }}>
                      <span className="lesson-no">{String(idx + 1).padStart(2, '0')}</span>
                      <Chip tone="accent" dir="ltr">{l.topic}</Chip>
                      <Chip>{isAr ? `صفحة ${l.pages[0]}` : `Page ${l.pages[0]}`}</Chip>
                      {isDone && (
                        <Chip tone="ok">
                          <Icon name="check" size={14} /> {isAr ? 'مكتمل' : 'Completed'}
                        </Chip>
                      )}
                    </div>
                    <div className="row wrap" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => toggleLessonExpand(l.id)}
                      >
                        <Icon name="book" size={15} />
                        {isOpen ? (isAr ? 'إخفاء النقاط' : 'Hide Points') : (isAr ? `عرض النقاط (${nf(l.points.length)})` : `Show Points (${l.points.length})`)}
                      </button>
                      <Link to={`/learn/${l.id}`} className="btn sm primary">
                        {isAr ? 'صفحة الدرس والاختبار' : 'Open Lesson'}
                        <Icon name="arrow" size={15} className="flip-rtl" />
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>{l.title.ar}</h3>
                    <div className="callout tip" style={{ marginBottom: 10 }}>
                      <Icon name="bolt" />
                      <div>
                        <b>{l.idea}</b>
                        <p style={{ margin: '4px 0 0' }}>{l.text}</p>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="stack" style={{ gap: 8 }}>
                      {l.points.map((pt, pi) => (
                        <div key={pi} className="point card tight flat" style={{ background: 'var(--surface-2)' }}>
                          <span className="point-no">{nf(pi + 1)}</span>
                          <p style={{ margin: 0 }}>{c(pt)}</p>
                        </div>
                      ))}
                      <div className="row between wrap" style={{ marginTop: 6 }}>
                        <button
                          type="button"
                          className={`btn sm ${isDone ? '' : 'primary'}`}
                          onClick={() => {
                            actions.completeLesson(l.id);
                            toast(t('lesson.xp'), 'check');
                          }}
                        >
                          <Icon name="check" size={15} />
                          {isDone ? t('lesson.completed') : t('lesson.complete')}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* SECTION 2: NETWORKS & COMMUNICATIONS (commData) */}
        {section === 'comm' && (
          <div className="grid" style={{ gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 16, alignItems: 'start' }}>
            <div className="card tight stack" style={{ gap: 6 }}>
              <b className="small muted">{isAr ? 'موضوعات الشبكات والاتصالات' : 'Networking Topics'}</b>
              {Object.keys(commData).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn sm ${commKey === k ? 'primary' : 'ghost'}`}
                  style={{ justifyContent: 'flex-start', textAlign: 'start' }}
                  onClick={() => setCommKey(k)}
                >
                  {COMM_LABELS[k] || k}
                </button>
              ))}
            </div>
            <div className="card stack">
              <Chip tone="accent">{COMM_LABELS[commKey] || commKey}</Chip>
              <h3 style={{ margin: 0, fontSize: 22 }}>{commData[commKey]?.idea}</h3>
              <p className="lead">{commData[commKey]?.text}</p>
              <div className="stack" style={{ gap: 8 }}>
                {(commData[commKey]?.points || []).map((pt, i) => (
                  <div key={i} className="point card tight flat" style={{ background: 'var(--surface-2)' }}>
                    <span className="point-no">{nf(i + 1)}</span>
                    <p style={{ margin: 0 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: CLOUD COMPUTING & STORAGE (cloudData) */}
        {section === 'cloud' && (
          <div className="grid" style={{ gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 16, alignItems: 'start' }}>
            <div className="card tight stack" style={{ gap: 6 }}>
              <b className="small muted">{isAr ? 'موضوعات الحوسبة السحابية' : 'Cloud Topics'}</b>
              {Object.keys(cloudData).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn sm ${cloudKey === k ? 'primary' : 'ghost'}`}
                  style={{ justifyContent: 'flex-start', textAlign: 'start' }}
                  onClick={() => setCloudKey(k)}
                >
                  {CLOUD_LABELS[k] || k}
                </button>
              ))}
            </div>
            <div className="card stack">
              <Chip tone="accent">{CLOUD_LABELS[cloudKey] || cloudKey}</Chip>
              <h3 style={{ margin: 0, fontSize: 22 }}>{cloudData[cloudKey]?.idea}</h3>
              <p className="lead">{cloudData[cloudKey]?.text}</p>
              <div className="stack" style={{ gap: 8 }}>
                {(cloudData[cloudKey]?.points || []).map((pt, i) => (
                  <div key={i} className="point card tight flat" style={{ background: 'var(--surface-2)' }}>
                    <span className="point-no">{nf(i + 1)}</span>
                    <p style={{ margin: 0 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SECURITY & POLICIES (securityData) */}
        {section === 'security' && (
          <div className="grid" style={{ gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 16, alignItems: 'start' }}>
            <div className="card tight stack" style={{ gap: 6 }}>
              <b className="small muted">{isAr ? 'موضوعات أمن المعلومات' : 'Security Topics'}</b>
              {Object.keys(securityData).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn sm ${secKey === k ? 'primary' : 'ghost'}`}
                  style={{ justifyContent: 'flex-start', textAlign: 'start' }}
                  onClick={() => setSecKey(k)}
                >
                  {SEC_LABELS[k] || k}
                </button>
              ))}
            </div>
            <div className="card stack">
              <Chip tone="accent">{SEC_LABELS[secKey] || secKey}</Chip>
              <h3 style={{ margin: 0, fontSize: 22 }}>{securityData[secKey]?.idea}</h3>
              <p className="lead">{securityData[secKey]?.text}</p>
              <div className="stack" style={{ gap: 8 }}>
                {(securityData[secKey]?.points || []).map((pt, i) => (
                  <div key={i} className="point card tight flat" style={{ background: 'var(--surface-2)' }}>
                    <span className="point-no">{nf(i + 1)}</span>
                    <p style={{ margin: 0 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: INTERACTIVE COMPARISONS (compareItems & comparePresets) */}
        {section === 'compare' && (
          <div className="stack lg">
            <div className="card stack">
              <h3 style={{ margin: 0 }}>{isAr ? 'مقارنات سريعة جاهزة للامتحان' : 'Quick Exam Comparisons'}</h3>
              <div className="row wrap" style={{ gap: 8 }}>
                {comparePresets.map(([a, b, summary], idx) => {
                  const ia = compareItems.find((x) => x.id === a);
                  const ib = compareItems.find((x) => x.id === b);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`btn sm ${cmpA === a && cmpB === b ? 'primary' : ''}`}
                      onClick={() => {
                        setCmpA(a);
                        setCmpB(b);
                        setCmpNote(summary);
                      }}
                    >
                      {ia?.ar || a} ⚡ {ib?.ar || b}
                    </button>
                  );
                })}
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="small muted">{isAr ? 'العنصر الأول' : 'First Concept'}</span>
                  <select className="input" value={cmpA} onChange={(e) => { setCmpA(e.target.value); setCmpNote(''); }}>
                    {compareItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.ar} ({it.en})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="small muted">{isAr ? 'العنصر الثاني' : 'Second Concept'}</span>
                  <select className="input" value={cmpB} onChange={(e) => { setCmpB(e.target.value); setCmpNote(''); }}>
                    {compareItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.ar} ({it.en})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {cmpNote && (
                <div className="callout tip">
                  <Icon name="bolt" />
                  <div>
                    <b>{isAr ? 'الفرق الجوهري:' : 'Key Distinction:'}</b> {cmpNote}
                  </div>
                </div>
              )}

              {itemA && itemB && (
                <div className="sc-table-wrap" style={{ maxHeight: 'none' }}>
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th>{isAr ? 'وجه المقارنة' : 'Aspect'}</th>
                        <th>{itemA.ar} ({itemA.en})</th>
                        <th>{itemB.ar} ({itemB.en})</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>{isAr ? 'التعريف' : 'Definition'}</b></td>
                        <td>{itemA.def}</td>
                        <td>{itemB.def}</td>
                      </tr>
                      <tr>
                        <td><b>{isAr ? 'الدور والوظيفة' : 'Role'}</b></td>
                        <td>{itemA.role}</td>
                        <td>{itemB.role}</td>
                      </tr>
                      <tr>
                        <td><b>{isAr ? 'أمثلة' : 'Examples'}</b></td>
                        <td>{itemA.ex}</td>
                        <td>{itemB.ex}</td>
                      </tr>
                      <tr>
                        <td><b>{isAr ? 'المزايا (Pros)' : 'Advantages'}</b></td>
                        <td>{itemA.pros}</td>
                        <td>{itemB.pros}</td>
                      </tr>
                      <tr>
                        <td><b>{isAr ? 'العيوب / القيود (Cons)' : 'Limitations'}</b></td>
                        <td>{itemA.cons}</td>
                        <td>{itemB.cons}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: SLIDE SUMMARIES (slideSummaries & summaryGroups) */}
        {section === 'slides' && (
          <div className="stack lg">
            {summaryGroups.map((grp, gi) => (
              <section key={gi} className="stack">
                <div className="row between wrap">
                  <h2 style={{ margin: 0, fontSize: 20 }}>{grp.title}</h2>
                  <Chip tone="accent">
                    {isAr ? `الشرائح ${grp.range[0] + 1} – ${grp.range[1] + 1}` : `Slides ${grp.range[0] + 1}–${grp.range[1] + 1}`}
                  </Chip>
                </div>
                <div className="grid auto">
                  {slideSummaries.slice(grp.range[0], grp.range[1] + 1).map((sl, si) => (
                    <article key={si} className="card stack">
                      <div className="row between">
                        <Chip tone="accent">{isAr ? `شريحة ${grp.range[0] + si + 1}` : `Slide ${grp.range[0] + si + 1}`}</Chip>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{sl.title}</h3>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent)' }}>{sl.idea}</p>
                      <ul style={{ margin: 0, paddingInlineStart: 20 }} className="stack">
                        {(sl.points || []).map((pt, pi) => (
                          <li key={pi} className="small">{pt}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
