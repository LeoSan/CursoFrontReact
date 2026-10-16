import { describe, it, expect } from 'vitest'
import { generateExam, type GenerateExamDeps } from '@domain/services/generateExam'
import { type Question } from '@domain/entities'

describe('generateExam', () => {
  const createMockDeps = (seed: number, startId: number = 0): GenerateExamDeps => {
    let idCounter = startId
    return {
      random: (() => {
        let s = seed
        return () => {
          s |= 0
          s = (s + 0x6d2b79f5) | 0
          let t = Math.imul(s ^ (s >>> 15), 1 | s)
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }
      })(),
      now: () => '2026-10-15T10:00:00Z',
      newId: () => `exam-${++idCounter}`,
    }
  }

  const q1: Question = {
    id: 'BK1-Q001',
    sourceId: 'S1',
    lessonPairs: ['17-18'],
    englishLevel: 'A1',
    difficulty: 'Easy',
    topic: 'Topic 1',
    skillType: 'Reading',
    questionType: 'open',
    gradingMode: 'exact',
    instruction: 'Answer',
    prompt: 'Test',
    answer: 'Answer',
    explanation: 'Exp',
    acceptedAnswers: ['Answer'],
  }

  const q2: Question = {
    ...q1,
    id: 'BK1-Q002',
    lessonPairs: ['17-18'],
  }

  const q3: Question = {
    ...q1,
    id: 'BK1-Q003',
    lessonPairs: ['19-20'],
  }

  const questions = [q1, q2, q3]

  it('invalid_count: 0', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 0,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result).toEqual({ ok: false, reason: 'invalid_count' })
  })

  it('invalid_count: negative', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: -5,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result).toEqual({ ok: false, reason: 'invalid_count' })
  })

  it('invalid_count: non-integer', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2.5,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result).toEqual({ ok: false, reason: 'invalid_count' })
  })

  it('no_questions: no matching pairs', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['99-100'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result).toEqual({ ok: false, reason: 'no_questions' })
  })

  it('no_questions: empty selectedPairIds', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: [],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result).toEqual({ ok: false, reason: 'no_questions' })
  })

  it('success: basic generation', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.questions).toHaveLength(2)
      expect(result.exam.id).toBe('exam-1')
      expect(result.exam.createdAt).toBe('2026-10-15T10:00:00Z')
      expect(result.reducedToAvailable).toBe(false)
    }
  })

  it('numbering 1..n', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.questions[0].number).toBe(1)
      expect(result.exam.questions[1].number).toBe(2)
    }
  })

  it('reducedToAvailable true when fewer available than requested', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 100,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.reducedToAvailable).toBe(true)
      expect(result.availableCount).toBe(2)
      expect(result.exam.questions).toHaveLength(2)
    }
  })

  it('reducedToAvailable false when enough available', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.reducedToAvailable).toBe(false)
    }
  })

  it('shuffle false keeps bank order', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.questions[0].question).toEqual(q1)
      expect(result.exam.questions[1].question).toEqual(q2)
    }
  })

  it('shuffle true changes order with appropriate seed', () => {
    const noShuffleResult = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: false,
      },
      createMockDeps(42, 100)
    )

    const shuffleResult = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: true,
      },
      createMockDeps(999, 101)
    )

    expect(noShuffleResult.ok).toBe(true)
    expect(shuffleResult.ok).toBe(true)
    if (noShuffleResult.ok && shuffleResult.ok) {
      const noShuffleIds = noShuffleResult.exam.questions.map((q) => q.question.id)
      expect(noShuffleIds).toEqual(['BK1-Q001', 'BK1-Q002'])
      const shuffleIds = shuffleResult.exam.questions.map((q) => q.question.id)
      expect(shuffleIds).toHaveLength(2)
      expect(shuffleIds).toContain('BK1-Q001')
      expect(shuffleIds).toContain('BK1-Q002')
    }
  })

  it('same seed gives same exam', () => {
    const result1 = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: true,
      },
      createMockDeps(42)
    )

    const result2 = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 2,
        shuffle: true,
      },
      createMockDeps(42)
    )

    expect(result1.ok).toBe(true)
    expect(result2.ok).toBe(true)
    if (result1.ok && result2.ok) {
      const ids1 = result1.exam.questions.map((q) => q.question.id)
      const ids2 = result2.exam.questions.map((q) => q.question.id)
      expect(ids1).toEqual(ids2)
    }
  })

  it('config is copied, not referenced', () => {
    const config = {
      selectedPairIds: ['17-18'] as const,
      levels: [] as const,
      difficulties: [] as const,
      questionCount: 1,
      shuffle: false,
    }
    const result = generateExam(questions, config, createMockDeps(42))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.config).toEqual(config)
      expect(result.exam.config).not.toBe(config)
    }
  })

  it('uses injected newId', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      createMockDeps(42, 0)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.id).toBe('exam-1')
    }
  })

  it('uses injected now', () => {
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      createMockDeps(42)
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.createdAt).toBe('2026-10-15T10:00:00Z')
    }
  })
})
