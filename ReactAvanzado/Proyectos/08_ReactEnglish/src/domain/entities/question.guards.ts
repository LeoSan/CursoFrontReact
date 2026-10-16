import {
  type ExactQuestion,
  type BlanksQuestion,
  type SelfCheckQuestion,
  type Question,
} from './question'

/** Narrows a Question to ExactQuestion (gradingMode = "exact"). */
export function isExactQuestion(q: Question): q is ExactQuestion {
  return q.gradingMode === 'exact'
}

/** Narrows a Question to BlanksQuestion (gradingMode = "blanks"). */
export function isBlanksQuestion(q: Question): q is BlanksQuestion {
  return q.gradingMode === 'blanks'
}

/** Narrows a Question to SelfCheckQuestion (gradingMode = "selfCheck"). */
export function isSelfCheckQuestion(q: Question): q is SelfCheckQuestion {
  return q.gradingMode === 'selfCheck'
}
