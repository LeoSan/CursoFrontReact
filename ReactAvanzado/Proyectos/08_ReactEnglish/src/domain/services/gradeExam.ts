import { type Exam, type UserAnswer, type ExamResult } from '../entities'
import { gradeQuestion } from './gradeQuestion'

/** Grade an entire exam and calculate the final score. */
export function gradeExam(exam: Exam, answers: readonly UserAnswer[]): ExamResult {
  // Index answers by questionId (last one wins if duplicates)
  const answerMap = new Map<string, UserAnswer>()
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer)
  }

  // Grade each question in order
  const results = exam.questions.map((examQuestion) => {
    const answer = answerMap.get(examQuestion.question.id)
    return gradeQuestion(examQuestion.question, answer)
  })

  // Count outcomes
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  for (const result of results) {
    if (result.correct === true) {
      correct++
    } else if (result.correct === false) {
      incorrect++
    } else {
      unanswered++
    }
  }

  const total = results.length
  const score = total === 0 ? 0 : Math.round((correct / total) * 100)

  return {
    examId: exam.id,
    total,
    correct,
    incorrect,
    unanswered,
    score,
    results,
  }
}
