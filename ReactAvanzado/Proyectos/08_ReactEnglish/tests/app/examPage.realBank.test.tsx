import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSubmitExam, type AppServices, type SubmitExamOutcome } from '@application'
import type { Attempt, Exam, IAttemptRepository, Question } from '@domain'
import { questionRepository } from '@infrastructure'
import ExamPage from '@presentation/pages/ExamPage'
import { AppServicesProvider } from '@presentation/context/AppServicesProvider'
import { appServices } from '../../src/app/composition'
import { systemDeps } from '../../src/app/systemDeps'

type User = ReturnType<typeof userEvent.setup>

const EXAM_IDS = ['BK1-Q001', 'BK1-Q003', 'BK1-Q004', 'BK1-Q037', 'BK1-Q006'] as const

const createMemoryAttemptRepository = (): IAttemptRepository => {
  const attempts: Attempt[] = []
  return {
    async list() {
      return [...attempts]
    },
    async getById(id) {
      return attempts.find((a) => a.id === id) ?? null
    },
    async save(attempt) {
      attempts.push(attempt)
    },
    async remove() {},
    async clear() {},
  }
}

async function buildExam(): Promise<Exam> {
  const all = await questionRepository.getAllQuestions()
  const questions = EXAM_IDS.map((id) => {
    const found = all.find((question: Question) => question.id === id)
    if (!found) throw new Error(`Missing real question ${id}`)
    return found
  })
  return {
    id: 'real-bank-exam',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: {
      selectedPairIds: ['17-18'],
      levels: [],
      difficulties: [],
      questionCount: questions.length,
      shuffle: false,
    },
    questions: questions.map((question, index) => ({ number: index + 1, question })),
  }
}

const heading = (n: number) => screen.getByRole('heading', { level: 2, name: `Pregunta ${n}` })
const goTo = (user: User, n: number) =>
  user.click(screen.getByRole('button', { name: new RegExp(`^Pregunta ${n},`) }))

async function answerQ1toQ4(user: User, { q4 = "It's one twenty-five." } = {}) {
  await user.type(screen.getByLabelText('Espacio 1'), "7 o'clock")
  await goTo(user, 2)
  await user.type(screen.getByLabelText('Espacio 1'), 'one')
  await goTo(user, 3)
  await user.type(screen.getByLabelText('Tu respuesta'), q4)
  await goTo(user, 4)
  await user.type(screen.getByLabelText('Simple Past'), 'grew')
  await user.type(screen.getByLabelText('Past Participle'), 'grown')
  await user.type(screen.getByLabelText('Gerund'), 'growing')
}

async function answerSelfCheck(user: User, mark: 'Acerté' | 'No acerté' | null) {
  await goTo(user, 5)
  await user.type(screen.getByLabelText('Tu respuesta'), 'I like pancakes')
  await user.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
  if (mark) await user.click(screen.getByRole('button', { name: mark }))
}

describe('ExamPage - real bank end to end', () => {
  let exam: Exam
  let attemptRepository: IAttemptRepository
  let onSubmitted: ReturnType<typeof vi.fn<(outcome: SubmitExamOutcome) => void>>
  let user: User

  beforeEach(async () => {
    exam = await buildExam()
    attemptRepository = createMemoryAttemptRepository()
    onSubmitted = vi.fn()
    user = userEvent.setup()

    const services: AppServices = {
      loadExamSetup: appServices.loadExamSetup,
      startExam: appServices.startExam,
      submitExam: createSubmitExam({ attemptRepository, system: systemDeps }),
      attemptHistory: attemptRepository,
    }
    render(
      <AppServicesProvider services={services}>
        <ExamPage exam={exam} onSubmitted={onSubmitted} onExit={() => {}} />
      </AppServicesProvider>
    )
  })

  async function savedAttempt(): Promise<Attempt> {
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    const attempts = await attemptRepository.list()
    expect(attempts).toHaveLength(1)
    return attempts[0]!
  }

  it('renders the five real questions and the media placeholder of Q001 as visible text', () => {
    expect(exam.questions.map((q) => q.question.id)).toEqual([...EXAM_IDS])
    expect(heading(1)).toBeTruthy()
    expect(screen.getByText('Imagen: Clock at 7:00')).toBeTruthy()
    expect(screen.getAllByText('Pregunta 1 de 5').length).toBeGreaterThan(0)
  })

  it('never shows a real answer before the student types it', async () => {
    const leaks = [
      "It's one twenty-five.",
      "It's twenty-five past one.",
      'grew',
      'grown',
      "7 o'clock",
    ]
    const assertNoLeak = () => {
      const html = document.body.innerHTML
      const text = document.body.textContent ?? ''
      for (const answer of leaks) {
        expect(html).not.toContain(answer)
        expect(text).not.toContain(answer)
      }
    }

    for (let n = 1; n <= 5; n += 1) {
      await goTo(user, n)
      assertNoLeak()
    }

    await goTo(user, 5)
    await user.type(screen.getByLabelText('Tu respuesta'), 'anything')
    expect(document.body.textContent).not.toContain('I like to eat pancakes')
    await user.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
    expect(screen.getByText('I like to eat pancakes with orange juice and coffee.')).toBeTruthy()
  })

  it('answering everything correctly submits without a dialog and scores 100', async () => {
    await answerQ1toQ4(user)
    await answerSelfCheck(user, 'Acerté')
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    const attempt = await savedAttempt()
    expect(attempt.result.total).toBe(5)
    expect(attempt.result.correct).toBe(5)
    expect(attempt.result.score).toBe(100)
    expect(attempt.result.unanswered).toBe(0)
    expect(attempt.answers).toHaveLength(5)
  })

  it('a wrong exact answer and a "No acerté" self-check score 60', async () => {
    await answerQ1toQ4(user, { q4: 'its one twenty-five' })
    await answerSelfCheck(user, 'No acerté')
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    const attempt = await savedAttempt()
    expect(attempt.result.correct).toBe(3)
    expect(attempt.result.total).toBe(5)
    expect(attempt.result.score).toBe(60)
    const byId = new Map(attempt.result.results.map((r) => [r.questionId, r]))
    expect(byId.get('BK1-Q004')?.correct).toBe(false)
    expect(byId.get('BK1-Q006')?.correct).toBe(false)
    expect(byId.get('BK1-Q001')?.correct).toBe(true)
    expect(byId.get('BK1-Q003')?.correct).toBe(true)
    expect(byId.get('BK1-Q037')?.correct).toBe(true)
  })

  it('an unmarked self-check opens the dialog and counts as unanswered over 5 questions', async () => {
    await answerQ1toQ4(user)
    await answerSelfCheck(user, null)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog)
        .getAllByRole('button', { name: /^Ir a la pregunta/ })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Ir a la pregunta 5'])

    await user.click(within(dialog).getByRole('button', { name: 'Entregar de todos modos' }))

    const attempt = await savedAttempt()
    expect(attempt.result.total).toBe(5)
    expect(attempt.result.unanswered).toBe(1)
    expect(attempt.result.correct).toBe(4)
    expect(attempt.result.score).toBe(80)
  })
})
