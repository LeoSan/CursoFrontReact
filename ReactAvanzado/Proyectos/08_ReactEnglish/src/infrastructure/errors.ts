/** Error storing an attempt in local storage (quota exceeded, etc). */
export class AttemptStorageError extends Error {
  readonly name = 'AttemptStorageError'
  constructor(message: string) {
    super(message)
  }
}

/** Error communicating with the HTTP attempt API. */
export class AttemptHttpError extends Error {
  readonly name = 'AttemptHttpError'
  readonly status: number
  readonly endpoint: string

  constructor(status: number, endpoint: string, message: string) {
    super(message)
    this.status = status
    this.endpoint = endpoint
  }
}
