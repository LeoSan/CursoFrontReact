import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HintBadge } from '@presentation/components/question/HintBadge'

describe('HintBadge', () => {
  it('renders "Pista: {hint}" when a hint exists', () => {
    render(<HintBadge hint="use the past" />)
    expect(screen.getByText('Pista: use the past')).toBeInTheDocument()
  })

  it('renders nothing without a hint', () => {
    const { container } = render(<HintBadge hint={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty hint', () => {
    const { container } = render(<HintBadge hint="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
