/** User's answer to a free-form (text) question. */
export type TextAnswer = {
  readonly kind: 'text'
  readonly questionId: string
  readonly value: string
  readonly markedCorrect?: boolean | null
}

/** User's answers to a fill-in-the-blank question (by blank ID). */
export type BlanksAnswer = {
  readonly kind: 'blanks'
  readonly questionId: string
  readonly values: Readonly<Record<number, string>>
  readonly markedCorrect?: boolean | null
}

/** User's self-check answer (manually mark correct or leave for review). */
export type SelfCheckAnswer = {
  readonly kind: 'selfCheck'
  readonly questionId: string
  readonly revealed: boolean
  readonly markedCorrect: boolean | null
  /** The student's own attempt, kept for review. Never graded. */
  readonly text?: string
}

/** A user's answer to a single question (one of three types). */
export type UserAnswer = TextAnswer | BlanksAnswer | SelfCheckAnswer

/** Grading result for a single question. */
export type QuestionResult = {
  readonly questionId: string
  readonly gradingMode: 'exact' | 'blanks' | 'selfCheck'
  readonly correct: boolean | null
  readonly blankResults?: Readonly<Record<number, boolean>>
}

/** Overall result for an exam. */
export type ExamResult = {
  readonly examId: string
  readonly total: number
  readonly correct: number
  readonly incorrect: number
  readonly unanswered: number
  readonly score: number
  readonly results: readonly QuestionResult[]
}
