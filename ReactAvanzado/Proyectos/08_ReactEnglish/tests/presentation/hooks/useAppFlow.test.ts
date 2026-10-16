import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Attempt, Exam } from '@domain'
import type { SubmitExamOutcome } from '@application'
import { useAppFlow } from '@presentation/hooks/useAppFlow'

const exam: Exam = {
  id: 'exam-1',
  createdAt: '2026-10-15T10:00:00Z',
  config: { selectedPairIds: [], levels: [], difficulties: [], questionCount: 0, shuffle: false },
  questions: [],
}

const attempt: Attempt = {
  id: 'att-1',
  exam,
  answers: [],
  result: {
    examId: 'exam-1',
    total: 4,
    correct: 3,
    incorrect: 1,
    unanswered: 0,
    score: 75,
    results: [],
  },
  finishedAt: '2026-10-15T10:30:00Z',
}

const savedOutcome: SubmitExamOutcome = { saved: true, attempt }
const unsavedOutcome: SubmitExamOutcome = { saved: false, attempt, error: new Error('disk full') }

describe('useAppFlow', () => {
  it('starts on config with no exam and no outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    expect(result.current.state).toEqual({ screen: 'config', exam: null, outcome: null })
  })

  it('examStarted moves to exam and stores the exam', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examStarted(exam))

    expect(result.current.state).toEqual({ screen: 'exam', exam, outcome: null })
  })

  it('examSubmitted moves to results and stores the outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examStarted(exam))
    act(() => result.current.examSubmitted(savedOutcome))

    expect(result.current.state.screen).toBe('results')
    expect(result.current.state.outcome).toBe(savedOutcome)
    expect(result.current.state.exam).toBe(exam)
  })

  it('examSubmitted stores an unsaved outcome including its error', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examSubmitted(unsavedOutcome))

    expect(result.current.state.outcome).toBe(unsavedOutcome)
    expect(result.current.state.outcome?.saved).toBe(false)
  })

  it('backToConfig clears the exam and the outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examStarted(exam))
    act(() => result.current.examSubmitted(savedOutcome))
    act(() => result.current.backToConfig())

    expect(result.current.state).toEqual({ screen: 'config', exam: null, outcome: null })
  })

  it('examStarted after a previous result clears the old outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examSubmitted(savedOutcome))
    act(() => result.current.examStarted(exam))

    expect(result.current.state.outcome).toBeNull()
  })

  it('showResults keeps the exam and the outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examStarted(exam))
    act(() => result.current.examSubmitted(savedOutcome))
    act(() => result.current.showResults())

    expect(result.current.state).toEqual({ screen: 'results', exam, outcome: savedOutcome })
  })

  it('showHistory clears the exam and the outcome', () => {
    const { result } = renderHook(() => useAppFlow())

    act(() => result.current.examStarted(exam))
    act(() => result.current.examSubmitted(savedOutcome))
    act(() => result.current.showHistory())

    expect(result.current.state).toEqual({ screen: 'history', exam: null, outcome: null })
  })
})
