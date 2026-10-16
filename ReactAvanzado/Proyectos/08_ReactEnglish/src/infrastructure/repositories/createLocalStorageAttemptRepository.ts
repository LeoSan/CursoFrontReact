import { type Attempt, type IAttemptRepository } from '@domain'
import { attemptSchema } from '../schemas/attemptSchema'
import { type StorageLike } from '../storage/storageLike'
import { AttemptStorageError } from '../errors'

type AttemptEnvelope = {
  readonly version: number
  readonly attempts: readonly Attempt[]
}

export type CreateLocalStorageAttemptRepositoryDeps = {
  readonly storage: StorageLike
  readonly key?: string
  readonly maxAttempts?: number
}

/**
 * LocalStorage adapter for IAttemptRepository.
 * Stores attempts in an envelope with version 1.
 * Handles corrupt data gracefully with backups.
 * Returns newest first (by finishedAt).
 */
export function createLocalStorageAttemptRepository(
  deps: CreateLocalStorageAttemptRepositoryDeps
): IAttemptRepository {
  const key = deps.key ?? 'english-exam:attempts'
  const maxAttempts = deps.maxAttempts ?? 50

  function loadAttempts(): Attempt[] {
    const rawValue = deps.storage.getItem(key)
    if (!rawValue) return []

    try {
      const parsed = JSON.parse(rawValue) as unknown
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'version' in parsed &&
        parsed.version === 1 &&
        'attempts' in parsed &&
        Array.isArray(parsed.attempts)
      ) {
        const envelope = parsed as AttemptEnvelope
        const validated: Attempt[] = []

        for (const attempt of envelope.attempts) {
          try {
            const parsed = attemptSchema.parse(attempt)
            validated.push(parsed)
          } catch {
            console.warn(
              `[localStorage] Skipping invalid attempt in ${key}: schema validation failed`
            )
          }
        }

        return validated
      } else {
        console.warn(`[localStorage] Unknown envelope version in ${key}, treating as empty`)
        return []
      }
    } catch {
      console.warn(`[localStorage] Corrupt JSON in ${key}, treating as empty`)
      return []
    }
  }

  function saveAttempts(attempts: Attempt[]): void {
    const envelope: AttemptEnvelope = {
      version: 1,
      attempts,
    }

    try {
      const json = JSON.stringify(envelope)
      deps.storage.setItem(key, json)
    } catch (error) {
      // Check if it's a quota exceeded error
      if (
        error instanceof Error &&
        (error.name === 'QuotaExceededError' || error.message.includes('quota'))
      ) {
        throw new AttemptStorageError(`Failed to save attempts to ${key}: storage quota exceeded`)
      }
      throw new AttemptStorageError(`Failed to save attempts to ${key}: ${String(error)}`)
    }
  }

  function backupIfNeeded(): void {
    const current = deps.storage.getItem(key)
    if (current && !deps.storage.getItem(`${key}.backup`)) {
      deps.storage.setItem(`${key}.backup`, current)
    }
  }

  return {
    async list() {
      const attempts = loadAttempts()
      // Sort newest first by finishedAt
      return attempts.sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    },

    async getById(id: string) {
      const attempts = loadAttempts()
      return attempts.find((a) => a.id === id) ?? null
    },

    async save(attempt) {
      const attempts = loadAttempts()

      // Add new attempt
      const updated = [attempt, ...attempts]

      // Trim to maxAttempts (keep newest)
      const trimmed = updated.slice(0, maxAttempts)

      // Before saving, backup old data if it's corrupt
      const current = deps.storage.getItem(key)
      if (current) {
        try {
          JSON.parse(current)
        } catch {
          backupIfNeeded()
        }
      }

      saveAttempts(trimmed)
    },

    async remove(id: string) {
      const attempts = loadAttempts()
      const filtered = attempts.filter((a) => a.id !== id)
      if (filtered.length < attempts.length) {
        saveAttempts(filtered)
      }
    },

    async clear() {
      backupIfNeeded()
      deps.storage.removeItem(key)
    },
  }
}
