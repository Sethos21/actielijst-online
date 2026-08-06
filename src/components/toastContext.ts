import { createContext } from 'react'

export interface ToastContextValue {
  toon: (bericht: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
