import { describe, it, expect } from 'vitest'
import {
  examSessionReducer,
  selectAnswersArray,
  selectUnansweredNumbers,
} from '@application/store/examSession'
import { type Exam } from '@domain'
import { type ExamSessionState } from '@application'

describe('examSessionReducer', () => {
  const mockExam: Exam = {
    id: 'exam-1',
    createdAt: '2026-10-15T10:00:00Z',
    config: {
      selectedPairIds: ['1-2'],
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
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Q1',
          answer: 'A1',
          explanation: 'Correct',
          acceptedAnswers: ['A1'],
        },
      },
      {
        number: 2,
        question: {
          id: 'Q2',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'fill_blank',
          gradingMode: 'blanks',
          instruction: 'Fill',
          prompt: 'Test {{1}}',
          answer: 'blank',
          explanation: 'Correct',
          template: 'Test {{1}}',
          blanks: [{ id: 1, acceptedAnswers: ['blank'] }],
        },
      },
      {
        number: 3,
        question: {
          id: 'Q3',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Writing',
          questionType: 'open',
          gradingMode: 'selfCheck',
          instruction: 'Write',
          prompt: 'Essay',
          answer: 'Model',
          explanation: 'Correct',
        },
      },
    ],
  }

  it('start sets exam and resets answers/index', () => {
    const state = examSessionReducer(undefined, { type: 'start', exam: mockExam })

    expect(state.exam).toBe(mockExam)
    expect(state.answers).toEqual({})
    expect(state.currentIndex).toBe(0)
    expect(state.status).toBe('in_progress')
  })

  it('answerText adds text answer when in_progress', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, {
      type: 'answerText',
      questionId: 'Q1',
      value: 'Hello',
    })

    expect(state2.answers['Q1']).toEqual({
      kind: 'text',
      questionId: 'Q1',
      value: 'Hello',
    })
  })

  it('answerText ignored when not in_progress', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'markSubmitted' })
    const state3 = examSessionReducer(state2, {
      type: 'answerText',
      questionId: 'Q1',
      value: 'Hello',
    })

    expect(state3.answers).toEqual({})
  })

  it('answerBlank accumulates blank values', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, {
      type: 'answerBlank',
      questionId: 'Q2',
      blankId: 1,
      value: 'test',
    })

    expect(state2.answers['Q2']).toEqual({
      kind: 'blanks',
      questionId: 'Q2',
      values: { 1: 'test' },
    })
  })

  it('answerBlank updates existing blank', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, {
      type: 'answerBlank',
      questionId: 'Q2',
      blankId: 1,
      value: 'first',
    })
    const state3 = examSessionReducer(state2, {
      type: 'answerBlank',
      questionId: 'Q2',
      blankId: 1,
      value: 'second',
    })

    expect(state3.answers['Q2']).toEqual({
      kind: 'blanks',
      questionId: 'Q2',
      values: { 1: 'second' },
    })
  })

  it('markSelfCheck sets revealed and markedCorrect', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, {
      type: 'markSelfCheck',
      questionId: 'Q3',
      correct: true,
    })

    expect(state2.answers['Q3']).toEqual({
      kind: 'selfCheck',
      questionId: 'Q3',
      revealed: true,
      markedCorrect: true,
    })
  })

  describe('selfCheck text', () => {
    const started = () => examSessionReducer(undefined, { type: 'start', exam: mockExam })

    it('answerSelfCheckText creates an answer with revealed false and markedCorrect null', () => {
      const state = examSessionReducer(started(), {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'My essay',
      })

      expect(state.answers['Q3']).toEqual({
        kind: 'selfCheck',
        questionId: 'Q3',
        revealed: false,
        markedCorrect: null,
        text: 'My essay',
      })
    })

    it('answerSelfCheckText updates the text and keeps revealed and markedCorrect', () => {
      let state = started()
      state = examSessionReducer(state, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'first',
      })
      state = examSessionReducer(state, { type: 'markSelfCheck', questionId: 'Q3', correct: false })
      state = examSessionReducer(state, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'second',
      })

      expect(state.answers['Q3']).toEqual({
        kind: 'selfCheck',
        questionId: 'Q3',
        revealed: true,
        markedCorrect: false,
        text: 'second',
      })
    })

    it('answerSelfCheckText does not touch other answers', () => {
      let state = started()
      state = examSessionReducer(state, { type: 'answerText', questionId: 'Q1', value: 'A1' })
      state = examSessionReducer(state, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'x',
      })

      expect(state.answers['Q1']).toEqual({ kind: 'text', questionId: 'Q1', value: 'A1' })
    })

    it('answerSelfCheckText is ignored when not in_progress', () => {
      const idle = examSessionReducer(undefined, { type: 'reset' })
      const state = examSessionReducer(idle, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'x',
      })

      expect(state).toBe(idle)
    })

    it('answerSelfCheckText is ignored after submission', () => {
      const submitted = examSessionReducer(started(), { type: 'markSubmitted' })
      const state = examSessionReducer(submitted, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'x',
      })

      expect(state).toBe(submitted)
    })

    it('reveal keeps an existing text', () => {
      let state = started()
      state = examSessionReducer(state, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'kept',
      })
      state = examSessionReducer(state, { type: 'reveal', questionId: 'Q3' })

      expect(state.answers['Q3']).toEqual({
        kind: 'selfCheck',
        questionId: 'Q3',
        revealed: true,
        markedCorrect: null,
        text: 'kept',
      })
    })

    it('markSelfCheck keeps an existing text', () => {
      let state = started()
      state = examSessionReducer(state, {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'kept',
      })
      state = examSessionReducer(state, { type: 'markSelfCheck', questionId: 'Q3', correct: true })

      expect(state.answers['Q3']).toEqual({
        kind: 'selfCheck',
        questionId: 'Q3',
        revealed: true,
        markedCorrect: true,
        text: 'kept',
      })
    })

    it('markSelfCheck without prior text does not add a text field', () => {
      const state = examSessionReducer(started(), {
        type: 'markSelfCheck',
        questionId: 'Q3',
        correct: true,
      })

      expect(state.answers['Q3']).not.toHaveProperty('text')
    })

    it('a selfCheck with text but markedCorrect null still counts as unanswered', () => {
      const state = examSessionReducer(started(), {
        type: 'answerSelfCheckText',
        questionId: 'Q3',
        value: 'typed but not marked',
      })

      expect(selectUnansweredNumbers(state)).toContain(3)
    })
  })

  it('goTo clamps index to valid range', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'goTo', index: 10 })

    expect(state2.currentIndex).toBe(2) // Max index is 2 (0-based)
  })

  it('goTo clamps negative index to 0', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'goTo', index: -5 })

    expect(state2.currentIndex).toBe(0)
  })

  it('next increments currentIndex', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'next' })

    expect(state2.currentIndex).toBe(1)
  })

  it('next clamps at end', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'goTo', index: 2 })
    const state3 = examSessionReducer(state2, { type: 'next' })

    expect(state3.currentIndex).toBe(2)
  })

  it('previous decrements currentIndex', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'goTo', index: 2 })
    const state3 = examSessionReducer(state2, { type: 'previous' })

    expect(state3.currentIndex).toBe(1)
  })

  it('previous clamps at start', () => {
    const state = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state, { type: 'previous' })

    expect(state2.currentIndex).toBe(0)
  })

  it('markSubmitted changes status', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, { type: 'markSubmitted' })

    expect(state2.status).toBe('submitted')
  })

  it('reset returns to initial state', () => {
    const state1 = examSessionReducer(undefined, { type: 'start', exam: mockExam })
    const state2 = examSessionReducer(state1, {
      type: 'answerText',
      questionId: 'Q1',
      value: 'Test',
    })
    const state3 = examSessionReducer(state2, { type: 'reset' })

    expect(state3.exam).toBeNull()
    expect(state3.answers).toEqual({})
    expect(state3.currentIndex).toBe(0)
    expect(state3.status).toBe('idle')
  })
})

