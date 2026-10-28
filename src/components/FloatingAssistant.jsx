import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageContext } from '../assistant/pageContext.js';
import { getTutorContext } from '../store/assignment.js';

const PAGE_NAMES = {
  '/': 'Home page',
  '/learn': 'Lessons list',
  '/shortcuts': 'Technical acronyms & shortcuts glossary',
  '/learn/shortcuts': 'Technical acronyms & shortcuts glossary',
  '/models': '3D models page',
  '/lab': 'Networking lab',
  '/practice': 'Practice questions',
  '/games': 'Games page',
  '/assignment': 'Assignment helper',
  '/progress': 'Progress page',
};

function pageName(path) {
  if (path.startsWith('/learn/')) return `Lesson page (${path.split('/')[2]})`;
  return PAGE_NAMES[path] || path;
}

export default function FloatingAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // صفحة المساعد الكاملة فيها محادثة أصلاً
  if (pathname === '/assistant') return null;

  async function send(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    const history = messages.filter((m) => !m.error);
    const next = [...history, { role: 'user', content: q }];
    setMessages([...messages, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          lang: /[\u0600-\u06FF]/.test(q) ? 'ar' : 'en',
          page: pageName(pathname),
          pageContext: (getPageContext() || '').slice(0, 6000),
          assignmentContext: getTutorContext(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: 'assistant', content: data.answer.replace(/\s?\[S\d+\]/g, '') }
          : { role: 'assistant', content: `⚠️ ${data.message || 'صار خطأ، جرّب مرة ثانية'}`, error: true },
      ]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ ما قدرت أوصل للسيرفر', error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div style={styles.panel} dir="rtl">
          <div style={styles.header}>
            <span>🤖 المساعد الذكي</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.headerBtn} onClick={() => setMessages([])} title="محادثة جديدة">↺</button>
              <button style={styles.headerBtn} onClick={() => setOpen(false)} title="إغلاق">✕</button>
            </div>
          </div>
          <div style={styles.body}>
            {messages.length === 0 && (
              <div style={styles.empty}>
                اسألني أي شي عن هالصفحة 👋
                <br />
                مثلاً: "شو الغلط عندي؟" أو "كيف بعمل هاي؟"
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} dir="auto" style={m.role === 'user' ? styles.user : m.error ? styles.error : styles.bot}>
                {m.content}
              </div>
            ))}
            {loading && <div style={styles.bot}>عم بفكر… ⏳</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} style={styles.form}>
            <input
              dir="auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك…"
              style={styles.input}
              maxLength={6000}
            />
            <button type="submit" disabled={loading} style={styles.send}>➤</button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} style={styles.fab} aria-label="المساعد الذكي">
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed', bottom: 20, left: 20, zIndex: 1000, width: 58, height: 58,
    borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 26, color: '#fff',
    background: 'linear-gradient(135deg, #38bdf8, #0284c7)', boxShadow: '0 8px 24px rgba(0,0,0,.4)',
  },
  panel: {
    position: 'fixed', bottom: 90, left: 20, zIndex: 1000, width: 'min(380px, calc(100vw - 40px))',
    height: 'min(520px, calc(100vh - 120px))', display: 'flex', flexDirection: 'column',
    background: '#111827', border: '1px solid #243049', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,.5)', color: '#e5e7eb', fontFamily: 'inherit',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
    background: '#16203a', borderBottom: '1px solid #243049', fontWeight: 600,
  },
  headerBtn: {
    background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 8,
    width: 30, height: 30, cursor: 'pointer',
  },
  body: { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, lineHeight: 1.8 },
  user: {
    alignSelf: 'flex-start', background: '#0ea5e9', color: '#fff', padding: '8px 12px',
    borderRadius: 14, maxWidth: '85%', whiteSpace: 'pre-wrap',
  },
  bot: {
    alignSelf: 'flex-end', background: '#1e293b', padding: '8px 12px', borderRadius: 14,
    maxWidth: '90%', whiteSpace: 'pre-wrap', lineHeight: 1.7,
  },
  error: {
    alignSelf: 'flex-end', background: '#3b1d2a', padding: '8px 12px', borderRadius: 14, maxWidth: '90%',
  },
  form: { display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #243049' },
  input: {
    flex: 1, background: '#0b1220', border: '1px solid #334155', color: '#e5e7eb',
    borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, outline: 'none',
  },
  send: {
    width: 44, border: 'none', borderRadius: 10, background: '#0ea5e9', color: '#fff',
    cursor: 'pointer', fontSize: 18,
  },
};