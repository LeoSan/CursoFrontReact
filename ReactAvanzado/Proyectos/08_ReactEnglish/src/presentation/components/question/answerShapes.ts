import type { UserAnswer } from '@domain'

export type SelfCheckShape = {
  readonly text: string
  readonly revealed: boolean
  readonly markedCorrect: boolean | null
}

export function readTextValue(answer: UserAnswer | undefined): string {
  return answer?.kind === 'text' ? answer.value : ''
}

export function readBlankValues(answer: UserAnswer | undefined): Readonly<Record<number, string>> {
  return answer?.kind === 'blanks' ? answer.values : {}
}

export function readSelfCheck(answer: UserAnswer | undefined): SelfCheckShape {
  if (answer?.kind === 'selfCheck') {
    return {
      text: answer.text ?? '',
      revealed: answer.revealed,
      markedCorrect: answer.markedCorrect,
    }
  }
  return { text: '', revealed: false, markedCorrect: null }
}
