import { useId } from 'react'
import type { Question } from '@domain'
import { es } from '../../i18n/es'
import { buttonFocusRing } from './fieldStyles'

interface RevealAnswerProps {
  question: Question
  revealed: boolean
  onToggle: () => void
}

export function RevealAnswer({ question, revealed, onToggle }: RevealAnswerProps) {
  const panelId = useId()

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={revealed}
        aria-controls={panelId}
        onClick={onToggle}
        className={`inline-flex min-h-11 items-center justify-center rounded-md border border-indigo-600 px-4 py-2 text-base font-medium text-indigo-700 hover:bg-indigo-50 ${buttonFocusRing}`}
      >
        {revealed ? es.exam.hideAnswer : es.exam.showAnswerSelf}
      </button>

      {revealed && (
        <section id={panelId} className="rounded-md border border-indigo-200 bg-indigo-50 p-4">
          <h4 className="text-xs font-bold tracking-wide text-indigo-800 uppercase">
            {es.exam.modelAnswer}
          </h4>
          <p className="mt-1 text-base whitespace-pre-wrap text-gray-900">{question.answer}</p>
          {question.explanation && (
            <p className="mt-3 text-sm text-gray-700">
              <span className="font-semibold">{es.exam.explanation}</span> {question.explanation}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
