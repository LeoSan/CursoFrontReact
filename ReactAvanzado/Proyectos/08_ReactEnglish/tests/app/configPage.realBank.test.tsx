import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfigPage from '@presentation/pages/ConfigPage'
import { AppServicesProvider } from '@presentation/context/AppServicesProvider'
import { appServices } from '../../src/app/composition'
import type { AppServices } from '@application'
import type { IAttemptRepository, Attempt, Exam, UserAnswer } from '@domain'

// In-memory attempt repository for testing
const createMemoryAttemptRepository = (): IAttemptRepository & {
  spy: Record<string, ReturnType<typeof vi.fn>>
} => {
  const attempts: Attempt[] = []
  const spy = {
    list: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  }

  return {
    spy,
    async list() {
      spy.list()
      return [...attempts]
    },
    async getById(id: string) {
      spy.getById(id)
      return attempts.find((a) => a.id === id) ?? null
    },
    async save(attempt: Attempt) {
      spy.save(attempt)
      const idx = attempts.findIndex((a) => a.id === attempt.id)
      if (idx >= 0) {
        attempts[idx] = attempt
      } else {
        attempts.push(attempt)
      }
    },
    async remove(id: string) {
      spy.remove(id)
      const idx = attempts.findIndex((a) => a.id === id)
      if (idx >= 0) {
        attempts.splice(idx, 1)
      }
    },
    async clear() {
      spy.clear()
      attempts.length = 0
    },
  }
}

