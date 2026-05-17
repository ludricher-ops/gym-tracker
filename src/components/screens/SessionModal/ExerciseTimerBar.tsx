import type { RestTimer } from '../../../hooks/useRestTimer'
import { formatClock } from '../../../utils/format'
import { Button, Card, ProgressBar } from '../../ui'

interface ExerciseTimerBarProps {
  timer: RestTimer
  onValidate: () => void
}

/** Bandeau de compte à rebours pour les exercices de type « temps ». */
export function ExerciseTimerBar({ timer, onValidate }: ExerciseTimerBarProps) {
  if (!timer.active) return null
  const done = timer.remainingSec === 0
  const progress = timer.targetSec > 0 ? 1 - timer.remainingSec / timer.targetSec : 1

  return (
    <Card variant="flat">
      <div
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}
        aria-live="polite"
      >
        <span className="t-eyebrow">{done ? 'Temps terminé !' : 'Exercice en cours'}</span>
        <span
          className="t-num"
          style={{ fontSize: 34, color: done ? 'var(--accent)' : 'var(--text)' }}
          role="timer"
          aria-label={`Durée : ${formatClock(timer.remainingSec)}`}
        >
          {formatClock(timer.remainingSec)}
        </span>
      </div>
      <div style={{ margin: '10px 0' }}>
        <ProgressBar value={progress} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={timer.skip}>
            Arrêter
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button variant={done ? 'primary' : 'ghost'} onClick={onValidate}>
            {done ? 'Valider' : `Valider · ${formatClock(timer.remainingSec)}`}
          </Button>
        </div>
      </div>
    </Card>
  )
}
