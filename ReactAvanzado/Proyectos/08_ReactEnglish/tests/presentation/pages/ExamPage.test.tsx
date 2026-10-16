import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AppServices, SubmitExamOutcome } from '@application'
import type { Exam } from '@domain'
import ExamPage from '@presentation/pages/ExamPage'
import { AppServicesProvider } from '@presentation/context/AppServicesProvider'
import {
  makeExact,
  makeFillBlank,
  makeMultiBlank,
  makeSelfCheck,
  makeExam,
} from '../../../src/testing/questionFixtures'

type User = ReturnType<typeof userEvent.setup>

function makeOutcome(exam: Exam): SubmitExamOutcome {
  return {
    saved: true,
    attempt: {
      id: 'attempt-1',
      exam,
      answers: [],
      finishedAt: '2026-01-01T00:00:00.000Z',
      result: {
        examId: exam.id,
        total: exam.questions.length,
        correct: 0,
        incorrect: 0,
        unanswered: exam.questions.length,
        score: 0,
        results: [],
      },
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Q1 text, Q2 error_correction (text), Q3 fill_blank, Q4 multi_blank, Q5 self-check.
function makeFiveQuestionExam(): Exam {
  return makeExam([
    makeExact('open'),
    makeExact('error_correction'),
    makeFillBlank(),
    makeMultiBlank(),
    makeSelfCheck(),
  ])
}

function setup() {
  const exam = makeFiveQuestionExam()
  const submitExam = vi.fn<AppServices['submitExam']>(async (e) => makeOutcome(e))
  const services = {
    loadExamSetup: vi.fn(),
    startExam: vi.fn(),
    submitExam,
    attemptHistory: {},
  } as unknown as AppServices
  const onSubmitted = vi.fn()
  const onExit = vi.fn()
  const user = userEvent.setup()
  const view = render(
    <AppServicesProvider services={services}>
      <ExamPage exam={exam} onSubmitted={onSubmitted} onExit={onExit} />
    </AppServicesProvider>
  )
  return { exam, submitExam, onSubmitted, onExit, user, ...view }
}

const heading = (n: number) => screen.getByRole('heading', { level: 2, name: `Pregunta ${n}` })
const navButton = (n: number) => screen.getByRole('button', { name: new RegExp(`^Pregunta ${n},`) })

async function goTo(user: User, n: number) {
  await user.click(navButton(n))
}

async function answerQ1ToQ2(user: User) {
  await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  await user.type(screen.getByLabelText('Escribe la frase corregida'), 'She goes to school')
}

async function answerAll(user: User) {
  await answerQ1ToQ2(user)
  await goTo(user, 3)
  await user.type(screen.getByLabelText('Espacio 1'), 'runs')
  await goTo(user, 4)
  await user.type(screen.getByLabelText('Present'), 'go')
  await user.type(screen.getByLabelText('Past'), 'went')
  await user.type(screen.getByLabelText('Participle'), 'gone')
  await goTo(user, 5)
  await user.type(screen.getByLabelText('Tu respuesta'), 'my day')
  await user.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
  await user.click(screen.getByRole('button', { name: 'Acerté' }))
}

beforeEach(() => {
  vi.mocked(window.scrollTo).mockClear()
})

describe('ExamPage - rendering and progress', () => {
  it('renders question 1 of N', () => {
    setup()
    expect(heading(1)).toBeTruthy()
    expect(screen.getByText('What time is it?')).toBeTruthy()
    expect(screen.getAllByText('Pregunta 1 de 5').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1, name: 'Examen' })).toBeTruthy()
  })

  it('does not steal focus on the first render', () => {
    setup()
    expect(document.activeElement).toBe(document.body)
  })

  it('updates the progress text and progressbar as answers are given', async () => {
    const { user } = setup()
    const bar = screen.getByRole('progressbar', { name: 'Preguntas respondidas' })
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('5')
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByText('Respondidas: 0 / 5')).toBeTruthy()

    await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
    expect(bar.getAttribute('aria-valuenow')).toBe('1')
    expect(screen.getByText('Respondidas: 1 / 5')).toBeTruthy()

    await user.clear(screen.getByLabelText('Tu respuesta'))
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
  })

  it('shows the current position in the progress text', async () => {
    const { user } = setup()
    await goTo(user, 3)
    expect(screen.getAllByText('Pregunta 3 de 5').length).toBeGreaterThan(0)
  })
})

