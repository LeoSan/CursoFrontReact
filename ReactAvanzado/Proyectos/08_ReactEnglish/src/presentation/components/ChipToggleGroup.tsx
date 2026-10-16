interface ChipOption {
  value: string
  label: string
  count: number
  disabled: boolean
}

interface ChipToggleGroupProps {
  label: string
  options: ChipOption[]
  selectedOptions: string[]
  onToggle: (value: string) => void
}

export function ChipToggleGroup({
  label,
  options,
  selectedOptions,
  onToggle,
}: ChipToggleGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-gray-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => !option.disabled && onToggle(option.value)}
              disabled={option.disabled}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
              } ${option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
              aria-label={`${option.label}, ${option.count} preguntas`}
              type="button"
            >
              {option.label} ({option.count})
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
