import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionNavigator } from '@presentation/components/QuestionNavigator'

function setup(overrides: Partial<Parameters<typeof QuestionNavigator>[0]> = {}) {
  const props = {
    numbers: [1, 2, 3],
    currentIndex: 1,
    answeredFlags: [true, false, false],
    disabled: false,
    submitting: false,
    onGoTo: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  }
  render(<QuestionNavigator {...props} />)
  return props
}

describe('QuestionNavigator', () => {
  it('renders one button per question with state-aware accessible names', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Pregunta 1, respondida' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pregunta 2, actual' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pregunta 3, sin responder' })).toBeTruthy()
  })

  it('paints a question marked as incorrect in red', () => {
    setup({ answeredFlags: [true, true, false], incorrectFlags: [true, false, false] })
    const button = screen.getByRole('button', { name: 'Pregunta 1, marcada como no acertada' })
    expect(button.className).toContain('border-red-600')
    expect(button.className).not.toContain('border-green-600')
  })

  it('marks only the current question with aria-current="step"', () => {
    setup()
    expect(
      screen.getByRole('button', { name: 'Pregunta 2, actual' }).getAttribute('aria-current')
    ).toBe('step')
    expect(
      screen.getByRole('button', { name: 'Pregunta 1, respondida' }).hasAttribute('aria-current')
    ).toBe(false)
  })

  it('reports the clicked index', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Pregunta 3, sin responder' }))
    expect(props.onGoTo).toHaveBeenCalledWith(2)
  })

  it('has a collapsed-by-default toggle wired to the panel', async () => {
    setup()
    const toggle = screen.getByRole('button', { name: 'Ver todas las preguntas' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)
    expect(panel).toBeTruthy()
    expect(panel!.className).toContain('hidden')
    expect(panel!.className).toContain('lg:block')

    await userEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(panel!.className).not.toMatch(/(^|\s)hidden(\s|$)/)

    await userEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('submit button passes itself as the trigger', async () => {
    const props = setup()
    const button = screen.getByRole('button', { name: 'Entregar examen' })
    await userEvent.click(button)
    expect(props.onSubmit).toHaveBeenCalledWith(button)
  })

  it('disables every control and shows the pending label while submitting', () => {
    setup({ disabled: true, submitting: true })
    expect(
      (screen.getByRole('button', { name: 'Entregando...' }) as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Ver todas las preguntas' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Pregunta 1, respondida' }) as HTMLButtonElement).disabled
    ).toBe(true)
  })
})
