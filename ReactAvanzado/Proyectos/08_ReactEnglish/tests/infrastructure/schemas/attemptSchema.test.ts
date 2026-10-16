import { describe, it, expect } from 'vitest'
import { attemptSchema } from '@infrastructure/schemas/attemptSchema'

const baseAttempt = {
  id: 'att-1',
  exam: {
    id: 'exam-1',
    createdAt: '2026-10-15T10:00:00Z',
    config: {
      selectedPairIds: [],
      levels: [],
      difficulties: [],
      questionCount: 0,
      shuffle: false,
    },
    questions: [],
  },
  answers: [] as unknown[],
  result: {
    examId: 'exam-1',
    total: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    score: 0,
    results: [],
  },
  finishedAt: '2026-10-15T10:30:00Z',
}

const withAnswer = (answer: unknown) => ({ ...baseAttempt, answers: [answer] })

describe('attemptSchema selfCheck answers', () => {
  it('parses a selfCheck answer WITH text and keeps it', () => {
    const result = attemptSchema.safeParse(
      withAnswer({
        kind: 'selfCheck',
        questionId: 'BK1-Q001',
        revealed: true,
        markedCorrect: true,
        text: 'My answer',
      })
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.answers[0]).toEqual({
        kind: 'selfCheck',
        questionId: 'BK1-Q001',
        revealed: true,
        markedCorrect: true,
        text: 'My answer',
      })
    }
  })

  it('parses a selfCheck answer WITHOUT text (attempts stored before this field)', () => {
    const result = attemptSchema.safeParse(
      withAnswer({
        kind: 'selfCheck',
        questionId: 'BK1-Q001',
        revealed: false,
        markedCorrect: null,
      })
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.answers[0]).not.toHaveProperty('text')
    }
  })

  it('parses a selfCheck answer with an empty-string text', () => {
    const result = attemptSchema.safeParse(
      withAnswer({
        kind: 'selfCheck',
        questionId: 'BK1-Q001',
        revealed: false,
        markedCorrect: null,
        text: '',
      })
    )

    expect(result.success).toBe(true)
  })

  it('rejects a non-string text with a readable path', () => {
    const result = attemptSchema.safeParse(
      withAnswer({
        kind: 'selfCheck',
        questionId: 'BK1-Q001',
        revealed: false,
        markedCorrect: null,
        text: 42,
      })
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('answers.0.text')
    }
  })
})
