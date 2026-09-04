// Delta signé : fond + couleur accent si positif, surface2 + muted sinon.
// Usage : <DeltaPill value={+2.5} unit="kg" />
//         <DeltaPill value={-1} />

interface DeltaPillProps {
  value: number
  /** Unité affichée après la valeur (ex. "kg", "%") */
  unit?: string
}

export function DeltaPill({ value, unit }: DeltaPillProps) {
  const up = value > 0
  const sign = up ? '+' : value < 0 ? '−' : '='
  const abs = Math.abs(value)
  const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)
  return (
    <span className={`gt-deltapill${up ? ' gt-deltapill--up' : ' gt-deltapill--down'}`}>
      {sign}{formatted}{unit != null ? ` ${unit}` : ''}
    </span>
  )
}
