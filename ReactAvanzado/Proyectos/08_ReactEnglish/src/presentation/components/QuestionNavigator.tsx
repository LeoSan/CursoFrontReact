import { useId, useState } from 'react'
import { es } from '../i18n/es'

interface QuestionNavigatorProps {
  /** Display number of each question, in exam order. */
  numbers: readonly number[]
  currentIndex: number
  answeredFlags: readonly boolean[]
  /** One flag per question: true when the student marked it "No acerté". */
  incorrectFlags?: readonly boolean[]
  disabled: boolean
  submitting: boolean
  onGoTo: (index: number) => void
  onSubmit: (trigger: HTMLButtonElement) => void
}

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1'

function accessibleName(
  number: number,
  isCurrent: boolean,
  isAnswered: boolean,
  isIncorrect: boolean
): string {
  if (isCurrent) return es.examPage.navCurrent(number)
  if (isIncorrect) return es.examPage.navIncorrect(number)
  return isAnswered ? es.examPage.navAnswered(number) : es.examPage.navUnanswered(number)
}

function stateClass(isCurrent: boolean, isAnswered: boolean, isIncorrect: boolean): string {
  if (isCurrent) {
    return `border-indigo-700 bg-indigo-700 text-white ${isIncorrect ? 'ring-2 ring-red-500 ring-offset-1' : ''}`
  }
  if (isIncorrect) return 'border-red-600 bg-red-50 text-red-900'
  if (isAnswered) return 'border-green-600 bg-green-50 text-green-900'
  return 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
}

export function QuestionNavigator({
  numbers,
  currentIndex,
  answeredFlags,
  incorrectFlags = [],
  disabled,
  submitting,
  onGoTo,
  onSubmit,
}: QuestionNavigatorProps) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()

  return (
    <nav
      aria-label={es.examPage.navLabel}
      className="space-y-3 rounded-lg bg-white p-4 shadow lg:fixed lg:inset-y-0 lg:right-0 lg:w-72 lg:overflow-y-auto lg:rounded-none lg:border-l lg:border-gray-200 lg:pt-6 lg:shadow-none"
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
        className={`flex min-h-11 w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-base font-medium text-gray-800 lg:hidden disabled:opacity-60 ${focusRing}`}
      >
        {es.examPage.navToggle}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={panelId} className={expanded ? 'block' : 'hidden lg:block'}>
        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
          {numbers.map((number, index) => {
            const isCurrent = index === currentIndex
            const isAnswered = answeredFlags[index] === true
            const isIncorrect = incorrectFlags[index] === true
            return (
              <li key={number}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={accessibleName(number, isCurrent, isAnswered, isIncorrect)}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => onGoTo(index)}
                  className={`relative h-11 w-full min-w-11 rounded-md border text-base font-semibold disabled:opacity-60 ${stateClass(isCurrent, isAnswered, isIncorrect)} ${focusRing}`}
                >
                  {number}
                  {isIncorrect ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className="absolute top-0.5 right-0.5 h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 3l6 6M9 3L3 9" strokeLinecap="round" />
                    </svg>
                  ) : (
                    isAnswered && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 12 12"
                        className="absolute top-0.5 right-0.5 h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M2.5 6.5l2.5 2.5 4.5-5.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={(event) => onSubmit(event.currentTarget)}
        className={`min-h-11 w-full rounded-md bg-indigo-600 px-4 py-2 text-base font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400 ${focusRing}`}
      >
        {submitting ? es.examPage.submitting : es.examPage.submitExam}
      </button>
    </nav>
  )
}
