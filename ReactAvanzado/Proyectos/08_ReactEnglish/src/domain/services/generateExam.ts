import { type Question, type Exam, type ExamConfig, type ExamQuestion } from '../entities'
import { filterQuestions } from './filterQuestions'
import { shuffle } from './random'

/** Result of exam generation as a discriminated union. */
export type GenerateExamResult =
  | {
      readonly ok: false
      readonly reason: 'no_questions' | 'invalid_count'
    }
  | {
      readonly ok: true
      readonly exam: Exam
      readonly requestedCount: number
      readonly availableCount: number
      readonly reducedToAvailable: boolean
    }

/** Dependencies for exam generation (injected, never use Math.random/Date/crypto). */
export interface GenerateExamDeps {
  readonly random: () => number
  readonly now: () => string
  readonly newId: () => string
}

/** Generate an exam from questions and config. */
export function generateExam(
  questions: readonly Question[],
  config: ExamConfig,
  deps: GenerateExamDeps
): GenerateExamResult {
  // Validate questionCount
  if (!Number.isInteger(config.questionCount) || config.questionCount < 1) {
    return { ok: false, reason: 'invalid_count' }
  }

  // Filter questions
  let filtered = filterQuestions(questions, {
    selectedPairIds: config.selectedPairIds,
    levels: config.levels,
    difficulties: config.difficulties,
  })

  // Check if any questions match
  if (filtered.length === 0) {
    return { ok: false, reason: 'no_questions' }
  }

  // Shuffle if requested
  if (config.shuffle) {
    filtered = shuffle(filtered, deps.random)
  }

  // Take min(requested, available)
  const availableCount = filtered.length
  const questionCount = Math.min(config.questionCount, availableCount)
  const reducedToAvailable = questionCount < config.questionCount
  const selectedQuestions = filtered.slice(0, questionCount)

  // Create ExamQuestion[] with numbers 1..n
  const examQuestions: ExamQuestion[] = selectedQuestions.map((question, index) => ({
    number: index + 1,
    question,
  }))

  // Create Exam
  const exam: Exam = {
    id: deps.newId(),
    createdAt: deps.now(),
    config: { ...config },
    questions: examQuestions,
  }

  return {
    ok: true,
    exam,
    requestedCount: config.questionCount,
    availableCount,
    reducedToAvailable,
  }
}
