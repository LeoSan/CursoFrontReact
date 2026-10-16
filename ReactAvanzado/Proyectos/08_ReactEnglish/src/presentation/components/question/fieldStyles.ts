const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1'

/** Text input / textarea: 44px minimum touch target, 16px text (avoids iOS zoom). */
export const fieldClass = `min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 ${focusRing}`

export const inlineFieldClass = `box-content inline-block h-11 max-w-full rounded-md border border-gray-300 bg-white px-2 align-middle text-base text-gray-900 ${focusRing}`

export const labelClass = 'block text-sm font-semibold text-gray-700'

export const buttonFocusRing = focusRing
