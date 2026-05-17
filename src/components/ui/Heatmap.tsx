export interface HeatmapCell {
  key: string
  /** 0 = aucune activité ; > 0 = intensité (opacité de l'accent). */
  intensity: number
  title?: string
}

interface HeatmapProps {
  /** Lignes de cellules (une ligne = une semaine). */
  weeks: HeatmapCell[][]
}

export function Heatmap({ weeks }: HeatmapProps) {
  return (
    <div className="gt-heatmap">
      {weeks.map((week, wi) => (
        <div className="gt-heatmap__week" key={wi}>
          {week.map((cell) => (
            <div
              key={cell.key}
              className="gt-heatmap__cell"
              title={cell.title}
              style={
                cell.intensity > 0
                  ? {
                      background: 'var(--accent)',
                      opacity: 0.25 + 0.75 * Math.min(1, cell.intensity),
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
