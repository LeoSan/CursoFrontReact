import { type Question, type EnglishLevel, type Difficulty } from './question'

/** Configuration for generating an exam. */
export type ExamConfig = {
  readonly selectedPairIds: readonly string[]
  readonly levels: readonly EnglishLevel[]
  readonly difficulties: readonly Difficulty[]
  readonly questionCount: number
  readonly shuffle: boolean
}

/** A single question within an exam (with its position). */
export type ExamQuestion = {
  readonly number: number
  readonly question: Question
}

/** An exam instance (not yet graded). */
export type Exam = {
  readonly id: string
  readonly createdAt: string
  readonly config: ExamConfig
  readonly questions: readonly ExamQuestion[]
}
