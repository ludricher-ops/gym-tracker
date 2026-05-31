import { useMemo, useRef } from 'react'
import type { WeightUnit } from '../../../types'
import { formatWeight } from '../../../utils/units'
import { shareOrCopy } from '../../../utils/feedback'
import { ACCENTS } from '../../../theme/accents'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { Button, Icon } from '../../ui'

export interface PRCelebration {
  exerciseName: string
  weightKg: number
  reps: number
  estimated1RM: number
  previousBest1RM: number
}

interface PRCelebrationOverlayProps {
  pr: PRCelebration
  weightUnit: WeightUnit
  onContinue: () => void
}

const CONFETTI_COLORS = [...ACCENTS.map((a) => a.accent), '#ffffff']

export function PRCelebrationOverlay({ pr, weightUnit, onContinue }: PRCelebrationOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onContinue) // Échap → continuer la séance

  // Confetti statique : positions/couleurs tirées une fois au montage.
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: 2 + Math.random() * 1.8,
        delay: Math.random() * 1.5,
      })),
    [],
  )

  const delta = pr.estimated1RM - pr.previousBest1RM
  const isFirst = pr.previousBest1RM <= 0

  const share = () => {
    const text = `Nouveau record sur ${pr.exerciseName} : ${formatWeight(
      pr.weightKg,
      weightUnit,
    )} × ${pr.reps} (1RM estimé ${pr.estimated1RM.toFixed(1)} kg) 💪`
    shareOrCopy(text)
  }

  return (
    <div ref={ref} className="gt-pr-overlay" role="dialog" aria-modal="true" aria-label="Nouveau record">
      {confetti.map((c) => (
        <span
          key={c.id}
          className="gt-confetti"
          style={{
            left: `${c.left}%`,
            background: c.color,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      <div className="gt-pr-halo">
        <Icon name="trophy" size={56} strokeWidth={1.8} />
      </div>

      <p className="t-eyebrow" style={{ color: 'var(--accent)' }}>
        Nouveau record
      </p>
      <p className="t-title" style={{ fontSize: 22 }}>
        {pr.exerciseName}
      </p>

      <div className="t-num" style={{ fontSize: 56, color: 'var(--accent)' }}>
        {formatWeight(pr.weightKg, weightUnit)} × {pr.reps}
      </div>

      <div className="gt-statrow" style={{ width: '100%', maxWidth: 320 }}>
        <div className="gt-stat">
          <div className="gt-stat__value" style={{ fontSize: 19 }}>
            {isFirst ? '—' : `${pr.previousBest1RM.toFixed(1)}`}
          </div>
          <div className="gt-stat__label">1RM précédent</div>
        </div>
        <div className="gt-stat">
          <div className="gt-stat__value" style={{ fontSize: 19, color: 'var(--accent)' }}>
            {pr.estimated1RM.toFixed(1)}
          </div>
          <div className="gt-stat__label">
            1RM estimé{!isFirst && delta > 0 ? ` (+${delta.toFixed(1)})` : ''}
          </div>
        </div>
      </div>

      <p className="t-caption" style={{ maxWidth: 280 }}>
        {isFirst
          ? 'Première performance enregistrée sur cet exercice — la barre est posée.'
          : 'Continue comme ça, la progression est au rendez-vous.'}
      </p>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button icon="check" onClick={onContinue}>
          Continuer la séance
        </Button>
        <Button variant="ghost" icon="share" onClick={share}>
          Partager
        </Button>
      </div>
    </div>
  )
}
