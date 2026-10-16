import { describe, it, expect } from 'vitest'
import { normalizeAnswer } from '@domain/services/normalizeAnswer'

describe('normalizeAnswer', () => {
  it('trims whitespace', () => {
    expect(normalizeAnswer('  hello  ')).toBe('hello')
  })

  it('collapses multiple spaces to single space', () => {
    expect(normalizeAnswer('hello   world')).toBe('hello world')
  })

  it('collapses tabs', () => {
    expect(normalizeAnswer('hello\t\tworld')).toBe('hello world')
  })

  it('collapses non-breaking spaces (\\u00A0)', () => {
    expect(normalizeAnswer('hello  world')).toBe('hello world')
  })

  it('converts curly apostrophe to straight', () => {
    expect(normalizeAnswer("it's")).toBe("it's")
    expect(normalizeAnswer("it's")).toBe("it's")
  })

  it('converts curly quotes to straight', () => {
    expect(normalizeAnswer('"hello"')).toBe('"hello"')
    expect(normalizeAnswer('"hello"')).toBe('"hello"')
  })

  it('preserves case', () => {
    expect(normalizeAnswer('Hello WORLD')).toBe('Hello WORLD')
  })

  it('preserves punctuation', () => {
    expect(normalizeAnswer('Hello, world!')).toBe('Hello, world!')
  })

  it("example: It's  one   twenty-five.", () => {
    expect(normalizeAnswer("It's  one   twenty-five.")).toBe("It's one twenty-five.")
  })
})
