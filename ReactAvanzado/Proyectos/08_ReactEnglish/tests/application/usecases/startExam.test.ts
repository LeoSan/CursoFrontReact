import { describe, it, expect } from 'vitest'
import { createStartExam } from '@application/usecases/startExam'
import { type IQuestionRepository, type Question } from '@domain'
import { type SystemDeps } from '@application'

describe('createStartExam', () => {
  const mockQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
    id: `BK1-Q${String(i + 1).padStart(3, '0')}`,
    sourceId: 'S1',
    lessonPairs: ['1-2'],
    englishLevel: 'A1' as const,
    difficulty: 'Easy' as const,
    topic: 'Test',
    skillType: 'Speaking' as const,
    questionType: 'open' as const,
    gradingMode: 'exact' as const,
    instruction: 'Answer',
    prompt: `Question ${i + 1}`,
    answer: `Answer ${i + 1}`,
    explanation: 'Correct',
    acceptedAnswers: [`Answer ${i + 1}`],
  }))

  it('returns exam with same seed producing same questions', async () => {
    const mockRepo: IQuestionRepository = {
      async getAllQuestions() {
        return mockQuestions
      },
      async getBanks() {
        return []
      },
      async getLessonPairs() {
        return []
      },
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:00:00Z',
      newId: () => 'exam-1',
      randomSeed: () => 42,
    }

    const startExam = createStartExam({
      questionRepository: mockRepo,
      system: mockSystem,
    })

    const result1 = await startExam({
      selectedPairIds: ['1-2'],
      levels: [],
      difficulties: [],
      questionCount: 5,
      shuffle: true,
    })

    // Create new startExam with same seed
    const mockSystem2: SystemDeps = {
      now: () => '2026-10-15T10:00:00Z',
      newId: () => 'exam-2',
      randomSeed: () => 42,
    }

    const startExam2 = createStartExam({
      questionRepository: mockRepo,
      system: mockSystem2,
    })

    const result2 = await startExam2({
      selectedPairIds: ['1-2'],
      levels: [],
      difficulties: [],
      questionCount: 5,
      shuffle: true,
    })

    expect(result1.ok).toBe(true)
    expect(result2.ok).toBe(true)
    if (result1.ok && result2.ok) {
      const ids1 = result1.exam.questions.map((q) => q.question.id)
      const ids2 = result2.exam.questions.map((q) => q.question.id)
      expect(ids1).toEqual(ids2)
    }
  })

  it('passes through no_questions error', async () => {
    const mockRepo: IQuestionRepository = {
      async getAllQuestions() {
        return []
      },
      async getBanks() {
        return []
      },
      async getLessonPairs() {
        return []
      },
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:00:00Z',
      newId: () => 'exam-1',
      randomSeed: () => 42,
    }

    const startExam = createStartExam({
      questionRepository: mockRepo,
      system: mockSystem,
    })

    const result = await startExam({
      selectedPairIds: ['1-2'],
      levels: [],
      difficulties: [],
      questionCount: 5,
      shuffle: true,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('no_questions')
    }
  })

  it('passes through invalid_count error', async () => {
    const mockRepo: IQuestionRepository = {
      async getAllQuestions() {
        return mockQuestions
      },
      async getBanks() {
        return []
      },
      async getLessonPairs() {
        return []
      },
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:00:00Z',
      newId: () => 'exam-1',
      randomSeed: () => 42,
    }

    const startExam = createStartExam({
      questionRepository: mockRepo,
      system: mockSystem,
    })

    const result = await startExam({
      selectedPairIds: ['1-2'],
      levels: [],
      difficulties: [],
      questionCount: 0,
      shuffle: true,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid_count')
    }
  })
})
