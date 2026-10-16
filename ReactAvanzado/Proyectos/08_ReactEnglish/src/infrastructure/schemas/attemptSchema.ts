import { z } from 'zod'
import { type Attempt } from '@domain'

// Reuse enums
const englishLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
const difficultySchema = z.enum(['Easy', 'Medium', 'Hard'])
const skillTypeSchema = z.enum([
  'Writing',
  'Reading',
  'Grammar',
  'Vocabulary',
  'Listening',
  'Speaking',
])
const questionTypeSchema = z.enum(['open', 'fill_blank', 'multi_blank', 'error_correction'])
const gradingModeSchema = z.enum(['exact', 'blanks', 'selfCheck'])

// Media
const mediaSchema = z.object({
  type: z.literal('image'),
  name: z.string(),
  src: z.string().nullable(),
})

// Blank
const blankSchema = z.object({
  id: z.number().int().min(1),
  label: z.string().optional(),
  acceptedAnswers: z.array(z.string()).min(1),
})

// Base question fields (context-free, no bank prefix check)
const baseQuestionFields = {
  id: z.string().regex(/^[A-Z0-9]+-Q\d{3,}$/),
  sourceId: z.string(),
  lessonPairs: z.array(z.string().regex(/^\d+-\d+$/)),
  englishLevel: englishLevelSchema,
  difficulty: difficultySchema,
  topic: z.string(),
  subtopic: z.string().optional(),
  grammarFocus: z.string().optional(),
  skillType: skillTypeSchema,
  questionType: questionTypeSchema,
  instruction: z.string(),
  prompt: z.string(),
  hint: z.string().optional(),
  media: mediaSchema.optional(),
  answer: z.string(),
  explanation: z.string(),
  tags: z.array(z.string()).optional(),
}

// ExactQuestion
const exactQuestionSchema = z.object({
  ...baseQuestionFields,
  gradingMode: z.literal('exact'),
  acceptedAnswers: z.array(z.string()).min(1),
})

// BlanksQuestion
const blanksQuestionSchema = z.object({
  ...baseQuestionFields,
  gradingMode: z.literal('blanks'),
  blanks: z.array(blankSchema).min(1),
  template: z.string().optional(),
})

// SelfCheckQuestion
const selfCheckQuestionSchema = z.object({
  ...baseQuestionFields,
  gradingMode: z.literal('selfCheck'),
})

// Discriminated union for stored questions (no bank-level validation)
const storedQuestionSchema = z.discriminatedUnion('gradingMode', [
  exactQuestionSchema,
  blanksQuestionSchema,
  selfCheckQuestionSchema,
])

// ExamConfig
const examConfigSchema = z.object({
  selectedPairIds: z.array(z.string()),
  levels: z.array(englishLevelSchema),
  difficulties: z.array(difficultySchema),
  questionCount: z.number().int(),
  shuffle: z.boolean(),
})

// ExamQuestion
const examQuestionSchema = z.object({
  number: z.number().int().min(1),
  question: storedQuestionSchema,
})

// Exam
const examSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  config: examConfigSchema,
  questions: z.array(examQuestionSchema),
})

// QuestionResult
const questionResultSchema = z.object({
  questionId: z.string(),
  gradingMode: gradingModeSchema,
  correct: z.boolean().nullable(),
  blankResults: z.record(z.number(), z.boolean()).optional(),
})

// ExamResult
const examResultSchema = z.object({
  examId: z.string(),
  total: z.number().int(),
  correct: z.number().int(),
  incorrect: z.number().int(),
  unanswered: z.number().int(),
  score: z.number().int().min(0).max(100),
  results: z.array(questionResultSchema),
})

// UserAnswer - discriminated union
const textAnswerSchema = z.object({
  kind: z.literal('text'),
  questionId: z.string(),
  value: z.string(),
})

const blanksAnswerSchema = z.object({
  kind: z.literal('blanks'),
  questionId: z.string(),
  values: z.record(z.number(), z.string()),
})

const selfCheckAnswerSchema = z.object({
  kind: z.literal('selfCheck'),
  questionId: z.string(),
  revealed: z.boolean(),
  markedCorrect: z.boolean().nullable(),
  text: z.string().optional(),
})

const userAnswerSchema = z.discriminatedUnion('kind', [
  textAnswerSchema,
  blanksAnswerSchema,
  selfCheckAnswerSchema,
])

// Attempt
export const attemptSchema = z.object({
  id: z.string(),
  exam: examSchema,
  answers: z.array(userAnswerSchema),
  result: examResultSchema,
  finishedAt: z.string().datetime(),
})

// Compile-time assertion
const _attemptAssert: z.ZodType<Attempt> = attemptSchema
