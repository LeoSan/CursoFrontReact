import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// jsdom does not implement scrolling; stub it so components can call window.scrollTo.
window.scrollTo = vi.fn()

let consoleErrorSpy: ReturnType<typeof vi.spyOn<typeof console, 'error'>>
let consoleWarnSpy: ReturnType<typeof vi.spyOn<typeof console, 'warn'>>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  if (consoleErrorSpy.mock.calls.length > 0 || consoleWarnSpy.mock.calls.length > 0) {
    const errorCalls = consoleErrorSpy.mock.calls
      .map((call: readonly unknown[]) => call[0])
      .filter(
        (msg: unknown) =>
          !String(msg).includes('Warning: useLayoutEffect does nothing on the server')
      )
    const warnCalls = consoleWarnSpy.mock.calls.map((call: readonly unknown[]) => call[0])

    if (errorCalls.length > 0 || warnCalls.length > 0) {
      throw new Error(
        `Console errors/warnings detected:\nErrors: ${errorCalls.join(', ')}\nWarnings: ${warnCalls.join(', ')}`
      )
    }
  }

  consoleErrorSpy.mockRestore()
  consoleWarnSpy.mockRestore()
  cleanup()
})
