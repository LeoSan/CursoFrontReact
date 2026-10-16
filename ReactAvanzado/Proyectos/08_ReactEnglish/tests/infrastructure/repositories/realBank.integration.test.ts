import { describe, it, expect } from 'vitest'
import { questionRepository } from '@infrastructure/repositories/bundledBanks'
import {
  filterQuestions,
  getFilterCounts,
  countAvailable,
  generateExam,
  createSeededRandom,
  type GenerateExamDeps,
} from '@domain'

describe('Real bank integration', () => {
  it('loads all questions through repository', async () => {
    const questions = await questionRepository.getAllQuestions()
    expect(questions).toHaveLength(60)
  })

  it('filterQuestions pair "17-18" returns 33', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(33)
  })

  it('filterQuestions pair "19-20" returns 39', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['19-20'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(39)
  })

  it('filterQuestions pair "11-12" returns 12 with all having all 5 pairs', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['11-12'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(12)
    const allHaveFivePairs = result.every((q) => q.lessonPairs.length === 5)
    expect(allHaveFivePairs).toBe(true)
  })

  it('union ["17-18","19-20"] returns 60 with no duplicates', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18', '19-20'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(60)
    const ids = new Set(result.map((q) => q.id))
    expect(ids.size).toBe(60)
  })

  it('empty selectedPairIds returns 0', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: [],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(0)
  })

  it('level filter reduces result and only returns matching levels', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: ['A1'],
      difficulties: [],
    })
    expect(result.length).toBeLessThan(33)
    const allA1 = result.every((q) => q.englishLevel === 'A1')
    expect(allA1).toBe(true)
  })

  it('difficulty filter reduces result and only returns matching difficulties', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: ['Easy'],
    })
    expect(result.length).toBeLessThan(33)
    const allEasy = result.every((q) => q.difficulty === 'Easy')
    expect(allEasy).toBe(true)
  })

  it('getFilterCounts for pair "17-18": sums equal countAvailable', async () => {
    const questions = await questionRepository.getAllQuestions()
    const counts = getFilterCounts(questions, ['17-18'])
    const levelSum = Object.values(counts.levels).reduce((a, b) => a + b, 0)
    const difficultySum = Object.values(counts.difficulties).reduce((a, b) => a + b, 0)
    const available = countAvailable(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(levelSum).toBe(available)
    expect(difficultySum).toBe(available)
  })

  it('generateExam count 10 shuffle true: returns 10 numbered 1..10 with no duplicates', async () => {
    const questions = await questionRepository.getAllQuestions()
    const deps: GenerateExamDeps = {
      random: createSeededRandom(42),
      now: () => '2026-10-15T10:00:00Z',
      newId: () => 'exam-1',
    }
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18', '19-20'],
        levels: [],
        difficulties: [],
        questionCount: 10,
        shuffle: true,
      },
      deps
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.exam.questions).toHaveLength(10)
      const numbers = result.exam.questions.map((q) => q.number)
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const ids = new Set(result.exam.questions.map((q) => q.question.id))
      expect(ids.size).toBe(10)
    }
  })

  it('generateExam same seed returns same ids in same order', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result1 = generateExam(
      questions,
      {
        selectedPairIds: ['17-18', '19-20'],
        levels: [],
        difficulties: [],
        questionCount: 10,
        shuffle: true,
      },
      {
        random: createSeededRandom(42),
        now: () => '2026-10-15T10:00:00Z',
        newId: () => 'exam-1',
      }
    )

    const result2 = generateExam(
      questions,
      {
        selectedPairIds: ['17-18', '19-20'],
        levels: [],
        difficulties: [],
        questionCount: 10,
        shuffle: true,
      },
      {
        random: createSeededRandom(42),
        now: () => '2026-10-15T10:00:00Z',
        newId: () => 'exam-2',
      }
    )

    expect(result1.ok).toBe(true)
    expect(result2.ok).toBe(true)
    if (result1.ok && result2.ok) {
      const ids1 = result1.exam.questions.map((q) => q.question.id)
      const ids2 = result2.exam.questions.map((q) => q.question.id)
      expect(ids1).toEqual(ids2)
    }
  })

  it('generateExam count 500 returns reducedToAvailable true', async () => {
    const questions = await questionRepository.getAllQuestions()
    const result = generateExam(
      questions,
      {
        selectedPairIds: ['17-18', '19-20'],
        levels: [],
        difficulties: [],
        questionCount: 500,
        shuffle: false,
      },
      {
        random: () => Math.random(),
        now: () => new Date().toISOString(),
        newId: () => Math.random().toString(),
      }
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.reducedToAvailable).toBe(true)
      expect(result.availableCount).toBe(60)
    }
  })
})
