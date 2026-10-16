import type { Media } from '@domain'
import { es } from '../../i18n/es'

interface MediaPlaceholderProps {
  media: Media
}

export function MediaPlaceholder({ media }: MediaPlaceholderProps) {
  const label = `${es.exam.image} ${media.name}`

  if (media.src !== null) {
    return (
      <img
        src={media.src}
        alt={media.name}
        loading="lazy"
        className="h-auto max-w-full rounded-md"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      className="flex min-h-32 items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-gray-600"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-8 w-8 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M3 17l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}
