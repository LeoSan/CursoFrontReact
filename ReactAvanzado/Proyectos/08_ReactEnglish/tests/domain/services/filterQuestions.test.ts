import { describe, it, expect } from 'vitest'
import { filterQuestions } from '@domain/services/filterQuestions'
import { type Question } from '@domain/entities'

describe('filterQuestions', () => {
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

  const q3Review: Question = {
    ...q1,
    id: 'BK1-Q003',
    lessonPairs: ['11-12', '13-14', '15-16', '17-18', '19-20'],
    englishLevel: 'A2',
  }

  const questions = [q1, q2, q3Review]

  it('pair union: ["17-18","19-20"] includes both specific and review', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18', '19-20'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(3)
  })

  it('single pair: ["17-18"] includes specific and review with that pair', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(2)
    expect(result).toContain(q1)
    expect(result).toContain(q3Review)
  })

  it('empty pairs returns []', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: [],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(0)
  })

  it('level filter', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: ['A1'],
      difficulties: [],
    })
    expect(result.map((q) => q.id)).toEqual(['BK1-Q001'])
  })

  it('difficulty filter', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18', '19-20'],
      levels: [],
      difficulties: ['Easy'],
    })
    expect(result.map((q) => q.id)).toEqual(['BK1-Q001', 'BK1-Q003'])
  })

  it('level and difficulty combine (AND semantics)', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: ['A1'],
      difficulties: ['Easy'],
    })
    expect(result.map((q) => q.id)).toEqual(['BK1-Q001'])
  })

  it('preserves original order', () => {
    const unsorted = [q2, q1, q3Review]
    const result = filterQuestions(unsorted, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(result).toEqual([q1, q3Review])
  })

  it('empty levels means no level restriction', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(2)
  })

  it('empty difficulties means no difficulty restriction', () => {
    const result = filterQuestions(questions, {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
    })
    expect(result).toHaveLength(2)
  })
})
