import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSubmitExam, type AppServices, type GenerateExamResult } from '@application'
import type { Attempt, Exam, IAttemptRepository } from '@domain'
import App from '../src/App'
import { AppServicesProvider } from '@presentation/context/AppServicesProvider'
import {
  SECRET,
  makeExact,
  makeExam,
  makeFillBlank,
  makeMultiBlank,
  makeSelfCheck,
} from '../src/testing/questionFixtures'

function makeFiveQuestionExam(): Exam {
  return makeExam([
    makeExact('open'),
    makeExact('error_correction'),
    makeFillBlank(),
    makeMultiBlank(),
    makeSelfCheck(),
  ])
}

function makeServices(saveBehavior: 'ok' | 'fail') {
  const exam = makeFiveQuestionExam()
  const saved: Attempt[] = []
  const attemptRepository: IAttemptRepository = {
    list: async () => [...saved],
    getById: async (id) => saved.find((a) => a.id === id) ?? null,
    save: async (attempt) => {
      if (saveBehavior === 'fail') throw new Error('storage full')
      saved.push(attempt)
    },
    remove: async () => {},
    clear: async () => {},
  }
  const services: AppServices = {
    loadExamSetup: async () => ({
      pairs: [{ id: '17-18', label: 'Lessons 17-18', lessons: [17, 18] }],
      questions: exam.questions.map((q) => q.question),
    }),
    startExam: vi.fn(async (config): Promise<GenerateExamResult> => ({
      ok: true,
      exam,
      requestedCount: config.questionCount,
      availableCount: exam.questions.length,
      reducedToAvailable: false,
    })),
    submitExam: createSubmitExam({
      attemptRepository,
      system: {
        now: () => '2026-01-01T00:00:00.000Z',
        newId: () => 'attempt-1',
        randomSeed: () => 1,
      },
    }),
    attemptHistory: attemptRepository,
  }
  return { services, saved }
}

async function startAndAnswerFirst(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('Generador de Examen')
  await user.click(screen.getByRole('button', { name: /Selecciona pares de lecciones/i }))
  await user.click(screen.getByLabelText('Lessons 17-18'))
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Todas' }))
  await user.click(screen.getByRole('button', { name: /Generar Examen/i }))
  await screen.findByRole('heading', { level: 2, name: 'Pregunta 1' })
  await user.type(screen.getByLabelText('Tu respuesta'), SECRET)
}

async function submitAnyway(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
  await user.click(screen.getByRole('button', { name: 'Entregar de todos modos' }))
}

describe('App flow', () => {
  it('config -> generate -> answer -> submit shows the results placeholder with the score', async () => {
    const { services, saved } = makeServices('ok')
    const user = userEvent.setup()
    render(
      <AppServicesProvider services={services}>
        <App />
      </AppServicesProvider>
    )

    await startAndAnswerFirst(user)
    expect(screen.queryByText('Generador de Examen')).toBeNull()

    await submitAnyway(user)

    expect(await screen.findByRole('heading', { name: 'Resultados' })).toBeTruthy()
    expect(screen.getByText('Puntaje: 20')).toBeTruthy()
    expect(screen.getByText('Correctas: 1')).toBeTruthy()
    expect(screen.getByText('Sin responder: 4')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(saved).toHaveLength(1)
    expect(screen.queryByRole('heading', { level: 2, name: 'Pregunta 1' })).toBeNull()
  })

  it('shows the unsaved warning on the results screen when the attempt could not be saved', async () => {
    const { services } = makeServices('fail')
    const user = userEvent.setup()
    render(
      <AppServicesProvider services={services}>
        <App />
      </AppServicesProvider>
    )

    await startAndAnswerFirst(user)
    await submitAnyway(user)

    expect(await screen.findByText('Puntaje: 20')).toBeTruthy()
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe(
      'No se pudo guardar el intento en este dispositivo. Tu resultado se muestra igualmente.'
    )
  })

  it('exiting the exam returns to the config screen', async () => {
    const { services } = makeServices('ok')
    const user = userEvent.setup()
    render(
      <AppServicesProvider services={services}>
        <App />
      </AppServicesProvider>
    )

    await startAndAnswerFirst(user)
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    await user.click(screen.getByRole('button', { name: 'Sí, salir' }))

    expect(await screen.findByText('Generador de Examen')).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 2, name: 'Pregunta 1' })).toBeNull()
  })

  it('"Nuevo examen" from the results returns to the config screen', async () => {
    const { services } = makeServices('ok')
    const user = userEvent.setup()
    render(
      <AppServicesProvider services={services}>
        <App />
      </AppServicesProvider>
    )

    await startAndAnswerFirst(user)
    await submitAnyway(user)
    await user.click(await screen.findByRole('button', { name: 'Nuevo examen' }))

    await waitFor(() => expect(screen.getByText('Generador de Examen')).toBeTruthy())
  })
})
