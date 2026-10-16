import { describe, it, expect, vi } from 'vitest'
import { createLocalStorageAttemptRepository } from '@infrastructure/repositories/createLocalStorageAttemptRepository'
import { type Attempt } from '@domain'
import { type StorageLike } from '@infrastructure'

describe('createLocalStorageAttemptRepository', () => {
  function createFakeStorage(): StorageLike {
    const store = new Map<string, string>()
    return {
      getItem(key: string) {
        return store.get(key) ?? null
      },
      setItem(key: string, value: string) {
        store.set(key, value)
      },
      removeItem(key: string) {
        store.delete(key)
      },
    }
  }

  const mockAttempt: Attempt = {
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

  it('saves attempt in envelope format', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    await repo.save(mockAttempt)

    const saved = storage.getItem('english-exam:attempts')
    expect(saved).toBeDefined()
    const parsed = JSON.parse(saved!)
    expect(parsed.version).toBe(1)
    expect(parsed.attempts).toHaveLength(1)
    expect(parsed.attempts[0].id).toBe('att-1')
  })

  it('list returns newest first', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    const att1 = { ...mockAttempt, id: 'att-1', finishedAt: '2026-10-15T10:00:00Z' }
    const att2 = { ...mockAttempt, id: 'att-2', finishedAt: '2026-10-15T11:00:00Z' }

    await repo.save(att1)
    await repo.save(att2)

    const list = await repo.list()
    expect(list[0].id).toBe('att-2')
    expect(list[1].id).toBe('att-1')
  })

  it('get returns attempt by id', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    await repo.save(mockAttempt)
    const result = await repo.getById('att-1')

    expect(result?.id).toBe('att-1')
  })

  it('get returns null when not found', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    const result = await repo.getById('nonexistent')
    expect(result).toBeNull()
  })

  it('remove deletes attempt', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    await repo.save(mockAttempt)
    await repo.remove('att-1')

    const list = await repo.list()
    expect(list).toHaveLength(0)
  })

  it('clear empties storage', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage })

    await repo.save(mockAttempt)
    await repo.clear()

    const list = await repo.list()
    expect(list).toHaveLength(0)
  })

  it('trims to maxAttempts', async () => {
    const storage = createFakeStorage()
    const repo = createLocalStorageAttemptRepository({ storage, maxAttempts: 2 })

    const att1 = { ...mockAttempt, id: 'att-1', finishedAt: '2026-10-15T10:00:00Z' }
    const att2 = { ...mockAttempt, id: 'att-2', finishedAt: '2026-10-15T11:00:00Z' }
    const att3 = { ...mockAttempt, id: 'att-3', finishedAt: '2026-10-15T12:00:00Z' }

    await repo.save(att1)
    await repo.save(att2)
    await repo.save(att3)

    const list = await repo.list()
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe('att-3')
    expect(list[1].id).toBe('att-2')
  })

  it('corrupt JSON returns empty list and warns', async () => {
    const storage = createFakeStorage()
    storage.setItem('english-exam:attempts', 'not json')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const repo = createLocalStorageAttemptRepository({ storage })
    const list = await repo.list()

    expect(list).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Corrupt JSON'))

    warnSpy.mockRestore()
  })

  it('unknown version returns empty list and warns', async () => {
    const storage = createFakeStorage()
    storage.setItem('english-exam:attempts', JSON.stringify({ version: 2, attempts: [] }))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const repo = createLocalStorageAttemptRepository({ storage })
    const list = await repo.list()

    expect(list).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown envelope version'))

    warnSpy.mockRestore()
  })

  it('invalid attempt skipped with warning', async () => {
    const storage = createFakeStorage()
    const envelope = {
      version: 1,
      attempts: [
        mockAttempt,
        { id: 'invalid' }, // Missing required fields
      ],
    }
    storage.setItem('english-exam:attempts', JSON.stringify(envelope))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const repo = createLocalStorageAttemptRepository({ storage })
    const list = await repo.list()

    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('att-1')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping invalid attempt'))

    warnSpy.mockRestore()
  })

  it('setItem throwing quota error throws AttemptStorageError', async () => {
    const quotaError = new Error('QuotaExceededError')
    quotaError.name = 'QuotaExceededError'
    const storage: StorageLike = {
      getItem() {
        return null
      },
      setItem() {
        throw quotaError
      },
      removeItem() {},
    }

    const repo = createLocalStorageAttemptRepository({ storage })

    await expect(repo.save(mockAttempt)).rejects.toThrow('quota exceeded')
  })
})
