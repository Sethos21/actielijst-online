import type { ReactNode } from 'react'

type BadgeVariant = 'open' | 'done' | 'due' | 'hold'

interface Props {
  variant: BadgeVariant
  children: ReactNode
}

export function Badge({ variant, children }: Props) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
