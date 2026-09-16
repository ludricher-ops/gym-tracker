import type { RestTimer } from '../../../hooks/useRestTimer'
import { formatClock } from '../../../utils/format'
import { Button, Card, ProgressBar } from '../../ui'

interface RestTimerBarProps {
  timer: RestTimer
  /** Appelé quand l'utilisateur valide la série directement depuis l'écran de repos. */
  onValidate?: () => void
}

/** Bandeau de repos : décompte mm:ss centré (56 px) + barre + actions. */
export function RestTimerBar({ timer, onValidate }: RestTimerBarProps) {
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
      {done && onValidate ? (
        /* Repos terminé : valider directement ou revenir à la saisie */
        <>
          <Button
            icon="check"
            onClick={() => { timer.skip(); onValidate() }}
          >
            Valider la série →
          </Button>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <Button variant="secondary" onClick={() => timer.addTime(15)}>
                +15 s
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button variant="ghost" onClick={timer.skip}>
                Ajuster
              </Button>
            </div>
          </div>
        </>
      ) : (
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
      )}
    </Card>
  )
}
