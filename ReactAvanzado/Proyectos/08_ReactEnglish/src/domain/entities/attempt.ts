import { type Exam } from './exam'
import { type UserAnswer } from './answer'
import { type ExamResult } from './answer'

/** A completed exam attempt with answers and results. */
export type Attempt = {
  readonly id: string
  readonly exam: Exam
  readonly answers: readonly UserAnswer[]
  readonly result: ExamResult
  readonly finishedAt: string
}
