import { describe, it, expect } from 'vitest'
import { gradeQuestion } from '@domain/services/gradeQuestion'
import { type Question } from '@domain/entities'

describe('gradeQuestion', () => {
  describe('exact grading', () => {
    const exactQuestion: Question = {
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
      acceptedAnswers: ["It's one twenty-five.", "It's one and twenty-five minutes."],
    }

    it('correct answer', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: "It's one twenty-five.",
      })
      expect(result.correct).toBe(true)
    })

    it('wrong answer', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: 'One twenty-five',
      })
      expect(result.correct).toBe(false)
    })

    it('different case is incorrect', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: "it's one twenty-five.",
      })
      expect(result.correct).toBe(false)
    })

    it('missing final period is incorrect', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: "It's one twenty-five",
      })
      expect(result.correct).toBe(false)
    })

    it('extra inner spaces are correct (collapsed by normalize)', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: "It's  one   twenty-five.",
      })
      expect(result.correct).toBe(true)
    })

    it('second accepted answer is correct', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: "It's one and twenty-five minutes.",
      })
      expect(result.correct).toBe(true)
    })

    it('empty answer gives null', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'text',
        questionId: exactQuestion.id,
        value: '',
      })
      expect(result.correct).toBeNull()
    })

    it('undefined answer gives null', () => {
      const result = gradeQuestion(exactQuestion, undefined)
      expect(result.correct).toBeNull()
    })

    it('wrong answer kind gives null', () => {
      const result = gradeQuestion(exactQuestion, {
        kind: 'blanks',
        questionId: exactQuestion.id,
        values: {},
      })
      expect(result.correct).toBeNull()
    })
  })

  describe('blanks grading', () => {
    const blanksQuestion: Question = {
      id: 'BK1-Q044',
      sourceId: 'S1',
      lessonPairs: ['17-18'],
      englishLevel: 'B1',
      difficulty: 'Medium',
      topic: 'Quantities',
      skillType: 'Grammar',
      questionType: 'fill_blank',
      gradingMode: 'blanks',
      instruction: 'Fill',
      prompt: 'There are {{1}} apples.',
      answer: 'many',
      explanation: 'Correct',
      template: 'There are {{1}} apples.',
      blanks: [
        {
          id: 1,
          acceptedAnswers: ['many', 'a lot of'],
        },
      ],
    }

    it('all blanks correct', () => {
      const result = gradeQuestion(blanksQuestion, {
        kind: 'blanks',
        questionId: blanksQuestion.id,
        values: { 1: 'many' },
      })
      expect(result.correct).toBe(true)
      expect(result.blankResults).toEqual({ 1: true })
    })

    it('alternative accepted answer is correct', () => {
      const result = gradeQuestion(blanksQuestion, {
        kind: 'blanks',
        questionId: blanksQuestion.id,
        values: { 1: 'a lot of' },
      })
      expect(result.correct).toBe(true)
    })

    it('one blank wrong gives false with correct blankResults', () => {
      const multiBlankQuestion: Question = {
        ...blanksQuestion,
        prompt: 'I {{1}} to school {{2}}.',
        template: 'I {{1}} to school {{2}}.',
        blanks: [
          { id: 1, acceptedAnswers: ['go', 'went'] },
          { id: 2, acceptedAnswers: ['yesterday', 'last week'] },
        ],
      }
      const result = gradeQuestion(multiBlankQuestion, {
        kind: 'blanks',
        questionId: multiBlankQuestion.id,
        values: { 1: 'go', 2: 'tomorrow' },
      })
      expect(result.correct).toBe(false)
      expect(result.blankResults).toEqual({ 1: true, 2: false })
    })

    it('one empty and one right gives false (not null)', () => {
      const multiBlankQuestion: Question = {
        ...blanksQuestion,
        prompt: 'I {{1}} to school {{2}}.',
        template: 'I {{1}} to school {{2}}.',
        blanks: [
          { id: 1, acceptedAnswers: ['go', 'went'] },
          { id: 2, acceptedAnswers: ['yesterday', 'last week'] },
        ],
      }
      const result = gradeQuestion(multiBlankQuestion, {
        kind: 'blanks',
        questionId: multiBlankQuestion.id,
        values: { 1: 'go', 2: '' },
      })
      expect(result.correct).toBe(false)
      expect(result.blankResults).toEqual({ 1: true, 2: false })
    })

    it('all blanks empty gives null without blankResults', () => {
      const result = gradeQuestion(blanksQuestion, {
        kind: 'blanks',
        questionId: blanksQuestion.id,
        values: { 1: '' },
      })
      expect(result.correct).toBeNull()
      expect(result.blankResults).toBeUndefined()
    })

    it('wrong answer kind gives null', () => {
      const result = gradeQuestion(blanksQuestion, {
        kind: 'text',
        questionId: blanksQuestion.id,
        value: 'many',
      })
      expect(result.correct).toBeNull()
    })
  })

  describe('selfCheck grading', () => {
    const selfCheckQuestion: Question = {
      id: 'BK1-Q050',
      sourceId: 'S1',
      lessonPairs: ['19-20'],
      englishLevel: 'C1',
      difficulty: 'Hard',
      topic: 'Essay',
      skillType: 'Writing',
      questionType: 'open',
      gradingMode: 'selfCheck',
      instruction: 'Write',
      prompt: 'Write an essay',
      answer: 'Model answer',
      explanation: 'Correct',
    }

    it('marked correct', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: false,
        markedCorrect: true,
      })
      expect(result.correct).toBe(true)
    })

    it('marked incorrect', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: false,
        markedCorrect: false,
      })
      expect(result.correct).toBe(false)
    })

    it('not marked gives null', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: false,
        markedCorrect: null,
      })
      expect(result.correct).toBeNull()
    })

    it('revealed with not marked gives null', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: true,
        markedCorrect: null,
      })
      expect(result.correct).toBeNull()
    })

    it('wrong answer kind gives null', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'text',
        questionId: selfCheckQuestion.id,
        value: 'Essay',
      })
      expect(result.correct).toBeNull()
    })

    it('ignores the student text: not marked stays null', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: true,
        markedCorrect: null,
        text: 'Model answer',
      })
      expect(result.correct).toBeNull()
    })

    it('ignores the student text: marked incorrect stays false even if text equals the answer', () => {
      const result = gradeQuestion(selfCheckQuestion, {
        kind: 'selfCheck',
        questionId: selfCheckQuestion.id,
        revealed: true,
        markedCorrect: false,
        text: 'Model answer',
      })
      expect(result.correct).toBe(false)
    })
  })
})
