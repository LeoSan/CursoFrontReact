import {
  type Exam,
  type UserAnswer,
  type Attempt,
  type IAttemptRepository,
  gradeExam,
} from '@domain'
import { type SystemDeps } from '../ports/systemDeps'

export type SubmitExamResult =
  | { readonly saved: true; readonly attempt: Attempt }
  | { readonly saved: false; readonly attempt: Attempt; readonly error: Error }

/** Outcome of submitting an exam: the graded attempt plus whether it was persisted. */
export type SubmitExamOutcome = SubmitExamResult

export type SubmitExamDeps = {
  readonly attemptRepository: IAttemptRepository
  readonly system: SystemDeps
}

/** Grade an exam and persist the attempt. Grading is never lost even if persistence fails. */
export function createSubmitExam(deps: SubmitExamDeps) {
  return async (exam: Exam, answers: readonly UserAnswer[]): Promise<SubmitExamResult> => {
    // Grade the exam (pure function, always succeeds)
    const result = gradeExam(exam, answers)

    // Build attempt
    const attempt: Attempt = {
      id: deps.system.newId(),
      exam,
      answers,
      result,
      finishedAt: deps.system.now(),
    }

    // Try to persist; if it fails, still return the graded attempt
    try {
      await deps.attemptRepository.save(attempt)
      return { saved: true, attempt }
    } catch (error) {
      return {
        saved: false,
        attempt,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }
}