describe('selectAnswersArray', () => {
  it('extracts answers as array', () => {
    const state: ExamSessionState = {
      exam: null,
      answers: {
        Q1: { kind: 'text', questionId: 'Q1', value: 'test' },
        Q2: { kind: 'text', questionId: 'Q2', value: 'test2' },
      },
      currentIndex: 0,
      status: 'idle',
    }

    const array = selectAnswersArray(state)
    expect(array).toHaveLength(2)
    expect(
      Array.from(array)
        .map((a) => a.questionId)
        .sort()
    ).toEqual(['Q1', 'Q2'])
  })
})

describe('selectUnansweredNumbers', () => {
  const mockExam: Exam = {
    id: 'exam-1',
    createdAt: '2026-10-15T10:00:00Z',
    config: {
      selectedPairIds: [],
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
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Q1',
          answer: 'A1',
          explanation: 'Correct',
          acceptedAnswers: ['A1'],
        },
      },
      {
        number: 2,
        question: {
          id: 'Q2',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Q2',
          answer: 'A2',
          explanation: 'Correct',
          acceptedAnswers: ['A2'],
        },
      },
      {
        number: 3,
        question: {
          id: 'Q3',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'Test',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Q3',
          answer: 'A3',
          explanation: 'Correct',
          acceptedAnswers: ['A3'],
        },
      },
    ],
  }

  it('finds unanswered questions', () => {
    const state: ExamSessionState = {
      exam: mockExam,
      answers: {
        Q1: { kind: 'text', questionId: 'Q1', value: 'test' },
        // Q2 is unanswered
        Q3: { kind: 'text', questionId: 'Q3', value: '' }, // Empty is unanswered
      },
      currentIndex: 0,
      status: 'in_progress',
    }

    const unanswered = selectUnansweredNumbers(state)
    expect(Array.from(unanswered).sort()).toEqual([2, 3])
  })

  it('returns empty array when all answered', () => {
    const state: ExamSessionState = {
      exam: mockExam,
      answers: {
        Q1: { kind: 'text', questionId: 'Q1', value: 'test' },
        Q2: { kind: 'text', questionId: 'Q2', value: 'test' },
        Q3: { kind: 'text', questionId: 'Q3', value: 'test' },
      },
      currentIndex: 0,
      status: 'in_progress',
    }

    const unanswered = selectUnansweredNumbers(state)
    expect(unanswered).toEqual([])
  })

  it('returns empty array when no exam', () => {
    const state: ExamSessionState = {
      exam: null,
      answers: {},
      currentIndex: 0,
      status: 'idle',
    }

    const unanswered = selectUnansweredNumbers(state)
    expect(unanswered).toEqual([])
  })
})
