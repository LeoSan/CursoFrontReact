import type { Ref } from 'react'
import type { Question, UserAnswer } from '@domain'
import { es } from '../../i18n/es'
import { readBlankValues, readSelfCheck, readTextValue } from './answerShapes'
import { BlanksTable } from './BlanksTable'
import { ErrorCorrection } from './ErrorCorrection'
import { HintBadge } from './HintBadge'
import { InlineBlanks } from './InlineBlanks'
import { MediaPlaceholder } from './MediaPlaceholder'
import { OpenAnswerInput } from './OpenAnswerInput'
import { RevealAnswer } from './RevealAnswer'
import { SelfCheckBlock } from './SelfCheckBlock'
import { MarkCorrectIncorrect } from './MarkCorrectIncorrect'

/** Handlers are already bound to the question being shown. */
export type QuestionHandlers = {
  readonly onAnswerText: (value: string) => void
  readonly onAnswerBlank: (blankId: number, value: string) => void
  readonly onAnswerSelfCheckText: (value: string) => void
  readonly onReveal: () => void
  readonly onMarkSelfCheck: (correct: boolean) => void
  readonly onMark: (correct: boolean) => void
}

interface QuestionViewProps {
  question: Question
  number: number
  answer: UserAnswer | undefined
  handlers: QuestionHandlers
  /** Peek state for non-selfCheck questions; UI only, never graded. */
  revealed: boolean
  onToggleReveal: () => void
  /** Lets the page move focus to the question heading when the question changes. */
  headingRef?: Ref<HTMLHeadingElement>
}

function PromptText({ children }: { children: string }) {
  return <p className="text-lg font-medium text-gray-900">{children}</p>
}

function QuestionContent({
  question,
  answer,
  handlers,
}: Pick<QuestionViewProps, 'question' | 'answer' | 'handlers'>) {
  if (question.gradingMode === 'selfCheck') {
    return (
      <div className="space-y-4">
        <PromptText>{question.prompt}</PromptText>
        <SelfCheckBlock
          question={question}
          state={readSelfCheck(answer)}
          onText={handlers.onAnswerSelfCheckText}
          onReveal={handlers.onReveal}
          onMark={handlers.onMarkSelfCheck}
        />
      </div>
    )
  }

  if (question.gradingMode === 'blanks') {
    const values = readBlankValues(answer)
    if (question.questionType !== 'multi_blank' && question.template) {
      return (
        <div className="space-y-4">
          <InlineBlanks
            template={question.template}
            blanks={question.blanks}
            values={values}
            onChange={handlers.onAnswerBlank}
          />
          <MarkCorrectIncorrect marked={answer?.markedCorrect} onMark={handlers.onMark} />
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BlanksTable
          heading={question.prompt}
          blanks={question.blanks}
          values={values}
          onChange={handlers.onAnswerBlank}
        />
        <MarkCorrectIncorrect marked={answer?.markedCorrect} onMark={handlers.onMark} />
      </div>
    )
  }

  if (question.questionType === 'error_correction') {
    return (
      <div className="space-y-4">
        <ErrorCorrection
          sentence={question.prompt}
          value={readTextValue(answer)}
          onChange={handlers.onAnswerText}
        />
        <MarkCorrectIncorrect marked={answer?.markedCorrect} onMark={handlers.onMark} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PromptText>{question.prompt}</PromptText>
      <OpenAnswerInput value={readTextValue(answer)} onChange={handlers.onAnswerText} />
      <MarkCorrectIncorrect marked={answer?.markedCorrect} onMark={handlers.onMark} />
    </div>
  )
}

export function QuestionView({
  question,
  number,
  answer,
  handlers,
  revealed,
  onToggleReveal,
  headingRef,
}: QuestionViewProps) {
  return (
    <article className="space-y-4">
      <div className="space-y-1">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-sm font-semibold text-indigo-700 focus:outline-none"
        >{`${es.exam.questionNumber} ${number}`}</h2>
        <p className="text-sm text-gray-600">{question.instruction}</p>
      </div>

      <QuestionContent question={question} answer={answer} handlers={handlers} />

      {question.gradingMode !== 'selfCheck' && (
        <RevealAnswer question={question} revealed={revealed} onToggle={onToggleReveal} />
      )}

      {question.media && <MediaPlaceholder media={question.media} />}
      <HintBadge hint={question.hint} />
    </article>
  )
}
