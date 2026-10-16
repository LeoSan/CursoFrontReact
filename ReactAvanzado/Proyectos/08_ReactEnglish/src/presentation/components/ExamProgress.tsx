import { es } from '../i18n/es'

interface ExamProgressProps {
  current: number
  total: number
  answered: number
}

export function ExamProgress({ current, total, answered }: ExamProgressProps) {
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-semibold text-gray-900">{es.examPage.questionOf(current, total)}</p>
        <p className="text-gray-600">{es.examPage.answeredCount(answered, total)}</p>
      </div>
      <div
        role="progressbar"
        aria-label={es.examPage.progressLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full bg-indigo-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
