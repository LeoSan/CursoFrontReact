import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Attempt } from '@domain'
import type { SubmitExamOutcome } from '@application'
import ResultsPlaceholderPage from '@presentation/pages/ResultsPlaceholderPage'

const attempt: Attempt = {
  id: 'att-1',
  exam: {
    id: 'exam-1',
    createdAt: '2026-10-15T10:00:00Z',
    config: { selectedPairIds: [], levels: [], difficulties: [], questionCount: 0, shuffle: false },
    questions: [],
  },
  answers: [],
  result: {
    examId: 'exam-1',
    total: 6,
    correct: 3,
    incorrect: 2,
    unanswered: 1,
    score: 75,
    results: [],
  },
  finishedAt: '2026-10-15T10:30:00Z',
}

const saved: SubmitExamOutcome = { saved: true, attempt }
const unsaved: SubmitExamOutcome = { saved: false, attempt, error: new Error('quota') }

describe('ResultsPlaceholderPage', () => {
  it('shows the score', () => {
    render(<ResultsPlaceholderPage outcome={saved} onNewExam={() => {}} />)

    expect(screen.getByText('Puntaje: 75')).toBeInTheDocument()
  })

  it('shows correct, incorrect and unanswered counts', () => {
    render(<ResultsPlaceholderPage outcome={saved} onNewExam={() => {}} />)

    expect(screen.getByText('Correctas: 3')).toBeInTheDocument()
    expect(screen.getByText('Incorrectas: 2')).toBeInTheDocument()
    expect(screen.getByText('Sin responder: 1')).toBeInTheDocument()
  })

  it('shows no alert when the attempt was saved', () => {
    render(<ResultsPlaceholderPage outcome={saved} onNewExam={() => {}} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a warning alert when the attempt was not saved, and still shows the result', () => {
    render(<ResultsPlaceholderPage outcome={unsaved} onNewExam={() => {}} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo guardar el intento en este dispositivo. Tu resultado se muestra igualmente.'
    )
    expect(screen.getByText('Puntaje: 75')).toBeInTheDocument()
  })

  it('"Nuevo examen" calls onNewExam', async () => {
    const onNewExam = vi.fn()
    render(<ResultsPlaceholderPage outcome={saved} onNewExam={onNewExam} />)

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo examen' }))

    expect(onNewExam).toHaveBeenCalledTimes(1)
  })
})
