/** Normalize answer text for consistent grading comparison. */
export function normalizeAnswer(value: string): string {
  return (
    value
      // Unicode NFC normalization
      .normalize('NFC')
      // Replace typographic apostrophes and quotes with straight ones
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      // Trim leading and trailing whitespace
      .trim()
      // Collapse all runs of whitespace (including non-breaking spaces) into single spaces
      .replace(/\s+/g, ' ')
  )
}
