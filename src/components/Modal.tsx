import type { ReactNode } from 'react'

interface Props {
  titel: string
  onSluiten: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ titel, onSluiten, children, footer }: Props) {
  return (
    <div className="modal-overlay" onClick={onSluiten}>
      <div
        className="modal"
        role="dialog"
        aria-label={titel}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titel}</h2>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
