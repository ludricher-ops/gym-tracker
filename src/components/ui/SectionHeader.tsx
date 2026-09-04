// En-tête de section : eyebrow à gauche, valeur optionnelle à droite.
// Remplace les <p className="t-eyebrow"> avec margin inline.
// Usage : <SectionHeader label="Cette semaine" value="4 séances" />
//         <SectionHeader label="Records" />

import type { ReactNode } from 'react'

interface SectionHeaderProps {
  label: string
  value?: string | ReactNode
}

export function SectionHeader({ label, value }: SectionHeaderProps) {
  return (
    <div className="gt-section-header">
      <span className="gt-section-header__label">{label}</span>
      {value != null && (
        <span className="gt-section-header__value">{value}</span>
      )}
    </div>
  )
}
