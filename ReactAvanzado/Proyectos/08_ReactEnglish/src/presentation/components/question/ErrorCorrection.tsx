import { useId } from 'react'
import { es } from '../../i18n/es'
import { fieldClass, labelClass } from './fieldStyles'

interface ErrorCorrectionProps {
  sentence: string
  value: string
  onChange: (value: string) => void
}

export function ErrorCorrection({ sentence, value, onChange }: ErrorCorrectionProps) {
  const inputId = useId()
  const titleId = useId()

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-labelledby={titleId}
        className="rounded-md border-l-4 border-red-500 bg-red-50 p-4"
      >
        <p id={titleId} className="text-xs font-bold tracking-wide text-red-800 uppercase">
          {es.exam.incorrectSentence}
        </p>
        <p className="mt-1 text-lg text-gray-900">{sentence}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor={inputId} className={labelClass}>
          {es.exam.correctedSentence}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className={fieldClass}
        />
      </div>
    </div>
  )
}
