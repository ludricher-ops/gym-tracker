import { useMemo, useState, useCallback } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import {
  startSessionFromTemplate, recoverableSession,
} from '../../utils/sessionOps'
import { computeStreak } from '../../utils/streak'
import { statsForWeek, statsForPreviousWeek, weekDeltas } from '../../utils/stats'
import { localDayKey, startOfLocalDay } from '../../utils/dates'
import { formatDuration } from '../../utils/format'
import { generateSchedule, scheduleCard } from '../../utils/programSchedule'
import type { ScheduledSession } from '../../utils/programSchedule'
import { buildPhases } from '../../utils/programGenerator'
import type { DraftPhase } from '../programBuilder/programDraft'
import { Button, Card, Icon, Pill, Row, SectionHeader, StatTile } from '../ui'
import type { WorkoutTemplate, WorkoutType } from '../../types'

const WORKOUT_FILTER: { key: WorkoutType | 'all'; label: string }[] = [
  { key: 'all',      label: 'Tous'      },
  { key: 'push',     label: 'Push'      },
  { key: 'pull',     label: 'Pull'      },
  { key: 'legs',     label: 'Legs'      },
  { key: 'upper',    label: 'Upper'     },
  { key: 'lower',    label: 'Lower'     },
  { key: 'fullbody', label: 'Full body' },
]

// Couleurs et labels des phases de périodisation
const PHASE_COLORS: Record<DraftPhase['focus'], string> = {
  adaptation:      'var(--accent)',
  progression:     '#5b9dff',
  intensification: '#ff8a3d',
  deload:          'var(--fg-muted)',
}
const PHASE_EMOJI: Record<DraftPhase['focus'], string> = {
  adaptation:      '🌱',
  progression:     '📈',
  intensification: '🔥',
  deload:          '🔄',
}

