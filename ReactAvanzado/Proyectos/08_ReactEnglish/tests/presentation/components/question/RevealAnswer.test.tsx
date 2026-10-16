import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { EXPLANATION, makeExact, SECRET } from '../../../../src/testing/questionFixtures'
import { RevealAnswer } from '@presentation/components/question/RevealAnswer'

function Harness() {
  const [revealed, setRevealed] = useState(false)
  return (
    <RevealAnswer
      question={makeExact('open')}
      revealed={revealed}
      onToggle={() => setRevealed((v) => !v)}
    />
  )
}

describe('RevealAnswer', () => {
  it('keeps the answer out of the DOM until revealed', () => {
    render(<Harness />)
    expect(document.body).not.toHaveTextContent(SECRET)
    expect(document.body).not.toHaveTextContent(EXPLANATION)
    expect(screen.getByRole('button', { name: 'Ver respuesta' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('shows the answer and explanation, then hides them again', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Ver respuesta' }))
    expect(document.body).toHaveTextContent(SECRET)
    expect(document.body).toHaveTextContent(EXPLANATION)

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar respuesta' }))
    expect(document.body).not.toHaveTextContent(SECRET)
  })
})
