import { describe, it, expect } from 'vitest'
import { isAnswerEmpty } from '@domain/services/isAnswerEmpty'

describe('isAnswerEmpty', () => {
  describe('undefined answer', () => {
    it('undefined is empty', () => {
      expect(isAnswerEmpty(undefined)).toBe(true)
    })
  })

  describe('text answer', () => {
    it('empty string is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: '',
        })
      ).toBe(true)
    })

    it('whitespace-only string is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: '   ',
        })
      ).toBe(true)
    })

    it('tab-only string is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: '\t\t',
        })
      ).toBe(true)
    })

    it('non-breaking space is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: ' ',
        })
      ).toBe(true)
    })

    it('text with content is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: 'hello',
        })
      ).toBe(false)
    })

    it('text with mixed whitespace and content is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'text',
          questionId: 'Q1',
          value: '  hello  ',
        })
      ).toBe(false)
    })
  })

  describe('blanks answer', () => {
    it('all blanks empty is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'blanks',
          questionId: 'Q1',
          values: { 1: '', 2: '', 3: '' },
        })
      ).toBe(true)
    })

    it('all blanks whitespace is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'blanks',
          questionId: 'Q1',
          values: { 1: '   ', 2: '\t', 3: '' },
        })
      ).toBe(true)
    })

    it('one blank with content is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'blanks',
          questionId: 'Q1',
          values: { 1: '', 2: 'hello', 3: '' },
        })
      ).toBe(false)
    })

    it('all blanks with content is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'blanks',
          questionId: 'Q1',
          values: { 1: 'a', 2: 'b', 3: 'c' },
        })
      ).toBe(false)
    })

    it('empty object is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'blanks',
          questionId: 'Q1',
          values: {},
        })
      ).toBe(true)
    })
  })

  describe('selfCheck answer', () => {
    it('markedCorrect null is empty even when it has text', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: true,
          markedCorrect: null,
          text: 'I wrote something',
        })
      ).toBe(true)
    })

    it('markedCorrect null is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: false,
          markedCorrect: null,
        })
      ).toBe(true)
    })

    it('markedCorrect true is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: false,
          markedCorrect: true,
        })
      ).toBe(false)
    })

    it('markedCorrect false is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: false,
          markedCorrect: false,
        })
      ).toBe(false)
    })

    it('revealed true with markedCorrect null is empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: true,
          markedCorrect: null,
        })
      ).toBe(true)
    })

    it('revealed true with markedCorrect true is not empty', () => {
      expect(
        isAnswerEmpty({
          kind: 'selfCheck',
          questionId: 'Q1',
          revealed: true,
          markedCorrect: true,
        })
      ).toBe(false)
    })
  })
})
