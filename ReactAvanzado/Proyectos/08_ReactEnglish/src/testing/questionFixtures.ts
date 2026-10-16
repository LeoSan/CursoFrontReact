import type { BlanksQuestion, ExactQuestion, Exam, Media, SelfCheckQuestion, Blank } from '@domain'

export const SECRET = 'SECRET-ANSWER'
export const EXPLANATION = 'SECRET-EXPLANATION-TEXT'

type Extras = { readonly hint?: string; readonly media?: Media }

const base = {
  sourceId: 'src',
  lessonPairs: ['17-18'],
  englishLevel: 'A1',
  difficulty: 'Easy',
  topic: 'Topic',
  skillType: 'Grammar',
  instruction: 'Follow the instruction.',
  explanation: EXPLANATION,
} as const

export function makeExact(
  questionType: 'open' | 'error_correction' = 'open',
  extras: Extras = {}
): ExactQuestion {
  return {
    ...base,
    ...extras,
    id: `exact-${questionType}`,
    questionType,
    prompt: questionType === 'error_correction' ? 'She go to school.' : 'What time is it?',
    answer: SECRET,
    gradingMode: 'exact',
    acceptedAnswers: [SECRET],
  }
}

function makeBlank(id: number, label?: string): Blank {
  return label === undefined
    ? { id, acceptedAnswers: [SECRET] }
    : { id, label, acceptedAnswers: [SECRET] }
}

export function makeFillBlank(
  template = 'The dog {{1}} early every day.',
  extras: Extras = {}
): BlanksQuestion {
  const ids = [...template.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))
  return {
    ...base,
    ...extras,
    id: 'fill-1',
    questionType: 'fill_blank',
    prompt: 'Complete the sentence.',
    answer: SECRET,
    gradingMode: 'blanks',
    template,
    blanks: ids.map((id) => makeBlank(id)),
  }
}

export function makeMultiBlank(extras: Extras = {}): BlanksQuestion {
  return {
    ...base,
    ...extras,
    id: 'multi-1',
    questionType: 'multi_blank',
    prompt: 'Complete the table',
    answer: SECRET,
    gradingMode: 'blanks',
    blanks: [makeBlank(1, 'Present'), makeBlank(2, 'Past'), makeBlank(3, 'Participle')],
  }
}

export function makeSelfCheck(extras: Extras = {}): SelfCheckQuestion {
  return {
    ...base,
    ...extras,
    id: 'self-1',
    questionType: 'open',
    prompt: 'Describe your day.',
    answer: SECRET,
    gradingMode: 'selfCheck',
  }
}

export function makeExam(questions: Exam['questions'][number]['question'][]): Exam {
  return {
    id: 'exam-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: {
      selectedPairIds: ['17-18'],
      levels: ['A1'],
      difficulties: ['Easy'],
      questionCount: questions.length,
      shuffle: false,
    },
    questions: questions.map((question, i) => ({ number: i + 1, question })),
  }
}
