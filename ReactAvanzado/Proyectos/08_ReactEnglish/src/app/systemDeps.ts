import { type SystemDeps } from '@application'

/** Browser implementation of system dependencies. */
export const systemDeps: SystemDeps = {
  now() {
    return new Date().toISOString()
  },

  newId() {
    // crypto.randomUUID is available in modern browsers; fallback to simpler UUID
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }
    // Fallback: simple pseudo-UUID (not cryptographically secure, but good enough for IDs)
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  },

  randomSeed() {
    // 32-bit random integer for seeding
    return Math.floor(Math.random() * 0xffffffff)
  },
}
