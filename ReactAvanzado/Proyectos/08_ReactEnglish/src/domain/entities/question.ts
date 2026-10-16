/** English proficiency levels (CEFR framework). */
export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** Relative difficulty of a question. */
export type Difficulty = 'Easy' | 'Medium' | 'Hard'

/** The language skill being tested. */
export type SkillType = 'Writing' | 'Reading' | 'Grammar' | 'Vocabulary' | 'Listening' | 'Speaking'

/** Question type indicates the interaction model (free-form, blanks, error correction). */
export type QuestionType = 'open' | 'fill_blank' | 'multi_blank' | 'error_correction'

/** How the answer should be graded: exact match, by-blank matching, or manual review. */
export type GradingMode = 'exact' | 'blanks' | 'selfCheck'

/** Media asset reference (e.g., images, audio). */
export type Media = {
  readonly type: 'image'
  readonly name: string
  readonly src: string | null
}

/** A single blank in a fill-in-the-blank question. */
export type Blank = {
  readonly id: number
  readonly label?: string
  readonly acceptedAnswers: readonly string[]
}

/** A pair of consecutive lessons (e.g., "17-18"). */
export type LessonPair = {
  readonly id: string
  readonly label: string
  readonly lessons: readonly [number, number]
}

/** Reference to a content source (textbook, worksheet, etc.). */
export type Source = {
  readonly id: string
  readonly name: string
}

/** Metadata about a question bank. */
export type QuestionBankMetadata = {
  readonly schemaVersion: string
  readonly bookId: string
  readonly title: string
  readonly generatedAt?: string
  readonly totalQuestions?: number
  readonly lessonPairs: readonly LessonPair[]
  readonly sources: readonly Source[]
}

/** Common fields shared by all question variants. */
type BaseQuestion = {
  readonly id: string
  readonly sourceId: string
  readonly lessonPairs: readonly string[]
  readonly englishLevel: EnglishLevel
  readonly difficulty: Difficulty
  readonly topic: string
  readonly subtopic?: string
  readonly grammarFocus?: string
  readonly skillType: SkillType
  readonly questionType: QuestionType
  readonly instruction: string
  readonly prompt: string
  readonly hint?: string
  readonly media?: Media
  readonly answer: string
  readonly explanation: string
  readonly tags?: readonly string[]
}

/** Question graded by exact match against accepted answers. */
export type ExactQuestion = BaseQuestion & {
  readonly gradingMode: 'exact'
  readonly acceptedAnswers: readonly string[]
}

/** Question graded by matching answers to individual blanks. */
export type BlanksQuestion = BaseQuestion & {
  readonly gradingMode: 'blanks'
  readonly blanks: readonly Blank[]
  readonly template?: string
}

/** Question requiring manual review (self-check). */
export type SelfCheckQuestion = BaseQuestion & {
  readonly gradingMode: 'selfCheck'
}

/** A question is one of the three grading variants. */
export type Question = ExactQuestion | BlanksQuestion | SelfCheckQuestion

/** Collection of questions with metadata. */
export type QuestionBank = {
  readonly metadata: QuestionBankMetadata
  readonly questions: readonly Question[]
}
