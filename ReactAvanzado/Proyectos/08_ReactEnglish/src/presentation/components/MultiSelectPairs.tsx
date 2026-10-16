import { useState, useRef, useEffect } from 'react'
import type { LessonPair } from '@domain'

interface MultiSelectPairsProps {
  pairs: readonly LessonPair[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
}

export function MultiSelectPairs({
  pairs,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
}: MultiSelectPairsProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectedPairs = pairs.filter((p) => selectedIds.includes(p.id))
  const displayText =
    selectedIds.length === 0
      ? 'Selecciona pares de lecciones'
      : selectedIds.length === 1
        ? selectedPairs[0]?.label || selectedIds[0]
        : `${selectedIds.length} pares seleccionados`

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:border-gray-400 md:max-w-xs lg:max-w-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {displayText}
        <span className="float-right">▼</span>
      </button>

      {open && (
        <div
          className="absolute top-full z-10 mt-2 w-full rounded border border-gray-300 bg-white shadow-lg md:max-w-xs lg:max-w-sm"
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          <div className="border-b border-gray-200 px-4 py-2">
            <button
              onClick={() => {
                onSelectAll()
              }}
              className="mr-2 text-sm text-indigo-600 hover:underline"
              type="button"
            >
              Seleccionar todos
            </button>
            <button
              onClick={() => {
                onClear()
              }}
              className="text-sm text-indigo-600 hover:underline"
              type="button"
            >
              Limpiar
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {pairs.map((pair) => (
              <label
                key={pair.id}
                className="flex cursor-pointer items-center px-4 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(pair.id)}
                  onChange={() => onToggle(pair.id)}
                  className="mr-3 h-4 w-4"
                  aria-label={pair.label}
                />
                <span className="text-sm text-gray-700">{pair.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
