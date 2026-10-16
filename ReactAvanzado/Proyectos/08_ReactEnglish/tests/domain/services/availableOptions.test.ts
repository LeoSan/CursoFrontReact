import { describe, it, expect } from 'vitest'
import { countAvailable, getFilterCounts } from '@domain/services/availableOptions'
import { type Question } from '@domain/entities'

describe('availableOptions', () => {
  const q1: Question = {
    id: 'BK1-Q001',
    sourceId: 'S1',
    lessonPairs: ['17-18'],
    englishLevel: 'A1',
    difficulty: 'Easy',
    topic: 'Topic 1',
    skillType: 'Reading',
    questionType: 'open',
    gradingMode: 'exact',
    instruction: 'Answer',
    prompt: 'Test',
    answer: 'Answer',
    explanation: 'Exp',
    acceptedAnswers: ['Answer'],
  }

  const q2: Question = {
    ...q1,
    id: 'BK1-Q002',
    lessonPairs: ['19-20'],
    englishLevel: 'B1',
    difficulty: 'Medium',
  }

  const q3: Question = {
    ...q1,
    id: 'BK1-Q003',
    lessonPairs: ['17-18'],
    englishLevel: 'A2',
    difficulty: 'Medium',
  }

  const questions = [q1, q2, q3]

  it('countAvailable', () => {
    const count = countAvailable(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(count).toBe(2)
  })

  it('getFilterCounts: all keys present even with 0 count', () => {
    const counts = getFilterCounts(questions, ['99-100'])
    expect(counts.levels).toEqual({
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    })
    expect(counts.difficulties).toEqual({
      Easy: 0,
      Medium: 0,
      Hard: 0,
    })
  })

  it('getFilterCounts: counts only in selectedPairIds', () => {
    const counts = getFilterCounts(questions, ['17-18'])
    expect(counts.levels).toEqual({
      A1: 1,
      A2: 1,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    })
    expect(counts.difficulties).toEqual({
      Easy: 1,
      Medium: 1,
      Hard: 0,
    })
  })

  it('countAvailable consistency with getFilterCounts sum', () => {
    const count = countAvailable(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    const counts = getFilterCounts(questions, ['17-18'])
    const sum = Object.values(counts.levels).reduce((a, b) => a + b, 0)
    expect(count).toBe(sum)
  })

  it('empty selectedPairIds returns 0 for all', () => {
    const counts = getFilterCounts(questions, [])
    expect(Object.values(counts.levels).every((v) => v === 0)).toBe(true)
    expect(Object.values(counts.difficulties).every((v) => v === 0)).toBe(true)
  })
})
