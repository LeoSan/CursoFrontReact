import { es } from '../../i18n/es'

interface HintBadgeProps {
  hint: string | undefined
}

export function HintBadge({ hint }: HintBadgeProps) {
  if (!hint) return null

  return (
    <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
      {`${es.exam.hint} ${hint}`}
    </p>
  )
}
