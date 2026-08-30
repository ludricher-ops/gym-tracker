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
  /**
   * 'list' (défaut) : séries empilées verticalement.
   * 'grid' : séries compactes en grille horizontale (idéal pour les supersets).
   */
  layout?: 'list' | 'grid'
}

function perfLabel(set: SetRecord, type: SetTableProps['trackingType'], unit: WeightUnit): string {
  if (type === 'time') return `${set.reps} s`
  if (type === 'reps_only') return `${set.reps} reps`
  return `${formatWeight(set.weightKg, unit)} × ${set.reps}`
}

/** Bouton/circle de validation réutilisé dans les deux layouts. */
function SetMark({
  set, active, onValidate,
}: { set: SetRecord; active: boolean; onValidate?: () => void }) {
  if (set.completedAt != null) {
    return (
      <span style={{ color: 'var(--accent)', lineHeight: 0 }}>
        <Icon name="check" size={16} strokeWidth={2.4} />
      </span>
    )
  }
  return (
    <span
      role={active && onValidate ? 'button' : undefined}
      aria-label={active && onValidate ? 'Valider la série' : undefined}
      tabIndex={active && onValidate ? 0 : undefined}
      onClick={active && onValidate ? (e) => { e.stopPropagation(); onValidate() } : undefined}
      onKeyDown={
        active && onValidate
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); e.stopPropagation(); onValidate()
              }
            }
          : undefined
      }
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: active && onValidate ? 'pointer' : 'default',
      }}
    />
  )
}

export function SetTable({
  sets, activeSetId, trackingType, weightUnit, onSelect, onValidate, layout = 'list',
}: SetTableProps) {
  let work = 0
  const labels = sets.map((s) => (s.isWarmup ? 'Échauff.' : `Série ${++work}`))

  if (sets.length === 0) {
    return <p className="t-caption">Aucune série — {TRACKING_LABEL[trackingType]}.</p>
  }

  // ── Layout vertical (défaut) ────────────────────────────────────────────────
  if (layout === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sets.map((set, i) => {
          const done = set.completedAt != null
          const active = set.id === activeSetId
          return (
            <button
              key={set.id}
              type="button"
              className={`gt-set ${active ? 'gt-set--active' : ''} ${
                !done && !active ? 'gt-set--planned' : ''
              }`}
              onClick={() => onSelect(set.id)}
            >
              <span className="gt-set__idx">{labels[i]}</span>
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
                              e.preventDefault(); e.stopPropagation(); onValidate()
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
      </div>
    )
  }

  // ── Layout grille compacte (supersets) ──────────────────────────────────────
  // Pré-calcul des labels courts (S1, S2… ou Éch.)
  let gridWork = 0
  const gridLabels = sets.map((s) => (s.isWarmup ? 'Éch.' : `S${++gridWork}`))

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
      }}
    >
      {sets.map((set, i) => {
        const done = set.completedAt != null
        const active = set.id === activeSetId
        const label = gridLabels[i]!

        return (
          <button
            key={set.id}
            type="button"
            onClick={() => onSelect(set.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 2,
              padding: '8px 10px',
              borderRadius: 10,
              border: active
                ? '1.5px solid var(--accent)'
                : done
                  ? '1px solid var(--border)'
                  : '1px solid var(--border)',
              background: active
                ? 'color-mix(in srgb, var(--accent) 8%, var(--surface))'
                : done
                  ? 'var(--surface2)'
                  : 'var(--surface)',
              cursor: 'pointer',
              textAlign: 'left',
              opacity: done && !active ? 0.75 : 1,
            }}
          >
            {/* Label */}
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: active ? 'var(--accent)' : 'var(--dim)',
              }}
            >
              {label}
            </span>

            {/* Performance */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {perfLabel(set, trackingType, weightUnit)}
            </span>

            {/* Statut + badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {set.isPersonalRecord && (
                  <span style={{ color: 'var(--accent)', lineHeight: 0 }}>
                    <Icon name="bolt" size={12} />
                  </span>
                )}
                {set.isFailure && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--danger)' }}>
                    Échec
                  </span>
                )}
              </div>
              <SetMark set={set} active={active} onValidate={onValidate} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
