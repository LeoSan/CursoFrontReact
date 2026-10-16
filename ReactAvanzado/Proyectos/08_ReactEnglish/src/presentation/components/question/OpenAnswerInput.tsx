import { useId } from 'react'
import { es } from '../../i18n/es'
import { fieldClass, labelClass } from './fieldStyles'

interface OpenAnswerInputProps {
  value: string
  onChange: (value: string) => void
}

export function OpenAnswerInput({ value, onChange }: OpenAnswerInputProps) {
  const id = useId()

  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>
        {es.exam.yourAnswer}
      </label>
      <input
        id={id}
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
  )
}
