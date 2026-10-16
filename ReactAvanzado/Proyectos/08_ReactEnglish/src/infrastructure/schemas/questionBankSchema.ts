import { z } from 'zod'
import { type QuestionBank } from '@domain'

// Enums from domain
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

// Source
const sourceSchema = z.object({
  id: z.string(),
  name: z.string(),
})

// LessonPair
const lessonPairSchema = z.object({
  id: z.string().regex(/^\d+-\d+$/),
  label: z.string(),
  lessons: z.tuple([z.number().int(), z.number().int()]),
})

// Metadata
const metadataSchema = z.object({
  schemaVersion: z.string(),
  bookId: z.string().regex(/^[A-Z0-9]+$/),
  title: z.string(),
  generatedAt: z.string().optional(),
  totalQuestions: z.number().int().optional(),
  lessonPairs: z.array(lessonPairSchema),
  sources: z.array(sourceSchema),
})

// Base question fields (common to all variants)
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
const exactQuestionSchema = z
  .object({
    ...baseQuestionFields,
    gradingMode: z.literal('exact'),
    acceptedAnswers: z.array(z.string()).min(1),
  })
  .strict()

// BlanksQuestion
const blanksQuestionSchema = z
  .object({
    ...baseQuestionFields,
    gradingMode: z.literal('blanks'),
    blanks: z.array(blankSchema).min(1),
    template: z.string().optional(),
  })
  .strict()

// SelfCheckQuestion
const selfCheckQuestionSchema = z
  .object({
    ...baseQuestionFields,
    gradingMode: z.literal('selfCheck'),
  })
  .strict()

// Discriminated union
const questionSchema = z.discriminatedUnion('gradingMode', [
  exactQuestionSchema,
  blanksQuestionSchema,
  selfCheckQuestionSchema,
])

// Question bank
const questionBankSchema = z
  .object({
    metadata: metadataSchema,
    questions: z.array(questionSchema),
  })
  .strict()
  .superRefine((bank, ctx) => {
    // Validate question IDs start with bookId
    bank.questions.forEach((q) => {
      const prefix = q.id.split('-Q')[0]
      if (prefix !== bank.metadata.bookId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questions', bank.questions.indexOf(q), 'id'],
          message: `Question ID prefix "${prefix}" does not match bookId "${bank.metadata.bookId}"`,
        })
      }
    })

    // Validate exact questions
    bank.questions.forEach((q, idx) => {
      if (q.gradingMode === 'exact' && (!q.acceptedAnswers || q.acceptedAnswers.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questions', idx, 'acceptedAnswers'],
          message: 'Exact question must have non-empty acceptedAnswers',
        })
      }
    })

    // Validate blanks questions
    bank.questions.forEach((q, idx) => {
      if (q.gradingMode === 'blanks') {
        // Check blanks are non-empty
        if (!q.blanks || q.blanks.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['questions', idx, 'blanks'],
            message: 'Blanks question must have non-empty blanks array',
          })
          return
        }

        // Check blank ids are unique and start at 1
        const ids = q.blanks.map((b) => b.id)
        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['questions', idx, 'blanks'],
            message: 'Blank ids must be unique',
          })
        }
        if (!ids.every((id) => id >= 1)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['questions', idx, 'blanks'],
            message: 'Blank ids must be >= 1',
          })
        }

        // Check template if present
        if (q.template) {
          const templateMatches = Array.from(q.template.matchAll(/\{\{(\d+)\}\}/g))
          const templateIds = new Set(templateMatches.map((m) => parseInt(m[1], 10)))
          const blankIds = new Set(ids)

          // Every template marker must have a matching blank
          for (const tid of templateIds) {
            if (!blankIds.has(tid)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['questions', idx, 'template'],
                message: `Template marker {{${tid}}} has no matching blank id`,
              })
            }
          }

          // Every blank id must appear in template
          for (const bid of blankIds) {
            if (!templateIds.has(bid)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['questions', idx, 'template'],
                message: `Blank id ${bid} does not appear in template`,
              })
            }
          }
        }
      }
    })

    // Validate fill_blank questions have template
    bank.questions.forEach((q, idx) => {
      if (q.questionType === 'fill_blank' && (!('template' in q) || !q.template)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questions', idx, 'template'],
          message: 'fill_blank question type requires template',
        })
      }
    })
  })

// Compile-time assertion that parsed schema matches domain type
const _typeCheck: z.ZodType<QuestionBank> = questionBankSchema

export { questionBankSchema, metadataSchema, questionSchema, blankSchema }
