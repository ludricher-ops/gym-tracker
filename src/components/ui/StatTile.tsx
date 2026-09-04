import type { CSSProperties } from 'react'

interface StatTileProps {
  label: string
  value: string
  /** Variation vs période précédente (signe → couleur + flèche). */
  delta?: number
  /** Suffixe du delta, ex. " séances". */
  deltaUnit?: string
  /** Surcharge de style inline (ex. fond teinté sur carte accent). */
  style?: CSSProperties
}

export function StatTile({ label, value, delta, deltaUnit, style }: StatTileProps) {
  return (
    <div className="gt-stat" style={style}>
      <div className="gt-stat__value">{value}</div>
      <div className="gt-stat__label">{label}</div>
      {delta != null && delta !== 0 && (
        <div className={`gt-stat__delta gt-stat__delta--${delta > 0 ? 'up' : 'down'}`}>
          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          {deltaUnit}
        </div>
      )}
    </div>
  )
}
