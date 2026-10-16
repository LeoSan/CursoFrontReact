import type { Exam } from '@domain'
import { useExamSetup } from '../hooks/useExamSetup'
import { useExamConfigForm } from '../hooks/useExamConfigForm'
import { MultiSelectPairs } from '../components/MultiSelectPairs'
import { ChipToggleGroup } from '../components/ChipToggleGroup'
import { es } from '../i18n/es'

interface ConfigPageProps {
  onExamStarted?: (exam: Exam) => void
}

export default function ConfigPage({ onExamStarted }: ConfigPageProps = {}) {
  const { data, loading, error, retry } = useExamSetup()
  const form = useExamConfigForm(data)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">{es.configPage.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <p className="text-lg text-red-600">{es.configPage.error}</p>
          <button
            onClick={retry}
            className="mt-4 rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            {es.configPage.retry}
          </button>
        </div>
      </div>
    )
  }

  if (!form) return null

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await form.handlers.submit(e)
    if (result?.success) {
      onExamStarted?.(result.exam)
    }
  }

  const { state, handlers, computed } = form

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">{es.configPage.title}</h1>
          <p className="mt-2 text-gray-600">{es.configPage.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-lg">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              {es.pairSelection.label}
            </label>
            <div className="mt-2">
              <MultiSelectPairs
                pairs={computed.pairs}
                selectedIds={state.selectedPairIds}
                onToggle={handlers.togglePair}
                onSelectAll={handlers.selectAllPairs}
                onClear={handlers.clearPairs}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChipToggleGroup
              label={es.levelAndDifficulty.levels}
              options={computed.levelOptions}
              selectedOptions={state.selectedLevels}
              onToggle={handlers.toggleLevel}
            />
            <ChipToggleGroup
              label={es.levelAndDifficulty.difficulties}
              options={computed.difficultyOptions}
              selectedOptions={state.selectedDifficulties}
              onToggle={handlers.toggleDifficulty}
            />
          </div>

          <p className="text-xs text-gray-500 md:text-sm">{es.levelAndDifficulty.note}</p>

          <div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700">
                  {es.questionCount.label}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={computed.availableCount || 1}
                    value={state.questionCount}
                    onChange={(e) => handlers.setCount(parseInt(e.target.value) || 1)}
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlers.setCount(num)}
                    className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlers.setCount(computed.availableCount)}
                  className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  {es.questionCount.all}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 md:text-sm">
              {es.questionCount.available} {computed.availableCount}
            </p>
            {state.questionCount > computed.availableCount && computed.availableCount > 0 && (
              <p className="mt-1 text-xs text-orange-600">
                {es.questionCount.exceeded} {computed.availableCount}
              </p>
            )}
          </div>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={state.shuffle}
              onChange={(e) => handlers.setShuffle(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm text-gray-700">{es.shuffle.label}</span>
          </label>

          {state.submitError && (
            <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-600">
              {state.submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={state.submitting || state.selectedPairIds.length === 0}
            className="w-full rounded bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400 md:w-auto"
          >
            {state.submitting ? es.generate.generating : es.generate.button}
          </button>
        </form>
      </div>
    </div>
  )
}
