import { describe, it, expect } from 'vitest'
import { questionRepository } from '@infrastructure/repositories/bundledBanks'
import {
  gradeQuestion,
  gradeExam,
  generateExam,
  createSeededRandom,
  type GenerateExamDeps,
} from '@domain'

describe('Real bank grading integration', () => {
  describe('BK1-Q004 exact grading', () => {
    it('grades "It\'s one twenty-five." as correct', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q004 = questions.find((q) => q.id === 'BK1-Q004')
      expect(q004).toBeDefined()
      if (!q004) return

      const result = gradeQuestion(q004, {
        kind: 'text',
        questionId: q004.id,
        value: "It's one twenty-five.",
      })
      expect(result.correct).toBe(true)
    })

    it('grades "It\'s twenty-five past one." as correct (alternative answer)', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q004 = questions.find((q) => q.id === 'BK1-Q004')
      expect(q004).toBeDefined()
      if (!q004) return

      const result = gradeQuestion(q004, {
        kind: 'text',
        questionId: q004.id,
        value: "It's twenty-five past one.",
      })
      expect(result.correct).toBe(true)
    })

    it('grades "its one twenty-five" as incorrect (lowercase its)', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q004 = questions.find((q) => q.id === 'BK1-Q004')
      expect(q004).toBeDefined()
      if (!q004) return

      const result = gradeQuestion(q004, {
        kind: 'text',
        questionId: q004.id,
        value: 'its one twenty-five',
      })
      expect(result.correct).toBe(false)
    })
  })

  describe('BK1-Q025 exact grading', () => {
    it('grades "It\'s three oh eight." as correct', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q025 = questions.find((q) => q.id === 'BK1-Q025')
      expect(q025).toBeDefined()
      if (!q025) return

      const result = gradeQuestion(q025, {
        kind: 'text',
        questionId: q025.id,
        value: "It's three oh eight.",
      })
      expect(result.correct).toBe(true)
    })

    it("grades \"It's three o'eight.\" as correct (o'eight alternative)", async () => {
      const questions = await questionRepository.getAllQuestions()
      const q025 = questions.find((q) => q.id === 'BK1-Q025')
      expect(q025).toBeDefined()
      if (!q025) return

      const result = gradeQuestion(q025, {
        kind: 'text',
        questionId: q025.id,
        value: "It's three o'eight.",
      })
      expect(result.correct).toBe(true)
    })
  })

  describe('BK1-Q044 blanks grading', () => {
    it('grades "many" as correct', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q044 = questions.find((q) => q.id === 'BK1-Q044')
      expect(q044).toBeDefined()
      if (!q044) return

      const result = gradeQuestion(q044, {
        kind: 'blanks',
        questionId: q044.id,
        values: { 1: 'many' },
      })
      expect(result.correct).toBe(true)
    })

    it('grades "a lot of" as correct (alternative answer)', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q044 = questions.find((q) => q.id === 'BK1-Q044')
      expect(q044).toBeDefined()
      if (!q044) return

      const result = gradeQuestion(q044, {
        kind: 'blanks',
        questionId: q044.id,
        values: { 1: 'a lot of' },
      })
      expect(result.correct).toBe(true)
    })
  })

  describe('BK1-Q037 multi-blank grading', () => {
    it('grades all blanks correct when using proper tenses', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q037 = questions.find((q) => q.id === 'BK1-Q037')
      expect(q037).toBeDefined()
      if (!q037 || q037.gradingMode !== 'blanks') return

      // All three blanks correct: grew (past), grown (participle), growing (gerund)
      const result = gradeQuestion(q037, {
        kind: 'blanks',
        questionId: q037.id,
        values: { 1: 'grew', 2: 'grown', 3: 'growing' },
      })
      expect(result.correct).toBe(true)
    })

    it('has correct blankResults when one blank is wrong', async () => {
      const questions = await questionRepository.getAllQuestions()
      const q037 = questions.find((q) => q.id === 'BK1-Q037')
      expect(q037).toBeDefined()
      if (!q037 || q037.gradingMode !== 'blanks') return

      const result = gradeQuestion(q037, {
        kind: 'blanks',
        questionId: q037.id,
        values: { 1: 'grew', 2: 'wrong', 3: 'growing' },
      })
      expect(result.correct).toBe(false)
      expect(result.blankResults).toBeDefined()
      if (result.blankResults) {
        expect(result.blankResults[1]).toBe(true)
        expect(result.blankResults[2]).toBe(false)
        expect(result.blankResults[3]).toBe(true)
      }
    })
  })

  describe('Full bank exam with all unanswered', () => {
    it('whole bank with all answers empty: unanswered=60, score=0', async () => {
      const questions = await questionRepository.getAllQuestions()
      const deps: GenerateExamDeps = {
        random: createSeededRandom(42),
        now: () => '2026-10-15T10:00:00Z',
        newId: () => 'exam-all-unanswered',
      }
      const examResult = generateExam(
        questions,
        {
          selectedPairIds: ['17-18', '19-20'],
          levels: [],
          difficulties: [],
          questionCount: 60,
          shuffle: false,
        },
        deps
      )

      expect(examResult.ok).toBe(true)
      if (!examResult.ok) return

      const exam = examResult.exam
      const emptyAnswers = exam.questions.map((q) => ({
        kind: 'text' as const,
        questionId: q.question.id,
        value: '',
      }))

      const gradeResult = gradeExam(exam, emptyAnswers)
      expect(gradeResult.unanswered).toBe(60)
      expect(gradeResult.correct).toBe(0)
      expect(gradeResult.incorrect).toBe(0)
      expect(gradeResult.score).toBe(0)
    })
  })
})
