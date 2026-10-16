import { ReactNode } from 'react'
import type { AppServices } from '@application'
import { appServicesContext } from './appServicesContext'

export interface AppServicesProviderProps {
  children: ReactNode
  services: AppServices
}

export function AppServicesProvider({ children, services }: AppServicesProviderProps) {
  return <appServicesContext.Provider value={services}>{children}</appServicesContext.Provider>
}
