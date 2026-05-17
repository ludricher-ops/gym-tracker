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

function perfLabel(set: SetRecord, type: SetTableProps['trackingType'], unit: WeightUnit): string {
  if (type === 'time') return `${set.reps}s`
  if (type === 'reps_only') return `${set.reps} reps`
  return `${formatWeight(set.weightKg, unit)} × ${set.reps}`
}

export function SetTable({ sets, activeSetId, trackingType, weightUnit, onSelect, onValidate }: SetTableProps) {
  // Numérotation des séries de travail (l'échauffement ne compte pas).
  let work = 0
  const labels = sets.map((s) => (s.isWarmup ? 'Échauff.' : `Série ${++work}`))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sets.map((set, i) => {
        const done = set.completedAt != null
        const active = set.id === activeSetId
        const label = labels[i]
        return (
          <button
            key={set.id}
            type="button"
            className={`gt-set ${active ? 'gt-set--active' : ''} ${
              !done && !active ? 'gt-set--planned' : ''
            }`}
            onClick={() => onSelect(set.id)}
          >
            <span className="gt-set__idx">{label}</span>
            <span className="gt-set__perf">{perfLabel(set, trackingType, weightUnit)}</span>
            <span className="gt-set__mark">
              {set.rpe != null && (
                <span style={{ fontSize: 11, fontWeight: 600 }}>RPE {set.rpe}</span>
              )}
              {set.isFailure && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>
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
