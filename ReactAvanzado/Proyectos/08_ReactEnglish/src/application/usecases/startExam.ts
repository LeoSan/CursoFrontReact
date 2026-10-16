import {
  type ExamConfig,
  type GenerateExamResult,
  type IQuestionRepository,
  createSeededRandom,
  filterQuestions,
  generateExam,
} from '@domain'
import { type SystemDeps } from '../ports/systemDeps'

export type StartExamDeps = {
  readonly questionRepository: IQuestionRepository
  readonly system: SystemDeps
}

/** Start an exam by generating questions based on config. Uses seeded random from system. */
export function createStartExam(deps: StartExamDeps) {
  return async (config: ExamConfig): Promise<GenerateExamResult> => {
    const allQuestions = await deps.questionRepository.getAllQuestions()

    // Filter by config
    const filtered = filterQuestions(allQuestions, {
      selectedPairIds: config.selectedPairIds,
      levels: config.levels,
      difficulties: config.difficulties,
    })

    // Generate exam with seeded random
    const random = createSeededRandom(deps.system.randomSeed())
    const result = generateExam(filtered, config, {
      random,
      now: () => deps.system.now(),
      newId: () => deps.system.newId(),
    })

    return result
  }
}
