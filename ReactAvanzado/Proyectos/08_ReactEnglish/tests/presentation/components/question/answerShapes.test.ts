import { describe, expect, it } from 'vitest'
import {
  readBlankValues,
  readSelfCheck,
  readTextValue,
} from '@presentation/components/question/answerShapes'

describe('answerShapes', () => {
  it('readTextValue returns the text value or empty string', () => {
    expect(readTextValue({ kind: 'text', value: 'hi' })).toBe('hi')
    expect(readTextValue(undefined)).toBe('')
    expect(readTextValue({ kind: 'blanks', values: { 1: 'a' } })).toBe('')
  })

  it('readBlankValues returns the values or an empty record', () => {
    expect(readBlankValues({ kind: 'blanks', values: { 1: 'a' } })).toEqual({ 1: 'a' })
    expect(readBlankValues(undefined)).toEqual({})
    expect(readBlankValues({ kind: 'text', value: 'x' })).toEqual({})
  })

  it('readSelfCheck returns defaults for undefined or other kinds', () => {
    const defaults = { text: '', revealed: false, markedCorrect: null }
    expect(readSelfCheck(undefined)).toEqual(defaults)
    expect(readSelfCheck({ kind: 'text', value: 'x' })).toEqual(defaults)
  })

  it('readSelfCheck maps a self-check answer, defaulting missing text', () => {
    expect(readSelfCheck({ kind: 'selfCheck', revealed: true, markedCorrect: false })).toEqual({
      text: '',
      revealed: true,
      markedCorrect: false,
    })
    expect(
      readSelfCheck({ kind: 'selfCheck', revealed: false, markedCorrect: null, text: 'abc' })
    ).toEqual({ text: 'abc', revealed: false, markedCorrect: null })
  })
})
