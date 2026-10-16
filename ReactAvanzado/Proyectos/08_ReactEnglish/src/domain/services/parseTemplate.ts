export type TemplatePart =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'blank'; readonly id: number }

// Marker is {{n}} with n an integer >= 1 (no leading zeros).
const MARKER = /\{\{([1-9]\d*)\}\}/g

/** Split a template into literal text and blank markers. Text is kept verbatim; no empty text parts. */
export function parseTemplate(template: string): readonly TemplatePart[] {
  const parts: TemplatePart[] = []
  let cursor = 0

  for (const match of template.matchAll(MARKER)) {
    const start = match.index
    if (start > cursor) {
      parts.push({ kind: 'text', value: template.slice(cursor, start) })
    }
    parts.push({ kind: 'blank', id: Number(match[1]) })
    cursor = start + match[0].length
  }

  if (cursor < template.length) {
    parts.push({ kind: 'text', value: template.slice(cursor) })
  }

  return parts
}
