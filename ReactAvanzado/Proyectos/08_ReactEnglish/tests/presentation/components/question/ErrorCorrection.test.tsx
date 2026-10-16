import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorCorrection } from '@presentation/components/question/ErrorCorrection'

describe('ErrorCorrection', () => {
  it('shows the wrong sentence in a box titled "Frase incorrecta"', () => {
    render(<ErrorCorrection sentence="She go to school." value="" onChange={() => {}} />)
    const box = screen.getByRole('group', { name: 'Frase incorrecta' })
    expect(box).toHaveTextContent('She go to school.')
  })

  it('renders an empty labelled input when there is no answer', () => {
    render(<ErrorCorrection sentence="She go to school." value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Escribe la frase corregida')).toHaveValue('')
  })

  it('shows the stored value and updates when the prop changes', () => {
    const { rerender } = render(<ErrorCorrection sentence="s" value="one" onChange={() => {}} />)
    expect(screen.getByLabelText('Escribe la frase corregida')).toHaveValue('one')
    rerender(<ErrorCorrection sentence="s" value="two" onChange={() => {}} />)
    expect(screen.getByLabelText('Escribe la frase corregida')).toHaveValue('two')
  })

  it('calls onChange with the typed text', async () => {
    const onChange = vi.fn()
    render(<ErrorCorrection sentence="s" value="" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Escribe la frase corregida'), 'S')
    expect(onChange).toHaveBeenCalledWith('S')
  })
})
