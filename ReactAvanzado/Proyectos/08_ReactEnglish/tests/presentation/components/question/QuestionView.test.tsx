import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Question, UserAnswer } from '@domain'
import {
  EXPLANATION,
  makeExact,
  makeExam,
  makeFillBlank,
  makeMultiBlank,
  makeSelfCheck,
  SECRET,
} from '../../../../src/testing/questionFixtures'
import { useExamSession } from '@presentation/hooks/useExamSession'
import { QuestionView, type QuestionHandlers } from '@presentation/components/question/QuestionView'

function makeHandlers(): { [K in keyof QuestionHandlers]: ReturnType<typeof vi.fn> } {
  return {
    onAnswerText: vi.fn(),
    onAnswerBlank: vi.fn(),
    onAnswerSelfCheckText: vi.fn(),
    onReveal: vi.fn(),
    onMarkSelfCheck: vi.fn(),
  }
}

function renderView(question: Question, answer?: UserAnswer, handlers = makeHandlers()) {
  const utils = render(
    <QuestionView question={question} number={3} answer={answer} handlers={handlers} />
  )
  return { handlers, ...utils }
}

// Stable reference: useExamSession restarts whenever it receives a different exam object.
const HARNESS_EXAM = makeExam([makeSelfCheck()])

function Harness() {
  const session = useExamSession(HARNESS_EXAM)
  const current = session.currentQuestion
  if (!current) return null
  const id = current.question.id
  return (
    <QuestionView
      question={current.question}
      number={current.number}
      answer={session.state.answers[id]}
      handlers={{
        onAnswerText: (v) => session.actions.answerText(id, v),
        onAnswerBlank: (b, v) => session.actions.answerBlank(id, b, v),
        onAnswerSelfCheckText: (v) => session.actions.answerSelfCheckText(id, v),
        onReveal: () => session.actions.reveal(id),
        onMarkSelfCheck: (c) => session.actions.markSelfCheck(id, c),
      }}
    />
  )
}

