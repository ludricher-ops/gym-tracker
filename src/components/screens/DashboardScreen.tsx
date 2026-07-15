import { useMemo } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import {
  startFreestyleSession, startSessionFromTemplate, recoverableSession,
} from '../../utils/sessionOps'
import { computeStreak } from '../../utils/streak'
import { statsForWeek, statsForPreviousWeek, weekDeltas } from '../../utils/stats'
import { localDayKey } from '../../utils/dates'
import { formatDuration, formatVolume } from '../../utils/format'
import { generateSchedule, scheduleCard } from '../../utils/programSchedule'
import type { ScheduledSession } from '../../utils/programSchedule'
import { Button, Card, Icon, Row, StatTile } from '../ui'

export function DashboardScreen() {
  const store = useStore()
  const nav = useNavigation()

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

  const resumable = useMemo(() => recoverableSession(store), [store])

  const endedSessions = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null).sort((a, b) => b.startedAt - a.startedAt),
    [store.sessions],
  )

  const schedule = useMemo(
    () => activeProgram ? generateSchedule(activeProgram, store.workoutTemplates) : [],
    [activeProgram, store.workoutTemplates],
  )

  // Sessions du programme actif uniquement — évite les collisions de labels
  // entre deux runs du même programme (findCompleted sans filtre programId).
  const programSessions = useMemo(
    () => activeProgram
      ? endedSessions.filter((s) => s.programId === activeProgram.id)
      : endedSessions,
    [endedSessions, activeProgram],
  )

  const card = useMemo(
    () => scheduleCard(schedule, programSessions, Date.now()),
    [schedule, programSessions],
  )

  const streak = useMemo(
    () => computeStreak(endedSessions.map((s) => localDayKey(s.startedAt))),
    [endedSessions],
  )

  // ── Progression du programme ─────────────────────────────────────────
  const progressCells = useMemo(() => {
    return schedule.map((s) => {
      const done =
        programSessions.some((cs) => cs.programSessionLabel === s.label) ||
        programSessions.some(
          (cs) =>
            cs.workoutTemplateId === s.workoutTemplateId &&
            localDayKey(cs.startedAt) === localDayKey(s.date),
        )
      return { label: s.label, workoutName: s.workoutName, done }
    })
  }, [schedule, programSessions])

  const progressDoneCount = useMemo(
    () => progressCells.filter((c) => c.done).length,
    [progressCells],
  )


  const { current, deltas } = useMemo(() => {
    const cur = statsForWeek(endedSessions, Date.now(), weekStart)
    const prev = statsForPreviousWeek(endedSessions, Date.now(), weekStart)
    return { current: cur, deltas: weekDeltas(cur, prev) }
  }, [endedSessions, weekStart])

  const recent = endedSessions.slice(0, 3)

  const openSession = (id: string) => nav.openModal('session', { sessionId: id })
  const startFree = async () => openSession((await startFreestyleSession(store)).id)

  const startScheduled = async (scheduled: ScheduledSession) => {
    const wt = store.workoutTemplates.find((w) => w.id === scheduled.workoutTemplateId)
    if (!wt) return
    openSession((await startSessionFromTemplate(wt, store, scheduled.label)).id)
  }

  const greeting = store.settings.firstName ? `Salut ${store.settings.firstName}` : 'Salut'

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">{dateLabel}</div>
          <h1 className="gt-topbar__title" style={{ fontSize: 22 }}>
            {greeting}
          </h1>
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

        {!resumable && activeProgram && card.type === 'done_today' && card.todaySession && (
          <Card variant="accent">
            <p className="t-eyebrow">Séance du jour terminée</p>
            <p className="t-title" style={{ marginTop: 4 }}>{card.todaySession.workoutName}</p>
            <p className="t-caption" style={{ marginTop: 2 }}>{card.todaySession.label}</p>
            {card.completedSession && (
              <div className="gt-statrow" style={{ marginTop: 10 }}>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {formatDuration(card.completedSession.durationSec ?? 0)}
                  </div>
                  <div className="gt-stat__label">Durée</div>
                </div>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {formatVolume(card.completedSession.totalVolumeKg ?? 0)} kg
                  </div>
                  <div className="gt-stat__label">Volume</div>
                </div>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {card.completedSession.completedSets}
                  </div>
                  <div className="gt-stat__label">Séries</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="secondary" icon="plus" onClick={startFree}>
                Ajouter une séance libre
              </Button>
              {card.missedSessions.map((s) => (
                <Button key={s.label} variant="ghost" icon="bolt" onClick={() => startScheduled(s)}>
                  {`Rattraper : ${s.workoutName}${card.missedSessions.length > 1 ? ` · ${s.label}` : ''}`}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {!resumable && activeProgram && card.type === 'done_early' && card.todaySession && (
          <Card variant="accent">
            <p className="t-eyebrow">Séance en avance terminée</p>
            <p className="t-title" style={{ marginTop: 4 }}>{card.todaySession.workoutName}</p>
            <p className="t-caption" style={{ marginTop: 2 }}>{card.todaySession.label}</p>
            {card.completedSession && (
              <div className="gt-statrow" style={{ marginTop: 10 }}>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {formatDuration(card.completedSession.durationSec ?? 0)}
                  </div>
                  <div className="gt-stat__label">Durée</div>
                </div>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {formatVolume(card.completedSession.totalVolumeKg ?? 0)} kg
                  </div>
                  <div className="gt-stat__label">Volume</div>
                </div>
                <div className="gt-stat">
                  <div className="gt-stat__value" style={{ fontSize: 17 }}>
                    {card.completedSession.completedSets}
                  </div>
                  <div className="gt-stat__label">Séries</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" icon="plus" onClick={startFree}>
                Ajouter une séance libre
              </Button>
            </div>
          </Card>
        )}

        {!resumable && activeProgram && card.type === 'scheduled' && card.todaySession && (
          <Card>
            <p className="t-eyebrow">Séance du jour · {card.todaySession.label}</p>
            <p className="t-title" style={{ marginTop: 4 }}>{card.todaySession.workoutName}</p>
            <p className="t-caption" style={{ marginTop: 2 }}>{activeProgram.name}</p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button icon="bolt" onClick={() => startScheduled(card.todaySession!)}>
                Commencer la séance
              </Button>
              {card.missedSessions.map((s) => (
                <Button key={s.label} variant="ghost" icon="bolt" onClick={() => startScheduled(s)}>
                  {`Rattraper : ${s.workoutName}${card.missedSessions.length > 1 ? ` · ${s.label}` : ''}`}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {!resumable && activeProgram && card.type === 'missed' && card.missedSessions.length > 0 && (
          <Card>
            <p className="t-eyebrow">Jour de repos</p>
            <p className="t-title" style={{ marginTop: 4 }}>Récupération</p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              Aucune séance prévue aujourd&apos;hui dans «&nbsp;{activeProgram.name}&nbsp;».
            </p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {card.missedSessions.map((s, i) => (
                <Button
                  key={s.label}
                  variant={i === 0 ? 'primary' : 'ghost'}
                  icon="bolt"
                  onClick={() => startScheduled(s)}
                >
                  {`Rattraper : ${s.workoutName}${card.missedSessions.length > 1 ? ` · ${s.label}` : ''}`}
                </Button>
              ))}
              <Button variant="secondary" icon="plus" onClick={startFree}>
                Séance libre
              </Button>
            </div>
          </Card>
        )}

        {!resumable && activeProgram && card.type === 'early' && card.nextSession && (
          <Card>
            <p className="t-eyebrow">Jour de repos</p>
            <p className="t-title" style={{ marginTop: 4 }}>Récupération</p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              Aucune séance prévue aujourd&apos;hui dans «&nbsp;{activeProgram.name}&nbsp;».
            </p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button icon="bolt" onClick={() => startScheduled(card.nextSession!)}>
                Commencer la séance en avance : {card.nextSession!.workoutName}
              </Button>
              <Button variant="secondary" icon="plus" onClick={startFree}>
                Séance libre
              </Button>
            </div>
          </Card>
        )}

        {!resumable && activeProgram && card.type === 'rest_done' && (
          <Card>
            <p className="t-eyebrow">
              {schedule.length > 0 ? 'Programme terminé' : 'Jour de repos'}
            </p>
            <p className="t-title" style={{ marginTop: 4 }}>
              {schedule.length > 0 ? activeProgram.name : 'Récupération'}
            </p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              {schedule.length > 0
                ? 'Toutes les séances sont complètes. Bravo !'
                : `Aucune séance prévue aujourd'hui dans « ${activeProgram.name} ».`}
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

        {activeProgram && schedule.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p className="t-eyebrow">Avancement</p>
              <span className="t-num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {progressDoneCount} / {schedule.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {progressCells.map((cell) => (
                <div
                  key={cell.label}
                  title={`${cell.label} — ${cell.workoutName}`}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: cell.done ? 'var(--accent)' : 'var(--surface2)',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </>
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
                  value={`${formatVolume(s.totalVolumeKg ?? 0)} kg · ${formatDuration(s.durationSec ?? 0)}`}
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
