import { createContext, useContext } from 'react'
import type { AppServices } from '@application'

export const appServicesContext = createContext<AppServices | null>(null)

export function useAppServices(): AppServices {
  const services = useContext(appServicesContext)
  if (!services) {
    throw new Error('useAppServices must be used within AppServicesProvider')
  }
  return services
}
