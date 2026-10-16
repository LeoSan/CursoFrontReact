import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExamProgress } from '@presentation/components/ExamProgress'

describe('ExamProgress', () => {
  it('shows the current question and the answered count', () => {
    render(<ExamProgress current={2} total={5} answered={3} />)
    expect(screen.getByText('Pregunta 2 de 5')).toBeTruthy()
    expect(screen.getByText('Respondidas: 3 / 5')).toBeTruthy()
  })

  it('exposes a progressbar with the answered count', () => {
    render(<ExamProgress current={1} total={5} answered={2} />)
    const bar = screen.getByRole('progressbar', { name: 'Preguntas respondidas' })
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('5')
    expect(bar.getAttribute('aria-valuenow')).toBe('2')
  })

  it('fills the bar proportionally', () => {
    render(<ExamProgress current={1} total={4} answered={1} />)
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement
    expect(fill.style.width).toBe('25%')
  })

  it('does not divide by zero with an empty exam', () => {
    render(<ExamProgress current={0} total={0} answered={0} />)
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement
    expect(fill.style.width).toBe('0%')
  })
})
