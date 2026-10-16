import { type IQuestionRepository } from '@domain'
import { type LessonPair, type Question } from '@domain'

export type LoadExamSetupResult = {
  readonly pairs: readonly LessonPair[]
  readonly questions: readonly Question[]
}

export type LoadExamSetupDeps = {
  readonly questionRepository: IQuestionRepository
}

/** Load lesson pairs and questions for the exam configuration screen. */
export function createLoadExamSetup(deps: LoadExamSetupDeps) {
  return async (): Promise<LoadExamSetupResult> => {
    const [banks, questions] = await Promise.all([
      deps.questionRepository.getBanks(),
      deps.questionRepository.getAllQuestions(),
    ])

    // Flatten all lesson pairs from all banks
    const pairMap = new Map<string, LessonPair>()
    for (const bank of banks) {
      for (const pair of bank.metadata.lessonPairs) {
        pairMap.set(pair.id, pair)
      }
    }

    return {
      pairs: Array.from(pairMap.values()),
      questions,
    }
  }
}
