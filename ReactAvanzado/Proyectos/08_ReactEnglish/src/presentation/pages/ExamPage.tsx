import { useEffect, useRef, useState } from 'react'
import type { Exam } from '@domain'
import { selectAnswersArray, type SubmitExamOutcome } from '@application'
import { useAppServices } from '../context/appServicesContext'
import { useExamSession } from '../hooks/useExamSession'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ExamProgress } from '../components/ExamProgress'
import { QuestionNavigator } from '../components/QuestionNavigator'
import { QuestionView } from '../components/question/QuestionView'
import { es } from '../i18n/es'

interface ExamPageProps {
  exam: Exam
  onSubmitted: (outcome: SubmitExamOutcome) => void
  onExit: () => void
}

type DialogState = { kind: 'unanswered' | 'exit'; trigger: HTMLElement | null }

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2'

export default function ExamPage({ exam, onSubmitted, onExit }: ExamPageProps) {
  const services = useAppServices()
  const {
    state,
    actions,
    currentQuestion,
    currentNumber,
    total,
    answeredFlags,
    unansweredNumbers,
  } = useExamSession(exam)

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(() => new Set())
  const submittingRef = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const inProgress = state.status === 'in_progress'
  const answeredCount = answeredFlags.filter(Boolean).length
  const isFirst = state.currentIndex === 0
  const isLast = state.currentIndex === total - 1

  useEffect(() => {
    if (!inProgress) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [inProgress])

  // Runs on explicit navigation only, so the first render does not steal focus.
  useEffect(() => {
    if (focusRequest === 0) return
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [focusRequest])

  const toggleReveal = (id: string) =>
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const requestFocus = () => setFocusRequest((value) => value + 1)

  const goToIndex = (index: number) => {
    actions.goTo(index)
    requestFocus()
  }

  const goToNumber = (questionNumber: number) => {
    const index = exam.questions.findIndex((item) => item.number === questionNumber)
    if (index >= 0) goToIndex(index)
  }

  const submit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitFailed(false)

    let outcome: SubmitExamOutcome
    try {
      outcome = await services.submitExam(exam, selectAnswersArray(state))
    } catch {
      submittingRef.current = false
      setSubmitting(false)
      setSubmitFailed(true)
      return
    }

    actions.markSubmitted()
    onSubmitted(outcome)
  }

  const requestSubmit = (trigger: HTMLElement) => {
    if (submittingRef.current) return
    if (unansweredNumbers.length > 0) {
      setDialog({ kind: 'unanswered', trigger })
    } else {
      void submit()
    }
  }

  if (!currentQuestion) return null

  const { question } = currentQuestion
  const questionId = question.id
  const closeDialog = () => setDialog(null)

  return (
    <div className="min-h-screen lg:pr-72">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-indigo-900">{es.examPage.title}</h1>
            <button
              type="button"
              disabled={submitting}
              onClick={(event) => setDialog({ kind: 'exit', trigger: event.currentTarget })}
              className={`min-h-11 rounded-md border border-gray-300 px-4 py-2 text-base font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60 ${focusRing}`}
            >
              {es.examPage.exit}
            </button>
          </div>
          <ExamProgress current={currentNumber} total={total} answered={answeredCount} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4 pb-32">
        <div className="rounded-lg bg-white p-4 shadow md:p-6" aria-busy={submitting}>
          <fieldset disabled={submitting} className="m-0 min-w-0 border-0 p-0">
            <QuestionView
              question={question}
              number={currentNumber}
              answer={state.answers[questionId]}
              headingRef={headingRef}
              revealed={revealedIds.has(questionId)}
              onToggleReveal={() => toggleReveal(questionId)}
              handlers={{
                onAnswerText: (value) => actions.answerText(questionId, value),
                onAnswerBlank: (blankId, value) => actions.answerBlank(questionId, blankId, value),
                onAnswerSelfCheckText: (value) => actions.answerSelfCheckText(questionId, value),
                onReveal: () => actions.reveal(questionId),
                onMarkSelfCheck: (correct) => actions.markSelfCheck(questionId, correct),
                onMark: (correct) => actions.markQuestion(questionId, correct),
              }}
            />
          </fieldset>
        </div>

        {submitFailed && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {es.examPage.submitError}
          </p>
        )}

        <QuestionNavigator
          numbers={exam.questions.map((item) => item.number)}
          currentIndex={state.currentIndex}
          answeredFlags={answeredFlags}
          incorrectFlags={exam.questions.map((item) => {
            const answer = state.answers[item.question.id]
            return answer?.markedCorrect === false
          })}
          disabled={submitting}
          submitting={submitting}
          onGoTo={goToIndex}
          onSubmit={requestSubmit}
        />
      </main>

      <div role="status" aria-live="polite" className="sr-only">
        {es.examPage.questionOf(currentNumber, total)}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:right-72">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button
            type="button"
            disabled={isFirst || submitting}
            onClick={() => {
              actions.previous()
              requestFocus()
            }}
            className={`min-h-11 flex-1 rounded-md border border-gray-300 px-4 py-2 text-base font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 ${focusRing}`}
          >
            {es.examPage.previous}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={(event) => {
              if (isLast) {
                requestSubmit(event.currentTarget)
              } else {
                actions.next()
                requestFocus()
              }
            }}
            className={`min-h-11 flex-1 rounded-md bg-indigo-600 px-4 py-2 text-base font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400 ${focusRing}`}
          >
            {isLast
              ? submitting
                ? es.examPage.submitting
                : es.examPage.submitLast
              : es.examPage.next}
          </button>
        </div>
      </div>

      {dialog?.kind === 'unanswered' && (
        <ConfirmDialog
          title={es.examPage.unansweredTitle}
          returnFocusTo={dialog.trigger}
          onClose={closeDialog}
          description={
            <div className="space-y-3">
              <p>{es.examPage.unansweredIntro}</p>
              <ul className="flex flex-wrap gap-2">
                {unansweredNumbers.map((number) => (
                  <li key={number}>
                    <button
                      type="button"
                      aria-label={es.examPage.goToQuestion(number)}
                      onClick={() => {
                        closeDialog()
                        goToNumber(number)
                      }}
                      className={`h-11 min-w-11 rounded-md border border-gray-300 px-3 text-base font-semibold text-gray-800 hover:bg-gray-50 ${focusRing}`}
                    >
                      {number}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          }
          actions={[
            {
              label: es.examPage.keepAnswering,
              onClick: closeDialog,
              variant: 'primary',
              initialFocus: true,
            },
            {
              label: es.examPage.submitAnyway,
              onClick: () => {
                closeDialog()
                void submit()
              },
              variant: 'secondary',
            },
          ]}
        />
      )}

      {dialog?.kind === 'exit' && (
        <ConfirmDialog
          title={es.examPage.exitTitle}
          description={<p>{es.examPage.exitDescription}</p>}
          returnFocusTo={dialog.trigger}
          onClose={closeDialog}
          actions={[
            {
              label: es.examPage.exitCancel,
              onClick: closeDialog,
              variant: 'primary',
              initialFocus: true,
            },
            {
              label: es.examPage.exitConfirm,
              onClick: () => {
                closeDialog()
                onExit()
              },
              variant: 'danger',
            },
          ]}
        />
      )}
    </div>
  )
}
