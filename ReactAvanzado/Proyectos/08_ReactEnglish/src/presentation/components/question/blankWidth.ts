import type { Blank } from '@domain'

export const MIN_BLANK_WIDTH_CH = 6
export const MAX_BLANK_WIDTH_CH = 24

/** Input width in ch for a blank. Only the length of the longest accepted answer is used; the text is never rendered. */
export function blankWidthCh(blank: Blank | undefined): number {
  const longest = (blank?.acceptedAnswers ?? []).reduce((max, a) => Math.max(max, a.length), 0)
  return Math.min(MAX_BLANK_WIDTH_CH, Math.max(MIN_BLANK_WIDTH_CH, longest))
}
