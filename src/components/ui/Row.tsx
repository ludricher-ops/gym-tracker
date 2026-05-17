import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface RowProps {
  icon?: IconName
  label: ReactNode
  sub?: ReactNode
  value?: ReactNode
  /** Affiche un chevron à droite (ligne navigable). */
  chevron?: boolean
  onClick?: () => void
  /** Contrôle personnalisé à droite (ToggleRow). */
  trailing?: ReactNode
  danger?: boolean
}

export function Row({ icon, label, sub, value, chevron, onClick, trailing, danger }: RowProps) {
  const content = (
    <>
      {icon && (
        <span className="gt-row__icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="gt-row__body">
        <span
          className="gt-row__label"
          style={danger ? { color: 'var(--danger)' } : undefined}
        >
          {label}
        </span>
        {sub && <span className="gt-row__sub">{sub}</span>}
      </span>
      {value != null && <span className="gt-row__value">{value}</span>}
      {trailing}
      {chevron && (
        <span className="gt-row__chevron">
          <Icon name="chevron-right" size={18} />
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className="gt-row" onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className="gt-row">{content}</div>
}

interface ToggleRowProps {
  icon?: IconName
  label: ReactNode
  sub?: ReactNode
  /** Contrôle trailing : Switch, Segmented, Stepper, etc. */
  control: ReactNode
}

/** Row avec un contrôle interactif aligné à droite. */
export function ToggleRow({ icon, label, sub, control }: ToggleRowProps) {
  return <Row icon={icon} label={label} sub={sub} trailing={control} />
}
