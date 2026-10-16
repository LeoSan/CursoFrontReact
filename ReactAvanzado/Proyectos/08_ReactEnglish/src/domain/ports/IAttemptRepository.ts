import { type Attempt } from '../entities/attempt'

/** Port for persisting and retrieving exam attempts (to be implemented by infrastructure). */
export interface IAttemptRepository {
  /** Save an attempt (create or update). */
  save(_attempt: Attempt): Promise<void>

  /** Get all attempts. */
  list(): Promise<readonly Attempt[]>

  /** Get a single attempt by ID. */
  getById(_id: string): Promise<Attempt | null>

  /** Delete an attempt by ID. */
  remove(_id: string): Promise<void>

  /** Clear all attempts. */
  clear(): Promise<void>
}
