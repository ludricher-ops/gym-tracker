import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: IconName
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`gt-btn gt-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

interface PrimaryBarProps {
  children: ReactNode
}

/** CTA collant en bas d'écran (cahier 4.4). */
export function PrimaryBar({ children }: PrimaryBarProps) {
  return <div className="gt-primarybar">{children}</div>
}
