import { type IQuestionRepository } from '@domain'
import { type Question, type QuestionBank, type LessonPair } from '@domain'
import {
  validateQuestionBank,
  validateQuestionBanks,
  type ValidationIssue,
} from '../schemas/validateQuestionBanks'

export class QuestionBankLoadError extends Error {
  constructor(issues: ValidationIssue[]) {
    const message = issues
      .map((issue) => {
        const parts = [issue.file, issue.path]
        if (issue.questionId) {
          parts.push(`[${issue.questionId}]`)
        }
        return `${parts.join(':')} ${issue.message}`
      })
      .join('\n')
    super(message)
    this.name = 'QuestionBankLoadError'
  }
}

export function createJsonQuestionRepository(
  loadRawBanks: () => Record<string, unknown>
): IQuestionRepository {
  let cachedBanks: Map<string, { bank: QuestionBank }> | null = null
  let loadPromise: Promise<Map<string, { bank: QuestionBank }>> | null = null

  async function loadAndValidate(): Promise<Map<string, { bank: QuestionBank }>> {
    if (cachedBanks) {
      return cachedBanks
    }

    if (loadPromise) {
      return loadPromise
    }

    loadPromise = (async () => {
      const rawBanks = loadRawBanks()
      const banks = new Map<string, { bank: QuestionBank }>()
      const allIssues: ValidationIssue[] = []

      // Validate each bank
      for (const [file, rawBank] of Object.entries(rawBanks)) {
        const result = validateQuestionBank(rawBank, file)
        if (result.valid) {
          banks.set(file, { bank: result.bank })
        } else {
          allIssues.push(...result.issues)
        }
      }

      // Cross-bank validation
      const crossIssues = validateQuestionBanks(banks)
      allIssues.push(...crossIssues)

      // Separate errors and warnings
      const errors = allIssues.filter((i) => i.severity === 'error')
      const warnings = allIssues.filter((i) => i.severity === 'warning')

      if (errors.length > 0) {
        throw new QuestionBankLoadError(errors)
      }

      // Log warnings
      warnings.forEach((warning) => {
        console.warn(`Warning: ${warning.file}:${warning.path} ${warning.message}`)
      })

      cachedBanks = banks
      return banks
    })()

    return loadPromise
  }

  return {
    async getBanks(): Promise<readonly QuestionBank[]> {
      const banks = await loadAndValidate()
      return Array.from(banks.values()).map((b) => b.bank)
    },

    async getAllQuestions(): Promise<readonly Question[]> {
      const banks = await loadAndValidate()
      const questions: Question[] = []
      for (const { bank } of banks.values()) {
        questions.push(...bank.questions)
      }
      return questions
    },

    async getLessonPairs(): Promise<readonly LessonPair[]> {
      const banks = await loadAndValidate()
      const pairMap = new Map<string, LessonPair>()
      const questionsByPair = new Map<string, Set<string>>()

      // Track which pairs have questions
      for (const { bank } of banks.values()) {
        bank.questions.forEach((q) => {
          q.lessonPairs.forEach((pairId) => {
            if (!questionsByPair.has(pairId)) {
              questionsByPair.set(pairId, new Set())
            }
            questionsByPair.get(pairId)!.add(q.id)
          })
        })
      }

      // Collect pairs with questions
      for (const { bank } of banks.values()) {
        bank.metadata.lessonPairs.forEach((lp) => {
          if (questionsByPair.has(lp.id) && !pairMap.has(lp.id)) {
            pairMap.set(lp.id, lp)
          }
        })
      }

      // Sort numerically by first lesson number
      return Array.from(pairMap.values()).sort((a, b) => a.lessons[0] - b.lessons[0])
    },
  }
}
