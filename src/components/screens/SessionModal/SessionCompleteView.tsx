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

  const { session } = recap

  return (
    <div className="gt-screen">
      <div className="gt-screen__scroll" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div
          className="gt-complete-circle"
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

        {/* Beau boulot en eyebrow, nom de séance en display */}
        <p className="t-eyebrow" style={{ marginTop: 16 }}>Beau boulot.</p>
        <p style={{ fontWeight: 700, fontSize: 'var(--fs-display)', lineHeight: 1.15, marginTop: 4 }}>
          {session.name}
        </p>
        {session.programWeek != null && (
          <p className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
            Semaine {session.programWeek}
          </p>
        )}

        {/* Durée hero — taille volontairement large (pas de token pour 52px) */}
        <div className="t-num" style={{ fontSize: 52, marginTop: 8 }}>
          {formatDuration(recap.durationSec).replace(/:\d{2}$/, '')}
        </div>

        <div className="gt-statrow" style={{ width: '100%', marginTop: 12 }}>
          <StatTile label="Séries" value={String(recap.completedSets)} />
          <StatTile label="Volume kg" value={formatVolume(recap.totalVolumeKg)} />
          {recap.prCount > 0 && (
            <StatTile label="Records" value={String(recap.prCount)} />
          )}
        </div>

        {/* Faits : PR et streak */}
        {recap.prCount > 0 && (
          <Card variant="flat" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent)' }}><Icon name="bolt" size={18} /></span>
                <span style={{ fontWeight: 600 }}>
                  Record{recap.prCount > 1 ? 's' : ''} personnel{recap.prCount > 1 ? 's' : ''}
                </span>
              </div>
              <span className="t-num" style={{ fontSize: 'var(--fs-title)', color: 'var(--accent)' }}>
                {recap.prCount}
              </span>
            </div>
          </Card>
        )}
        {streak > 0 && (
          <Card variant="flat" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent)' }}><Icon name="flame" size={18} /></span>
                <span style={{ fontWeight: 600 }}>Streak</span>
              </div>
              <span className="t-num" style={{ fontSize: 'var(--fs-title)' }}>
                {streak} j.
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
