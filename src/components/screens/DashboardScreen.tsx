import { useMemo, useState, useCallback } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import {
  startFreestyleSession, startSessionFromTemplate, recoverableSession,
} from '../../utils/sessionOps'
import { computeStreak } from '../../utils/streak'
import { statsForWeek, statsForPreviousWeek, weekDeltas } from '../../utils/stats'
import { localDayKey, startOfLocalDay } from '../../utils/dates'
import { formatDuration, formatVolume } from '../../utils/format'
import { generateSchedule, scheduleCard } from '../../utils/programSchedule'
import type { ScheduledSession } from '../../utils/programSchedule'
import { Button, Card, Icon, Row, StatTile } from '../ui'

const WEEK_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

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
  // entre deux runs du même programme. On filtre aussi par startedAt pour que
  // les sessions d'un run précédent ne comptent pas dans le run courant.
  const programSessions = useMemo(
    () => activeProgram
      ? endedSessions.filter(
          (s) =>
            s.programId === activeProgram.id &&
            (!activeProgram.startedAt || s.startedAt >= activeProgram.startedAt),
        )
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
  const ignoredBefore = activeProgram?.catchupIgnoredBefore ?? 0
  const now = Date.now()
  // Début du jour courant — les séances planifiées aujourd'hui ne sont jamais "ignorées"
  const startOfToday = startOfLocalDay(now).getTime()

  const progressCells = useMemo(() => {
    return schedule.map((s) => {
      const done =
        programSessions.some((cs) => cs.programSessionLabel === s.label) ||
        programSessions.some(
          (cs) =>
            cs.workoutTemplateId === s.workoutTemplateId &&
            localDayKey(cs.startedAt) === localDayKey(s.date),
        )
      // Une séance est "ignorée" seulement si elle est strictement avant aujourd'hui
      const ignored = !done && s.date.getTime() < startOfToday && ignoredBefore > 0 && s.date.getTime() < ignoredBefore
      return { label: s.label, workoutName: s.workoutName, date: s.date, done, ignored }
    })
  }, [schedule, programSessions, ignoredBefore, startOfToday])

  const progressDoneCount = useMemo(
    () => progressCells.filter((c) => c.done).length,
    [progressCells],
  )

  const [selectedCell, setSelectedCell] = useState<typeof progressCells[0] | null>(null)

  const handleCellClick = useCallback((cell: typeof progressCells[0]) => {
    setSelectedCell((prev) => (prev?.label === cell.label ? null : cell))
  }, [])

  const handleIgnoreCatchups = useCallback(async () => {
    if (!activeProgram) return
    await store.program.save({ ...activeProgram, catchupIgnoredBefore: startOfToday })
    setSelectedCell(null)
  }, [activeProgram, store, startOfToday])

  // Restaure une séance ignorée (et toutes les suivantes) en reculant catchupIgnoredBefore
  const handleRestoreCell = useCallback(async (cell: typeof progressCells[0]) => {
    if (!activeProgram) return
    await store.program.save({ ...activeProgram, catchupIgnoredBefore: cell.date.getTime() })
    setSelectedCell(null)
  }, [activeProgram, store])


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

  // Séances uniques du programme actif, triées lundi → dimanche.
  const programWorkouts = useMemo(() => {
    if (!activeProgram) return []
    const seen = new Set<string>()
    return WEEK_ORDER
      .map((day) => activeProgram.weekTemplate[day])
      .filter((id): id is string => !!id && !seen.has(id) && (seen.add(id), true))
      .map((id) => store.workoutTemplates.find((w) => w.id === id && !w.deleted))
      .filter((w): w is NonNullable<typeof w> => w != null)
  }, [activeProgram, store.workoutTemplates])

  // Filtre les rattrapages déjà ignorés
  const visibleMissed = useMemo(
    () => card.missedSessions.filter((s) => s.date.getTime() >= ignoredBefore),
    [card.missedSessions, ignoredBefore],
  )
  const hasMissedToIgnore = visibleMissed.length > 0

  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false)

  const startFromWorkout = async (wtId: string) => {
    const wt = store.workoutTemplates.find((w) => w.id === wtId)
    if (!wt) return
    setShowWorkoutPicker(false)
    openSession((await startSessionFromTemplate(wt, store)).id)
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
              {visibleMissed.map((s) => (
                <Button key={s.label} variant="ghost" icon="bolt" onClick={() => startScheduled(s)}>
                  {`Rattraper : ${s.workoutName}${visibleMissed.length > 1 ? ` · ${s.label}` : ''}`}
                </Button>
              ))}
              {hasMissedToIgnore && (
                <Button variant="ghost" icon="clock" onClick={handleIgnoreCatchups}>
                  Ignorer les rattrapages antérieurs
                </Button>
              )}
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
              {visibleMissed.map((s) => (
                <Button key={s.label} variant="ghost" icon="bolt" onClick={() => startScheduled(s)}>
                  {`Rattraper : ${s.workoutName}${visibleMissed.length > 1 ? ` · ${s.label}` : ''}`}
                </Button>
              ))}
              {hasMissedToIgnore && (
                <Button variant="ghost" icon="clock" onClick={handleIgnoreCatchups}>
                  Ignorer les rattrapages antérieurs
                </Button>
              )}
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

        {activeProgram && programWorkouts.length > 0 && (
          <>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowWorkoutPicker((v) => !v)}
            >
              <p className="t-eyebrow">Séances du programme</p>
              <span style={{ color: 'var(--muted)' }}>
                <Icon name={showWorkoutPicker ? 'chevron-up' : 'chevron-down'} size={14} />
              </span>
            </div>
            {showWorkoutPicker && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {programWorkouts.map((wt) => (
                  <Row
                    key={wt.id}
                    icon="dumbbell"
                    label={wt.name}
                    chevron
                    onClick={() => startFromWorkout(wt.id)}
                  />
                ))}
              </div>
            )}
          </>
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
              {progressCells.map((cell) => {
                const isSelected = selectedCell?.label === cell.label
                let bg: string
                if (cell.done) bg = 'var(--accent)'
                else if (cell.ignored) bg = 'var(--border)'
                else bg = 'var(--surface2)'
                return (
                  <button
                    key={cell.label}
                    type="button"
                    aria-label={`${cell.label} — ${cell.workoutName}`}
                    onClick={() => handleCellClick(cell)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: bg,
                      flexShrink: 0,
                      border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      padding: 0,
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )
              })}
            </div>
            {selectedCell && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface2)',
                fontSize: 13,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700 }}>
                    {selectedCell.workoutName}
                  </span>
                  <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                    · {selectedCell.label}
                  </span>
                  <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                    · {selectedCell.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ marginLeft: 6, color: selectedCell.done ? 'var(--accent)' : selectedCell.ignored ? 'var(--muted)' : 'var(--dim)' }}>
                    {selectedCell.done ? '✓ Faite' : selectedCell.ignored ? 'Ignorée' : 'À venir'}
                  </span>
                  {selectedCell.ignored && (
                    <button
                      type="button"
                      onClick={() => handleRestoreCell(selectedCell)}
                      style={{
                        marginLeft: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Restaurer
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0 }}
                  aria-label="Fermer"
                >×</button>
              </div>
            )}
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
