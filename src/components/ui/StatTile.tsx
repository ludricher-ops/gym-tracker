interface StatTileProps {
  label: string
  value: string
  /** Variation vs période précédente (signe → couleur + flèche). */
  delta?: number
  /** Suffixe du delta, ex. " séances". */
  deltaUnit?: string
}

export function StatTile({ label, value, delta, deltaUnit }: StatTileProps) {
  return (
    <div className="gt-stat">
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
