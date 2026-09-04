import type { SetRecord, WeightUnit } from '../../../types'
import { formatWeight } from '../../../utils/units'
import { TRACKING_LABEL } from '../../../utils/labels'
import { Icon } from '../../ui'

interface SetTableProps {
  sets: SetRecord[]
  activeSetId: string | null
  trackingType: 'weight_reps' | 'reps_only' | 'time'
  weightUnit: WeightUnit
  onSelect: (id: string) => void
  /** Valide la série active directement depuis la case à cocher. */
  onValidate?: () => void
}

export function SetTable({ sets, activeSetId, trackingType, weightUnit, onSelect, onValidate }: SetTableProps) {
  // Numérotation des séries de travail (l'échauffement ne compte pas).
  let work = 0
  const labels = sets.map((s) => (s.isWarmup ? 'Éch.' : `S${++work}`))

  const showWeight = trackingType === 'weight_reps'
  const colCount = showWeight ? 4 : 3
  const colClass = `gt-set--grid-${colCount}`
  const headClass = `gt-set-table__head--${colCount}`

  // En-tête de colonne métrique : unité si poids, sinon DURÉE ou REPS.
  const col2Header = showWeight ? weightUnit.toUpperCase() : trackingType === 'time' ? 'DURÉE' : 'REPS'
  const col3Header = showWeight ? 'REPS' : ''

  return (
    <div className="gt-set-table">
      {/* Ligne d'en-tête */}
      {sets.length > 0 && (
        <div className={`gt-set-table__head ${headClass}`} aria-hidden="true">
          <span className="gt-set-table__cell">SET</span>
          <span className="gt-set-table__cell">{col2Header}</span>
          {showWeight && <span className="gt-set-table__cell">{col3Header}</span>}
          <span className="gt-set-table__cell" />
        </div>
      )}

      {/* Lignes de séries */}
      {sets.map((set, i) => {
        const done = set.completedAt != null
        const active = set.id === activeSetId
        const label = labels[i]

        const kgStr = showWeight ? formatWeight(set.weightKg, weightUnit) : null
        const repsStr = trackingType === 'time' ? `${set.reps}s` : String(set.reps)

        return (
          <button
            key={set.id}
            type="button"
            className={`gt-set gt-set--grid ${colClass} ${active ? 'gt-set--active' : ''} ${
              !done && !active ? 'gt-set--planned' : ''
            }`}
            onClick={() => onSelect(set.id)}
          >
            <span className="gt-set__idx">{label}</span>
            {kgStr != null && <span className="gt-set__kg">{kgStr}</span>}
            <span className="gt-set__reps">{repsStr}</span>
            <span className="gt-set__mark">
              {set.rpe != null && (
                <span style={{ fontSize: 'var(--fs-eyebrow)', fontWeight: 600 }}>
                  RPE {set.rpe}
                </span>
              )}
              {set.isFailure && (
                <span style={{ fontSize: 'var(--fs-eyebrow)', fontWeight: 700, color: 'var(--danger)' }}>
                  Échec
                </span>
              )}
              {set.isPersonalRecord && (
                <span style={{ color: 'var(--accent)' }}>
                  <Icon name="bolt" size={16} />
                </span>
              )}
              {done ? (
                <span style={{ color: 'var(--accent)' }}>
                  <Icon name="check" size={18} strokeWidth={2.4} />
                </span>
              ) : (
                <span
                  role={active && onValidate ? 'button' : undefined}
                  aria-label={active && onValidate ? 'Valider la série' : undefined}
                  tabIndex={active && onValidate ? 0 : undefined}
                  onClick={
                    active && onValidate
                      ? (e) => { e.stopPropagation(); onValidate() }
                      : undefined
                  }
                  onKeyDown={
                    active && onValidate
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            onValidate()
                          }
                        }
                      : undefined
                  }
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: active && onValidate ? 'pointer' : 'default',
                  }}
                />
              )}
            </span>
          </button>
        )
      })}

      {sets.length === 0 && (
        <p className="t-caption">Aucune série — {TRACKING_LABEL[trackingType]}.</p>
      )}
    </div>
  )
}
