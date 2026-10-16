import { describe, it, expect } from 'vitest'
import { createLoadExamSetup } from '@application/usecases/loadExamSetup'
import { type IQuestionRepository, type QuestionBank } from '@domain'

describe('createLoadExamSetup', () => {
  const mockBank: QuestionBank = {
    metadata: {
      schemaVersion: '2.0',
      bookId: 'BK1',
      title: 'Book 1',
      lessonPairs: [
        { id: '1-2', label: 'Lessons 1-2', lessons: [1, 2] },
        { id: '3-4', label: 'Lessons 3-4', lessons: [3, 4] },
      ],
      sources: [],
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
        prompt: 'Hello',
        answer: 'Hi',
        explanation: 'Correct',
        acceptedAnswers: ['Hi'],
      },
    ],
  }

  const mockBank2: QuestionBank = {
    metadata: {
      schemaVersion: '2.0',
      bookId: 'BK2',
      title: 'Book 2',
      lessonPairs: [
        { id: '3-4', label: 'Lessons 3-4', lessons: [3, 4] },
        { id: '5-6', label: 'Lessons 5-6', lessons: [5, 6] },
      ],
      sources: [],
    },
    questions: [
      {
        id: 'BK2-Q001',
        sourceId: 'S2',
        lessonPairs: ['5-6'],
        englishLevel: 'A2',
        difficulty: 'Easy',
        topic: 'Numbers',
        skillType: 'Listening',
        questionType: 'open',
        gradingMode: 'exact' as const,
        instruction: 'Answer',
        prompt: 'Count to 5',
        answer: '1 2 3 4 5',
        explanation: 'Correct',
        acceptedAnswers: ['1 2 3 4 5'],
      },
    ],
  }

  it('returns pairs and questions from repository', async () => {
    const mockRepo: IQuestionRepository = {
      async getBanks() {
        return [mockBank, mockBank2]
      },
      async getAllQuestions() {
        return mockBank.questions.concat(mockBank2.questions)
      },
      async getLessonPairs() {
        return []
      },
    }

    const loadExamSetup = createLoadExamSetup({ questionRepository: mockRepo })
    const result = await loadExamSetup()

    expect(result.pairs).toHaveLength(3) // 1-2, 3-4, 5-6
    expect(result.questions).toHaveLength(2)
  })

  it('deduplicates lesson pairs with the same id', async () => {
    const mockRepo: IQuestionRepository = {
      async getBanks() {
        return [mockBank, mockBank2]
      },
      async getAllQuestions() {
        return mockBank.questions.concat(mockBank2.questions)
      },
      async getLessonPairs() {
        return []
      },
    }

    const loadExamSetup = createLoadExamSetup({ questionRepository: mockRepo })
    const result = await loadExamSetup()

    const pairIds = result.pairs.map((p) => p.id)
    const uniqueIds = new Set(pairIds)
    expect(uniqueIds.size).toBe(pairIds.length)
  })
})
