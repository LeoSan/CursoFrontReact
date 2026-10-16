import type { SubmitExamOutcome } from '@application'
import { es } from '../i18n/es'

interface ResultsPlaceholderPageProps {
  outcome: SubmitExamOutcome
  onNewExam: () => void
}

export default function ResultsPlaceholderPage({
  outcome,
  onNewExam,
}: ResultsPlaceholderPageProps) {
  const { score, correct, incorrect, unanswered } = outcome.attempt.result

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-indigo-900">{es.results.title}</h1>

        {!outcome.saved && (
          <p role="alert" className="rounded bg-amber-100 p-3 text-sm text-amber-900">
            {es.results.notSaved}
          </p>
        )}

        <p className="text-xl font-semibold text-gray-900">{`${es.results.score} ${score}`}</p>
        <ul className="space-y-1 text-gray-700">
          <li>{`${es.results.correct} ${correct}`}</li>
          <li>{`${es.results.incorrect} ${incorrect}`}</li>
          <li>{`${es.results.unanswered} ${unanswered}`}</li>
        </ul>

        <button
          type="button"
          onClick={onNewExam}
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          {es.results.newExam}
        </button>
      </div>
    </div>
  )
}
