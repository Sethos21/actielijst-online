import { createContext, useCallback, useState, type ReactNode } from 'react'

export interface ToastContextValue {
  toon: (bericht: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [bericht, setBericht] = useState<string | null>(null)

  const toon = useCallback((nieuwBericht: string) => {
    setBericht(nieuwBericht)
    setTimeout(() => setBericht(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toon }}>
      {children}
      {bericht && (
        <div className="toast" role="status">
          {bericht}
        </div>
      )}
    </ToastContext.Provider>
  )
}
