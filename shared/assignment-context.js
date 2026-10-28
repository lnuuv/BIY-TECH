// Compact, bounded summary of the active analysed assignment for the AI tutor (built on the client, re-validated on the server).
const cut = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
export const MAX_CONTEXT_CHARS = 6500;

export function buildTutorContext(result) {
  if (!result?.structure) return null;
  const st = result.structure;
  const ctx = {
    source: 'student-uploaded assignment brief (extracted by software; items marked notFound were not in the document)',
    title: cut(st.title, 160), subject: cut(st.subject, 120), organisation: cut(st.organisation, 120),
    scenario: { summary: cut(st.scenario?.summary, 700), needs: (st.scenario?.needs || []).slice(0, 8).map((x) => cut(x, 160)), stakeholders: (st.scenario?.stakeholders || []).slice(0, 6).map((x) => cut(x.name, 60)) },
    activities: (st.activities || []).slice(0, 8).map((a) => ({
      id: a.id, title: cut(a.title, 120), criteria: a.criteria, commandWords: a.commandWords, requirements: (a.requirements || []).slice(0, 5).map((x) => cut(x, 160)),
      firstStep: cut(result.guidance?.activities?.[a.id]?.firstStep, 240),
    })),
    criteria: (st.criteria || []).slice(0, 24).map((c) => ({ code: c.code, text: cut(c.text, 160) })),
    commandWords: (st.commandWords || []).slice(0, 12),
    notFound: (st.missing || []).slice(0, 6).map((x) => cut(x, 80)),
    lessonIds: (result.lessons || []).slice(0, 8).map((l) => l.id),
  };
  let json = JSON.stringify(ctx);
  // shrink progressively instead of cutting JSON in half
  for (const step of [() => ctx.activities.forEach((a) => { a.firstStep = ''; }), () => ctx.activities.forEach((a) => { a.requirements = a.requirements.slice(0, 2); }), () => { ctx.criteria = ctx.criteria.slice(0, 10); }, () => { ctx.scenario.summary = ctx.scenario.summary.slice(0, 300); }]) {
    if (json.length <= MAX_CONTEXT_CHARS) break;
    step(); json = JSON.stringify(ctx);
  }
  return json.length <= MAX_CONTEXT_CHARS ? json : json.slice(0, MAX_CONTEXT_CHARS);
}
