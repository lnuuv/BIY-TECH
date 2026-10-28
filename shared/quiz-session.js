import { QUESTIONS, SHORTCUT_QUESTIONS } from './content/quizzes.js';
import { SHORTCUTS } from './content/shortcuts.js';

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const belongsToLesson = (question, lessonId) =>
  lessonId === 'all' || question.lesson === lessonId || question.lessonIds?.includes(lessonId);

const hardenShortcutQuestion = (question, shortcut, shortcutPool) => {
  const distractors = shuffle(shortcutPool
    .filter((candidate) => candidate.id !== question.id)
    .map((candidate) => ({
      en: candidate.code,
      ar: candidate.code,
    }))
    .filter((option, index, all) =>
      option.en !== shortcut.code && all.findIndex((other) => other.en === option.en) === index
    )
    .sort((a, b) => Math.abs(a.en.length - shortcut.code.length) - Math.abs(b.en.length - shortcut.code.length))
    .slice(0, 6))
    .slice(0, 3);
  return {
    ...question,
    q: {
      en: `Which acronym matches this technical definition most precisely? ${shortcut.desc.en}`,
      ar: `أي اختصار يطابق هذا التعريف التقني بدقة؟ ${shortcut.desc.ar}`,
    },
    options: [{ en: shortcut.code, ar: shortcut.code }, ...distractors],
    ans: 0,
    exp: shortcut.comparison || shortcut.desc,
  };
};

const hardenCourseQuestion = (question, coursePool) => {
  const targetLen = (question.exp?.en?.length || 0) + (question.exp?.ar?.length || 0);
  const explanations = shuffle(coursePool
    .filter((candidate) => candidate.id !== question.id)
    .map((candidate) => candidate.exp)
    .filter((explanation) => explanation?.en && explanation?.ar)
    .filter((explanation, index, all) => all.findIndex((other) => other.en === explanation.en) === index)
    .sort((a, b) => {
      const da = Math.abs((a.en.length + a.ar.length) - targetLen);
      const db = Math.abs((b.en.length + b.ar.length) - targetLen);
      return da - db;
    })
    .slice(0, 6))
    .slice(0, 3);
  return {
    ...question,
    q: {
      en: `Which explanation best justifies the answer to this question? ${question.q.en}`,
      ar: `أي شرح يبرّر الإجابة عن هذا السؤال بشكل أدق؟ ${question.q.ar}`,
    },
    options: [question.exp, ...explanations],
    ans: 0,
  };
};

export function createQuizSet({
  lessonId = 'all',
  mode = 'mixed',
  difficulty = 'easy',
  source = 'lesson',
  weakIds = [],
  excludeIds = [],
  count = 12,
} = {}) {
  const lessonQuestions = QUESTIONS.filter((question) => belongsToLesson(question, lessonId));
  const shortcutQuestions = SHORTCUT_QUESTIONS.filter((question) => belongsToLesson(question, lessonId));
  const weakSet = new Set(weakIds);

  let pool;
  if (source === 'weak') {
    pool = [...lessonQuestions, ...shortcutQuestions].filter((question) => weakSet.has(question.id));
  } else if (mode === 'book') {
    pool = lessonQuestions;
  } else if (mode === 'shortcuts') {
    pool = shortcutQuestions;
  } else {
    pool = [...lessonQuestions, ...shortcutQuestions];
  }

  if (!pool.length || count < 1) return [];

  if (difficulty === 'hard') {
    pool = pool.map((question) => {
      if (question.id.startsWith('shortcut-')) {
        const shortcut = SHORTCUTS.find((candidate) => question.id === `shortcut-${candidate.id}`);
        const distractorPool = shortcut
          ? SHORTCUT_QUESTIONS.filter((candidate) =>
            SHORTCUTS.find((item) => candidate.id === `shortcut-${item.id}`)?.cat === shortcut.cat
          )
          : [];
        return shortcut ? hardenShortcutQuestion(question, shortcut, distractorPool) : question;
      }
      return hardenCourseQuestion(question, QUESTIONS);
    });
  }

  const excluded = new Set(excludeIds);
  const freshPool = pool.filter((question) => !excluded.has(question.id));
  const selectionPool = freshPool.length ? freshPool : pool;
  const targetCount = source === 'weak' ? Math.min(count, selectionPool.length) : count;
  const selected = [];
  while (selected.length < targetCount) {
    let batch = shuffle(selectionPool);
    if (selected.length && batch.length > 1 && batch[0].id === selected.at(-1).id) {
      batch = [...batch.slice(1), batch[0]];
    }
    const next = source === 'weak'
      ? batch.filter((question) => !selected.some((item) => item.id === question.id))
      : batch;
    selected.push(...next.slice(0, targetCount - selected.length));
    if (source === 'weak' && selected.length >= targetCount) break;
    if (source !== 'weak' && selected.length >= targetCount) break;
    if (next.length === 0) break;
  }
  return selected;
}

export { QUESTIONS, SHORTCUT_QUESTIONS };
