export interface HeatmapCell {
  key: string
  /** 0 = aucune activité ; > 0 = intensité (opacité de l'accent). */
  intensity: number
  title?: string
  /** Vrai si la cellule est hors du mois affiché (padding en début/fin). */
  outOfMonth?: boolean
}

interface HeatmapProps {
  /** Lignes de cellules (une ligne = une semaine). */
  weeks: HeatmapCell[][]
  selectedKey?: string | null
  onCellClick?: (key: string) => void
  /** Affiche la ligne d'en-tête L M M J V S D (ou D L M M J V S). */
  showHeaders?: boolean
  /** Jour de début de semaine — détermine l'ordre des en-têtes. */
  weekStart?: 'monday' | 'sunday'
}

const HEADERS_MONDAY = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const HEADERS_SUNDAY = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function Heatmap({ weeks, selectedKey, onCellClick, showHeaders, weekStart }: HeatmapProps) {
  const headers = weekStart === 'sunday' ? HEADERS_SUNDAY : HEADERS_MONDAY

  return (
    <div className="gt-heatmap">
      {showHeaders && (
        <div className="gt-heatmap__week" aria-hidden="true">
          {headers.map((d, i) => (
            <div
              key={i}
              className="gt-heatmap__cell"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--fs-eyebrow)',
                color: 'var(--muted)',
                background: 'none',
                cursor: 'default',
                aspectRatio: 'auto',
                fontWeight: 600,
              }}
            >
              {d}
            </div>
          ))}
        </div>
      )}
      {weeks.map((week, wi) => (
        <div className="gt-heatmap__week" key={wi}>
          {week.map((cell) => {
            const selected = cell.key === selectedKey
            const cls = [
              'gt-heatmap__cell',
              onCellClick ? 'gt-heatmap__cell--clickable' : '',
              selected ? 'gt-heatmap__cell--selected' : '',
            ].filter(Boolean).join(' ')

            let cellStyle: React.CSSProperties | undefined
            if (cell.intensity > 0) {
              const baseOpacity = 0.25 + 0.75 * Math.min(1, cell.intensity)
              cellStyle = {
                background: 'var(--accent)',
                opacity: cell.outOfMonth ? baseOpacity * 0.35 : baseOpacity,
              }
            } else if (cell.outOfMonth) {
              cellStyle = { opacity: 0.3 }
            }

            return (
              <div
                key={cell.key}
                className={cls}
                title={cell.title}
                role={onCellClick ? 'button' : undefined}
                tabIndex={onCellClick ? 0 : undefined}
                onClick={onCellClick ? () => onCellClick(cell.key) : undefined}
                onKeyDown={onCellClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(cell.key) } : undefined}
                style={cellStyle}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
