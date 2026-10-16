import { useState } from 'react'
import type { ExamConfig, EnglishLevel, Difficulty, GenerateExamResult } from '@domain'
import type { LoadExamSetupResult } from '@application'
import { useAppServices } from '../context/appServicesContext'
import { es } from '../i18n/es'

export function useExamConfigForm(setup: LoadExamSetupResult | null) {
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<EnglishLevel[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [shuffle, setShuffle] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { startExam } = useAppServices()

  if (!setup) return null

  const { pairs, questions } = setup

  const availableQuestions = questions.filter((q) => {
    const pairFilter =
      selectedPairIds.length === 0 || selectedPairIds.some((id) => q.lessonPairs.includes(id))
    const levelFilter = selectedLevels.length === 0 || selectedLevels.includes(q.englishLevel)
    const diffFilter =
      selectedDifficulties.length === 0 || selectedDifficulties.includes(q.difficulty)
    return pairFilter && levelFilter && diffFilter
  })

  const availableCount = availableQuestions.length

  const clampedCount = Math.min(questionCount, availableCount || 1)
  const countMismatch = questionCount > availableCount

  const handleTogglePair = (pairId: string) => {
    setSelectedPairIds((prev) =>
      prev.includes(pairId) ? prev.filter((id) => id !== pairId) : [...prev, pairId]
    )
  }

  const handleSelectAllPairs = () => {
    setSelectedPairIds(pairs.map((p) => p.id))
  }

  const handleClearPairs = () => {
    setSelectedPairIds([])
  }

  const handleToggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level as EnglishLevel)
        ? prev.filter((l) => l !== level)
        : [...prev, level as EnglishLevel]
    )
  }

  const handleToggleDifficulty = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff as Difficulty)
        ? prev.filter((d) => d !== diff)
        : [...prev, diff as Difficulty]
    )
  }

  const handleSetCount = (count: number) => {
    setQuestionCount(Math.max(1, count))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (selectedPairIds.length === 0 || availableCount === 0) {
      setSubmitError('Selecciona al menos un par de lecciones')
      return null
    }

    const config: ExamConfig = {
      selectedPairIds: selectedPairIds.sort((a, b) => {
        const aFirst = parseInt(a.split('-')[0], 10)
        const bFirst = parseInt(b.split('-')[0], 10)
        return aFirst - bFirst
      }),
      levels: selectedLevels,
      difficulties: selectedDifficulties,
      questionCount: clampedCount,
      shuffle,
    }

    setSubmitting(true)
    try {
      const result = (await startExam(config)) as GenerateExamResult
      if (result.ok) {
        return { success: true, exam: result.exam }
      } else if (result.reason === 'no_questions') {
        setSubmitError('No hay preguntas con estos filtros.')
      } else {
        setSubmitError('Cantidad de preguntas inválida')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }

    return null
  }

  const allLevels = Array.from(
    new Set(questions.map((q) => q.englishLevel))
  ).sort() as EnglishLevel[]
  const allDifficulties = Array.from(
    new Set(questions.map((q) => q.difficulty))
  ).sort() as Difficulty[]

  // Build level options with counts
  const levelOptions = allLevels.map((level) => {
    const count = availableQuestions.filter((q) => q.englishLevel === level).length
    return {
      value: level,
      label: level,
      count,
      disabled: count === 0,
    }
  })

  // Build difficulty options with counts and labels
  const difficultyOptions = allDifficulties.map((diff) => {
    const count = availableQuestions.filter((q) => q.difficulty === diff).length
    return {
      value: diff,
      label: es.difficultyLabels[diff],
      count,
      disabled: count === 0,
    }
  })

  return {
    state: {
      selectedPairIds,
      selectedLevels,
      selectedDifficulties,
      questionCount,
      shuffle,
      submitting,
      submitError,
    },
    handlers: {
      togglePair: handleTogglePair,
      selectAllPairs: handleSelectAllPairs,
      clearPairs: handleClearPairs,
      toggleLevel: handleToggleLevel,
      toggleDifficulty: handleToggleDifficulty,
      setCount: handleSetCount,
      setShuffle,
      submit: handleSubmit,
    },
    computed: {
      pairs,
      availableCount,
      clampedCount,
      countMismatch,
      allLevels,
      allDifficulties,
      levelOptions,
      difficultyOptions,
    },
  }
}
