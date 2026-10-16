import { type Question, type Difficulty, type EnglishLevel } from '../entities'
import { filterQuestions } from './filterQuestions'

/** Count questions matching the filter config. */
export function countAvailable(
  questions: readonly Question[],
  config: {
    readonly selectedPairIds: readonly string[]
    readonly levels: readonly EnglishLevel[]
    readonly difficulties: readonly Difficulty[]
  }
): number {
  return filterQuestions(questions, config).length
}

/** Get count breakdown by level and difficulty for questions in selectedPairIds. */
export function getFilterCounts(
  questions: readonly Question[],
  selectedPairIds: readonly string[]
): {
  readonly levels: Record<EnglishLevel, number>
  readonly difficulties: Record<Difficulty, number>
} {
  const levels: Record<EnglishLevel, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  }
  const difficulties: Record<Difficulty, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  }

  if (selectedPairIds.length === 0) {
    return { levels, difficulties }
  }

  const selectedPairs = new Set(selectedPairIds)
  questions.forEach((q) => {
    const hasMatchingPair = q.lessonPairs.some((pairId) => selectedPairs.has(pairId))
    if (hasMatchingPair) {
      levels[q.englishLevel]++
      difficulties[q.difficulty]++
    }
  })

  return { levels, difficulties }
}
