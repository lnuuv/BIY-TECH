export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function shuffleQuestionOptions(question, random = Math.random) {
  const options = shuffle(
    question.options.map((option, index) => ({ option, index })),
    random,
  );
  return {
    ...question,
    options: options.map(({ option }) => option),
    ans: options.findIndex(({ index }) => index === question.ans),
  };
}
