import { describe, it, expect } from 'vitest'
import { questionBankSchema } from '@infrastructure/schemas/questionBankSchema'

// Test parsing valid data
const validData = {
  metadata: {
    schemaVersion: '2.0',
    bookId: 'BK1',
    title: 'Test Book',
    lessonPairs: [{ id: '1-2', label: 'Lessons 1-2', lessons: [1, 2] }],
    sources: [{ id: 'S1', name: 'Source 1' }],
  },
  questions: [
    {
      id: 'BK1-Q001',
      sourceId: 'S1',
      lessonPairs: ['1-2'],
      englishLevel: 'A1',
      difficulty: 'Easy',
      topic: 'Greetings',
      skillType: 'Speaking',
      questionType: 'open',
      gradingMode: 'exact' as const,
      instruction: 'Answer',
      prompt: 'Say hello',
      answer: 'Hello',
      explanation: 'Say hello',
      acceptedAnswers: ['Hello', 'Hi'],
    },
    {
      id: 'BK1-Q002',
      sourceId: 'S1',
      lessonPairs: ['1-2'],
      englishLevel: 'A1',
      difficulty: 'Easy',
      topic: 'Counting',
      skillType: 'Reading',
      questionType: 'fill_blank' as const,
      gradingMode: 'blanks' as const,
      instruction: 'Fill in',
      prompt: 'Complete',
      answer: 'one two',
      explanation: 'Numbers',
      template: '{{1}} {{2}}',
      blanks: [
        { id: 1, acceptedAnswers: ['one'] },
        { id: 2, acceptedAnswers: ['two'] },
      ],
    },
  ],
}

describe('questionBankSchema', () => {
  it('parses valid data', () => {
    const result = questionBankSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata.bookId).toBe('BK1')
      expect(result.data.questions).toHaveLength(2)
    }
  })

  it('rejects exact question without acceptedAnswers', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[0],
          acceptedAnswers: undefined,
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects template with unmatched marker', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[1],
          template: '{{1}} {{3}}',
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects fill_blank without template', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[1],
          template: undefined,
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects mismatched question ID prefix', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[0],
          id: 'WRONG-Q001',
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('parses all three question types', () => {
    const result = questionBankSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.questions[0].gradingMode).toBe('exact')
      expect(result.data.questions[1].gradingMode).toBe('blanks')
    }
  })

  it('accepts valid lesson pair format 17-18 in metadata', () => {
    const valid = {
      ...validData,
      metadata: {
        ...validData.metadata,
        lessonPairs: [{ id: '17-18', label: 'Lessons 17-18', lessons: [17, 18] }],
      },
      questions: [
        {
          ...validData.questions[0],
          lessonPairs: ['17-18'],
        },
      ],
    }
    const result = questionBankSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects invalid lesson pair format 17_18 in metadata', () => {
    const invalid = {
      ...validData,
      metadata: {
        ...validData.metadata,
        lessonPairs: [{ id: '17_18', label: 'Lessons 17-18', lessons: [17, 18] }],
      },
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects invalid lesson pair format abc in question', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[0],
          lessonPairs: ['abc'],
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects incomplete lesson pair format 17- in question', () => {
    const invalid = {
      ...validData,
      questions: [
        {
          ...validData.questions[0],
          lessonPairs: ['17-'],
        },
      ],
    }
    const result = questionBankSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
