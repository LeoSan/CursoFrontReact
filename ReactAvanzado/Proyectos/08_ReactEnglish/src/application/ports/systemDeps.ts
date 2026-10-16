/** Dependencies injected from the system environment (browser, Node.js, etc). */
export type SystemDeps = {
  /** ISO 8601 timestamp: YYYY-MM-DDTHH:mm:ss.sssZ */
  now(): string
  /** Unique identifier generator. */
  newId(): string
  /** Random 32-bit integer for seeding the exam random function. */
  randomSeed(): number
}
