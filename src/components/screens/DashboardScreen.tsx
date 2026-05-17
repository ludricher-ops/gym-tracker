import { useMemo } from 'react'
import type { Weekday } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import {
  startFreestyleSession, startSessionFromTemplate, recoverableSession,
} from '../../utils/sessionOps'
import { computeStreak } from '../../utils/streak'
import { statsForWeek, statsForPreviousWeek, weekDeltas } from '../../utils/stats'
import { localDayKey } from '../../utils/dates'
import { formatDuration, formatVolume } from '../../utils/format'
import { Button, Card, Icon, Row, StatTile } from '../ui'

const WEEKDAYS: Weekday[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export function DashboardScreen() {
  const store = useStore()
  const nav = useNavigation()

  const todayKey = WEEKDAYS[(new Date().getDay() + 6) % 7]
  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const weekStart = store.settings.preferences.weekStart

  const activeProgram = useMemo(
    () => store.programs.find((p) => p.isActive),
    [store.programs],
  )
  const todayWorkout = useMemo(() => {
    const wtId = activeProgram?.weekTemplate[todayKey]
    return wtId ? store.workoutTemplates.find((w) => w.id === wtId) : undefined
  }, [activeProgram, todayKey, store.workoutTemplates])

  const resumable = useMemo(() => recoverableSession(store), [store])

  const endedSessions = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null).sort((a, b) => b.startedAt - a.startedAt),
    [store.sessions],
  )

  const streak = useMemo(
    () => computeStreak(endedSessions.map((s) => localDayKey(s.startedAt))),
    [endedSessions],
  )

  const { current, deltas } = useMemo(() => {
    const cur = statsForWeek(endedSessions, Date.now(), weekStart)
    const prev = statsForPreviousWeek(endedSessions, Date.now(), weekStart)
    return { current: cur, deltas: weekDeltas(cur, prev) }
  }, [endedSessions, weekStart])

  const recent = endedSessions.slice(0, 3)

  const openSession = (id: string) => nav.openModal('session', { sessionId: id })
  const startTemplate = async () => {
    if (!todayWorkout) return
    openSession((await startSessionFromTemplate(todayWorkout, store)).id)
  }
  const startFree = async () => {
    openSession((await startFreestyleSession(store)).id)
  }

  const greeting = store.settings.firstName ? `Salut ${store.settings.firstName}` : 'Salut'

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">{dateLabel}</div>
          <div className="gt-topbar__title" style={{ fontSize: 22 }}>
            {greeting}
          </div>
        </div>
        {streak > 0 && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)' }}
            title="Jours consécutifs"
          >
            <Icon name="flame" size={20} />
            <span className="t-num" style={{ fontSize: 18 }}>
              {streak}
            </span>
          </div>
        )}
      </div>

      <div className="gt-screen__scroll">
        {resumable && (
          <Card variant="accent" onClick={() => openSession(resumable.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="bolt" size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>Reprendre la séance</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{resumable.name}</div>
              </div>
            </div>
          </Card>
        )}

        {!resumable && todayWorkout && (
          <Card>
            <p className="t-eyebrow">Séance du jour</p>
            <p className="t-title" style={{ marginTop: 4 }}>
              {todayWorkout.name}
            </p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              {activeProgram?.name}
            </p>
            <div style={{ marginTop: 12 }}>
              <Button icon="bolt" onClick={startTemplate}>
                Commencer la séance
              </Button>
            </div>
          </Card>
        )}

        {!resumable && activeProgram && !todayWorkout && (
          <Card>
            <p className="t-eyebrow">Jour de repos</p>
            <p className="t-title" style={{ marginTop: 4 }}>
              Récupération
            </p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              Aucune séance prévue aujourd&apos;hui.
            </p>
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" icon="plus" onClick={startFree}>
                Séance libre
              </Button>
            </div>
          </Card>
        )}

        {!resumable && !activeProgram && (
          <Card>
            <p className="t-eyebrow">Pas de programme actif</p>
            <p className="t-title" style={{ marginTop: 4 }}>
              Démarrer une séance libre
            </p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              Active un programme depuis l&apos;onglet Profil, ou lance une séance libre.
            </p>
            <div style={{ marginTop: 12 }}>
              <Button icon="bolt" onClick={startFree}>
                Séance libre
              </Button>
            </div>
          </Card>
        )}

        <p className="t-eyebrow">Cette semaine</p>
        <div className="gt-statrow">
          <StatTile
            label="Séances"
            value={String(current.sessions)}
            delta={deltas.sessions}
          />
          <StatTile
            label="Volume"
            value={`${formatVolume(current.volumeKg)} kg`}
          />
          <StatTile label="Temps" value={formatDuration(current.timeSec)} />
        </div>

        {recent.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ marginTop: 6 }}>
              Séances récentes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map((s) => (
                <Row
                  key={s.id}
                  icon="dumbbell"
                  label={s.name}
                  sub={new Date(s.startedAt).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  value={`${formatVolume(s.totalVolumeKg ?? 0)} kg`}
                  chevron
                  onClick={() => nav.navigate('sessionRecap', { sessionId: s.id })}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
