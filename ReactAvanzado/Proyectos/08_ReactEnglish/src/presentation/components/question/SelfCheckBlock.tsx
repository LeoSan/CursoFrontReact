import { useId } from 'react'
import type { SelfCheckQuestion } from '@domain'
import { es } from '../../i18n/es'
import type { SelfCheckShape } from './answerShapes'
import { buttonFocusRing, fieldClass, labelClass } from './fieldStyles'

interface SelfCheckBlockProps {
  question: SelfCheckQuestion
  state: SelfCheckShape
  onText: (value: string) => void
  onReveal: () => void
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

export function SelfCheckBlock({ question, state, onText, onReveal, onMark }: SelfCheckBlockProps) {
  const textId = useId()
  const modelTitleId = useId()

  const handleReveal = () => {
    // Ensure an answer exists first: the session reducer ignores `reveal` for a question with no answer yet.
    onText(state.text)
    onReveal()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor={textId} className={labelClass}>
          {es.exam.yourAnswer}
        </label>
        <textarea
          id={textId}
          value={state.text}
          onChange={(e) => onText(e.target.value)}
          rows={4}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className={fieldClass}
        />
      </div>

      {!state.revealed && (
        <button
          type="button"
          onClick={handleReveal}
          className={`${baseButton} bg-indigo-600 text-white hover:bg-indigo-700`}
        >
          {es.exam.showAnswer}
        </button>
      )}

      {state.revealed && (
        <>
          <section
            aria-labelledby={modelTitleId}
            className="rounded-md border border-indigo-200 bg-indigo-50 p-4"
          >
            <h4
              id={modelTitleId}
              className="text-xs font-bold tracking-wide text-indigo-800 uppercase"
            >
              {es.exam.modelAnswer}
            </h4>
            <p className="mt-1 text-base whitespace-pre-wrap text-gray-900">{question.answer}</p>
          </section>

          <div role="group" aria-label={es.exam.selfCheckGroup} className="flex flex-wrap gap-3">
            <button
              type="button"
              aria-pressed={state.markedCorrect === true}
              onClick={() => onMark(true)}
              className={markButtonClass(state.markedCorrect === true, 'green')}
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
              aria-pressed={state.markedCorrect === false}
              onClick={() => onMark(false)}
              className={markButtonClass(state.markedCorrect === false, 'red')}
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
        </>
      )}
    </div>
  )
}
