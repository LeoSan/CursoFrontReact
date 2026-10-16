import { createJsonQuestionRepository, QuestionBankLoadError } from './createJsonQuestionRepository'
import { type IQuestionRepository } from '@domain'

function loadBundledBanks(): Record<string, unknown> {
  const modules = import.meta.glob<{ default: unknown }>('/src/data/*.json', {
    eager: true,
    import: 'default',
  })

  const result: Record<string, unknown> = {}
  for (const [path, module] of Object.entries(modules)) {
    // Extract filename for use as key
    const filename = path.split('/').pop() || path
    result[filename] = module
  }
  return result
}

/** Default question repository using bundled JSON files */
export const questionRepository: IQuestionRepository = createJsonQuestionRepository(loadBundledBanks)

export { createJsonQuestionRepository, QuestionBankLoadError }
