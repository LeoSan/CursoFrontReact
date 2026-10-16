import { describe, it, expect } from 'vitest'
import {
  validateQuestionBank,
  validateQuestionBanks,
} from '@infrastructure/schemas/validateQuestionBanks'

const validBank = {
  metadata: {
    schemaVersion: '2.0' as const,
    bookId: 'BK1',
    title: 'Test',
    lessonPairs: [{ id: '1-2', label: 'Lessons 1-2', lessons: [1, 2] as const }],
    sources: [{ id: 'S1', name: 'Source 1' }],
    totalQuestions: 1,
  },
  questions: [
    {
      id: 'BK1-Q001',
      sourceId: 'S1',
      lessonPairs: ['1-2'],
      englishLevel: 'A1' as const,
      difficulty: 'Easy' as const,
      topic: 'Test',
      skillType: 'Reading' as const,
      questionType: 'open' as const,
      gradingMode: 'exact' as const,
      instruction: 'Test',
      prompt: 'Test',
      answer: 'Test',
      explanation: 'Test',
      acceptedAnswers: ['Test'],
    },
  ],
}

describe('validateQuestionBank', () => {
  it('accepts valid bank', () => {
    const result = validateQuestionBank(validBank, 'test.json')
    expect(result.valid).toBe(true)
  })

  it('rejects unknown sourceId', () => {
    const invalid = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          sourceId: 'UNKNOWN',
        },
      ],
    }
    const result = validateQuestionBank(invalid, 'test.json')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      const issue = result.issues.find((i) => i.message.includes('sourceId'))
      expect(issue).toBeDefined()
    }
  })

  it('rejects unknown lessonPair', () => {
    const invalid = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          lessonPairs: ['99-100'],
        },
      ],
    }
    const result = validateQuestionBank(invalid, 'test.json')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      const issue = result.issues.find((i) => i.message.includes('lessonPair'))
      expect(issue).toBeDefined()
    }
  })
})

describe('validateQuestionBanks', () => {
  it('detects duplicate question IDs', () => {
    const bank2 = {
      ...validBank,
      metadata: {
        ...validBank.metadata,
        bookId: 'BK2',
      },
      questions: [
        {
          ...validBank.questions[0],
          id: 'BK1-Q001', // Duplicate!
        },
      ],
    }
    const banks = new Map([
      ['bk1.json', { bank: validBank }],
      ['bk2.json', { bank: bank2 }],
    ])
    const issues = validateQuestionBanks(banks)
    const duplicate = issues.find((i) => i.message.includes('Duplicate question'))
    expect(duplicate).toBeDefined()
  })

  it('detects duplicate bookIds', () => {
    const bank2 = {
      ...validBank,
      metadata: {
        ...validBank.metadata,
        bookId: 'BK1', // Duplicate!
      },
    }
    const banks = new Map([
      ['bk1.json', { bank: validBank }],
      ['bk2.json', { bank: bank2 }],
    ])
    const issues = validateQuestionBanks(banks)
    const duplicate = issues.find((i) => i.message.includes('Duplicate bookId'))
    expect(duplicate).toBeDefined()
  })
})
