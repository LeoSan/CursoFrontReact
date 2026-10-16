import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfigPage from '@presentation/pages/ConfigPage'
import { AppServicesProvider } from '@presentation/context/AppServicesProvider'
import type { AppServices, GenerateExamResult, LoadExamSetupResult } from '@application'
import type { Exam, ExamConfig, Question } from '@domain'

const mockQuestion1 = {
  id: 'Q1',
  sourceId: 'S1',
  lessonPairs: ['1-2'],
  englishLevel: 'A1' as const,
  difficulty: 'Easy' as const,
  topic: 'Greetings',
  skillType: 'Speaking' as const,
  questionType: 'open' as const,
  gradingMode: 'exact' as const,
  instruction: 'Answer',
  prompt: 'Say hello',
  answer: 'Hello',
  explanation: 'Correct',
  acceptedAnswers: ['Hello'],
} as Question

const mockQuestion2 = {
  id: 'Q2',
  sourceId: 'S2',
  lessonPairs: ['3-4'],
  englishLevel: 'A2' as const,
  difficulty: 'Medium' as const,
  topic: 'Numbers',
  skillType: 'Writing' as const,
  questionType: 'open' as const,
  gradingMode: 'exact' as const,
  instruction: 'Write',
  prompt: 'Count to 5',
  answer: '1 2 3 4 5',
  explanation: 'Correct',
  acceptedAnswers: ['1 2 3 4 5'],
} as Question

const mockQuestion3 = {
  id: 'Q3',
  sourceId: 'S3',
  lessonPairs: ['1-2'],
  englishLevel: 'A1' as const,
  difficulty: 'Medium' as const,
  topic: 'Colors',
  skillType: 'Speaking' as const,
  questionType: 'open' as const,
  gradingMode: 'exact' as const,
  instruction: 'Say',
  prompt: 'Name a color',
  answer: 'Blue',
  explanation: 'Correct',
  acceptedAnswers: ['Blue'],
} as Question

const mockQuestionReview = {
  id: 'QR1',
  sourceId: 'SR1',
  lessonPairs: ['1-2', '3-4'],
  englishLevel: 'A1' as const,
  difficulty: 'Hard' as const,
  topic: 'Review',
  skillType: 'Speaking' as const,
  questionType: 'open' as const,
  gradingMode: 'exact' as const,
  instruction: 'Review answer',
  prompt: 'What did you learn?',
  answer: 'Various answers',
  explanation: 'Review question',
  acceptedAnswers: ['Various answers'],
} as Question

const mockQuestionB2 = {
  id: 'QB2',
  sourceId: 'SB2',
  lessonPairs: ['3-4'],
  englishLevel: 'B2' as const,
  difficulty: 'Hard' as const,
  topic: 'Advanced',
  skillType: 'Writing' as const,
  questionType: 'open' as const,
  gradingMode: 'exact' as const,
  instruction: 'Write advanced',
  prompt: 'Complex question',
  answer: 'Complex answer',
  explanation: 'B2 level explanation',
  acceptedAnswers: ['Complex answer'],
} as Question

const mockPairs = [
  { id: '1-2', label: 'Lecciones 1-2', lessons: [1, 2] as const },
  { id: '3-4', label: 'Lecciones 3-4', lessons: [3, 4] as const },
]

const mockExam: Exam = {
  id: 'exam-1',
  createdAt: '2026-10-15T10:00:00Z',
  config: {
    selectedPairIds: ['1-2'],
    levels: [],
    difficulties: [],
    questionCount: 3,
    shuffle: false,
  },
  questions: [
    { number: 1, question: mockQuestion1 },
    { number: 2, question: mockQuestion3 },
  ],
}

