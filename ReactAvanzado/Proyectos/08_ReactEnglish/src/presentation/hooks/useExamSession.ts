import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { type Exam, type ExamQuestion, isAnswerEmpty } from '@domain'
import { examSessionReducer, type ExamSessionState } from '@application'

export type ExamSessionActions = {
  readonly answerText: (questionId: string, value: string) => void
  readonly answerBlank: (questionId: string, blankId: number, value: string) => void
  readonly answerSelfCheckText: (questionId: string, value: string) => void
  readonly reveal: (questionId: string) => void
  readonly markSelfCheck: (questionId: string, correct: boolean) => void
  readonly goTo: (index: number) => void
  readonly next: () => void
  readonly previous: () => void
  readonly markSubmitted: () => void
}

export type UseExamSessionResult = {
  readonly state: ExamSessionState
  readonly actions: ExamSessionActions
  readonly currentQuestion: ExamQuestion | null
  /** Display number of the current question (1-based); 0 when the exam has no questions. */
  readonly currentNumber: number
  readonly total: number
  /** One flag per question, in exam order: true when the question has a non-empty answer. */
  readonly answeredFlags: readonly boolean[]
  /** Question numbers (1-based) that are still unanswered. */
  readonly unansweredNumbers: readonly number[]
}

function startSession(exam: Exam): ExamSessionState {
  return examSessionReducer(undefined, { type: 'start', exam })
}

/** Runs an exam session for `exam`. The session is in_progress from the first render. */
export function useExamSession(exam: Exam): UseExamSessionResult {
  const [state, dispatch] = useReducer(examSessionReducer, exam, startSession)

  // Restart when a different exam is passed in; the guard keeps the initial mount untouched.
  useEffect(() => {
    if (state.exam !== exam) dispatch({ type: 'start', exam })
  }, [exam, state.exam])

  const answerText = useCallback(
    (questionId: string, value: string) => dispatch({ type: 'answerText', questionId, value }),
    []
  )
  const answerBlank = useCallback(
    (questionId: string, blankId: number, value: string) =>
      dispatch({ type: 'answerBlank', questionId, blankId, value }),
    []
  )
  const answerSelfCheckText = useCallback(
    (questionId: string, value: string) =>
      dispatch({ type: 'answerSelfCheckText', questionId, value }),
    []
  )
  const reveal = useCallback((questionId: string) => dispatch({ type: 'reveal', questionId }), [])
  const markSelfCheck = useCallback(
    (questionId: string, correct: boolean) =>
      dispatch({ type: 'markSelfCheck', questionId, correct }),
    []
  )
  const goTo = useCallback((index: number) => dispatch({ type: 'goTo', index }), [])
  const next = useCallback(() => dispatch({ type: 'next' }), [])
  const previous = useCallback(() => dispatch({ type: 'previous' }), [])
  const markSubmitted = useCallback(() => dispatch({ type: 'markSubmitted' }), [])

  const actions = useMemo<ExamSessionActions>(
    () => ({
      answerText,
      answerBlank,
      answerSelfCheckText,
      reveal,
      markSelfCheck,
      goTo,
      next,
      previous,
      markSubmitted,
    }),
    [
      answerText,
      answerBlank,
      answerSelfCheckText,
      reveal,
      markSelfCheck,
      goTo,
      next,
      previous,
      markSubmitted,
    ]
  )

  const questions = state.exam?.questions
  const answers = state.answers

  const answeredFlags = useMemo(
    () => (questions ?? []).map((q) => !isAnswerEmpty(answers[q.question.id])),
    [questions, answers]
  )

  const unansweredNumbers = useMemo(
    () => (questions ?? []).filter((_, i) => !answeredFlags[i]).map((q) => q.number),
    [questions, answeredFlags]
  )

  const currentQuestion = questions?.[state.currentIndex] ?? null

  return {
    state,
    actions,
    currentQuestion,
    currentNumber: currentQuestion?.number ?? 0,
    total: questions?.length ?? 0,
    answeredFlags,
    unansweredNumbers,
  }
}
