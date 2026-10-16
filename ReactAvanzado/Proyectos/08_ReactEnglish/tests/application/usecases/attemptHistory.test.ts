import { describe, it, expect, vi } from 'vitest'
import { createAttemptHistory } from '@application/usecases/attemptHistory'
import { type Attempt, type IAttemptRepository } from '@domain'

describe('createAttemptHistory', () => {
  const mockAttempt1: Attempt = {
    id: 'attempt-1',
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
    answers: [],
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

  const mockAttempt2: Attempt = {
    ...mockAttempt1,
    id: 'attempt-2',
    finishedAt: '2026-10-15T11:00:00Z',
  }

  it('list delegates to repository', async () => {
    const listCall = vi.fn(async () => [mockAttempt1, mockAttempt2])
    const mockRepo: IAttemptRepository = {
      list: listCall,
      getById: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const history = createAttemptHistory({ attemptRepository: mockRepo })
    const result = await history.list()

    expect(listCall).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(2)
  })

  it('getById delegates to repository', async () => {
    const getByIdCall = vi.fn(async () => mockAttempt1)
    const mockRepo: IAttemptRepository = {
      list: vi.fn(),
      getById: getByIdCall,
      save: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }

    const history = createAttemptHistory({ attemptRepository: mockRepo })
    const result = await history.getById('attempt-1')

    expect(getByIdCall).toHaveBeenCalledWith('attempt-1')
    expect(result).toBe(mockAttempt1)
  })

  it('remove delegates to repository', async () => {
    const removeCall = vi.fn(async () => {})
    const mockRepo: IAttemptRepository = {
      list: vi.fn(),
      getById: vi.fn(),
      save: vi.fn(),
      remove: removeCall,
      clear: vi.fn(),
    }

    const history = createAttemptHistory({ attemptRepository: mockRepo })
    await history.remove('attempt-1')

    expect(removeCall).toHaveBeenCalledWith('attempt-1')
  })

  it('clear delegates to repository', async () => {
    const clearCall = vi.fn(async () => {})
    const mockRepo: IAttemptRepository = {
      list: vi.fn(),
      getById: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      clear: clearCall,
    }

    const history = createAttemptHistory({ attemptRepository: mockRepo })
    await history.clear()

    expect(clearCall).toHaveBeenCalledTimes(1)
  })
})
