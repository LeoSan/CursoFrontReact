import { type Question, type ExamConfig } from '../entities'

/** Filter questions based on config (pairs, levels, difficulties). */
export function filterQuestions(
  questions: readonly Question[],
  config: Pick<ExamConfig, 'selectedPairIds' | 'levels' | 'difficulties'>
): Question[] {
  // Empty selectedPairIds returns empty array
  if (config.selectedPairIds.length === 0) {
    return []
  }

  const selectedPairs = new Set(config.selectedPairIds)
  const allowedLevels = config.levels.length > 0 ? new Set(config.levels) : null
  const allowedDifficulties = config.difficulties.length > 0 ? new Set(config.difficulties) : null

  return questions.filter((q) => {
    // Check if ANY of question's lesson pairs is in selectedPairIds
    const hasMatchingPair = q.lessonPairs.some((pairId) => selectedPairs.has(pairId))
    if (!hasMatchingPair) {
      return false
    }

    // Check level if restricted
    if (allowedLevels && !allowedLevels.has(q.englishLevel)) {
      return false
    }

    // Check difficulty if restricted
    if (allowedDifficulties && !allowedDifficulties.has(q.difficulty)) {
      return false
    }

    return true
  })
}