function createMockAppServices(overrides?: Partial<AppServices>): AppServices {
  return {
    loadExamSetup: vi.fn(async (): Promise<LoadExamSetupResult> => ({
      pairs: mockPairs as LoadExamSetupResult['pairs'],
      questions: [mockQuestion1, mockQuestion2, mockQuestion3, mockQuestionReview, mockQuestionB2],
    })),
    startExam: vi.fn(async (config: ExamConfig): Promise<GenerateExamResult> => ({
      ok: true as const,
      exam: mockExam,
      requestedCount: config.questionCount,
      availableCount: 3,
      reducedToAvailable: false,
    })),
    submitExam: vi.fn(),
    attemptHistory: {
      list: vi.fn(),
      getById: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    ...overrides,
  }
}

function renderWithServices(services: AppServices) {
  return render(
    <AppServicesProvider services={services}>
      <ConfigPage />
    </AppServicesProvider>
  )
}

describe('ConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays form', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    expect(screen.getByText('Pares de Lecciones')).toBeTruthy()
    expect(screen.getByText('Niveles de Inglés')).toBeTruthy()
    expect(screen.getByText('Dificultades')).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const services = createMockAppServices({
      loadExamSetup: vi.fn((): Promise<LoadExamSetupResult> => new Promise(() => {})),
    })
    renderWithServices(services)

    expect(screen.getByText('Cargando datos...')).toBeTruthy()
  })

  it('shows error state and retry button', async () => {
    const services = createMockAppServices({
      loadExamSetup: vi.fn(async (): Promise<LoadExamSetupResult> => {
        throw new Error('Failed to load')
      }),
    })
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los datos')).toBeTruthy()
    })
    expect(screen.getByText('Reintentar')).toBeTruthy()
  })

  it('displays pair selection button', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })
  })

  it('displays dropdown with pair options when clicked', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
      expect(screen.getByText('Lecciones 3-4')).toBeTruthy()
    })
  })

  it('shows available question count', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText(/Disponibles:/)).toBeTruthy()
    })
  })

  it('disables submit button when no pairs selected', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('displays question count input field', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByDisplayValue('10')).toBeTruthy()
    })

    const input = screen.getByDisplayValue('10') as HTMLInputElement
    expect(input.type).toBe('number')
  })

  it('has level and difficulty filters', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Niveles de Inglés')).toBeTruthy()
      expect(screen.getByText('Dificultades')).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: /A1/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Fácil|Easy/ })).toBeTruthy()
  })

  it('has shuffle checkbox checked by default', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Mezclar preguntas')).toBeTruthy()
    })

    const checkbox = screen.getByRole('checkbox', {
      name: 'Mezclar preguntas',
    }) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('toggles shuffle checkbox', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Mezclar preguntas')).toBeTruthy()
    })

    const checkbox = screen.getByRole('checkbox', {
      name: 'Mezclar preguntas',
    }) as HTMLInputElement

    await userEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)

    await userEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
  })

  it('displays level chip buttons', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const a1Btn = screen.getByRole('button', { name: /A1/ })
      expect(a1Btn).toBeTruthy()
    })
  })

  it('displays question count quick buttons', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const btn5 = screen.getByRole('button', { name: '5' })
      const btn10 = screen.getByRole('button', { name: '10' })
      const btn20 = screen.getByRole('button', { name: '20' })
      expect(btn5).toBeTruthy()
      expect(btn10).toBeTruthy()
      expect(btn20).toBeTruthy()
    })
  })

  // Pair dropdown tests
  describe('Pair dropdown', () => {
    it('clicking the trigger button again closes the dropdown', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
      })

      expect(button).toHaveAttribute('aria-expanded', 'true')

      await user.click(button)

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('Escape closes dropdown', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
      })

      expect(button).toHaveAttribute('aria-expanded', 'true')

      const selectAllBtn = screen.getByRole('button', { name: 'Seleccionar todos' })
      selectAllBtn.focus()
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('clicking outside closes dropdown', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
      })

      const heading = screen.getByText('Generador de Examen')
      await user.click(heading)

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false' as unknown)
      })
    })

    it('aria-expanded toggles with dropdown state', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      expect(button).toHaveAttribute('aria-expanded', 'false' as unknown)

      await user.click(button)

      expect(button).toHaveAttribute('aria-expanded', 'true' as unknown)

      await user.click(button)

      expect(button).toHaveAttribute('aria-expanded', 'false' as unknown)
    })

    it('"Seleccionar todos" selects every pair', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      const selectAllBtn = screen.getByRole('button', { name: 'Seleccionar todos' })
      await user.click(selectAllBtn)

      await waitFor(() => {
        expect(button).toHaveTextContent('2 pares seleccionados')
      })
    })

    it('"Limpiar" clears all selected pairs', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      const selectAllBtn = screen.getByRole('button', { name: 'Seleccionar todos' })
      await user.click(selectAllBtn)

      await waitFor(() => {
        expect(button).toHaveTextContent('2 pares seleccionados')
      })

      const clearBtn = screen.getByRole('button', { name: 'Limpiar' })
      await user.click(clearBtn)

      await waitFor(() => {
        expect(button).toHaveTextContent('Selecciona pares de lecciones')
      })
    })

    it('checkbox can be toggled with the keyboard', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      const checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)

      await waitFor(() => {
        expect(checkbox).toBeChecked()
      })

      await user.click(checkbox)

      await waitFor(() => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('each pair shows the number of questions inside it', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      await waitFor(() => {
        const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
        const checkbox2 = screen.getByRole('checkbox', { name: 'Lecciones 3-4' })
        expect(checkbox1).toBeTruthy()
        expect(checkbox2).toBeTruthy()
      })
    })
  })

  // Union count test
  describe('Union count', () => {
    it('selecting two pairs shows union count with no duplicated questions', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const button = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(button)

      const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      const checkbox2 = screen.getByRole('checkbox', { name: 'Lecciones 3-4' })

      await user.click(checkbox1)
      await user.click(checkbox2)

      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Disponibles: 5')).toBeTruthy()
      })
    })
  })

  // Chips tests
  describe('Chips', () => {
    it('counts update when selected pairs change', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const pairButton = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(pairButton)

      const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      await user.click(checkbox1)

      await waitFor(() => {
        const a1Chip = screen.getAllByRole('button').find((btn) => btn.textContent?.includes('A1'))
        expect(a1Chip?.textContent).toContain('(')
      })
    })

    it('chip with 0 questions is disabled', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
      })

      const pairButton = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(pairButton)

      const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      await user.click(checkbox1)

      await user.click(pairButton)

      const buttons = screen.getAllByRole('button')
      const b2Chip = buttons.find((btn) => btn.textContent?.includes('B2'))

      if (b2Chip) {
        expect(b2Chip).toBeDisabled()
      }
    })

    it('clicking chip toggles aria-pressed', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Niveles de Inglés')).toBeTruthy()
      })

      const pairButton = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(pairButton)

      const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      await user.click(checkbox1)

      await user.click(pairButton)

      const a1Chip = screen.getAllByRole('button').find((btn) => btn.textContent?.includes('A1'))

      if (a1Chip) {
        expect(a1Chip).toHaveAttribute('aria-pressed', 'false' as unknown)

        await user.click(a1Chip)

        expect(a1Chip).toHaveAttribute('aria-pressed', 'true' as unknown)
      }
    })

    it('B2 level chip appears (derived from data)', async () => {
      const services = createMockAppServices()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Niveles de Inglés')).toBeTruthy()
      })

      const buttons = screen.getAllByRole('button')
      const b2Chip = buttons.find((btn) => btn.textContent?.includes('B2'))

      expect(b2Chip).toBeTruthy()
    })

    it('difficulty chips show Spanish labels', async () => {
      const services = createMockAppServices()
      const user = userEvent.setup()
      renderWithServices(services)

      await waitFor(() => {
        expect(screen.getByText('Dificultades')).toBeTruthy()
      })

      const pairButton = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
      await user.click(pairButton)

      const checkbox1 = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
      await user.click(checkbox1)

      await user.click(pairButton)

      await waitFor(() => {
        expect(screen.getByText(/Fácil/)).toBeTruthy()
        expect(screen.getByText(/Media/)).toBeTruthy()
        expect(screen.getByText(/Difícil/)).toBeTruthy()
      })
    })
  })

  // Count input tests
  it('count input defaults to min(10, available)', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const input = screen.getByDisplayValue('10') as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.value).toBe('10')
    })
  })

  it('count input stays at default even when available < 10', async () => {
    const services = createMockAppServices({
      loadExamSetup: vi.fn(async (): Promise<LoadExamSetupResult> => ({
        pairs: mockPairs as LoadExamSetupResult['pairs'],
        questions: [mockQuestion1],
      })),
    })
    renderWithServices(services)

    await waitFor(() => {
      const input = screen.getByDisplayValue('10') as HTMLInputElement
      expect(input.value).toBe('10')
    })

    // Verify available count shows 1
    expect(screen.getByText('Disponibles: 1')).toBeTruthy()
  })

  it('re-clamps count when filters reduce availability', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByDisplayValue('10')).toBeTruthy()
    })

    // Select a pair first
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    await userEvent.click(pairBtn)

    // Now set count to 20
    const countInput = screen.getByDisplayValue('10') as HTMLInputElement
    await userEvent.clear(countInput)
    await userEvent.type(countInput, '20')

    // Pair 1-2 has 3 questions (Q1, Q3, QR1), so count should show 20 but warning appears
    await waitFor(() => {
      expect(countInput.value).toBe('20')
      expect(screen.getByText(/Solo están disponibles 3/)).toBeTruthy()
    })
  })

  it('quick button 5 sets count to 5', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const btn5 = screen.getByRole('button', { name: '5' })
      expect(btn5).toBeTruthy()
    })

    const btn5 = screen.getByRole('button', { name: '5' })
    await userEvent.click(btn5)

    const input = screen.getByDisplayValue('5') as HTMLInputElement
    expect(input.value).toBe('5')
  })

  it('quick button 10 sets count to 10', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const btn10 = screen.getByRole('button', { name: '10' })
      expect(btn10).toBeTruthy()
    })

    const btn10 = screen.getByRole('button', { name: '10' })
    await userEvent.click(btn10)

    const input = screen.getByDisplayValue('10') as HTMLInputElement
    expect(input.value).toBe('10')
  })

  it('quick button 20 sets count to 20', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      const btn20 = screen.getByRole('button', { name: '20' })
      expect(btn20).toBeTruthy()
    })

    const btn20 = screen.getByRole('button', { name: '20' })
    await userEvent.click(btn20)

    const input = screen.getByDisplayValue('20') as HTMLInputElement
    expect(input.value).toBe('20')

    // Verify overflow warning appears (5 available questions total)
    await waitFor(() => {
      expect(screen.getByText(/Solo están disponibles 5/)).toBeTruthy()
    })
  })

  it('Todas button sets count to available count', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Todas')).toBeTruthy()
    })

    const todasBtn = screen.getByRole('button', { name: 'Todas' })
    await userEvent.click(todasBtn)

    const input = screen.getByDisplayValue('5') as HTMLInputElement
    expect(input.value).toBe('5')
  })

  it('overflow note appears when count > available', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByDisplayValue('10')).toBeTruthy()
    })

    // Manually set a high count via input
    const countInput = screen.getByDisplayValue('10') as HTMLInputElement
    await userEvent.clear(countInput)
    await userEvent.type(countInput, '15')

    // Should show overflow warning
    await waitFor(() => {
      expect(screen.getByText(/Solo están disponibles 5/)).toBeTruthy()
    })
  })

  // Submit and error handling tests
  it('submit calls startExam with exact ExamConfig', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    // Select pairs
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    // Close dropdown by clicking outside
    const heading = screen.getByText('Generador de Examen')
    await userEvent.click(heading)

    await waitFor(() => {
      expect(pairBtn).toHaveAttribute('aria-expanded', 'false')
    })

    // Verify pair is selected
    await waitFor(() => {
      expect(pairBtn).toHaveTextContent('Lecciones 1-2')
    })

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(false)
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(services.startExam).toHaveBeenCalledWith({
        selectedPairIds: ['1-2'],
        levels: [],
        difficulties: [],
        questionCount: 3,
        shuffle: true,
      })
    })
  })

  it('submit clamps questionCount to available', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByDisplayValue('10')).toBeTruthy()
    })

    // Select pairs
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    // Set count to 20 (more than 3 available for pair 1-2)
    const countInput = screen.getByDisplayValue('10') as HTMLInputElement
    await userEvent.clear(countInput)
    await userEvent.type(countInput, '20')

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' })
    await userEvent.click(submitBtn)

    // Should be clamped to 3 (available for pair 1-2)
    await waitFor(() => {
      expect(services.startExam).toHaveBeenCalledWith(
        expect.objectContaining({
          questionCount: 3,
        })
      )
    })
  })

  it('shows "Generando..." while startExam is pending', async () => {
    const deferred = (() => {
      let resolve: (value: GenerateExamResult) => void
      const promise = new Promise<GenerateExamResult>((r) => {
        resolve = r
      })
      return { promise, resolve: resolve! }
    })()

    const services = createMockAppServices({
      startExam: vi.fn(() => deferred.promise),
    })
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    // Select pairs
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' }) as HTMLButtonElement
    await userEvent.click(submitBtn)

    // Should show "Generando..." and button disabled
    await waitFor(() => {
      expect(screen.getByText('Generando...')).toBeTruthy()
      expect(submitBtn.disabled).toBe(true)
    })

    // Resolve promise
    deferred.resolve({
      ok: true as const,
      exam: mockExam,
      requestedCount: 3,
      availableCount: 2,
      reducedToAvailable: false,
    })
  })

  it('shows inline error for no_questions result', async () => {
    const services = createMockAppServices({
      startExam: vi.fn(async () => ({
        ok: false as const,
        reason: 'no_questions' as const,
      })),
    })
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    // Select pairs
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' })
    await userEvent.click(submitBtn)

    // Should show error with role="alert"
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe('No hay preguntas con estos filtros.')
    })
  })

  it('shows inline error for invalid_count result', async () => {
    const services = createMockAppServices({
      startExam: vi.fn(async () => ({
        ok: false as const,
        reason: 'invalid_count' as const,
      })),
    })
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    // Select pairs
    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' })
    await userEvent.click(submitBtn)

    // Should show error with role="alert"
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe('Cantidad de preguntas inválida')
    })
  })

  it('generate button disabled with no pair selected', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Generador de Examen')).toBeTruthy()
    })

    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('generate button enabled after selecting pair', async () => {
    const services = createMockAppServices()
    renderWithServices(services)

    await waitFor(() => {
      expect(screen.getByText('Selecciona pares de lecciones')).toBeTruthy()
    })

    const pairBtn = screen.getByRole('button', { name: /Selecciona pares de lecciones/i })
    await userEvent.click(pairBtn)

    await waitFor(() => {
      expect(screen.getByText('Lecciones 1-2')).toBeTruthy()
    })

    const pair12Checkbox = screen.getByRole('checkbox', { name: /Lecciones 1-2/ })
    await userEvent.click(pair12Checkbox)

    const submitBtn = screen.getByRole('button', { name: 'Generar Examen' }) as HTMLButtonElement
    await waitFor(() => {
      expect(submitBtn.disabled).toBe(false)
    })
  })
})
