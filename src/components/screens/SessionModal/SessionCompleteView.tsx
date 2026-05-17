import { useMemo } from 'react'
import { useStore } from '../../../hooks/useStore'
import { buildSessionRecap } from '../../../utils/sessionRecap'
import { computeStreak } from '../../../utils/streak'
import { localDayKey } from '../../../utils/dates'
import { formatDuration, formatVolume } from '../../../utils/format'
import { Button, Card, Icon, PrimaryBar, StatTile } from '../../ui'

interface SessionCompleteViewProps {
  sessionId: string
  onHome: () => void
  onRecap: () => void
}

/** Écran de célébration affiché à la fin d'une séance (cahier 6.15). */
export function SessionCompleteView({ sessionId, onHome, onRecap }: SessionCompleteViewProps) {
  const store = useStore()
  const recap = useMemo(() => buildSessionRecap(sessionId, store), [sessionId, store])

  const streak = useMemo(() => {
    const days = store.sessions
      .filter((s) => s.endedAt != null)
      .map((s) => localDayKey(s.startedAt))
    return computeStreak(days)
  }, [store.sessions])

  if (!recap) {
    return (
      <div className="gt-screen__scroll">
        <p className="t-caption">Séance introuvable.</p>
        <Button onClick={onHome}>Accueil</Button>
      </div>
    )
  }

  return (
    <div className="gt-screen">
      <div className="gt-screen__scroll" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Icon name="check" size={44} strokeWidth={2.6} />
        </div>

        <p className="t-eyebrow" style={{ marginTop: 16 }}>
          Séance terminée
        </p>
        <p className="t-display">Beau boulot.</p>
        <p className="t-caption">{recap.session.name}</p>

        <div className="t-num" style={{ fontSize: 52, marginTop: 8 }}>
          {formatDuration(recap.durationSec)}
        </div>

        <div className="gt-statrow" style={{ width: '100%', marginTop: 12 }}>
          <StatTile label="Séries" value={String(recap.completedSets)} />
          <StatTile label="Volume" value={`${formatVolume(recap.totalVolumeKg)} kg`} />
          <StatTile label="Records" value={String(recap.prCount)} />
        </div>

        {recap.prCount > 0 && (
          <Card variant="accent" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bolt" size={22} />
              <span style={{ fontWeight: 700 }}>
                {recap.prCount} nouveau{recap.prCount > 1 ? 'x' : ''} record
                {recap.prCount > 1 ? 's' : ''} !
              </span>
            </div>
          </Card>
        )}

        {streak > 0 && (
          <Card variant="flat" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <Icon name="flame" size={20} />
              <span style={{ fontWeight: 600 }}>
                Streak de {streak} jour{streak > 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        )}
      </div>

      <PrimaryBar>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button icon="list" onClick={onRecap}>
            Voir le récap détaillé
          </Button>
          <Button variant="ghost" onClick={onHome}>
            Accueil
          </Button>
        </div>
      </PrimaryBar>
    </div>
  )
}
