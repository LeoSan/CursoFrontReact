import { es } from '../../i18n/es'
import { buttonFocusRing } from './fieldStyles'

interface MarkCorrectIncorrectProps {
  marked: boolean | null | undefined
  onMark: (correct: boolean) => void
}

const baseButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium ${buttonFocusRing}`

function markButtonClass(pressed: boolean, tone: 'green' | 'red'): string {
  if (!pressed) {
    return `${baseButton} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`
  }
  return tone === 'green'
    ? `${baseButton} border border-green-700 bg-green-700 text-white`
    : `${baseButton} border border-red-700 bg-red-700 text-white`
}

export function MarkCorrectIncorrect({ marked, onMark }: MarkCorrectIncorrectProps) {
  return (
    <div role="group" aria-label={es.exam.selfCheckGroup} className="flex flex-wrap gap-3">
      <button
        type="button"
        aria-pressed={marked === true}
        onClick={() => onMark(true)}
        className={markButtonClass(marked === true, 'green')}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {es.exam.markCorrect}
      </button>
      <button
        type="button"
        aria-pressed={marked === false}
        onClick={() => onMark(false)}
        className={markButtonClass(marked === false, 'red')}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
        {es.exam.markIncorrect}
      </button>
    </div>
  )
}
