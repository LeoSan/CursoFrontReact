import { describe, it, expect } from 'vitest'
import {
  createJsonQuestionRepository,
  QuestionBankLoadError,
} from '@infrastructure/repositories/createJsonQuestionRepository'
import { type QuestionBank } from '@domain'

const sampleBank: QuestionBank = {
  metadata: {
    schemaVersion: '2.0',
    bookId: 'BK1',
    title: 'Book 1',
    lessonPairs: [
      { id: '11-12', label: 'Lessons 11-12', lessons: [11, 12] },
      { id: '13-14', label: 'Lessons 13-14', lessons: [13, 14] },
      { id: '15-16', label: 'Lessons 15-16', lessons: [15, 16] },
      { id: '17-18', label: 'Lessons 17-18', lessons: [17, 18] },
      { id: '19-20', label: 'Lessons 19-20', lessons: [19, 20] },
    ],
    sources: [
      { id: 'S01', name: 'Source 1' },
      { id: 'S02', name: 'Source 2' },
    ],
    totalQuestions: 60,
  },
  questions: [
    // 26 exact questions
    ...Array.from({ length: 26 }, (_, i) => ({
      id: `BK1-Q${String(i + 1).padStart(3, '0')}`,
      sourceId: i % 2 === 0 ? 'S01' : 'S02',
      lessonPairs: [
        i % 5 === 0
          ? '11-12'
          : i % 5 === 1
            ? '13-14'
            : i % 5 === 2
              ? '15-16'
              : i % 5 === 3
                ? '17-18'
                : '19-20',
      ],
      englishLevel: 'B1' as const,
      difficulty: 'Medium' as const,
      topic: `Topic ${i}`,
      skillType: 'Reading' as const,
      questionType: 'open' as const,
      gradingMode: 'exact' as const,
      instruction: 'Answer',
      prompt: `Q${i}`,
      answer: `Answer ${i}`,
      explanation: `Explanation ${i}`,
      acceptedAnswers: [`Answer ${i}`, `A${i}`],
    })),
    // 15 blanks questions
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `BK1-Q${String(26 + i + 1).padStart(3, '0')}`,
      sourceId: i % 2 === 0 ? 'S01' : 'S02',
      lessonPairs: [
        i % 5 === 0
          ? '11-12'
          : i % 5 === 1
            ? '13-14'
            : i % 5 === 2
              ? '15-16'
              : i % 5 === 3
                ? '17-18'
                : '19-20',
      ],
      englishLevel: 'A2' as const,
      difficulty: 'Easy' as const,
      topic: `Blanks ${i}`,
      skillType: 'Reading' as const,
      questionType: 'fill_blank' as const,
      gradingMode: 'blanks' as const,
      instruction: 'Fill',
      prompt: `Fill ${i}`,
      answer: `one two`,
      explanation: `Explanation`,
      template: '{{1}} {{2}}',
      blanks: [
        { id: 1, acceptedAnswers: ['one'] },
        { id: 2, acceptedAnswers: ['two'] },
      ],
    })),
    // 19 selfCheck questions
    ...Array.from({ length: 19 }, (_, i) => ({
      id: `BK1-Q${String(41 + i + 1).padStart(3, '0')}`,
      sourceId: i % 2 === 0 ? 'S01' : 'S02',
      lessonPairs: [
        i % 5 === 0
          ? '11-12'
          : i % 5 === 1
            ? '13-14'
            : i % 5 === 2
              ? '15-16'
              : i % 5 === 3
                ? '17-18'
                : '19-20',
      ],
      englishLevel: 'C1' as const,
      difficulty: 'Hard' as const,
      topic: `Essay ${i}`,
      skillType: 'Writing' as const,
      questionType: 'open' as const,
      gradingMode: 'selfCheck' as const,
      instruction: 'Write',
      prompt: `Write ${i}`,
      answer: `Model answer`,
      explanation: `Explanation`,
    })),
  ],
}

