import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  icon?: IconName
  title: string
  sub?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, sub, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 8,
        padding: '48px 24px',
      }}
    >
      {icon && (
        <div style={{ color: 'var(--dim)', marginBottom: 4 }}>
          <Icon name={icon} size={40} strokeWidth={1.4} />
        </div>
      )}
      <p className="t-title" style={{ fontSize: 18 }}>
        {title}
      </p>
      {sub && (
        <p className="t-caption" style={{ maxWidth: 260 }}>
          {sub}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
