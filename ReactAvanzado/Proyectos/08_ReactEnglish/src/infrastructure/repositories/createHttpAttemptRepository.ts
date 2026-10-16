import { type Attempt, type IAttemptRepository } from '@domain'
import { attemptSchema } from '../schemas/attemptSchema'
import { AttemptHttpError } from '../errors'

export type CreateHttpAttemptRepositoryDeps = {
  readonly baseUrl: string
  readonly fetchFn?: typeof fetch
  readonly getAuthToken?: () => string | null
}

/**
 * HTTP adapter for IAttemptRepository (REST API).
 * Supports optional Bearer token authentication.
 * Validates all responses with attemptSchema.
 * Returns newest first (by finishedAt).
 */
export function createHttpAttemptRepository(
  deps: CreateHttpAttemptRepositoryDeps
): IAttemptRepository {
  const fetchFn = deps.fetchFn ?? globalThis.fetch
  const baseUrl = deps.baseUrl.replace(/\/$/, '') // Remove trailing slash

  async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = deps.getAuthToken?.()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetchFn(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new AttemptHttpError(
        response.status,
        endpoint,
        `HTTP ${response.status} ${response.statusText} from ${method} ${endpoint}`
      )
    }

    if (method === 'DELETE' && response.status === 204) {
      return undefined as T
    }

    const json = await response.json()
    return json as T
  }

  return {
    async list() {
      const json = await request<unknown>('GET', '/attempts')
      if (!Array.isArray(json)) {
        throw new Error('Expected array from GET /attempts')
      }

      const attempts: Attempt[] = []
      for (const item of json) {
        try {
          const parsed = attemptSchema.parse(item)
          attempts.push(parsed)
        } catch (error) {
          console.warn(`[http] Skipping invalid attempt in list: ${String(error)}`)
        }
      }

      // Sort newest first by finishedAt
      return attempts.sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    },

    async getById(id: string) {
      try {
        const json = await request<unknown>('GET', `/attempts/${id}`)
        return attemptSchema.parse(json)
      } catch (error) {
        if (error instanceof AttemptHttpError && error.status === 404) {
          return null
        }
        throw error
      }
    },

    async save(attempt) {
      await request<unknown>('POST', '/attempts', attempt)
    },

    async remove(id: string) {
      await request<void>('DELETE', `/attempts/${id}`)
    },

    async clear() {
      await request<void>('DELETE', '/attempts')
    },
  }
}
