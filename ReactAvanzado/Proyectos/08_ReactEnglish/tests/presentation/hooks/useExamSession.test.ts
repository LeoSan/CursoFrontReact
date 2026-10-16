import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Exam } from '@domain'
import { useExamSession } from '@presentation/hooks/useExamSession'

function makeExam(id: string): Exam {
  return {
    id,
    createdAt: '2026-10-15T10:00:00Z',
    config: { selectedPairIds: [], levels: [], difficulties: [], questionCount: 3, shuffle: false },
    questions: [
      {
        number: 1,
        question: {
          id: 'BK1-Q001',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'T',
          skillType: 'Speaking',
          questionType: 'open',
          gradingMode: 'exact',
          instruction: 'Answer',
          prompt: 'Q1',
          answer: 'A',
          explanation: 'E',
          acceptedAnswers: ['A'],
        },
      },
      {
        number: 2,
        question: {
          id: 'BK1-Q002',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'A1',
          difficulty: 'Easy',
          topic: 'T',
          skillType: 'Grammar',
          questionType: 'multi_blank',
          gradingMode: 'blanks',
          instruction: 'Fill',
          prompt: '{{1}} and {{2}}',
          answer: 'a, b',
          explanation: 'E',
          template: '{{1}} and {{2}}',
          blanks: [
            { id: 1, acceptedAnswers: ['a'] },
            { id: 2, acceptedAnswers: ['b'] },
          ],
        },
      },
      {
        number: 3,
        question: {
          id: 'BK1-Q003',
          sourceId: 'S1',
          lessonPairs: ['1-2'],
          englishLevel: 'B1',
          difficulty: 'Hard',
          topic: 'T',
          skillType: 'Writing',
          questionType: 'open',
          gradingMode: 'selfCheck',
          instruction: 'Write',
          prompt: 'Essay',
          answer: 'Model',
          explanation: 'E',
        },
      },
    ],
  }
}

const exam = makeExam('exam-1')

describe('useExamSession', () => {
  it('starts in_progress at index 0 on the first render', () => {
    const { result } = renderHook(() => useExamSession(exam))

    expect(result.current.state.status).toBe('in_progress')
    expect(result.current.state.exam).toBe(exam)
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.currentQuestion?.question.id).toBe('BK1-Q001')
    expect(result.current.currentNumber).toBe(1)
    expect(result.current.total).toBe(3)
  })

  it('starts with every question unanswered', () => {
    const { result } = renderHook(() => useExamSession(exam))

    expect(result.current.answeredFlags).toEqual([false, false, false])
    expect(result.current.unansweredNumbers).toEqual([1, 2, 3])
  })

  it('navigates with next/previous and clamps at both ends', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.previous())
    expect(result.current.state.currentIndex).toBe(0)

    act(() => result.current.actions.next())
    act(() => result.current.actions.next())
    act(() => result.current.actions.next())
    expect(result.current.state.currentIndex).toBe(2)
    expect(result.current.currentNumber).toBe(3)

    act(() => result.current.actions.previous())
    expect(result.current.state.currentIndex).toBe(1)
  })

  it('goTo jumps and clamps out-of-range indexes', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.goTo(1))
    expect(result.current.currentNumber).toBe(2)

    act(() => result.current.actions.goTo(99))
    expect(result.current.state.currentIndex).toBe(2)

    act(() => result.current.actions.goTo(-5))
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('answers persist across navigation', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerText('BK1-Q001', 'hello'))
    act(() => result.current.actions.goTo(2))
    act(() => result.current.actions.answerSelfCheckText('BK1-Q003', 'my essay'))
    act(() => result.current.actions.goTo(0))

    expect(result.current.state.answers['BK1-Q001']).toEqual({
      kind: 'text',
      questionId: 'BK1-Q001',
      value: 'hello',
    })
    expect(result.current.state.answers['BK1-Q003']).toMatchObject({ text: 'my essay' })
  })

  it('a text answer updates answeredFlags and unansweredNumbers', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerText('BK1-Q001', 'hello'))

    expect(result.current.answeredFlags).toEqual([true, false, false])
    expect(result.current.unansweredNumbers).toEqual([2, 3])
  })

  it('a whitespace-only text answer is still unanswered', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerText('BK1-Q001', '   '))

    expect(result.current.answeredFlags[0]).toBe(false)
  })

  it('a filled blank answers the question; clearing it makes it unanswered again', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerBlank('BK1-Q002', 1, 'a'))
    expect(result.current.answeredFlags).toEqual([false, true, false])
    expect(result.current.unansweredNumbers).toEqual([1, 3])

    act(() => result.current.actions.answerBlank('BK1-Q002', 1, ''))
    expect(result.current.answeredFlags[1]).toBe(false)
  })

  it('a selfCheck is answered only once marked, not by text or reveal', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerSelfCheckText('BK1-Q003', 'my essay'))
    expect(result.current.answeredFlags[2]).toBe(false)

    act(() => result.current.actions.reveal('BK1-Q003'))
    expect(result.current.answeredFlags[2]).toBe(false)
    expect(result.current.unansweredNumbers).toContain(3)

    act(() => result.current.actions.markSelfCheck('BK1-Q003', false))
    expect(result.current.answeredFlags).toEqual([false, false, true])
    expect(result.current.unansweredNumbers).toEqual([1, 2])
    expect(result.current.state.answers['BK1-Q003']).toMatchObject({
      revealed: true,
      markedCorrect: false,
      text: 'my essay',
    })
  })

  it('markSubmitted moves to submitted and then ignores further answers', () => {
    const { result } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.markSubmitted())
    act(() => result.current.actions.answerText('BK1-Q001', 'late'))

    expect(result.current.state.status).toBe('submitted')
    expect(result.current.answeredFlags[0]).toBe(false)
  })

  it('keeps actions referentially stable across renders', () => {
    const { result } = renderHook(() => useExamSession(exam))
    const first = result.current.actions

    act(() => result.current.actions.answerText('BK1-Q001', 'x'))

    expect(result.current.actions).toBe(first)
  })

  it('restarts with fresh answers when a different exam is passed', () => {
    const other = makeExam('exam-2')
    const { result, rerender } = renderHook(({ e }) => useExamSession(e), {
      initialProps: { e: exam },
    })

    act(() => result.current.actions.answerText('BK1-Q001', 'x'))
    act(() => result.current.actions.goTo(2))
    rerender({ e: other })

    expect(result.current.state.exam).toBe(other)
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.state.answers).toEqual({})
    expect(result.current.state.status).toBe('in_progress')
  })

  it('does not reset answers when re-rendered with the same exam', () => {
    const { result, rerender } = renderHook(() => useExamSession(exam))

    act(() => result.current.actions.answerText('BK1-Q001', 'x'))
    rerender()

    expect(result.current.answeredFlags[0]).toBe(true)
  })
})
