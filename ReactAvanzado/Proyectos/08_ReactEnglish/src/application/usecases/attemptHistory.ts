import { type Attempt, type IAttemptRepository } from '@domain'

export type AttemptHistoryDeps = {
  readonly attemptRepository: IAttemptRepository
}

export type AttemptHistory = {
  list(): Promise<readonly Attempt[]>
  getById(id: string): Promise<Attempt | null>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

/** Attempt history manager. List is returned newest first. */
export function createAttemptHistory(deps: AttemptHistoryDeps): AttemptHistory {
  return {
    async list() {
      return deps.attemptRepository.list()
    },
    async getById(id) {
      return deps.attemptRepository.getById(id)
    },
    async remove(id) {
      return deps.attemptRepository.remove(id)
    },
    async clear() {
      return deps.attemptRepository.clear()
    },
  }
}
