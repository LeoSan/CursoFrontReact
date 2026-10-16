import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EXPLANATION, makeSelfCheck } from '../../../../src/testing/questionFixtures'
import type { SelfCheckShape } from '@presentation/components/question/answerShapes'
import { SelfCheckBlock } from '@presentation/components/question/SelfCheckBlock'

const idle: SelfCheckShape = { text: '', revealed: false, markedCorrect: null }

function renderBlock(state: SelfCheckShape = idle) {
  const handlers = { onText: vi.fn(), onReveal: vi.fn(), onMark: vi.fn() }
  const utils = render(<SelfCheckBlock question={makeSelfCheck()} state={state} {...handlers} />)
  return { ...handlers, ...utils }
}

describe('SelfCheckBlock', () => {
  it('shows the textarea and reveal button but no model answer before reveal', () => {
    renderBlock()
    expect(screen.getByLabelText('Tu respuesta').tagName).toBe('TEXTAREA')
    expect(screen.getByRole('button', { name: 'Mostrar respuesta' })).toBeInTheDocument()
    expect(screen.queryByText('SECRET-ANSWER')).not.toBeInTheDocument()
    expect(screen.queryByText('Respuesta modelo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Acerté' })).not.toBeInTheDocument()
  })

  it('calls onText when typing', async () => {
    const { onText } = renderBlock()
    await userEvent.type(screen.getByLabelText('Tu respuesta'), 'h')
    expect(onText).toHaveBeenCalledWith('h')
  })

  it('reveal click stores the current text first, then reveals', async () => {
    const { onText, onReveal } = renderBlock({ ...idle, text: 'my text' })
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
    expect(onText).toHaveBeenCalledWith('my text')
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(onText.mock.invocationCallOrder[0]).toBeLessThan(onReveal.mock.invocationCallOrder[0])
  })

  it('after reveal shows the model answer, marking buttons, and keeps the typed text', () => {
    renderBlock({ text: 'my text', revealed: true, markedCorrect: null })
    expect(screen.getByText('Respuesta modelo')).toBeInTheDocument()
    expect(screen.getByText('SECRET-ANSWER')).toBeInTheDocument()
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('my text')
    expect(screen.queryByRole('button', { name: 'Mostrar respuesta' })).not.toBeInTheDocument()
  })

  it('never shows the explanation', () => {
    renderBlock({ text: '', revealed: true, markedCorrect: true })
    expect(screen.queryByText(EXPLANATION)).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(EXPLANATION)
  })

  it('exposes aria-pressed on Acerté / No acerté matching markedCorrect', () => {
    const { rerender, onMark } = renderBlock({ text: '', revealed: true, markedCorrect: null })
    const ok = () => screen.getByRole('button', { name: 'Acerté' })
    const ko = () => screen.getByRole('button', { name: 'No acerté' })
    expect(ok()).toHaveAttribute('aria-pressed', 'false')
    expect(ko()).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <SelfCheckBlock
        question={makeSelfCheck()}
        state={{ text: '', revealed: true, markedCorrect: true }}
        onText={() => {}}
        onReveal={() => {}}
        onMark={onMark}
      />
    )
    expect(ok()).toHaveAttribute('aria-pressed', 'true')
    expect(ko()).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <SelfCheckBlock
        question={makeSelfCheck()}
        state={{ text: '', revealed: true, markedCorrect: false }}
        onText={() => {}}
        onReveal={() => {}}
        onMark={onMark}
      />
    )
    expect(ok()).toHaveAttribute('aria-pressed', 'false')
    expect(ko()).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onMark with true / false', async () => {
    const { onMark } = renderBlock({ text: '', revealed: true, markedCorrect: null })
    await userEvent.click(screen.getByRole('button', { name: 'Acerté' }))
    await userEvent.click(screen.getByRole('button', { name: 'No acerté' }))
    expect(onMark).toHaveBeenNthCalledWith(1, true)
    expect(onMark).toHaveBeenNthCalledWith(2, false)
  })
})
