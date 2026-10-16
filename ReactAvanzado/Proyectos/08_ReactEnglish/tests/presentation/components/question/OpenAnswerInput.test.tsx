import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OpenAnswerInput } from '@presentation/components/question/OpenAnswerInput'

describe('OpenAnswerInput', () => {
  it('renders a labelled single-line input with the anti-autocorrect attributes', () => {
    render(<OpenAnswerInput value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Tu respuesta')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(input).toHaveAttribute('autocorrect', 'off')
  })

  it('shows the stored value and updates when the prop changes', () => {
    const { rerender } = render(<OpenAnswerInput value="first" onChange={() => {}} />)
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('first')
    rerender(<OpenAnswerInput value="second" onChange={() => {}} />)
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('second')
  })

  it('calls onChange with the typed text', async () => {
    const onChange = vi.fn()
    render(<OpenAnswerInput value="" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Tu respuesta'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })
})
