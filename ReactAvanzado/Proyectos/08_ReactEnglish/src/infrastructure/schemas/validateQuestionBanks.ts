import { type QuestionBank } from '@domain'
import { questionBankSchema } from './questionBankSchema'

export type ValidationIssue = {
  severity: 'error' | 'warning'
  file: string
  questionId?: string
  path: string
  message: string
}

/** Validate a single question bank for internal consistency */
export function validateQuestionBank(
  bank: unknown,
  file: string
): { valid: true; bank: QuestionBank } | { valid: false; issues: ValidationIssue[] } {
  const result = questionBankSchema.safeParse(bank)

  if (result.success) {
    // Cross-check sourceIds and lessonPairs exist in metadata
    const issues: ValidationIssue[] = []
    const sourceIds = new Set(result.data.metadata.sources.map((s) => s.id))
    const lessonPairIds = new Set(result.data.metadata.lessonPairs.map((lp) => lp.id))

    result.data.questions.forEach((q, idx) => {
      if (!sourceIds.has(q.sourceId)) {
        issues.push({
          severity: 'error',
          file,
          questionId: q.id,
          path: `questions[${idx}].sourceId`,
          message: `Unknown sourceId: "${q.sourceId}"`,
        })
      }

      q.lessonPairs.forEach((lpId, lpIdx) => {
        if (!lessonPairIds.has(lpId)) {
          issues.push({
            severity: 'error',
            file,
            questionId: q.id,
            path: `questions[${idx}].lessonPairs[${lpIdx}]`,
            message: `Unknown lessonPair: "${lpId}"`,
          })
        }
      })
    })

    // Check totalQuestions if present
    if (
      result.data.metadata.totalQuestions !== undefined &&
      result.data.metadata.totalQuestions !== result.data.questions.length
    ) {
      issues.push({
        severity: 'warning',
        file,
        path: 'metadata.totalQuestions',
        message: `totalQuestions (${result.data.metadata.totalQuestions}) does not match actual question count (${result.data.questions.length})`,
      })
    }

    if (issues.some((i) => i.severity === 'error')) {
      return { valid: false, issues }
    }

    return { valid: true, bank: result.data }
  }

  // Convert Zod errors to validation issues
  console.log(`[validateQuestionBank] Errores Zod en ${file}: ${result.error.issues.length}`)
  result.error.issues.slice(0, 5).forEach((err) => {
    console.log(`  - Path: ${err.path.join('.')} | Code: ${err.code} | Message: ${err.message}`)
  })

  const issues: ValidationIssue[] = result.error.issues.map((err) => {
    const pathStr = err.path.join('.')
    let questionId: string | undefined

    // Try to extract questionId from path like "questions.0.field" or "questions[0].field"
    if (pathStr.includes('questions')) {
      const match = pathStr.match(/questions[.[](\d+)/)
      if (match && bank && typeof bank === 'object' && 'questions' in bank) {
        const qIdx = parseInt(match[1], 10)
        const questions = (bank as Record<string, unknown>).questions
        if (Array.isArray(questions)) {
          const q = questions[qIdx] as Record<string, unknown> | undefined
          if (q && typeof q.id === 'string') {
            questionId = q.id
          }
        }
      }
    }

    return {
      severity: 'error' as const,
      file,
      questionId,
      path: pathStr || '.',
      message: err.message,
    }
  })

  return { valid: false, issues }
}

/** Cross-bank validation */
export function validateQuestionBanks(
  banks: Map<string, { bank: QuestionBank }>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const questionIds = new Map<string, string>() // questionId -> file
  const bookIds = new Map<string, string>() // bookId -> file
  const lessonPairIndex = new Map<
    string,
    { lessons: readonly [number, number]; label: string; file: string }
  >() // pairId -> lessons

  // Check uniqueness and merge lesson pairs
  for (const [file, { bank }] of banks) {
    // Check bookId uniqueness
    if (bookIds.has(bank.metadata.bookId)) {
      issues.push({
        severity: 'error',
        file,
        path: 'metadata.bookId',
        message: `Duplicate bookId "${bank.metadata.bookId}" (first seen in ${bookIds.get(bank.metadata.bookId)})`,
      })
    } else {
      bookIds.set(bank.metadata.bookId, file)
    }

    // Check question ID uniqueness and track lesson pairs
    bank.questions.forEach((q) => {
      if (questionIds.has(q.id)) {
        issues.push({
          severity: 'error',
          file,
          questionId: q.id,
          path: 'id',
          message: `Duplicate question ID "${q.id}" (first seen in ${questionIds.get(q.id)})`,
        })
      } else {
        questionIds.set(q.id, file)
      }
    })

    // Merge lesson pairs
    bank.metadata.lessonPairs.forEach((lp) => {
      if (!lessonPairIndex.has(lp.id)) {
        lessonPairIndex.set(lp.id, { lessons: lp.lessons, label: lp.label, file })
      } else {
        // Check lessons match if same pair id appears in multiple banks
        const existing = lessonPairIndex.get(lp.id)!
        if (existing.lessons[0] !== lp.lessons[0] || existing.lessons[1] !== lp.lessons[1]) {
          issues.push({
            severity: 'error',
            file,
            path: `metadata.lessonPairs[id=${lp.id}]`,
            message: `Lesson pair "${lp.id}" has conflicting lessons: ${lp.lessons.join('-')} in ${file} vs ${existing.lessons.join('-')} in ${existing.file}`,
          })
        }
      }
    })
  }

  return issues
}
