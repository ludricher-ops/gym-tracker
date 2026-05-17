import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'flat'
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Card({ children, variant = 'default', className, style, onClick }: CardProps) {
  const cls = [
    'gt-card',
    variant === 'accent' && 'gt-card--accent',
    variant === 'flat' && 'gt-card--flat',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    )
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  )
}
