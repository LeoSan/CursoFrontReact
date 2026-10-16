import {
  type Question,
  type UserAnswer,
  type QuestionResult,
  isExactQuestion,
  isBlanksQuestion,
  isSelfCheckQuestion,
} from '../entities'
import { normalizeAnswer } from './normalizeAnswer'

/** Grade a single question based on its answer. */
export function gradeQuestion(question: Question, answer: UserAnswer | undefined): QuestionResult {
  if (isExactQuestion(question)) {
    // Exact grading: compare normalized text
    if (answer?.kind !== 'text') {
      // Mismatched kind or no answer
      return {
        questionId: question.id,
        gradingMode: question.gradingMode,
        correct: null,
      }
    }

    const normalizedValue = normalizeAnswer(answer.value)

    // Empty answer is unanswered
    if (normalizedValue === '') {
      return {
        questionId: question.id,
        gradingMode: question.gradingMode,
        correct: null,
      }
    }

    // Check if it matches any accepted answer
    const isCorrect = question.acceptedAnswers.some(
      (accepted) => normalizeAnswer(accepted) === normalizedValue
    )

    return {
      questionId: question.id,
      gradingMode: question.gradingMode,
      correct: isCorrect,
    }
  }

  if (isBlanksQuestion(question)) {
    // Blanks grading: grade each blank independently
    if (answer?.kind !== 'blanks') {
      // Mismatched kind or no answer
      return {
        questionId: question.id,
        gradingMode: question.gradingMode,
        correct: null,
      }
    }

    const blankResults: Record<number, boolean> = {}
    let hasAnyContent = false

    // Grade each blank
    for (const blank of question.blanks) {
      const blankValue = answer.values[blank.id] ?? ''
      const normalizedValue = normalizeAnswer(blankValue)
      const isCorrect = blank.acceptedAnswers.some(
        (accepted) => normalizeAnswer(accepted) === normalizedValue
      )

      if (normalizedValue !== '') {
        hasAnyContent = true
      }

      blankResults[blank.id] = isCorrect
    }

    // If no content in any blank, return null correct
    if (!hasAnyContent) {
      return {
        questionId: question.id,
        gradingMode: question.gradingMode,
        correct: null,
      }
    }

    // Check if all blanks are correct
    const allCorrect = Object.values(blankResults).every((result) => result)

    return {
      questionId: question.id,
      gradingMode: question.gradingMode,
      correct: allCorrect,
      blankResults,
    }
  }

  if (isSelfCheckQuestion(question)) {
    // Self-check grading: just use markedCorrect
    if (answer?.kind !== 'selfCheck') {
      // Mismatched kind or no answer
      return {
        questionId: question.id,
        gradingMode: question.gradingMode,
        correct: null,
      }
    }

    return {
      questionId: question.id,
      gradingMode: question.gradingMode,
      correct: answer.markedCorrect,
    }
  }

  // Fallback (should not happen with proper type narrowing)
  return {
    questionId: 'unknown',
    gradingMode: 'exact' as const,
    correct: null,
  }
}
