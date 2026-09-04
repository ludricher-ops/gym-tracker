import { useCallback, useMemo } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { startSessionFromTemplate } from '../../utils/sessionOps'
import { generateSchedule, scheduleCard } from '../../utils/programSchedule'
import type { ScheduledSession } from '../../utils/programSchedule'
import { startOfLocalDay } from '../../utils/dates'
import { Button, Card, Icon } from '../ui'

export function RattrapagesScreen() {
  const store = useStore()
  const nav = useNavigation()

  const activeProgram = useMemo(
    () => store.programs.find((p) => p.isActive),
    [store.programs],
  )

  const endedSessions = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null).sort((a, b) => b.startedAt - a.startedAt),
    [store.sessions],
  )

  const schedule = useMemo(
    () => (activeProgram ? generateSchedule(activeProgram, store.workoutTemplates) : []),
    [activeProgram, store.workoutTemplates],
  )

  const programSessions = useMemo(
    () =>
      activeProgram
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

  const ignoredBefore = activeProgram?.catchupIgnoredBefore ?? 0
  const startOfToday = startOfLocalDay(Date.now()).getTime()

  const visibleMissed = useMemo(
    () => card.missedSessions.filter((s) => s.date.getTime() >= ignoredBefore),
    [card.missedSessions, ignoredBefore],
  )

  const handleIgnoreCatchups = useCallback(async () => {
    if (!activeProgram) return
    await store.program.save({ ...activeProgram, catchupIgnoredBefore: startOfToday })
    nav.back()
  }, [activeProgram, store, startOfToday, nav])

  const startScheduled = async (scheduled: ScheduledSession) => {
    const wt = store.workoutTemplates.find((w) => w.id === scheduled.workoutTemplateId)
    if (!wt) return
    const session = await startSessionFromTemplate(wt, store, scheduled.label)
    nav.openModal('session', { sessionId: session.id })
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Rattrapages</h1>
      </div>

      <div className="gt-screen__scroll">
        {visibleMissed.length === 0 ? (
          <Card>
            <p className="t-body" style={{ color: 'var(--muted)' }}>
              Aucun rattrapage en attente.
            </p>
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              {visibleMissed.map((s) => (
                <Card key={s.label}>
                  <p className="t-eyebrow" style={{ opacity: 0.7 }}>
                    {s.label} ·{' '}
                    {s.date.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--fs-title)',
                      marginTop: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.workoutName}
                  </p>
                  <div style={{ marginTop: 'var(--gap-tile)' }}>
                    <Button icon="bolt" onClick={() => startScheduled(s)}>
                      Rattraper cette séance
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ marginTop: 'var(--gap-tile)' }}>
              <Button variant="ghost" icon="clock" onClick={handleIgnoreCatchups}>
                Ignorer les rattrapages antérieurs
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
