import { describe, it, expect } from 'vitest'
import {
  isExactQuestion,
  isBlanksQuestion,
  isSelfCheckQuestion,
  type ExactQuestion,
  type BlanksQuestion,
  type SelfCheckQuestion,
} from '@domain'

describe('Question type guards', () => {
  const exactQuestion: ExactQuestion = {
    id: 'BK1-Q001',
    sourceId: 'S01',
    lessonPairs: ['17-18'],
    englishLevel: 'B1',
    difficulty: 'Medium',
    topic: 'Time expressions',
    skillType: 'Writing',
    questionType: 'open',
    gradingMode: 'exact',
    instruction: 'Write your answer',
    prompt: 'What time is it?',
    answer: "It is 3 o'clock.",
    explanation: 'Use the time format "It is X o\'clock."',
    acceptedAnswers: ["It is 3 o'clock.", 'It is 3 PM.', "It's 3 o'clock."],
  }

  const blanksQuestion: BlanksQuestion = {
    id: 'BK1-Q002',
    sourceId: 'S02',
    lessonPairs: ['17-18'],
    englishLevel: 'A2',
    difficulty: 'Easy',
    topic: 'Verb tenses',
    skillType: 'Grammar',
    questionType: 'fill_blank',
    gradingMode: 'blanks',
    instruction: 'Fill in the blanks',
    prompt: 'Complete the sentences.',
    answer: 'I went to the store. She was happy.',
    explanation: 'Use past tense for both verbs.',
    template: 'I {{1}} to the store. She {{2}} happy.',
    blanks: [
      { id: 1, acceptedAnswers: ['went', 'go'] },
      { id: 2, acceptedAnswers: ['was', 'is'] },
    ],
  }

  const selfCheckQuestion: SelfCheckQuestion = {
    id: 'BK1-Q003',
    sourceId: 'S03',
    lessonPairs: ['19-20'],
    englishLevel: 'B2',
    difficulty: 'Hard',
    topic: 'Essay writing',
    skillType: 'Writing',
    questionType: 'open',
    gradingMode: 'selfCheck',
    instruction: 'Write an essay',
    prompt: 'Describe your favorite place.',
    answer: 'My favorite place is the library because...',
    explanation: 'Include reasons and details.',
  }

  it('isExactQuestion identifies exact-mode questions', () => {
    expect(isExactQuestion(exactQuestion)).toBe(true)
    expect(isExactQuestion(blanksQuestion)).toBe(false)
    expect(isExactQuestion(selfCheckQuestion)).toBe(false)
  })

  it('isBlanksQuestion identifies blanks-mode questions', () => {
    expect(isBlanksQuestion(exactQuestion)).toBe(false)
    expect(isBlanksQuestion(blanksQuestion)).toBe(true)
    expect(isBlanksQuestion(selfCheckQuestion)).toBe(false)
  })

  it('isSelfCheckQuestion identifies selfCheck-mode questions', () => {
    expect(isSelfCheckQuestion(exactQuestion)).toBe(false)
    expect(isSelfCheckQuestion(blanksQuestion)).toBe(false)
    expect(isSelfCheckQuestion(selfCheckQuestion)).toBe(true)
  })

  it('type narrowing works inside guard conditions', () => {
    const q: ExactQuestion | BlanksQuestion | SelfCheckQuestion = exactQuestion

    if (isExactQuestion(q)) {
      // Should have acceptedAnswers without cast
      expect(q.acceptedAnswers).toEqual(["It is 3 o'clock.", 'It is 3 PM.', "It's 3 o'clock."])
    }
  })
})
