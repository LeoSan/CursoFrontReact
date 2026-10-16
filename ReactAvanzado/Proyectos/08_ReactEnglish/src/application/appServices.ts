import type { LoadExamSetupResult, SubmitExamResult, AttemptHistory } from './usecases'
import type { Exam, ExamConfig, UserAnswer, GenerateExamResult } from '@domain'

export type AppServices = {
  readonly loadExamSetup: () => Promise<LoadExamSetupResult>
  readonly startExam: (config: ExamConfig) => Promise<GenerateExamResult>
  readonly submitExam: (exam: Exam, answers: readonly UserAnswer[]) => Promise<SubmitExamResult>
  readonly attemptHistory: AttemptHistory
}
