import { parseTemplate, type Blank } from '@domain'
import { es } from '../../i18n/es'
import { blankWidthCh } from './blankWidth'
import { inlineFieldClass } from './fieldStyles'

interface InlineBlanksProps {
  template: string
  blanks: readonly Blank[]
  values: Readonly<Record<number, string>>
  onChange: (blankId: number, value: string) => void
}

export function InlineBlanks({ template, blanks, values, onChange }: InlineBlanksProps) {
  const parts = parseTemplate(template)

  return (
    <div className="text-lg leading-relaxed text-gray-900">
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <span key={index} className="whitespace-pre-wrap">
            {part.value}
          </span>
        ) : (
          <input
            key={index}
            type="text"
            aria-label={`${es.exam.blank} ${part.id}`}
            value={values[part.id] ?? ''}
            onChange={(e) => onChange(part.id, e.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            style={{ width: `${blankWidthCh(blanks.find((b) => b.id === part.id))}ch` }}
            className={`${inlineFieldClass} mx-1`}
          />
        )
      )}
    </div>
  )
}