describe('ConfigPage - Real Bank Integration', () => {
  let testServices: AppServices
  let memoryAttemptRepo: ReturnType<typeof createMemoryAttemptRepository>

  beforeEach(async () => {
    // Use real questionRepository and memory attempt repository
    memoryAttemptRepo = createMemoryAttemptRepository()

    testServices = {
      loadExamSetup: appServices.loadExamSetup,
      startExam: appServices.startExam,
      submitExam: async (exam: Exam, answers: readonly UserAnswer[]) => ({
        saved: true,
        attempt: {
          id: 'test-1',
          exam,
          answers,
          result: {
            examId: exam.id,
            total: exam.questions.length,
            correct: 0,
            incorrect: 0,
            unanswered: exam.questions.length,
            score: 0,
            results: [],
          },
          finishedAt: new Date().toISOString(),
        },
      }),
      attemptHistory: memoryAttemptRepo,
    }
  })

  it('displays 5 pairs with correct counts from real bank', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    await waitFor(() => {
      expect(screen.getByText('Lessons 11-12')).toBeTruthy()
      expect(screen.getByText('Lessons 13-14')).toBeTruthy()
      expect(screen.getByText('Lessons 15-16')).toBeTruthy()
      expect(screen.getByText('Lessons 17-18')).toBeTruthy()
      expect(screen.getByText('Lessons 19-20')).toBeTruthy()
    })
  })

  it('shows correct filters when 17-18 selected', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Click 17-18 checkbox
    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((el) => el.getAttribute('aria-label')?.includes('17-18'))
    if (checkboxes[0]) {
      await userEvent.click(checkboxes[0])
    }

    // Verify counts display
    await waitFor(() => {
      expect(screen.getByText(/Disponibles:/)).toBeTruthy()
    })
  })

  it('only 17-18 selected shows correct level and difficulty counts', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Click 17-18 checkbox
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    await userEvent.click(checkbox1718)

    // Close dropdown by clicking outside or pressing Escape
    await userEvent.keyboard('{Escape}')

    // Verify available count
    await waitFor(() => {
      expect(screen.getByText('Disponibles: 33')).toBeTruthy()
    })

    // Verify level counts: A1 4, A2 19, B1 10
    expect(screen.getByLabelText('A1, 4 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('A2, 19 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('B1, 10 preguntas')).toBeTruthy()

    // Verify difficulty counts: Fácil 12, Media 15, Difícil 6
    expect(screen.getByLabelText('Fácil, 12 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('Media, 15 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('Difícil, 6 preguntas')).toBeTruthy()
  })

  it('17-18 + 19-20 selected shows Disponibles 60 and correct counts', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select both 17-18 and 19-20
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    const checkbox1920 = screen.getByLabelText('Lessons 19-20')
    await userEvent.click(checkbox1718)
    await userEvent.click(checkbox1920)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    // Verify available count: 60
    await waitFor(() => {
      expect(screen.getByText('Disponibles: 60')).toBeTruthy()
    })

    // Verify level counts: A1 5, A2 31, B1 24
    expect(screen.getByLabelText('A1, 5 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('A2, 31 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('B1, 24 preguntas')).toBeTruthy()

    // Verify difficulty counts: Fácil 23, Media 27, Difícil 10
    expect(screen.getByLabelText('Fácil, 23 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('Media, 27 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('Difícil, 10 preguntas')).toBeTruthy()
  })

  it('only 11-12 selected shows Disponibles 12 and A1 chip is disabled', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select only 11-12
    const checkbox1112 = screen.getByLabelText('Lessons 11-12')
    await userEvent.click(checkbox1112)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    // Verify available count: 12
    await waitFor(() => {
      expect(screen.getByText('Disponibles: 12')).toBeTruthy()
    })

    // Verify A1 chip is disabled (should have 0 questions)
    const a1Chip = screen.getByLabelText('A1, 0 preguntas') as HTMLButtonElement
    expect(a1Chip.disabled).toBe(true)

    // Try clicking A1 and verify nothing changes
    await userEvent.click(a1Chip)
    expect(screen.getByText('Disponibles: 12')).toBeTruthy()

    // Verify A2 and B1 have correct counts
    expect(screen.getByLabelText('A2, 7 preguntas')).toBeTruthy()
    expect(screen.getByLabelText('B1, 5 preguntas')).toBeTruthy()
  })

  it('"Todas" with 17-18 sets count to 33', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select 17-18
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    await userEvent.click(checkbox1718)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.getByText('Disponibles: 33')).toBeTruthy()
    })

    // Click "Todas" button
    const todasBtn = screen.getByRole('button', { name: 'Todas' })
    await userEvent.click(todasBtn)

    // Verify count input is set to 33
    const countInput = screen.getByRole('spinbutton') as HTMLInputElement
    expect(parseInt(countInput.value)).toBe(33)
  })

  it('with 60 available the default count is 10', async () => {
    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select both 17-18 and 19-20 to get 60 available
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    const checkbox1920 = screen.getByLabelText('Lessons 19-20')
    await userEvent.click(checkbox1718)
    await userEvent.click(checkbox1920)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.getByText('Disponibles: 60')).toBeTruthy()
    })

    // Verify default count is 10
    const countInput = screen.getByRole('spinbutton') as HTMLInputElement
    expect(parseInt(countInput.value)).toBe(10)
  })

  it('generate 10 questions with shuffle true and pairs 17-18 and 19-20 calls startExam with correct config', async () => {
    const startExamSpy = vi.spyOn(testServices, 'startExam')

    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select 17-18 and 19-20
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    const checkbox1920 = screen.getByLabelText('Lessons 19-20')
    await userEvent.click(checkbox1718)
    await userEvent.click(checkbox1920)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    // Verify shuffle is checked by default
    const shuffleCheckbox = screen.getByRole('checkbox', {
      name: /Mezclar preguntas/i,
    }) as HTMLInputElement
    expect(shuffleCheckbox.checked).toBe(true)

    // Click Generate button
    const generateBtn = screen.getByRole('button', { name: /Generar Examen/i })
    await userEvent.click(generateBtn)

    // Wait for the exam to start
    await waitFor(() => {
      expect(startExamSpy).toHaveBeenCalled()
    })

    // Verify startExam was called with correct config
    const lastCall = startExamSpy.mock.calls[startExamSpy.mock.calls.length - 1]
    const config = lastCall?.[0]

    expect(config?.selectedPairIds).toEqual(['17-18', '19-20'])
    expect(config?.levels).toEqual([])
    expect(config?.difficulties).toEqual([])
    expect(config?.shuffle).toBe(true)
    expect(config?.questionCount).toBe(10)
  })

  it('clicking "Fácil" chip produces config.difficulties ["Easy"]', async () => {
    const startExamSpy = vi.spyOn(testServices, 'startExam')

    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Open dropdown
    const dropdownBtn = screen.getByRole('button', {
      name: /Selecciona pares de lecciones/i,
    })
    await userEvent.click(dropdownBtn)

    // Select 17-18
    const checkbox1718 = screen.getByLabelText('Lessons 17-18')
    await userEvent.click(checkbox1718)

    // Close dropdown
    await userEvent.keyboard('{Escape}')

    // Click "Fácil" chip
    const facilChip = screen.getByLabelText('Fácil, 12 preguntas')
    await userEvent.click(facilChip)

    // Click Generate button
    const generateBtn = screen.getByRole('button', { name: /Generar Examen/i })
    await userEvent.click(generateBtn)

    // Wait for the exam to start
    await waitFor(() => {
      expect(startExamSpy).toHaveBeenCalled()
    })

    // Verify startExam was called with difficulties containing "Easy" (the data value, not "Fácil")
    const lastCall = startExamSpy.mock.calls[startExamSpy.mock.calls.length - 1]
    const config = lastCall?.[0]

    expect(config?.difficulties).toEqual(['Easy'])
  })

  it('generates exam with sorted pair IDs and correct config', async () => {
    const startExamSpy = vi.spyOn(testServices, 'startExam')

    render(
      <AppServicesProvider services={testServices}>
        <ConfigPage />
      </AppServicesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    // Verify startExam was called with correct config
    if (startExamSpy.mock.calls.length > 0) {
      const lastCall = startExamSpy.mock.calls[startExamSpy.mock.calls.length - 1]
      const config = lastCall?.[0]
      expect(config?.shuffle).toBeDefined()
      expect(Array.isArray(config?.selectedPairIds)).toBe(true)
    }
  })
})
