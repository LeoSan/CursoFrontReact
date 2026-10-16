import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@presentation/components/ConfirmDialog'

function Harness({ onConfirm = () => {} }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open && (
        <ConfirmDialog
          title="Título"
          description={<p>Descripción del diálogo</p>}
          onClose={() => setOpen(false)}
          actions={[
            {
              label: 'Cancelar',
              variant: 'primary',
              initialFocus: true,
              onClick: () => setOpen(false),
            },
            { label: 'Confirmar', variant: 'danger', onClick: onConfirm },
          ]}
        />
      )}
    </div>
  )
}

async function openDialog() {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Abrir' }))
  return user
}

describe('ConfirmDialog', () => {
  it('exposes modal dialog semantics with a label and a description', async () => {
    await openDialog()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
    expect(dialog.tagName).not.toBe('DIALOG')
    expect(screen.getByRole('dialog', { name: 'Título' })).toBe(dialog)
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Descripción del diálogo'
    )
  })

  it('focuses the safe action when it opens', async () => {
    await openDialog()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }))
  })

  it('calls the action handler when an action is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(<Harness onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape and returns focus to the opener', async () => {
    const user = await openDialog()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir' }))
  })

  it('closes on backdrop click but not on a click inside the panel', async () => {
    const user = await openDialog()
    await user.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    const backdrop = screen.getByRole('dialog').parentElement!
    await user.click(backdrop)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir' }))
  })

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const user = await openDialog()
    const cancel = screen.getByRole('button', { name: 'Cancelar' })
    const confirm = screen.getByRole('button', { name: 'Confirmar' })

    expect(document.activeElement).toBe(cancel)
    await user.tab()
    expect(document.activeElement).toBe(confirm)
    await user.tab()
    expect(document.activeElement).toBe(cancel)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(confirm)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(cancel)
  })

  it('locks body scroll while open and restores it afterwards', async () => {
    const user = await openDialog()
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })

  it('removes the keydown listener and restores scroll on unmount', async () => {
    const onClose = vi.fn()
    const { unmount } = render(
      <ConfirmDialog
        title="T"
        description="D"
        onClose={onClose}
        actions={[{ label: 'Ok', variant: 'primary', onClick: () => {} }]}
      />
    )
    unmount()
    expect(document.body.style.overflow).toBe('')
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })
})
