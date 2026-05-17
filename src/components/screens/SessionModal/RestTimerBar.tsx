import type { RestTimer } from '../../../hooks/useRestTimer'
import { formatClock } from '../../../utils/format'
import { Button, Card, ProgressBar } from '../../ui'

interface RestTimerBarProps {
  timer: RestTimer
}

/** Bandeau de repos : décompte mm:ss + barre + actions Passer / +15 s. */
export function RestTimerBar({ timer }: RestTimerBarProps) {
  if (!timer.active) return null
  const done = timer.remainingSec === 0
  const progress = timer.targetSec > 0 ? timer.remainingSec / timer.targetSec : 0

  return (
    <Card variant="flat">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="t-eyebrow">{done ? 'Repos terminé' : 'Repos'}</span>
        <span
          className="t-num"
          style={{ fontSize: 34, color: done ? 'var(--accent)' : 'var(--text)' }}
        >
          {formatClock(timer.remainingSec)}
        </span>
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
