/** Browser storage-like interface (localStorage, sessionStorage, in-memory, etc). */
export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
