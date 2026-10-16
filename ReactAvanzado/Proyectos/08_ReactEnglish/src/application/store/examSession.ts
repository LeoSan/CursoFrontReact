import { type Exam, type UserAnswer, isAnswerEmpty } from '@domain'

export type ExamSessionState = {
  readonly exam: Exam | null
  readonly answers: Readonly<Record<string, UserAnswer>>
  readonly currentIndex: number
  readonly status: 'idle' | 'in_progress' | 'submitted'
}

export type ExamSessionAction =
  | { readonly type: 'start'; readonly exam: Exam }
  | { readonly type: 'answerText'; readonly questionId: string; readonly value: string }
  | {
      readonly type: 'answerBlank'
      readonly questionId: string
      readonly blankId: number
      readonly value: string
    }
  | {
      readonly type: 'answerSelfCheckText'
      readonly questionId: string
      readonly value: string
    }
  | { readonly type: 'reveal'; readonly questionId: string }
  | { readonly type: 'markSelfCheck'; readonly questionId: string; readonly correct: boolean }
  | { readonly type: 'goTo'; readonly index: number }
  | { readonly type: 'next' }
  | { readonly type: 'previous' }
  | { readonly type: 'markSubmitted' }
  | { readonly type: 'reset' }

const INITIAL_STATE: ExamSessionState = {
  exam: null,
  answers: {},
  currentIndex: 0,
  status: 'idle',
}

/** Pure reducer for exam session state. */
export function examSessionReducer(
  state: ExamSessionState = INITIAL_STATE,
  action: ExamSessionAction
): ExamSessionState {
  switch (action.type) {
    case 'start':
      return {
        exam: action.exam,
        answers: {},
        currentIndex: 0,
        status: 'in_progress',
      }

    case 'answerText':
      if (state.status !== 'in_progress' || !state.exam) return state
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            kind: 'text',
            questionId: action.questionId,
            value: action.value,
          },
        },
      }

    case 'answerBlank': {
      if (state.status !== 'in_progress' || !state.exam) return state
      const existingAnswer = state.answers[action.questionId]
      const blankValues = existingAnswer?.kind === 'blanks' ? { ...existingAnswer.values } : {}
      blankValues[action.blankId] = action.value
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            kind: 'blanks',
            questionId: action.questionId,
            values: blankValues,
          },
        },
      }
    }

    case 'answerSelfCheckText': {
      if (state.status !== 'in_progress' || !state.exam) return state
      const existingSelfCheck = state.answers[action.questionId]
      const base =
        existingSelfCheck?.kind === 'selfCheck'
          ? existingSelfCheck
          : ({ revealed: false, markedCorrect: null } as const)
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            kind: 'selfCheck',
            questionId: action.questionId,
            revealed: base.revealed,
            markedCorrect: base.markedCorrect,
            text: action.value,
          },
        },
      }
    }

    case 'reveal': {
      if (state.status !== 'in_progress' || !state.exam) return state
      const existingReveal = state.answers[action.questionId]
      if (!existingReveal || existingReveal.kind !== 'selfCheck') return state
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            ...existingReveal,
            revealed: true,
          },
        },
      }
    }

    case 'markSelfCheck': {
      if (state.status !== 'in_progress' || !state.exam) return state
      const existingMark = state.answers[action.questionId]
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            ...(existingMark?.kind === 'selfCheck' ? existingMark : {}),
            kind: 'selfCheck',
            questionId: action.questionId,
            revealed: true,
            markedCorrect: action.correct,
          },
        },
      }
    }

    case 'goTo': {
      if (!state.exam) return state
      const maxIndex = state.exam.questions.length - 1
      const clampedIndex = Math.max(0, Math.min(action.index, maxIndex))
      return {
        ...state,
        currentIndex: clampedIndex,
      }
    }

    case 'next': {
      if (!state.exam) return state
      const nextIndex = Math.min(state.currentIndex + 1, state.exam.questions.length - 1)
      return {
        ...state,
        currentIndex: nextIndex,
      }
    }

    case 'previous': {
      if (!state.exam) return state
      const prevIndex = Math.max(state.currentIndex - 1, 0)
      return {
        ...state,
        currentIndex: prevIndex,
      }
    }

    case 'markSubmitted':
      return {
        ...state,
        status: 'submitted',
      }

    case 'reset':
      return INITIAL_STATE

    default:
      return state
  }
}

/** Extract answers as UserAnswer array for grading. */
export function selectAnswersArray(state: ExamSessionState): readonly UserAnswer[] {
  return Object.values(state.answers)
}

/** Find unanswered question numbers (1-indexed). */
export function selectUnansweredNumbers(state: ExamSessionState): readonly number[] {
  if (!state.exam) return []

  const unanswered: number[] = []
  for (const question of state.exam.questions) {
    const answer = state.answers[question.question.id]
    if (isAnswerEmpty(answer)) {
      unanswered.push(question.number)
    }
  }
  return unanswered
}
