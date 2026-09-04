import { useMemo, useRef } from 'react'
import type { WeightUnit } from '../../../types'
import { formatWeight } from '../../../utils/units'
import { shareOrCopy } from '../../../utils/feedback'
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

// Confettis : accent courant + blanc uniquement.
const CONFETTI_COLORS = ['var(--accent)', '#ffffff']

export function PRCelebrationOverlay({ pr, weightUnit, onContinue }: PRCelebrationOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onContinue) // Échap → continuer la séance

  // Confetti statique : positions/couleurs tirées une fois au montage.
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
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
      <p className="t-title" style={{ fontSize: 'var(--fs-title)' }}>
        {pr.exerciseName}
      </p>

      <div className="t-num" style={{ fontSize: 56, color: 'var(--accent)' }}>
        {formatWeight(pr.weightKg, weightUnit)} × {pr.reps}
      </div>

      {/* Bloc avant → après avec delta accent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%', maxWidth: 320, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="t-eyebrow" style={{ color: 'var(--muted)', marginBottom: 4 }}>Avant</div>
          <div className="t-num" style={{ fontSize: 'var(--fs-title)' }}>
            {isFirst ? '—' : pr.previousBest1RM.toFixed(1)}
          </div>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>1RM kg</div>
        </div>

        <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-title)' }}>→</div>

        <div style={{ textAlign: 'center' }}>
          <div className="t-eyebrow" style={{ color: 'var(--muted)', marginBottom: 4 }}>Après</div>
          <div className="t-num" style={{ fontSize: 'var(--fs-title)', color: 'var(--accent)' }}>
            {pr.estimated1RM.toFixed(1)}
          </div>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>1RM kg</div>
        </div>
      </div>

      {/* Delta mis en avant à var(--fs-title) en accent */}
      {!isFirst && delta > 0 && (
        <div className="t-num" style={{ fontSize: 'var(--fs-title)', color: 'var(--accent)', fontWeight: 700 }}>
          +{delta.toFixed(1)} kg
        </div>
      )}

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
