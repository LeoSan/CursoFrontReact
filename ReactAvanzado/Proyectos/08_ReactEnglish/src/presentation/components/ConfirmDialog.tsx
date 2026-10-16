import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type ConfirmAction = {
  readonly label: string
  readonly onClick: () => void
  readonly variant: 'primary' | 'secondary' | 'danger'
  /** The safe action receives focus when the dialog opens. */
  readonly initialFocus?: boolean
}

interface ConfirmDialogProps {
  title: string
  description: ReactNode
  actions: readonly ConfirmAction[]
  /** Called on Escape and on backdrop click. */
  onClose: () => void
  /** Element to focus on close. Defaults to the element focused when the dialog opened. */
  returnFocusTo?: HTMLElement | null
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const variantClass: Record<ConfirmAction['variant'], string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
}

/** Mount it to open it, unmount it to close it. */
export function ConfirmDialog({
  title,
  description,
  actions,
  onClose,
  returnFocusTo,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  // Captured once, before focus moves into the dialog.
  const [opener] = useState<HTMLElement | null>(
    () =>
      returnFocusTo ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  )

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const initial =
      panel.querySelector<HTMLElement>('[data-initial-focus]') ?? focusableIn(panel)[0] ?? panel
    initial.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const items = focusableIn(panel)
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) {
        event.preventDefault()
        panel.focus()
        return
      }

      const active = document.activeElement
      if (!(active instanceof Node) || !panel.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus()
    }
  }, [opener])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl focus:outline-none"
      >
        <h2 id={titleId} className="text-lg font-bold text-gray-900">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm text-gray-700">
          {description}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              data-initial-focus={action.initialFocus ? '' : undefined}
              className={`min-h-11 rounded-md px-4 py-2 text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${variantClass[action.variant]}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
