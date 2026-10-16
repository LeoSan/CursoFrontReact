import { describe, expect, it } from 'vitest'
import {
  blankWidthCh,
  MAX_BLANK_WIDTH_CH,
  MIN_BLANK_WIDTH_CH,
} from '@presentation/components/question/blankWidth'

describe('blankWidthCh', () => {
  it('returns the minimum for an undefined blank', () => {
    expect(blankWidthCh(undefined)).toBe(MIN_BLANK_WIDTH_CH)
  })

  it('clamps short answers up to the minimum', () => {
    expect(blankWidthCh({ id: 1, acceptedAnswers: ['a'] })).toBe(MIN_BLANK_WIDTH_CH)
  })

  it('clamps long answers down to the maximum', () => {
    expect(blankWidthCh({ id: 1, acceptedAnswers: ['x'.repeat(60)] })).toBe(MAX_BLANK_WIDTH_CH)
  })

  it('uses the longest accepted answer within the range', () => {
    expect(blankWidthCh({ id: 1, acceptedAnswers: ['ab', 'abcdefghij'] })).toBe(10)
  })
})
