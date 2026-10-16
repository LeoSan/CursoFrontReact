// Entities
export type {
  EnglishLevel,
  Difficulty,
  SkillType,
  QuestionType,
  GradingMode,
  Media,
  Blank,
  LessonPair,
  Source,
  QuestionBankMetadata,
  Question,
  ExactQuestion,
  BlanksQuestion,
  SelfCheckQuestion,
  QuestionBank,
} from './entities/question'

export type { Exam, ExamConfig, ExamQuestion } from './entities/exam'

export type {
  UserAnswer,
  TextAnswer,
  BlanksAnswer,
  SelfCheckAnswer,
  QuestionResult,
  ExamResult,
} from './entities/answer'

export type { Attempt } from './entities/attempt'

// Type guards
export { isExactQuestion, isBlanksQuestion, isSelfCheckQuestion } from './entities/question.guards'

// Ports
export type { IQuestionRepository } from './ports/IQuestionRepository'
export type { IAttemptRepository } from './ports/IAttemptRepository'

// Services
export {
  createSeededRandom,
  shuffle,
  filterQuestions,
  countAvailable,
  getFilterCounts,
  generateExam,
  type GenerateExamResult,
  type GenerateExamDeps,
  normalizeAnswer,
  gradeQuestion,
  gradeExam,
  isAnswerEmpty,
  parseTemplate,
  type TemplatePart,
} from './services'
