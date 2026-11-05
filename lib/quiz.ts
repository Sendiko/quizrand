const SELECTION_COUNT_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

export function getQuestionSelectionLimit(questionText: string): number | null {
  const match = questionText.match(/\(\s*choose\s+(one|two|three|four|five|\d+)\s*\)/i);

  if (!match) {
    return null;
  }

  const value = match[1].toLowerCase();
  const limit = SELECTION_COUNT_WORDS[value] ?? Number(value);

  return Number.isInteger(limit) && limit > 0 ? limit : null;
}
