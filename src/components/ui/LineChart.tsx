export interface ChartPoint {
  x: number
  y: number
}

interface LineChartProps {
  /** Points triés par x croissant. */
  points: ChartPoint[]
  height?: number
}

const W = 320
const PAD = 12

/** Graphique en courbe (SVG pur) — échelle uniforme, accent du thème. */
export function LineChart({ points, height = 132 }: LineChartProps) {
  if (points.length < 2) {
    return (
      <p className="t-caption" style={{ padding: '24px 0', textAlign: 'center' }}>
        Pas assez de données pour tracer une courbe.
      </p>
    )
  }

  const H = height
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  // Marge verticale de 8 % pour ne pas coller aux bords.
  const padY = (maxY - minY) * 0.08 || 1
  const loY = minY - padY
  const spanY = maxY - loY + padY || 1

  const sx = (x: number) => PAD + ((x - minX) / spanX) * (W - 2 * PAD)
  const sy = (y: number) => H - PAD - ((y - loY) / spanY) * (H - 2 * PAD)

  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${sx(maxX).toFixed(1)} ${H - PAD} L${sx(minX).toFixed(1)} ${H - PAD} Z`
  const showDots = points.length <= 40

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Courbe de progression"
      style={{ display: 'block' }}
    >
      <path d={area} fill="var(--accent)" opacity={0.14} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.6} fill="var(--accent)" />
        ))}
    </svg>
  )
}
