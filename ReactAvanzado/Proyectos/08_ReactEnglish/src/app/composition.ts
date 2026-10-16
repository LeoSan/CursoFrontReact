import {
  createLoadExamSetup,
  createStartExam,
  createSubmitExam,
  createAttemptHistory,
  type AppServices,
} from '@application'
import { questionRepository, createLocalStorageAttemptRepository } from '@infrastructure'
import { systemDeps } from './systemDeps'

const attemptRepository = createLocalStorageAttemptRepository({
  storage: typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined!,
})

export const appServices = {
  loadExamSetup: createLoadExamSetup({ questionRepository }),
  startExam: createStartExam({ questionRepository, system: systemDeps }),
  submitExam: createSubmitExam({ attemptRepository, system: systemDeps }),
  attemptHistory: createAttemptHistory({ attemptRepository }),
} satisfies AppServices
