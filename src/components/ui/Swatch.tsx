// Pastille de légende : carré 12×12, couleur accent à l'opacité donnée.
// Utilisé dans SessionRecapScreen pour relier légende ↔ segment musculaire.
// Usage : <Swatch opacity={1 - i * 0.16} />

interface SwatchProps {
  /** 0–1, par défaut 1 */
  opacity?: number
}

export function Swatch({ opacity = 1 }: SwatchProps) {
  return (
    <span
      className="gt-swatch"
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