/** Abréviation du volume : ≥ 1000 kg → "4,8k", sinon chiffre entier. */
function abbrevVol(kg: number): string {
  if (kg >= 1000) {
    return (kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + 'k'
  }
  return String(Math.round(kg))
}


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

  // ── Phase de périodisation courante ─────────────────────────────────
  const programPhases = useMemo(
    () => (activeProgram ? buildPhases(activeProgram.durationWeeks) : undefined),
    [activeProgram],
  )

  /** Numéro de semaine actuel dans le programme (1-based). null si pas de startedAt. */
  const currentWeekNumber = useMemo(() => {
    if (!activeProgram?.startedAt) return null
    return Math.max(1, Math.ceil((Date.now() - activeProgram.startedAt) / (7 * 24 * 60 * 60 * 1000)))
  }, [activeProgram?.startedAt])

  const currentPhase = useMemo((): DraftPhase | null => {
    if (!currentWeekNumber || !programPhases) return null
    return programPhases.find(
      (p) => p.weekStart <= currentWeekNumber && currentWeekNumber <= p.weekEnd,
    ) ?? null
  }, [currentWeekNumber, programPhases])

  // ── Progression du programme ─────────────────────────────────────────
  const ignoredBefore = activeProgram?.catchupIgnoredBefore ?? 0
  const now = Date.now()
  const startOfToday = startOfLocalDay(now).getTime()
  const todayKey = localDayKey(now)

  const progressCells = useMemo(() => {
    return schedule.map((s) => {
      const done =
        programSessions.some((cs) => cs.programSessionLabel === s.label) ||
        programSessions.some(
          (cs) =>
            cs.workoutTemplateId === s.workoutTemplateId &&
            localDayKey(cs.startedAt) === localDayKey(s.date),
        )
      const ignored = !done && s.date.getTime() < startOfToday && ignoredBefore > 0 && s.date.getTime() < ignoredBefore
      return { label: s.label, workoutName: s.workoutName, date: s.date, workoutTemplateId: s.workoutTemplateId, done, ignored }
    })
  }, [schedule, programSessions, ignoredBefore, startOfToday])

  const progressDoneCount = useMemo(
    () => progressCells.filter((c) => c.done).length,
    [progressCells],
  )

  // Grouper les cellules par semaine (S1, S2…) — label format "S1.01".
  const progressByWeek = useMemo(() => {
    const map = new Map<string, typeof progressCells>()
    for (const cell of progressCells) {
      const week = cell.label.split('.')[0] ?? cell.label
      const arr = map.get(week) ?? []
      arr.push(cell)
      map.set(week, arr)
    }
    return [...map.entries()]
  }, [progressCells])

  const [selectedCell, setSelectedCell] = useState<typeof progressCells[0] | null>(null)

  const handleCellClick = useCallback((cell: typeof progressCells[0]) => {
    setSelectedCell((prev) => (prev?.label === cell.label ? null : cell))
  }, [])


  const handleRestoreCell = useCallback(async (cell: typeof progressCells[0]) => {
    if (!activeProgram) return
    await store.program.save({ ...activeProgram, catchupIgnoredBefore: cell.date.getTime() })
    setSelectedCell(null)
  }, [activeProgram, store])

  // Stats de la semaine en cours
  const { current, deltas } = useMemo(() => {
    const cur = statsForWeek(endedSessions, Date.now(), weekStart)
    const prev = statsForPreviousWeek(endedSessions, Date.now(), weekStart)
    return { current: cur, deltas: weekDeltas(cur, prev) }
  }, [endedSessions, weekStart])

  // Exercices de la séance du jour planifiée (pour la stat EXOS/SÉRIES/DURÉE)
  const scheduledWets = useMemo(() => {
    if (!card.todaySession) return []
    return store.workoutExerciseTemplates.filter(
      (wet) => wet.workoutTemplateId === card.todaySession!.workoutTemplateId && !wet.deleted && !wet.isWarmup,
    )
  }, [card.todaySession, store.workoutExerciseTemplates])
  const scheduledExos = scheduledWets.length
  const scheduledSeries = scheduledWets.reduce((sum, wet) => sum + wet.targetSets, 0)
  const scheduledDurMin = Math.ceil(scheduledSeries * 3.5)


  const openSession = (id: string) => nav.openModal('session', { sessionId: id })

  const startScheduled = async (scheduled: ScheduledSession) => {
    const wt = store.workoutTemplates.find((w) => w.id === scheduled.workoutTemplateId)
    if (!wt) return
    openSession((await startSessionFromTemplate(wt, store, scheduled.label)).id)
  }

  const visibleMissed = useMemo(
    () => card.missedSessions.filter((s) => s.date.getTime() >= ignoredBefore),
    [card.missedSessions, ignoredBefore],
  )

  const [showSeancesPicker, setShowSeancesPicker] = useState(false)
  const [seancesTypeFilter, setSeancesTypeFilter] = useState<WorkoutType | 'all'>('all')

  const startFromWorkout = async (wtId: string) => {
    const wt = store.workoutTemplates.find((w) => w.id === wtId)
    if (!wt) return
    setShowSeancesPicker(false)
    openSession((await startSessionFromTemplate(wt, store)).id)
  }

  const startNamedFreestyle = async (name: string) => {
    setShowSeancesPicker(false)
    const session = await store.session.save({
      id: crypto.randomUUID(),
      name,
      startedAt: Date.now(),
      totalSets: 0,
      completedSets: 0,
    })
    openSession(session.id)
  }

  /** Toutes les séances (workout templates) non supprimées. */
  const allWorkouts = useMemo(
    () => store.workoutTemplates.filter((w) => !w.deleted),
    [store.workoutTemplates],
  )

  type SeanceGroup = {
    programId: string
    label: string
    isTemplate: boolean
    isActive: boolean
    isLibre: boolean
    workouts: WorkoutTemplate[]
  }

  const seanceGroups = useMemo((): SeanceGroup[] => {
    const visible = seancesTypeFilter === 'all'
      ? allWorkouts
      : allWorkouts.filter((w) => w.type === seancesTypeFilter)

    const byProg = new Map<string, WorkoutTemplate[]>()
    for (const wt of visible) {
      const arr = byProg.get(wt.programId) ?? []
      arr.push(wt)
      byProg.set(wt.programId, arr)
    }

    const groups: SeanceGroup[] = []
    for (const [progId, workouts] of byProg) {
      const prog = store.programs.find((p) => p.id === progId)
      if (!prog) continue
      const isLibre = prog.name === '__libre__'
      groups.push({
        programId: progId,
        label: isLibre ? 'Mes séances' : prog.name,
        isTemplate: prog.isTemplate,
        isActive: prog.isActive,
        isLibre,
        workouts,
      })
    }

    groups.sort((a, b) => {
      if (a.isLibre !== b.isLibre) return a.isLibre ? -1 : 1
      if (a.isTemplate !== b.isTemplate) return a.isTemplate ? 1 : -1
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.label.localeCompare(b.label, 'fr')
    })

    return groups
  }, [allWorkouts, seancesTypeFilter, store.programs])

  const greeting = store.settings.firstName ? `Salut ${store.settings.firstName}` : 'Salut'


  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">{dateLabel}</div>
          <h1 className="gt-topbar__title" style={{ fontSize: 'var(--fs-title)' }}>
            {greeting}
          </h1>
        </div>
        {streak > 0 && (
          /* Chip streak compact : icône flamme + nombre + JOURS, layout horizontal */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--gap-tile)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--gap-tile)',
            }}
            title="Jours consécutifs"
          >
            <div style={{ color: 'var(--accent)', display: 'flex' }}>
              <Icon name="flame" size={20} />
            </div>
            <div>
              <div className="t-num gt-stat__label" style={{ lineHeight: 1 }}>{streak}</div>
              <div className="gt-stat__label">JOURS</div>
            </div>
          </div>
        )}
      </div>

      <div className="gt-screen__scroll">
        {/* ── Reprendre séance en cours ──────────────────────────────── */}
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

        {/* ── Séance du jour planifiée ────────────────────────────────── */}
        {!resumable && activeProgram && card.type === 'scheduled' && card.todaySession && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>{card.todaySession.label} · {activeProgram.name}</span>
              {currentPhase && (
                <span style={{
                  background: 'color-mix(in oklch, var(--accent-ink) 15%, transparent)',
                  color: 'var(--accent-ink)',
                  borderRadius: 4, padding: '1px 6px',
                  fontWeight: 700, fontSize: 10, letterSpacing: '0.04em',
                }}>
                  {PHASE_EMOJI[currentPhase.focus]} {currentPhase.name.toUpperCase()}
                </span>
              )}
            </p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-display)', lineHeight: 1.15, marginTop: 4 }}>
              {card.todaySession.workoutName}
            </p>
            {scheduledExos > 0 && (
              <div className="gt-statrow" style={{ marginTop: 'var(--gap-tile)' }}>
                {/* 75 % accent + 25 % accent-ink → vert olive assorti, légèrement plus sombre */}
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>{scheduledExos}</div>
                  <div className="gt-stat__label">EXOS</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>{scheduledSeries}</div>
                  <div className="gt-stat__label">SÉRIES</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>~{scheduledDurMin}&apos;</div>
                  <div className="gt-stat__label">DURÉE</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 'var(--gap-tile)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              <Button
                icon="bolt"
                variant="secondary"
                onClick={() => startScheduled(card.todaySession!)}
              >
                Commencer la séance
              </Button>
              <Button
                icon="dumbbell"
                variant="secondary"
                onClick={() => setShowSeancesPicker(true)}
              >
                Mes séances
              </Button>
            </div>
          </Card>
        )}

        {/* ── Rattrapages en attente : Row cliquable → écran dédié */}
        {!resumable && activeProgram && card.type === 'scheduled' && visibleMissed.length > 0 && (
          <Row
            icon="clock"
            label={`${visibleMissed.length} rattrapage${visibleMissed.length > 1 ? 's' : ''} en attente`}
            sub={visibleMissed.length <= 2
              ? visibleMissed.map((s) => `${s.workoutName} · ${s.label}`).join(' — ')
              : undefined}
            chevron
            onClick={() => nav.navigate('rattrapages')}
          />
        )}

        {/* ── Séance du jour terminée ──────────────────────────────────── */}
        {!resumable && activeProgram && card.type === 'done_today' && card.todaySession && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8 }}>Séance du jour terminée</p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-title)', marginTop: 4 }}>
              {card.todaySession.workoutName}
            </p>
            <p className="t-caption" style={{ marginTop: 2, opacity: 0.8 }}>{card.todaySession.label}</p>
            {card.completedSession && (
              <div className="gt-statrow" style={{ marginTop: 'var(--gap-tile)' }}>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {formatDuration(card.completedSession.durationSec ?? 0).replace(/:\d{2}$/, '')}
                  </div>
                  <div className="gt-stat__label">DURÉE</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {abbrevVol(card.completedSession.totalVolumeKg ?? 0)}
                  </div>
                  <div className="gt-stat__label">VOLUME KG</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {card.completedSession.completedSets}
                  </div>
                  <div className="gt-stat__label">SÉRIES</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 'var(--gap-tile)' }}>
              <Button icon="dumbbell" variant="secondary" onClick={() => setShowSeancesPicker(true)}>
                Mes séances
              </Button>
            </div>
          </Card>
        )}

        {/* Rattrapages en attente sous done_today */}
        {!resumable && activeProgram && card.type === 'done_today' && visibleMissed.length > 0 && (
          <Row
            icon="clock"
            label={`${visibleMissed.length} rattrapage${visibleMissed.length > 1 ? 's' : ''} en attente`}
            sub={visibleMissed.length <= 2
              ? visibleMissed.map((s) => `${s.workoutName} · ${s.label}`).join(' — ')
              : undefined}
            chevron
            onClick={() => nav.navigate('rattrapages')}
          />
        )}

        {/* ── Séance en avance terminée ──────────────────────────────── */}
        {!resumable && activeProgram && card.type === 'done_early' && card.todaySession && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8 }}>Séance en avance terminée</p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-title)', marginTop: 4 }}>
              {card.todaySession.workoutName}
            </p>
            <p className="t-caption" style={{ marginTop: 2, opacity: 0.8 }}>{card.todaySession.label}</p>
            {card.completedSession && (
              <div className="gt-statrow" style={{ marginTop: 'var(--gap-tile)' }}>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {formatDuration(card.completedSession.durationSec ?? 0).replace(/:\d{2}$/, '')}
                  </div>
                  <div className="gt-stat__label">DURÉE</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {abbrevVol(card.completedSession.totalVolumeKg ?? 0)}
                  </div>
                  <div className="gt-stat__label">VOLUME KG</div>
                </div>
                <div className="gt-stat" style={{ background: 'color-mix(in oklch, var(--accent) 75%, var(--accent-ink))', border: 'none' }}>
                  <div className="gt-stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                    {card.completedSession.completedSets}
                  </div>
                  <div className="gt-stat__label">SÉRIES</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 'var(--gap-tile)' }}>
              <Button icon="dumbbell" variant="secondary" onClick={() => setShowSeancesPicker(true)}>
                Mes séances
              </Button>
            </div>
          </Card>
        )}

        {/* ── Jour de repos avec rattrapages ──────────────────────────── */}
        {!resumable && activeProgram && card.type === 'missed' && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8 }}>Jour de repos</p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-display)', lineHeight: 1.15, marginTop: 4 }}>Récupération</p>
            <div style={{ marginTop: 'var(--gap-tile)' }}>
              <Button icon="dumbbell" variant="secondary" onClick={() => setShowSeancesPicker(true)}>
                Mes séances
              </Button>
            </div>
          </Card>
        )}
        {!resumable && activeProgram && card.type === 'missed' && visibleMissed.length > 0 && (
          <Row
            icon="clock"
            label={`${visibleMissed.length} rattrapage${visibleMissed.length > 1 ? 's' : ''} en attente`}
            sub={visibleMissed.length <= 2
              ? visibleMissed.map((s) => `${s.workoutName} · ${s.label}`).join(' — ')
              : undefined}
            chevron
            onClick={() => nav.navigate('rattrapages')}
          />
        )}

        {/* ── Jour de repos — séance en avance possible ──────────────── */}
        {!resumable && activeProgram && card.type === 'early' && card.nextSession && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8 }}>Jour de repos</p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-display)', lineHeight: 1.15, marginTop: 4 }}>Récupération</p>
            <div style={{ marginTop: 'var(--gap-tile)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              <Button variant="secondary" icon="bolt" onClick={() => startScheduled(card.nextSession!)}>
                Commencer {card.nextSession!.workoutName} en avance
              </Button>
              <Button icon="dumbbell" variant="secondary" onClick={() => setShowSeancesPicker(true)}>
                Mes séances
              </Button>
            </div>
          </Card>
        )}

        {/* ── Programme terminé / repos sans rattrapage ────────────────── */}
        {!resumable && activeProgram && card.type === 'rest_done' && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ opacity: 0.8 }}>
              {schedule.length > 0 ? 'Programme terminé' : 'Jour de repos'}
            </p>
            <p style={{ fontWeight: 700, fontSize: 'var(--fs-display)', lineHeight: 1.15, marginTop: 4 }}>
              {schedule.length > 0 ? 'Toutes les séances sont complètes 🎉' : 'Récupération'}
            </p>
            <div style={{ marginTop: 'var(--gap-tile)' }}>
              <Button icon="dumbbell" variant="secondary" onClick={() => setShowSeancesPicker(true)}>
                Mes séances
              </Button>
            </div>
          </Card>
        )}

        {/* ── Pas de programme actif ──────────────────────────────────── */}
        {!resumable && !activeProgram && (
          <Card>
            <p className="t-eyebrow">Pour commencer</p>
            <p className="t-title" style={{ marginTop: 4 }}>Crée ton programme</p>
            <p className="t-caption" style={{ marginTop: 2 }}>
              L&apos;app sait alors quoi te proposer chaque jour d&apos;entraînement.
            </p>
            <div style={{ marginTop: 'var(--gap-tile)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              <Button icon="bolt" onClick={() => nav.navigate('programGenerator')}>
                ⚡ Générer mon programme
              </Button>
              <Button variant="secondary" icon="list" onClick={() => nav.navigate('programsLibrary')}>
                Parcourir la bibliothèque
              </Button>
            </div>
          </Card>
        )}

        {/* ── Stats de la semaine en cours ────────────────────────────── */}
        <SectionHeader label="Cette semaine" />
        <div className="gt-statrow">
          <StatTile
            label="Séances"
            value={String(current.sessions)}
            delta={deltas.sessions}
          />
          <StatTile
            label="Volume kg"
            value={abbrevVol(current.volumeKg)}
          />
          <StatTile label="Temps" value={formatDuration(current.timeSec).replace(/:\d{2}$/, '')} />
        </div>

        {/* ── Avancement du programme — groupé par semaine ─────────────── */}
        {activeProgram && schedule.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionHeader label="Avancement" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentPhase && (
                  <span style={{
                    fontSize: 'var(--fs-caption)', fontWeight: 700,
                    color: PHASE_COLORS[currentPhase.focus],
                  }}>
                    {PHASE_EMOJI[currentPhase.focus]} {currentPhase.name}
                  </span>
                )}
                <span className="t-num" style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)' }}>
                  {progressDoneCount} / {schedule.length}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {progressByWeek.map(([weekKey, cells]) => {
                const weekNum = parseInt(weekKey.replace('S', ''), 10)
                const weekPhase = programPhases?.find(
                  (p) => p.weekStart <= weekNum && weekNum <= p.weekEnd,
                )
                const isCurrentWeek = weekNum === currentWeekNumber
                const weekColor = weekPhase ? PHASE_COLORS[weekPhase.focus] : 'var(--fg-muted)'
                return (
                <div key={weekKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="t-eyebrow"
                    style={{
                      color: isCurrentWeek ? weekColor : 'var(--fg-muted)',
                      fontWeight: isCurrentWeek ? 800 : 700,
                      minWidth: 24, flexShrink: 0,
                      opacity: isCurrentWeek ? 1 : 0.6,
                    }}
                  >
                    {weekKey}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {cells.map((cell) => {
                      const isSelected = selectedCell?.label === cell.label
                      const isScheduledToday = localDayKey(cell.date.getTime()) === todayKey && !cell.done && !cell.ignored
                      let bg: string
                      let border: string
                      if (cell.done) {
                        bg = 'var(--accent)'
                        border = '2px solid transparent'
                      } else if (isScheduledToday) {
                        bg = 'transparent'
                        border = '2px solid var(--accent)'
                      } else if (cell.ignored) {
                        bg = 'var(--border)'
                        border = '2px solid transparent'
                      } else {
                        bg = 'var(--surface2)'
                        border = '2px solid transparent'
                      }
                      return (
                        <button
                          key={cell.label}
                          type="button"
                          aria-label={`${cell.label} — ${cell.workoutName}`}
                          onClick={() => handleCellClick(cell)}
                          style={{
                            flex: 1,
                            height: 14, /* barre horizontale — aucun token ne couvre cette hauteur */
                            borderRadius: 4,
                            background: bg,
                            border: isSelected ? '2px solid var(--accent)' : border,
                            padding: 0,
                            cursor: 'pointer',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )})}
            </div>
            {selectedCell && (() => {
              const completedSession = selectedCell.done
                ? (programSessions.find((cs) => cs.programSessionLabel === selectedCell.label) ??
                   programSessions.find(
                     (cs) =>
                       cs.workoutTemplateId === selectedCell.workoutTemplateId &&
                       localDayKey(cs.startedAt) === localDayKey(selectedCell.date.getTime()),
                   ))
                : null
              const displayDate = completedSession
                ? new Date(completedSession.startedAt)
                : selectedCell.date
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--surface2)',
                  fontSize: 'var(--fs-body)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700 }}>{selectedCell.workoutName}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: 6 }}>· {selectedCell.label}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                      · {displayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
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
                          fontSize: 'var(--fs-caption)',
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
              )
            })()}
          </>
        )}

        {/* ── Enregistrement rapide ────────────────────────────────────── */}
        <Card variant="accent">
          <p className="t-eyebrow" style={{ marginBottom: 'var(--gap-tile)', opacity: 0.8 }}>Enregistrement rapide</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
            <Button variant="secondary" onClick={() => nav.navigate('freeWorkout')}>
              🧠 Planifier une séance rapide
            </Button>
            <Button variant="secondary" onClick={() => nav.navigate('quickLog')}>
              🏃 Courses, sport, full body
            </Button>
          </div>
        </Card>

      </div>

      {/* ── Bottom sheet : Mes séances ──────────────────────────────────── */}
      {showSeancesPicker && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowSeancesPicker(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--overlay-dim, rgba(0,0,0,0.45))',
              zIndex: 100,
            }}
          />
          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 101,
              background: 'var(--bg)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>Mes séances</span>
              <button
                type="button"
                onClick={() => setShowSeancesPicker(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, padding: '0 4px', lineHeight: 1 }}
                aria-label="Fermer"
              >×</button>
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 20px 10px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
              {WORKOUT_FILTER.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className="gt-chip"
                  onClick={() => setSeancesTypeFilter(key)}
                  style={{
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: seancesTypeFilter === key ? 'var(--accent)' : undefined,
                    color: seancesTypeFilter === key ? 'var(--accent-ink)' : undefined,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 0 20px' }}>

              {/* Séances groupées par programme */}
              {seanceGroups.length === 0 && allWorkouts.length > 0 && (
                <p className="t-caption" style={{ padding: '16px 20px', color: 'var(--fg-muted)', textAlign: 'center' }}>
                  Aucune séance dans cette catégorie
                </p>
              )}
              {seanceGroups.map((group) => (
                <div key={group.programId}>
                  {/* Header groupe */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 20px 6px',
                  }}>
                    <div style={{ width: 10, height: 1, background: 'var(--border)', flexShrink: 0 }} />
                    <span style={{
                      fontSize: 'var(--fs-caption)', fontWeight: 700,
                      color: 'var(--fg-muted)', textTransform: 'uppercase',
                      letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {group.label}
                    </span>
                    {group.isActive && <Pill variant="accent">ACTIF</Pill>}
                    {group.isTemplate && !group.isLibre && (
                      <span style={{ fontSize: 10, color: 'var(--fg-muted)', opacity: 0.65, fontWeight: 500, flexShrink: 0 }}>
                        template
                      </span>
                    )}
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-muted)', opacity: 0.65, flexShrink: 0 }}>
                      {group.workouts.length}
                    </span>
                  </div>
                  {/* Lignes séances */}
                  {group.workouts.map((wt) => (
                    <Row
                      key={wt.id}
                      leading={wt.icon ? <SessionEmoji emoji={wt.icon} /> : undefined}
                      icon={wt.icon ? undefined : 'dumbbell'}
                      label={wt.name}
                      sub={wt.type !== 'custom' ? wt.type.charAt(0).toUpperCase() + wt.type.slice(1) : undefined}
                      chevron
                      onClick={() => startFromWorkout(wt.id)}
                    />
                  ))}
                </div>
              ))}

              {/* Nouvelle séance */}
              <p className="t-eyebrow" style={{ padding: '12px 20px 4px' }}>NOUVELLE SÉANCE</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 20px' }}>
                {['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full body', 'Custom'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="gt-chip"
                    onClick={() => startNamedFreestyle(name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {name}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SessionEmoji({ emoji }: { emoji: string }) {
  return (
    <span
      className="gt-row__icon"
      style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {emoji}
    </span>
  )
}
