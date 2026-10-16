import { type UserAnswer } from '../entities'
import { normalizeAnswer } from './normalizeAnswer'

/** Check if an answer is empty (unanswered). */
export function isAnswerEmpty(answer: UserAnswer | undefined): boolean {
  if (!answer) {
    return true
  }

  if (answer.kind === 'text') {
    return normalizeAnswer(answer.value) === ''
  }

  if (answer.kind === 'blanks') {
    // All blanks must be empty
    return Object.values(answer.values).every((value) => normalizeAnswer(value) === '')
  }

  if (answer.kind === 'selfCheck') {
    return answer.markedCorrect === null
  }

  return true
}
