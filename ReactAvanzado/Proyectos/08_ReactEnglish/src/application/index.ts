export type { SystemDeps } from './ports/systemDeps'
export type { AppServices } from './appServices'

export {
  createLoadExamSetup,
  createStartExam,
  createSubmitExam,
  createAttemptHistory,
  type LoadExamSetupResult,
  type LoadExamSetupDeps,
  type StartExamDeps,
  type SubmitExamDeps,
  type SubmitExamResult,
  type SubmitExamOutcome,
  type AttemptHistory,
  type AttemptHistoryDeps,
} from './usecases'

export {
  examSessionReducer,
  selectAnswersArray,
  selectUnansweredNumbers,
  type ExamSessionState,
  type ExamSessionAction,
} from './store/examSession'

export type { GenerateExamResult } from '@domain'