describe('QuestionView', () => {
  it('shows the number and instruction before the content', () => {
    renderView(makeExact('open'))
    expect(screen.getByText('Pregunta 3')).toBeInTheDocument()
    const instruction = screen.getByText('Follow the instruction.')
    expect(instruction).toHaveClass('text-sm')
    const prompt = screen.getByText('What time is it?')
    expect(
      instruction.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  describe('open / exact', () => {
    it('renders the prompt and an input, and types through onAnswerText', async () => {
      const { handlers } = renderView(makeExact('open'))
      expect(screen.getByText('What time is it?')).toBeInTheDocument()
      await userEvent.type(screen.getByLabelText('Tu respuesta'), 'x')
      expect(handlers.onAnswerText).toHaveBeenCalledWith('x')
    })

    it('takes the value from the stored answer and follows prop changes', () => {
      const q = makeExact('open')
      const handlers = makeHandlers()
      const { rerender } = render(
        <QuestionView
          question={q}
          number={1}
          answer={{ kind: 'text', value: 'stored' }}
          handlers={handlers}
        />
      )
      expect(screen.getByLabelText('Tu respuesta')).toHaveValue('stored')
      rerender(
        <QuestionView
          question={q}
          number={1}
          answer={{ kind: 'text', value: 'changed' }}
          handlers={handlers}
        />
      )
      expect(screen.getByLabelText('Tu respuesta')).toHaveValue('changed')
    })
  })

  describe('fill_blank', () => {
    it('renders text around the inline input in order', () => {
      renderView(makeFillBlank('The dog {{1}} early every day.'))
      const input = screen.getByLabelText('Espacio 1')
      const nodes = Array.from((input.parentElement as HTMLElement).childNodes)
      expect(nodes[0]).toHaveTextContent('The dog')
      expect(nodes[1]).toBe(input)
      expect(nodes[2]).toHaveTextContent('early every day.')
    })

    it('renders two inputs for a two-marker template and passes the blank id', async () => {
      const { handlers } = renderView(makeFillBlank('{{1}} likes {{2}}.'))
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      await userEvent.type(screen.getByLabelText('Espacio 2'), 'a')
      expect(handlers.onAnswerBlank).toHaveBeenCalledWith(2, 'a')
    })

    it('reads values from the stored answer', () => {
      renderView(makeFillBlank('{{1}} likes {{2}}.'), { kind: 'blanks', values: { 1: 'Tom' } })
      expect(screen.getByLabelText('Espacio 1')).toHaveValue('Tom')
      expect(screen.getByLabelText('Espacio 2')).toHaveValue('')
    })
  })

  describe('multi_blank', () => {
    it('renders the prompt as a heading and labelled inputs', async () => {
      const { handlers } = renderView(makeMultiBlank())
      expect(screen.getByRole('heading', { name: 'Complete the table' })).toBeInTheDocument()
      await userEvent.type(screen.getByLabelText('Past'), 'w')
      expect(handlers.onAnswerBlank).toHaveBeenCalledWith(2, 'w')
    })
  })

  describe('error_correction', () => {
    it('shows the sentence and an empty corrected-sentence input', async () => {
      const { handlers } = renderView(makeExact('error_correction'))
      expect(screen.getByRole('group', { name: 'Frase incorrecta' })).toHaveTextContent(
        'She go to school.'
      )
      const input = screen.getByLabelText('Escribe la frase corregida')
      expect(input).toHaveValue('')
      await userEvent.type(input, 'S')
      expect(handlers.onAnswerText).toHaveBeenCalledWith('S')
    })
  })

  describe('selfCheck', () => {
    it('hides the model answer until the reveal button is used', () => {
      renderView(makeSelfCheck())
      expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Mostrar respuesta' })).toBeInTheDocument()
    })

    it('routes typing, reveal and marking to the right handlers', async () => {
      const { handlers, rerender } = renderView(makeSelfCheck())
      await userEvent.type(screen.getByLabelText('Tu respuesta'), 'h')
      expect(handlers.onAnswerSelfCheckText).toHaveBeenCalledWith('h')
      await userEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
      expect(handlers.onReveal).toHaveBeenCalledTimes(1)

      rerender(
        <QuestionView
          question={makeSelfCheck()}
          number={3}
          answer={{ kind: 'selfCheck', revealed: true, markedCorrect: null, text: 'h' }}
          handlers={handlers}
        />
      )
      await userEvent.click(screen.getByRole('button', { name: 'Acerté' }))
      expect(handlers.onMarkSelfCheck).toHaveBeenCalledWith(true)
    })

    it('with the real session: reveal works on an untouched question and typed text persists', async () => {
      render(<Harness />)

      await userEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
      expect(screen.getByText(SECRET)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Acerté' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
      await userEvent.click(screen.getByRole('button', { name: 'Acerté' }))
      expect(screen.getByRole('button', { name: 'Acerté' })).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(screen.getByRole('button', { name: 'No acerté' }))
      expect(screen.getByRole('button', { name: 'No acerté' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(screen.getByRole('button', { name: 'Acerté' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    it('with the real session: text typed before reveal is kept after reveal', async () => {
      render(<Harness />)

      await userEvent.type(screen.getByLabelText('Tu respuesta'), 'my essay')
      await userEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
      expect(screen.getByLabelText('Tu respuesta')).toHaveValue('my essay')
      await userEvent.click(screen.getByRole('button', { name: 'Acerté' }))
      expect(screen.getByLabelText('Tu respuesta')).toHaveValue('my essay')
    })
  })

  describe('media and hint', () => {
    it('renders the media placeholder and hint badge when present', () => {
      renderView(
        makeExact('open', {
          media: { type: 'image', name: 'Clock at 7:00', src: null },
          hint: 'think of the time',
        })
      )
      expect(screen.getByText('Imagen: Clock at 7:00')).toBeInTheDocument()
      expect(screen.getByText('Pista: think of the time')).toBeInTheDocument()
    })

    it('renders an img with the right alt when src is set', () => {
      renderView(makeExact('open', { media: { type: 'image', name: 'Clock', src: '/c.png' } }))
      expect(screen.getByAltText('Clock')).toHaveAttribute('src', '/c.png')
    })

    it('renders neither without media or hint', () => {
      renderView(makeExact('open'))
      expect(screen.queryByText(/Imagen:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Pista:/)).not.toBeInTheDocument()
    })
  })

  describe('answer secrecy', () => {
    const cases: [string, () => Question, string][] = [
      ['exact', () => makeExact('open'), 'Tu respuesta'],
      ['fill_blank', () => makeFillBlank('A {{1}} b.'), 'Espacio 1'],
      ['multi_blank', () => makeMultiBlank(), 'Past'],
      ['error_correction', () => makeExact('error_correction'), 'Escribe la frase corregida'],
    ]

    it.each(cases)(
      '%s never shows the answer or explanation, before or after typing',
      async (_n, build, label) => {
        renderView(build())
        expect(document.body).not.toHaveTextContent(SECRET)
        expect(document.body).not.toHaveTextContent(EXPLANATION)
        await userEvent.type(screen.getByLabelText(label), 'abc')
        expect(document.body).not.toHaveTextContent(SECRET)
        expect(document.body).not.toHaveTextContent(EXPLANATION)
      }
    )

    it('selfCheck never shows the explanation, even after reveal', () => {
      renderView(makeSelfCheck(), { kind: 'selfCheck', revealed: true, markedCorrect: null })
      expect(document.body).not.toHaveTextContent(EXPLANATION)
    })
  })

  describe('Enter key', () => {
    const cases: [string, () => Question, string][] = [
      ['exact', () => makeExact('open'), 'Tu respuesta'],
      ['fill_blank', () => makeFillBlank('A {{1}} b.'), 'Espacio 1'],
      ['multi_blank', () => makeMultiBlank(), 'Past'],
      ['error_correction', () => makeExact('error_correction'), 'Escribe la frase corregida'],
    ]

    it.each(cases)('%s: Enter in the input does not submit a form', async (_n, build, label) => {
      const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
      render(
        <div onSubmit={onSubmit}>
          <QuestionView
            question={build()}
            number={1}
            answer={undefined}
            handlers={makeHandlers()}
          />
        </div>
      )
      expect(document.querySelector('form')).toBeNull()
      await userEvent.type(screen.getByLabelText(label), '{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
