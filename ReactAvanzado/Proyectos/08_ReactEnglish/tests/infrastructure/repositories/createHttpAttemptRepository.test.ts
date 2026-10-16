import { describe, it, expect, vi } from 'vitest'
import { createHttpAttemptRepository } from '@infrastructure/repositories/createHttpAttemptRepository'
import { type Attempt } from '@domain'

describe('createHttpAttemptRepository', () => {
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

  it('GET /attempts returns array', async () => {
    const fetchFn = vi.fn(async (_url: string) => {
      return new Response(JSON.stringify([mockAttempt]), { status: 200 })
    }) as typeof fetch

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    const list = await repo.list()
    expect(list).toHaveLength(1)
    expect(fetchFn).toHaveBeenCalledWith(
      'http://api.test.com/attempts',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('GET /attempts/{id} 404 returns null', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes('/att-2')) {
        return new Response('Not found', { status: 404 })
      }
      return new Response(JSON.stringify(mockAttempt), { status: 200 })
    }) as typeof fetch

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    const result = await repo.getById('att-2')
    expect(result).toBeNull()
  })

  it('GET /attempts/{id} returns attempt', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify(mockAttempt), { status: 200 })
    }) as typeof fetch

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    const result = await repo.getById('att-1')
    expect(result?.id).toBe('att-1')
  })

  it('POST /attempts saves attempt', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify(mockAttempt), { status: 201 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    await repo.save(mockAttempt)
    expect(fetchFn).toHaveBeenCalledWith(
      'http://api.test.com/attempts',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"id":"att-1"'),
      })
    )
  })

  it('DELETE /attempts/{id} removes attempt', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(null, { status: 204 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    await repo.remove('att-1')
    expect(fetchFn).toHaveBeenCalledWith(
      'http://api.test.com/attempts/att-1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('DELETE /attempts clears all', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(null, { status: 204 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    await repo.clear()
    expect(fetchFn).toHaveBeenCalledWith(
      'http://api.test.com/attempts',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('sends Authorization header with token', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify([]), { status: 200 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
      getAuthToken: () => 'secret-token-123',
    })

    await repo.list()
    expect(fetchFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token-123',
        }),
      })
    )
  })

  it('does not send Authorization header without token', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify([]), { status: 200 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
      getAuthToken: () => null,
    })

    await repo.list()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = ((fetchFn.mock.calls as any)[0]?.[1] as RequestInit | undefined)?.headers as
      Record<string, string> | undefined
    expect(headers?.Authorization).toBeUndefined()
  })

  it('non-2xx status throws AttemptHttpError', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response('Server error', { status: 500 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    await expect(repo.list()).rejects.toThrow('HTTP 500')
  })

  it('list returns newest first', async () => {
    const att1 = { ...mockAttempt, id: 'att-1', finishedAt: '2026-10-15T10:00:00Z' }
    const att2 = { ...mockAttempt, id: 'att-2', finishedAt: '2026-10-15T11:00:00Z' }

    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify([att1, att2]), { status: 200 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    const list = await repo.list()
    expect(list[0].id).toBe('att-2')
    expect(list[1].id).toBe('att-1')
  })

  it('invalid response body throws', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify({ invalid: 'shape' }), { status: 200 })
    })

    const repo = createHttpAttemptRepository({
      baseUrl: 'http://api.test.com',
      fetchFn,
    })

    await expect(repo.getById('att-1')).rejects.toThrow()
  })
})
