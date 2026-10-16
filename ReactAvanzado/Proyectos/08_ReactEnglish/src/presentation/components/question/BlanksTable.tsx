import { useId } from 'react'
import type { Blank } from '@domain'
import { es } from '../../i18n/es'
import { fieldClass, labelClass } from './fieldStyles'

interface BlanksTableProps {
  heading: string
  blanks: readonly Blank[]
  values: Readonly<Record<number, string>>
  onChange: (blankId: number, value: string) => void
}

export function BlanksTable({ heading, blanks, values, onChange }: BlanksTableProps) {
  const idPrefix = useId()

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">{heading}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {blanks.map((blank) => {
          const id = `${idPrefix}-${blank.id}`
          return (
            <div key={blank.id} className="space-y-1">
              <label htmlFor={id} className={labelClass}>
                {blank.label ?? `${es.exam.blank} ${blank.id}`}
              </label>
              <input
                id={id}
                type="text"
                value={values[blank.id] ?? ''}
                onChange={(e) => onChange(blank.id, e.target.value)}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className={fieldClass}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
