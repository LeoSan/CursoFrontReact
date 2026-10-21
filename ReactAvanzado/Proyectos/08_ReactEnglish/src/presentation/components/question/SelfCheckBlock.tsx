import { useId } from 'react'
import type { SelfCheckQuestion } from '@domain'
import { es } from '../../i18n/es'
import type { SelfCheckShape } from './answerShapes'
import { buttonFocusRing, fieldClass, labelClass } from './fieldStyles'
import { MarkCorrectIncorrect } from './MarkCorrectIncorrect'

interface SelfCheckBlockProps {
  question: SelfCheckQuestion
  state: SelfCheckShape
  onText: (value: string) => void
  onReveal: () => void
  onMark: (correct: boolean) => void
}

const baseButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium ${buttonFocusRing}`

export function SelfCheckBlock({ question, state, onText, onReveal, onMark }: SelfCheckBlockProps) {
  const textId = useId()
  const modelTitleId = useId()

  const handleReveal = () => {
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

          <MarkCorrectIncorrect marked={state.markedCorrect} onMark={onMark} />
        </>
      )}
    </div>
  )
}
