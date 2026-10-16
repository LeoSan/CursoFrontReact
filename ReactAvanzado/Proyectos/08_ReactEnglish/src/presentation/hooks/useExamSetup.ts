import { useState, useEffect } from 'react'
import type { LoadExamSetupResult } from '@application'
import { useAppServices } from '../context/appServicesContext'

export function useExamSetup() {
  const [data, setData] = useState<LoadExamSetupResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { loadExamSetup } = useAppServices()

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await loadExamSetup()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { data, loading, error, retry: load }
}
