import { describe, it, expect } from 'vitest'
import { gradeExam } from '@domain/services/gradeExam'
import { type Exam, type UserAnswer } from '@domain/entities'

describe('gradeExam', () => {
  describe('score calculation', () => {
    const exam: Exam = {
      id: 'E1',
      createdAt: '2026-10-15T10:00:00Z',
      config: {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 3,
        shuffle: false,
      },
      questions: [
        {
          number: 1,
          question: {
            id: 'BK1-Q001',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Time',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'What time is it?',
            answer: "It's one twenty-five.",
            explanation: 'Correct',
            acceptedAnswers: ["It's one twenty-five."],
          },
        },
        {
          number: 2,
          question: {
            id: 'BK1-Q002',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Time',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'What is your name?',
            answer: 'John',
            explanation: 'Correct',
            acceptedAnswers: ['John', 'Johnny'],
          },
        },
        {
          number: 3,
          question: {
            id: 'BK1-Q003',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Time',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Where do you live?',
            answer: 'London',
            explanation: 'Correct',
            acceptedAnswers: ['London'],
          },
        },
      ],
    }

    it('all correct gives score 100', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: "It's one twenty-five." },
        { kind: 'text', questionId: 'BK1-Q002', value: 'John' },
        { kind: 'text', questionId: 'BK1-Q003', value: 'London' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(3)
      expect(result.incorrect).toBe(0)
      expect(result.unanswered).toBe(0)
      expect(result.score).toBe(100)
    })

    it('2 correct 1 wrong gives score 67', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: "It's one twenty-five." },
        { kind: 'text', questionId: 'BK1-Q002', value: 'Wrong' },
        { kind: 'text', questionId: 'BK1-Q003', value: 'London' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(2)
      expect(result.incorrect).toBe(1)
      expect(result.unanswered).toBe(0)
      expect(result.score).toBe(67)
    })

    it('1 correct 2 unanswered gives score 33', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: "It's one twenty-five." },
        { kind: 'text', questionId: 'BK1-Q002', value: '' },
        { kind: 'text', questionId: 'BK1-Q003', value: '' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(1)
      expect(result.incorrect).toBe(0)
      expect(result.unanswered).toBe(2)
      expect(result.score).toBe(33)
    })

    it('all wrong gives score 0', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: 'Wrong' },
        { kind: 'text', questionId: 'BK1-Q002', value: 'Wrong' },
        { kind: 'text', questionId: 'BK1-Q003', value: 'Wrong' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(0)
      expect(result.incorrect).toBe(3)
      expect(result.unanswered).toBe(0)
      expect(result.score).toBe(0)
    })

    it('rounding: 1/3 rounds to 33', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: "It's one twenty-five." },
      ]
      const result = gradeExam(exam, answers)
      expect(result.score).toBe(33)
    })

    it('rounding: 2/3 rounds to 67', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'BK1-Q001', value: "It's one twenty-five." },
        { kind: 'text', questionId: 'BK1-Q002', value: 'John' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.score).toBe(67)
    })
  })

  describe('empty exam', () => {
    const emptyExam: Exam = {
      id: 'E-empty',
      createdAt: '2026-10-15T10:00:00Z',
      config: {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 0,
        shuffle: false,
      },
      questions: [],
    }

    it('empty exam with no answers gives score 0', () => {
      const result = gradeExam(emptyExam, [])
      expect(result.total).toBe(0)
      expect(result.correct).toBe(0)
      expect(result.incorrect).toBe(0)
      expect(result.unanswered).toBe(0)
      expect(result.score).toBe(0)
    })
  })

  describe('duplicate answers', () => {
    const exam: Exam = {
      id: 'E2',
      createdAt: '2026-10-15T10:00:00Z',
      config: {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      questions: [
        {
          number: 1,
          question: {
            id: 'Q-dup',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Test',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Test?',
            answer: 'yes',
            explanation: 'Correct',
            acceptedAnswers: ['yes'],
          },
        },
      ],
    }

    it('last answer wins if duplicate questionIds', () => {
      const answers: UserAnswer[] = [
        { kind: 'text', questionId: 'Q-dup', value: 'no' },
        { kind: 'text', questionId: 'Q-dup', value: 'yes' },
      ]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(1)
      expect(result.score).toBe(100)
    })
  })

  describe('missing answers', () => {
    const exam: Exam = {
      id: 'E3',
      createdAt: '2026-10-15T10:00:00Z',
      config: {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 3,
        shuffle: false,
      },
      questions: [
        {
          number: 1,
          question: {
            id: 'Q1',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Test',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Q1?',
            answer: 'a1',
            explanation: 'Correct',
            acceptedAnswers: ['a1'],
          },
        },
        {
          number: 2,
          question: {
            id: 'Q2',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Test',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Q2?',
            answer: 'a2',
            explanation: 'Correct',
            acceptedAnswers: ['a2'],
          },
        },
        {
          number: 3,
          question: {
            id: 'Q3',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Test',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Q3?',
            answer: 'a3',
            explanation: 'Correct',
            acceptedAnswers: ['a3'],
          },
        },
      ],
    }

    it('no answers for any question gives all unanswered', () => {
      const result = gradeExam(exam, [])
      expect(result.correct).toBe(0)
      expect(result.incorrect).toBe(0)
      expect(result.unanswered).toBe(3)
      expect(result.score).toBe(0)
    })

    it('only one answer provided for first question', () => {
      const answers: UserAnswer[] = [{ kind: 'text', questionId: 'Q1', value: 'a1' }]
      const result = gradeExam(exam, answers)
      expect(result.correct).toBe(1)
      expect(result.incorrect).toBe(0)
      expect(result.unanswered).toBe(2)
      expect(result.score).toBe(33)
    })
  })

  describe('result structure', () => {
    const exam: Exam = {
      id: 'E-result',
      createdAt: '2026-10-15T10:00:00Z',
      config: {
        selectedPairIds: ['17-18'],
        levels: [],
        difficulties: [],
        questionCount: 1,
        shuffle: false,
      },
      questions: [
        {
          number: 1,
          question: {
            id: 'Q-result',
            sourceId: 'S1',
            lessonPairs: ['17-18'],
            englishLevel: 'A1',
            difficulty: 'Easy',
            topic: 'Test',
            skillType: 'Speaking',
            questionType: 'open',
            gradingMode: 'exact',
            instruction: 'Answer',
            prompt: 'Test?',
            answer: 'yes',
            explanation: 'Correct',
            acceptedAnswers: ['yes'],
          },
        },
      ],
    }

    it('result has correct examId', () => {
      const answers: UserAnswer[] = [{ kind: 'text', questionId: 'Q-result', value: 'yes' }]
      const result = gradeExam(exam, answers)
      expect(result.examId).toBe('E-result')
    })

    it('result.results array has one QuestionResult', () => {
      const answers: UserAnswer[] = [{ kind: 'text', questionId: 'Q-result', value: 'yes' }]
      const result = gradeExam(exam, answers)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].correct).toBe(true)
    })
  })
})
