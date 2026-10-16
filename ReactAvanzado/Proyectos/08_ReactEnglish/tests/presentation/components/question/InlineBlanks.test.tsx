import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeFillBlank } from '../../../../src/testing/questionFixtures'
import { InlineBlanks } from '@presentation/components/question/InlineBlanks'

function renderBlanks(template: string, values: Record<number, string> = {}, onChange = vi.fn()) {
  const q = makeFillBlank(template)
  render(<InlineBlanks template={template} blanks={q.blanks} values={values} onChange={onChange} />)
  return onChange
}

describe('InlineBlanks', () => {
  it('renders text before and after the input in order', () => {
    renderBlanks('The dog {{1}} early every day.')
    const input = screen.getByLabelText('Espacio 1')
    const container = input.parentElement as HTMLElement
    const children = Array.from(container.childNodes)
    expect(children).toHaveLength(3)
    expect(children[0]).toHaveTextContent('The dog')
    expect(children[1]).toBe(input)
    expect(children[2]).toHaveTextContent('early every day.')
  })

  it('renders one input per marker', () => {
    renderBlanks('{{1}} and {{2}} are friends.')
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByLabelText('Espacio 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Espacio 2')).toBeInTheDocument()
  })

  it('takes values from the stored answer and updates on prop change', () => {
    const q = makeFillBlank('A {{1}} b {{2}} c')
    const { rerender } = render(
      <InlineBlanks
        template="A {{1}} b {{2}} c"
        blanks={q.blanks}
        values={{ 1: 'x' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Espacio 1')).toHaveValue('x')
    expect(screen.getByLabelText('Espacio 2')).toHaveValue('')
    rerender(
      <InlineBlanks
        template="A {{1}} b {{2}} c"
        blanks={q.blanks}
        values={{ 1: 'y', 2: 'z' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Espacio 1')).toHaveValue('y')
    expect(screen.getByLabelText('Espacio 2')).toHaveValue('z')
  })

  it('calls onChange with the blank id and typed value', async () => {
    const onChange = renderBlanks('A {{1}} b {{2}} c')
    await userEvent.type(screen.getByLabelText('Espacio 2'), 'q')
    expect(onChange).toHaveBeenCalledWith(2, 'q')
  })

  it('sets a width style between 6ch and 24ch', () => {
    renderBlanks('The dog {{1}} early.')
    expect((screen.getByLabelText('Espacio 1') as HTMLInputElement).style.width).toBe('13ch')
  })

  it('does not render accepted answer text', () => {
    renderBlanks('The dog {{1}} early.')
    expect(document.body).not.toHaveTextContent('SECRET-ANSWER')
  })
})