describe('ExamPage - navigation', () => {
  it('disables Anterior on the first question', () => {
    setup()
    expect((screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })

  it('moves with Siguiente and Anterior', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(heading(2)).toBeTruthy()
    expect(screen.getByText('She go to school.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement).disabled).toBe(
      false
    )
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(heading(1)).toBeTruthy()
  })

  it('shows Entregar instead of Siguiente on the last question', async () => {
    const { user } = setup()
    expect(screen.queryByRole('button', { name: 'Entregar' })).toBeNull()
    await goTo(user, 5)
    expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Entregar' })).toBeTruthy()
  })

  it('jumps with the numbered buttons', async () => {
    const { user } = setup()
    await goTo(user, 4)
    expect(heading(4)).toBeTruthy()
    await goTo(user, 2)
    expect(heading(2)).toBeTruthy()
  })

  it('reflects current, answered and unanswered in the accessible names and updates them', async () => {
    const { user } = setup()
    const nav = screen.getByRole('navigation', { name: 'Navegador de preguntas' })
    const names = () =>
      within(nav)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label') ?? button.textContent)

    expect(names().slice(0, 5)).toEqual([
      'Ver todas las preguntas',
      'Pregunta 1, actual',
      'Pregunta 2, sin responder',
      'Pregunta 3, sin responder',
      'Pregunta 4, sin responder',
    ])

    await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
    expect(within(nav).getByRole('button', { name: 'Pregunta 1, actual' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(within(nav).getByRole('button', { name: 'Pregunta 1, respondida' })).toBeTruthy()
    const current = within(nav).getByRole('button', { name: 'Pregunta 2, actual' })
    expect(current.getAttribute('aria-current')).toBe('step')
    expect(within(nav).getAllByRole('button', { current: 'step' })).toHaveLength(1)

    await user.type(screen.getByLabelText('Escribe la frase corregida'), 'x')
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(within(nav).getByRole('button', { name: 'Pregunta 2, respondida' })).toBeTruthy()
  })

  it('keeps Enter inside an input from navigating or submitting', async () => {
    const { user, submitExam } = setup()
    await user.type(screen.getByLabelText('Tu respuesta'), 'hello{Enter}')
    expect(heading(1)).toBeTruthy()
    expect(submitExam).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()

    await goTo(user, 3)
    await user.type(screen.getByLabelText('Espacio 1'), 'runs{Enter}')
    expect(heading(3)).toBeTruthy()

    await goTo(user, 5)
    await user.type(screen.getByLabelText('Tu respuesta'), 'text{Enter}')
    expect(heading(5)).toBeTruthy()
    expect(submitExam).not.toHaveBeenCalled()
  })
})

describe('ExamPage - answers persist', () => {
  it('keeps text answers when moving away and back', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
    await goTo(user, 3)
    await goTo(user, 1)
    expect((screen.getByLabelText('Tu respuesta') as HTMLInputElement).value).toBe('hello')
  })

  it('keeps blank answers when moving away and back', async () => {
    const { user } = setup()
    await goTo(user, 3)
    await user.type(screen.getByLabelText('Espacio 1'), 'runs')
    await goTo(user, 4)
    await user.type(screen.getByLabelText('Past'), 'went')
    await goTo(user, 1)
    await goTo(user, 3)
    expect((screen.getByLabelText('Espacio 1') as HTMLInputElement).value).toBe('runs')
    await goTo(user, 4)
    expect((screen.getByLabelText('Past') as HTMLInputElement).value).toBe('went')
    expect((screen.getByLabelText('Present') as HTMLInputElement).value).toBe('')
  })

  it('keeps self-check text, reveal and mark when moving away and back', async () => {
    const { user } = setup()
    await goTo(user, 5)
    await user.type(screen.getByLabelText('Tu respuesta'), 'my day')
    await user.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
    await user.click(screen.getByRole('button', { name: 'No acerté' }))
    await goTo(user, 1)
    await goTo(user, 5)
    expect((screen.getByLabelText('Tu respuesta') as HTMLTextAreaElement).value).toBe('my day')
    expect(screen.getByRole('button', { name: 'No acerté' }).getAttribute('aria-pressed')).toBe(
      'true'
    )
    expect(screen.getByRole('button', { name: 'Acerté' }).getAttribute('aria-pressed')).toBe(
      'false'
    )
    expect(screen.queryByRole('button', { name: 'Mostrar respuesta' })).toBeNull()
  })
})

describe('ExamPage - focus and announcements', () => {
  it('moves focus to the question heading and scrolls to top on every question change', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(document.activeElement).toBe(heading(2))
    expect(window.scrollTo).toHaveBeenCalledTimes(1)

    await goTo(user, 4)
    expect(document.activeElement).toBe(heading(4))

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(document.activeElement).toBe(heading(3))
    expect(window.scrollTo).toHaveBeenCalledTimes(3)
  })

  it('makes the heading programmatically focusable but not a tab stop', () => {
    setup()
    expect(heading(1).getAttribute('tabindex')).toBe('-1')
  })

  it('announces the position in a polite live region', async () => {
    const { user } = setup()
    const live = screen.getByRole('status')
    expect(live.getAttribute('aria-live')).toBe('polite')
    expect(live.textContent).toBe('Pregunta 1 de 5')
    expect(live.className).toContain('sr-only')

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(live.textContent).toBe('Pregunta 2 de 5')
    await goTo(user, 5)
    expect(live.textContent).toBe('Pregunta 5 de 5')
  })
})

describe('ExamPage - mobile navigator toggle', () => {
  it('is collapsed by default and toggles aria-expanded', async () => {
    const { user } = setup()
    const toggle = screen.getByRole('button', { name: 'Ver todas las preguntas' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(panel.className).toContain('hidden')

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(panel.className).not.toMatch(/(^|\s)hidden(\s|$)/)

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('ExamPage - submit with unanswered questions', () => {
  async function openUnansweredDialog(user: User) {
    await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
    await goTo(user, 3)
    await user.type(screen.getByLabelText('Espacio 1'), 'runs')
    await goTo(user, 5)
    await user.type(screen.getByLabelText('Tu respuesta'), 'my day')
    await user.click(screen.getByRole('button', { name: 'Mostrar respuesta' }))
    await user.click(screen.getByRole('button', { name: 'Acerté' }))
    const trigger = screen.getByRole('button', { name: 'Entregar examen' })
    await user.click(trigger)
    return { trigger, dialog: screen.getByRole('dialog') }
  }

  it('opens a dialog listing exactly the unanswered numbers and does not submit', async () => {
    const { user, submitExam } = setup()
    const { dialog } = await openUnansweredDialog(user)

    expect(within(dialog).getByText('Hay preguntas sin responder')).toBeTruthy()
    const goButtons = within(dialog)
      .getAllByRole('button', { name: /^Ir a la pregunta/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(goButtons).toEqual(['Ir a la pregunta 2', 'Ir a la pregunta 4'])
    expect(submitExam).not.toHaveBeenCalled()
  })

  it('opens the same dialog from the bottom Entregar button on the last question', async () => {
    const { user } = setup()
    await goTo(user, 5)
    await user.click(screen.getByRole('button', { name: 'Entregar' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('focuses "Seguir respondiendo" and Escape closes it, returning focus to the trigger', async () => {
    const { user } = setup()
    const trigger = screen.getByRole('button', { name: 'Entregar examen' })
    await user.click(trigger)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Seguir respondiendo' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('"Seguir respondiendo" closes the dialog and returns focus to the button', async () => {
    const { user, submitExam } = setup()
    const { trigger } = await openUnansweredDialog(user)
    await user.click(screen.getByRole('button', { name: 'Seguir respondiendo' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(submitExam).not.toHaveBeenCalled()
  })

  it('a number button jumps to that question and closes the dialog', async () => {
    const { user, submitExam } = setup()
    await openUnansweredDialog(user)
    await user.click(screen.getByRole('button', { name: 'Ir a la pregunta 4' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(heading(4)).toBeTruthy()
    expect(document.activeElement).toBe(heading(4))
    expect(submitExam).not.toHaveBeenCalled()
  })

  it('traps Tab inside the dialog', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 12; i += 1) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    for (let i = 0; i < 12; i += 1) {
      await user.tab({ shift: true })
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('"Entregar de todos modos" submits once with the right answer shapes per kind', async () => {
    const { user, submitExam, exam, onSubmitted } = setup()
    await openUnansweredDialog(user)
    await user.click(screen.getByRole('button', { name: 'Entregar de todos modos' }))

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    expect(submitExam).toHaveBeenCalledTimes(1)
    expect(submitExam).toHaveBeenCalledWith(exam, [
      { kind: 'text', questionId: 'exact-open', value: 'hello' },
      { kind: 'blanks', questionId: 'fill-1', values: { 1: 'runs' } },
      {
        kind: 'selfCheck',
        questionId: 'self-1',
        text: 'my day',
        revealed: true,
        markedCorrect: true,
      },
    ])
  })

  it('submits without answers when nothing was answered', async () => {
    const { user, submitExam, exam } = setup()
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('button', { name: /^Ir a la pregunta/ })).toHaveLength(5)
    await user.click(screen.getByRole('button', { name: 'Entregar de todos modos' }))
    await waitFor(() => expect(submitExam).toHaveBeenCalledTimes(1))
    expect(submitExam).toHaveBeenCalledWith(exam, [])
  })
})

describe('ExamPage - submit with everything answered', () => {
  it('submits directly without a dialog and reports the outcome', async () => {
    const { user, submitExam, onSubmitted, exam } = setup()
    await answerAll(user)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    expect(submitExam).toHaveBeenCalledTimes(1)
    const [passedExam, answers] = submitExam.mock.calls[0]!
    expect(passedExam).toBe(exam)
    expect(answers).toHaveLength(5)
    expect(answers).toContainEqual({
      kind: 'blanks',
      questionId: 'multi-1',
      values: { 1: 'go', 2: 'went', 3: 'gone' },
    })
    expect(onSubmitted).toHaveBeenCalledWith(await submitExam.mock.results[0]!.value)
  })

  it('submits from the bottom Entregar button on the last question', async () => {
    const { user, submitExam, onSubmitted } = setup()
    await answerAll(user)
    await user.click(screen.getByRole('button', { name: 'Entregar' }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    expect(submitExam).toHaveBeenCalledTimes(1)
  })

  it('shows "Entregando..." and disables every control while pending, then reports success', async () => {
    const { user, submitExam, onSubmitted, exam } = setup()
    const pending = deferred<SubmitExamOutcome>()
    submitExam.mockReturnValueOnce(pending.promise)

    await answerAll(user)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    const pendingButtons = screen.getAllByRole('button', { name: 'Entregando...' })
    expect(pendingButtons).toHaveLength(2)
    for (const button of pendingButtons) expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salir' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Pregunta 1,/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ver todas las preguntas' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Acerté' })).toBeDisabled()
    expect(onSubmitted).not.toHaveBeenCalled()

    const outcome = makeOutcome(exam)
    pending.resolve(outcome)
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(outcome))
    expect(submitExam).toHaveBeenCalledTimes(1)
  })

  it('does not call submitExam twice on a double click', async () => {
    const { user, submitExam } = setup()
    const pending = deferred<SubmitExamOutcome>()
    submitExam.mockReturnValueOnce(pending.promise)

    await answerAll(user)
    await user.dblClick(screen.getByRole('button', { name: 'Entregar examen' }))
    expect(submitExam).toHaveBeenCalledTimes(1)

    for (const button of screen.getAllByRole('button', { name: 'Entregando...' })) {
      await user.click(button)
    }
    expect(submitExam).toHaveBeenCalledTimes(1)
  })

  it('shows an alert and re-enables the controls when submitExam rejects', async () => {
    const { user, submitExam, onSubmitted } = setup()
    submitExam.mockRejectedValueOnce(new Error('boom'))

    await answerAll(user)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('No se pudo entregar el examen. Inténtalo de nuevo.')
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Entregar examen' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Entregar' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Salir' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Acerté' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    expect(submitExam).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('ExamPage - exit', () => {
  it('opens a confirmation, and cancelling keeps the exam and the answers', async () => {
    const { user, onExit } = setup()
    await user.type(screen.getByLabelText('Tu respuesta'), 'hello')
    const exit = screen.getByRole('button', { name: 'Salir' })
    await user.click(exit)

    const dialog = screen.getByRole('dialog', { name: '¿Salir del examen?' })
    expect(within(dialog).getByText('Perderás tus respuestas.')).toBeTruthy()
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Seguir en el examen' })
    )

    await user.click(within(dialog).getByRole('button', { name: 'Seguir en el examen' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(exit)
    expect(onExit).not.toHaveBeenCalled()
    expect((screen.getByLabelText('Tu respuesta') as HTMLInputElement).value).toBe('hello')
  })

  it('confirming calls onExit', async () => {
    const { user, onExit } = setup()
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    await user.click(screen.getByRole('button', { name: 'Sí, salir' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('Escape closes the exit dialog without leaving', async () => {
    const { user, onExit } = setup()
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onExit).not.toHaveBeenCalled()
  })

  it('traps Tab inside the exit dialog', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 5; i += 1) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })
})

describe('ExamPage - beforeunload warning', () => {
  const fireBeforeUnload = () => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  }

  it('is active while in progress and removed on unmount', () => {
    const { unmount } = setup()
    expect(fireBeforeUnload()).toBe(true)
    unmount()
    expect(fireBeforeUnload()).toBe(false)
  })

  it('registers and unregisters the listener on window', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = setup()
    const added = add.mock.calls.filter(([type]) => type === 'beforeunload')
    expect(added).toHaveLength(1)
    unmount()
    const removed = remove.mock.calls.filter(([type]) => type === 'beforeunload')
    expect(removed).toHaveLength(1)
    expect(removed[0]![1]).toBe(added[0]![1])
    add.mockRestore()
    remove.mockRestore()
  })

  it('is removed once the exam is submitted', async () => {
    const { user, onSubmitted } = setup()
    expect(fireBeforeUnload()).toBe(true)
    await answerAll(user)
    expect(fireBeforeUnload()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(fireBeforeUnload()).toBe(false)
  })

  it('stays active after a failed submission', async () => {
    const { user, submitExam } = setup()
    submitExam.mockRejectedValueOnce(new Error('boom'))
    await answerAll(user)
    await user.click(screen.getByRole('button', { name: 'Entregar examen' }))
    await screen.findByRole('alert')
    expect(fireBeforeUnload()).toBe(true)
  })
})
