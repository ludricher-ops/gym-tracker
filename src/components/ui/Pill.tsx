import type { ReactNode } from 'react'

interface PillProps {
  children: ReactNode
  variant?: 'surface' | 'surface2' | 'accent'
}

export function Pill({ children, variant = 'surface2' }: PillProps) {
  return <span className={`gt-pill gt-pill--${variant}`}>{children}</span>
}
