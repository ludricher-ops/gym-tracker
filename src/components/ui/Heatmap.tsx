export interface HeatmapCell {
  key: string
  /** 0 = aucune activité ; > 0 = intensité (opacité de l'accent). */
  intensity: number
  title?: string
}

interface HeatmapProps {
  /** Lignes de cellules (une ligne = une semaine). */
  weeks: HeatmapCell[][]
  selectedKey?: string | null
  onCellClick?: (key: string) => void
}

export function Heatmap({ weeks, selectedKey, onCellClick }: HeatmapProps) {
  return (
    <div className="gt-heatmap">
      {weeks.map((week, wi) => (
        <div className="gt-heatmap__week" key={wi}>
          {week.map((cell) => {
            const selected = cell.key === selectedKey
            const cls = [
              'gt-heatmap__cell',
              onCellClick ? 'gt-heatmap__cell--clickable' : '',
              selected ? 'gt-heatmap__cell--selected' : '',
            ].filter(Boolean).join(' ')
            return (
              <div
                key={cell.key}
                className={cls}
                title={cell.title}
                role={onCellClick ? 'button' : undefined}
                tabIndex={onCellClick ? 0 : undefined}
                onClick={onCellClick ? () => onCellClick(cell.key) : undefined}
                onKeyDown={onCellClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(cell.key) } : undefined}
                style={
                  cell.intensity > 0
                    ? {
                        background: 'var(--accent)',
                        opacity: 0.25 + 0.75 * Math.min(1, cell.intensity),
                      }
                    : undefined
                }
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
