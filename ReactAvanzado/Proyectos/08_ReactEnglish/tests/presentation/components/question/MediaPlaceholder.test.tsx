import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MediaPlaceholder } from '@presentation/components/question/MediaPlaceholder'

describe('MediaPlaceholder', () => {
  it('renders a labelled placeholder with visible text when src is null', () => {
    render(<MediaPlaceholder media={{ type: 'image', name: 'Clock at 7:00', src: null }} />)
    expect(screen.getByRole('img', { name: 'Imagen: Clock at 7:00' })).toBeInTheDocument()
    expect(screen.getByText('Imagen: Clock at 7:00')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('renders an img with alt, lazy loading and max-w-full when src is set', () => {
    render(<MediaPlaceholder media={{ type: 'image', name: 'Clock at 7:00', src: '/clock.png' }} />)
    const img = screen.getByRole('img', { name: 'Clock at 7:00' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/clock.png')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveClass('max-w-full')
    expect(screen.queryByText('Imagen: Clock at 7:00')).not.toBeInTheDocument()
  })
})
