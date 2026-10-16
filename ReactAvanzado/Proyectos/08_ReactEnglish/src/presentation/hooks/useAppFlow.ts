import { useReducer } from 'react'
import type { Exam } from '@domain'
import type { SubmitExamOutcome } from '@application'

export type AppFlowState = {
  screen: 'config' | 'exam' | 'results' | 'history'
  exam: Exam | null
  outcome: SubmitExamOutcome | null
}

export type AppFlowAction =
  | { type: 'examStarted'; exam: Exam }
  | { type: 'examSubmitted'; outcome: SubmitExamOutcome }
  | { type: 'backToConfig' }
  | { type: 'showResults' }
  | { type: 'showHistory' }

const initialState: AppFlowState = {
  screen: 'config',
  exam: null,
  outcome: null,
}

function reducer(state: AppFlowState, action: AppFlowAction): AppFlowState {
  switch (action.type) {
    case 'examStarted':
      return {
        screen: 'exam',
        exam: action.exam,
        outcome: null,
      }
    case 'examSubmitted':
      return {
        ...state,
        screen: 'results',
        outcome: action.outcome,
      }
    case 'backToConfig':
      return {
        screen: 'config',
        exam: null,
        outcome: null,
      }
    case 'showResults':
      return {
        ...state,
        screen: 'results',
      }
    case 'showHistory':
      return {
        screen: 'history',
        exam: null,
        outcome: null,
      }
  }
}

export function useAppFlow() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    examStarted: (exam: Exam) => dispatch({ type: 'examStarted', exam }),
    examSubmitted: (outcome: SubmitExamOutcome) => dispatch({ type: 'examSubmitted', outcome }),
    backToConfig: () => dispatch({ type: 'backToConfig' }),
    showResults: () => dispatch({ type: 'showResults' }),
    showHistory: () => dispatch({ type: 'showHistory' }),
  }
}
