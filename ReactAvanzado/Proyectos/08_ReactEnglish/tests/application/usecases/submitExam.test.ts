import { describe, it, expect, vi } from 'vitest'
import { createSubmitExam } from '@application/usecases/submitExam'
import { type Exam, type IAttemptRepository, type UserAnswer } from '@domain'
import { type SystemDeps } from '@application'

describe('createSubmitExam', () => {
  const mockExam: Exam = {
    id: 'exam-1',
    createdAt: '2026-10-15T10:00:00Z',
    config: {
      selectedPairIds: ['1-2'],
      levels: [],
      difficulties: [],
      questionCount: 1,
      shuffle: false,
    },
    questions: [
      {
        number: 1,
        question: {
          id: 'BK1-Q001',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Hello',
          answer: 'Hi',
          explanation: 'Correct',
          acceptedAnswers: ['Hi'],
        },
      },
    ],
  }

  const mockAnswers: UserAnswer[] = [
    {
      kind: 'text',
      questionId: 'BK1-Q001',
      value: 'Hi',
    },
  ]

  it('builds attempt with injected id and date and correct score', async () => {
    const saveCall = vi.fn()
    const mockRepo: IAttemptRepository = {
      save: saveCall,
      list: vi.fn(),
      getById: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:30:00Z',
      newId: () => 'attempt-123',
      randomSeed: () => 42,
    }

    const submitExam = createSubmitExam({
      attemptRepository: mockRepo,
      system: mockSystem,
    })

    const result = await submitExam(mockExam, mockAnswers)

    expect(result.saved).toBe(true)
    if (result.saved) {
      expect(result.attempt.id).toBe('attempt-123')
      expect(result.attempt.finishedAt).toBe('2026-10-15T10:30:00Z')
      expect(result.attempt.result.score).toBe(100)
      expect(result.attempt.result.correct).toBe(1)
    }
  })

  it('calls save exactly once', async () => {
    const saveCall = vi.fn(async () => {})
    const mockRepo: IAttemptRepository = {
      save: saveCall,
      list: vi.fn(),
      getById: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:30:00Z',
      newId: () => 'attempt-123',
      randomSeed: () => 42,
    }

    const submitExam = createSubmitExam({
      attemptRepository: mockRepo,
      system: mockSystem,
    })

    await submitExam(mockExam, mockAnswers)

    expect(saveCall).toHaveBeenCalledTimes(1)
  })

  it('returns saved false with attempt when save fails', async () => {
    const saveError = new Error('Storage quota exceeded')
    const saveCall = vi.fn(async () => {
      throw saveError
    })
    const mockRepo: IAttemptRepository = {
      save: saveCall,
      list: vi.fn(),
      getById: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:30:00Z',
      newId: () => 'attempt-123',
      randomSeed: () => 42,
    }

    const submitExam = createSubmitExam({
      attemptRepository: mockRepo,
      system: mockSystem,
    })

    const result = await submitExam(mockExam, mockAnswers)

    expect(result.saved).toBe(false)
    if (!result.saved) {
      expect(result.attempt.result.score).toBe(100)
      expect(result.error).toBe(saveError)
    }
  })

  it('grades attempt with correct/incorrect/unanswered', async () => {
    const saveCall = vi.fn(async () => {})
    const mockRepo: IAttemptRepository = {
      save: saveCall,
      list: vi.fn(),
      getById: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const mockSystem: SystemDeps = {
      now: () => '2026-10-15T10:30:00Z',
      newId: () => 'attempt-123',
      randomSeed: () => 42,
    }

    const submitExam = createSubmitExam({
      attemptRepository: mockRepo,
      system: mockSystem,
    })

    const wrongAnswer: UserAnswer[] = [
      {
        kind: 'text',
        questionId: 'BK1-Q001',
        value: 'Wrong',
      },
    ]

    const result = await submitExam(mockExam, wrongAnswer)

    expect(result.saved).toBe(true)
    if (result.saved) {
      expect(result.attempt.result.score).toBe(0)
      expect(result.attempt.result.correct).toBe(0)
      expect(result.attempt.result.incorrect).toBe(1)
    }
  })
})
