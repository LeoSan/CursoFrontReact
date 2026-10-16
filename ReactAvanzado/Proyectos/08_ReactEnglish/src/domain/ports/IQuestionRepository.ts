import { type Question, type QuestionBank, type LessonPair } from '../entities/question'

/** Port for accessing question data (to be implemented by infrastructure). */
export interface IQuestionRepository {
  /** Get all question banks (e.g., from JSON files or API). */
  getBanks(): Promise<readonly QuestionBank[]>

  /** Get all questions across all banks. */
  getAllQuestions(): Promise<readonly Question[]>

  /** Get only the lesson pairs that have at least one question. */
  getLessonPairs(): Promise<readonly LessonPair[]>
}