const secondBank: QuestionBank = {
  metadata: {
    schemaVersion: '2.0',
    bookId: 'BK2',
    title: 'Book 2',
    lessonPairs: [{ id: '21-22', label: 'Lessons 21-22', lessons: [21, 22] }],
    sources: [{ id: 'S03', name: 'Source 3' }],
  },
  questions: [
    {
      id: 'BK2-Q001',
      sourceId: 'S03',
      lessonPairs: ['21-22'],
      englishLevel: 'A1' as const,
      difficulty: 'Easy' as const,
      topic: 'Test',
      skillType: 'Reading' as const,
      questionType: 'open' as const,
      gradingMode: 'exact' as const,
      instruction: 'Answer',
      prompt: 'Q',
      answer: 'A',
      explanation: 'E',
      acceptedAnswers: ['A'],
    },
  ],
}

describe('createJsonQuestionRepository', () => {
  it('loads and validates a single bank', async () => {
    const loader = () => ({
      'bk1.json': sampleBank,
    })
    const repo = createJsonQuestionRepository(loader)

    const banks = await repo.getBanks()
    expect(banks).toHaveLength(1)
    expect(banks[0].metadata.bookId).toBe('BK1')
  })

  it('counts questions by gradingMode correctly', async () => {
    const loader = () => ({
      'bk1.json': sampleBank,
    })
    const repo = createJsonQuestionRepository(loader)

    const questions = await repo.getAllQuestions()
    const exact = questions.filter((q) => q.gradingMode === 'exact')
    const blanks = questions.filter((q) => q.gradingMode === 'blanks')
    const selfCheck = questions.filter((q) => q.gradingMode === 'selfCheck')

    expect(exact).toHaveLength(26)
    expect(blanks).toHaveLength(15)
    expect(selfCheck).toHaveLength(19)
  })

  it('returns lesson pairs in correct order', async () => {
    const loader = () => ({
      'bk1.json': sampleBank,
    })
    const repo = createJsonQuestionRepository(loader)

    const pairs = await repo.getLessonPairs()
    const ids = pairs.map((p) => p.id)
    expect(ids).toEqual(['11-12', '13-14', '15-16', '17-18', '19-20'])
  })

  it('merges lesson pairs from multiple banks', async () => {
    const loader = () => ({
      'bk1.json': sampleBank,
      'bk2.json': secondBank,
    })
    const repo = createJsonQuestionRepository(loader)

    const pairs = await repo.getLessonPairs()
    const ids = pairs.map((p) => p.id)
    expect(ids).toContain('11-12')
    expect(ids).toContain('21-22')
    expect(ids[ids.length - 1]).toBe('21-22')
  })

  it('only includes pairs with questions', async () => {
    const loader = () => ({
      'bk1.json': {
        ...sampleBank,
        metadata: {
          ...sampleBank.metadata,
          lessonPairs: [
            ...sampleBank.metadata.lessonPairs,
            { id: '99-100', label: 'No questions', lessons: [99, 100] },
          ],
        },
      },
    })
    const repo = createJsonQuestionRepository(loader)

    const pairs = await repo.getLessonPairs()
    const ids = pairs.map((p) => p.id)
    expect(ids).not.toContain('99-100')
  })

  it('caches result on multiple calls', async () => {
    let callCount = 0
    const loader = () => {
      callCount++
      return { 'bk1.json': sampleBank }
    }
    const repo = createJsonQuestionRepository(loader)

    await repo.getAllQuestions()
    await repo.getBanks()
    await repo.getLessonPairs()

    expect(callCount).toBe(1)
  })

  it('throws on invalid bank', async () => {
    const loader = () => ({
      'invalid.json': { metadata: {}, questions: [] },
    })
    const repo = createJsonQuestionRepository(loader)

    await expect(repo.getBanks()).rejects.toThrow(QuestionBankLoadError)
  })

  it('includes error file and question details in message', async () => {
    const invalidBank: Record<string, unknown> = {
      metadata: {
        schemaVersion: '2.0',
        bookId: 'BK1',
        title: 'Test',
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
          topic: 'Test',
          skillType: 'Reading',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Test',
          prompt: 'Test',
          answer: 'Test',
          explanation: 'Test',
          acceptedAnswers: [],
        },
      ],
    }

    const loader = () => ({
      'src/data/bad.json': invalidBank,
    })
    const repo = createJsonQuestionRepository(loader)

    try {
      await repo.getBanks()
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(QuestionBankLoadError)
      const msg = (err as Error).message
      expect(msg).toContain('src/data/bad.json')
      expect(msg).toContain('questions.0.acceptedAnswers')
      expect(msg).toContain('BK1-Q001')
      expect(msg).toContain('Exact question must have non-empty acceptedAnswers')
    }
  })
})
