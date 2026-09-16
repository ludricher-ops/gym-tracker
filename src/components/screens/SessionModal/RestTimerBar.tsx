import type { RestTimer } from '../../../hooks/useRestTimer'
import { formatClock } from '../../../utils/format'
import { Button, Card, ProgressBar } from '../../ui'

interface RestTimerBarProps {
  timer: RestTimer
}

/** Bandeau de repos : décompte mm:ss centré (56 px) + barre + actions Passer / +15 s. */
export function RestTimerBar({ timer }: RestTimerBarProps) {
  if (!timer.active) return null
  const done = timer.remainingSec === 0
  const progress = timer.targetSec > 0 ? timer.remainingSec / timer.targetSec : 0

  return (
    <Card variant="flat">
      <div style={{ textAlign: 'center' }} aria-live="polite">
        <div className="t-eyebrow">{done ? 'Repos terminé' : 'Repos'}</div>
        <div
          className="t-num"
          // 56 px : valeur spécifique timer — aucun token de la gamme ne couvre cette taille.
          style={{ fontSize: 56, lineHeight: 1.1, color: done ? 'var(--accent)' : 'var(--text)' }}
          role="timer"
          aria-label={`Repos : ${formatClock(timer.remainingSec)}`}
        >
          {formatClock(timer.remainingSec)}
        </div>
      </div>
      <div style={{ margin: '10px 0' }}>
        <ProgressBar value={progress} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={() => timer.addTime(15)}>
            +15 s
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button variant={done ? 'primary' : 'ghost'} onClick={timer.skip}>
            {done ? 'Continuer' : 'Passer'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
