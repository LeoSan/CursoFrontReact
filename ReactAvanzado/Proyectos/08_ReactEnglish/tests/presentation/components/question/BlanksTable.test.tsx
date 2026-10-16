import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeMultiBlank } from '../../../../src/testing/questionFixtures'
import { BlanksTable } from '@presentation/components/question/BlanksTable'

function renderTable(values: Record<number, string> = {}, onChange = vi.fn()) {
  const q = makeMultiBlank()
  render(<BlanksTable heading={q.prompt} blanks={q.blanks} values={values} onChange={onChange} />)
  return onChange
}

describe('BlanksTable', () => {
  it('renders the prompt as a heading', () => {
    renderTable()
    expect(screen.getByRole('heading', { name: 'Complete the table' })).toBeInTheDocument()
  })

  it('labels each input with the blank label', () => {
    renderTable()
    expect(screen.getByLabelText('Present')).toBeInTheDocument()
    expect(screen.getByLabelText('Past')).toBeInTheDocument()
    expect(screen.getByLabelText('Participle')).toBeInTheDocument()
  })

  it('falls back to "Espacio n" when a blank has no label', () => {
    render(
      <BlanksTable
        heading="H"
        blanks={[{ id: 4, acceptedAnswers: ['x'] }]}
        values={{}}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Espacio 4')).toBeInTheDocument()
  })

  it('shows stored values and updates when the prop changes', () => {
    const q = makeMultiBlank()
    const { rerender } = render(
      <BlanksTable heading="H" blanks={q.blanks} values={{ 2: 'went' }} onChange={() => {}} />
    )
    expect(screen.getByLabelText('Past')).toHaveValue('went')
    expect(screen.getByLabelText('Present')).toHaveValue('')
    rerender(
      <BlanksTable heading="H" blanks={q.blanks} values={{ 2: 'did' }} onChange={() => {}} />
    )
    expect(screen.getByLabelText('Past')).toHaveValue('did')
  })

  it('calls onChange with the blank id and value', async () => {
    const onChange = renderTable()
    await userEvent.type(screen.getByLabelText('Participle'), 'g')
    expect(onChange).toHaveBeenCalledWith(3, 'g')
  })

  it('uses one column on mobile and two on md', () => {
    renderTable()
    const grid = screen.getByLabelText('Present').closest('.grid')
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2')
  })
})
