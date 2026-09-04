import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { exercisesWithHistory, buildExerciseStats } from '../../utils/exerciseStats'
import { formatVolume } from '../../utils/format'
import { weekRange } from '../../utils/dates'
import { Card, DateBlock, DeltaPill, EmptyState, Row, SectionHeader, StatTile } from '../ui'
import type { MuscleGroup, WeekStart } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeekPref(ts: number, pref: WeekStart): number {
  return weekRange(ts, pref).start.getTime()
}

function weekLabel(offset: number, weekStart: number): string {
  if (offset === 0) return 'Cette semaine'
  if (offset === 1) return 'Semaine dernière'
  const d = new Date(weekStart - offset * 7 * 86_400_000)
  return `Sem. du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

const MUSCLE_DISPLAY: { key: string; label: string; groups: MuscleGroup[] }[] = [
  { key: 'chest',      label: 'Pectoraux',  groups: ['chest', 'chest_upper', 'chest_lower'] },
  { key: 'back',       label: 'Dos',        groups: ['back', 'back_width', 'back_thickness'] },
  { key: 'shoulders',  label: 'Épaules',    groups: ['shoulders', 'shoulders_front', 'shoulders_lateral', 'shoulders_rear'] },
  { key: 'biceps',     label: 'Biceps',     groups: ['biceps'] },
  { key: 'triceps',    label: 'Triceps',    groups: ['triceps'] },
  { key: 'quads',      label: 'Quadriceps', groups: ['quads'] },
  { key: 'hamstrings', label: 'Ischio',     groups: ['hamstrings'] },
  { key: 'glutes',     label: 'Fessiers',   groups: ['glutes'] },
  { key: 'core',       label: 'Abdos',      groups: ['core'] },
]

// ── Composant ─────────────────────────────────────────────────────────────────

export function StatsScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [weekOffset, setWeekOffset] = useState(0)

  const weekStartPref = store.settings.preferences.weekStart

  const data = useMemo(() => {
    const now = Date.now()
    const currentWeekStart = startOfWeekPref(now, weekStartPref)

    // ── Volume 8 semaines (fixe, toujours les 8 dernières) ───────────────
    const weeklyVols = Array.from({ length: 8 }, (_, i) => {
      const offset = 7 - i
      const wStart = currentWeekStart - offset * 7 * 86_400_000
      const wEnd = wStart + 7 * 86_400_000
      const vol = store.sessions
        .filter((s) => s.endedAt != null && s.startedAt >= wStart && s.startedAt < wEnd)
        .reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0)
      return { vol, offset, isCurrent: offset === 0, wStart }
    })
    const maxVol = Math.max(...weeklyVols.map((w) => w.vol), 1)

    // ── Records récents (fixe, toutes semaines) ───────────────────────────
    const recentPRs = [...store.personalRecords]
      .filter((p) => p.type === '1rm')
      .sort((a, b) => b.achievedAt - a.achievedAt)
      .slice(0, 5)
      .map((pr) => ({
        id: pr.id,
        exerciseName: store.exercises.find((e) => e.id === pr.exerciseId)?.name ?? '?',
        estimated1RM: Number(pr.estimated1RM),
        achievedAt: pr.achievedAt,
        exerciseId: pr.exerciseId,
      }))

    // ── Progression 30 jours (fixe, toujours depuis aujourd'hui) ─────────
    const cutoff30 = now - 30 * 86_400_000
    const historyIds = exercisesWithHistory(store)
    const recentSessionIds = new Set(
      store.sessions.filter((s) => s.startedAt >= cutoff30).map((s) => s.id),
    )
    const recentExerciseIds = new Set(
      store.sessionExercises
        .filter(
          (se) =>
            recentSessionIds.has(se.sessionId) &&
            historyIds.includes(se.exerciseId),
        )
        .map((se) => se.exerciseId),
    )
    const progressions = [...recentExerciseIds]
      .map((exId) => {
        const stats = buildExerciseStats(exId, store)
        const recent = stats.performances.filter((p) => p.date >= cutoff30)
        const older = stats.performances.filter((p) => p.date < cutoff30)
        const recentBest = recent.reduce((m, p) => Math.max(m, p.best1RM), 0)
        const olderBest =
          older.length > 0 ? older.reduce((m, p) => Math.max(m, p.best1RM), 0) : null
        const delta = olderBest !== null ? recentBest - olderBest : null
        return {
          exerciseId: exId,
          name: store.exercises.find((e) => e.id === exId)?.name ?? '?',
          recentBest,
          delta,
        }
      })
      .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
      .slice(0, 5)

    return { currentWeekStart, weeklyVols, maxVol, recentPRs, progressions }
  }, [store, weekStartPref])

  // ── Stats de la semaine sélectionnée (réactif à weekOffset) ──────────────
  const weekStats = useMemo(() => {
    const { currentWeekStart } = data
    const selStart = currentWeekStart - weekOffset * 7 * 86_400_000
    const selEnd = selStart + 7 * 86_400_000

    const weekSessions = store.sessions.filter(
      (s) => s.endedAt != null && s.startedAt >= selStart && s.startedAt < selEnd,
    )
    const weekVolume = weekSessions.reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0)
    const weekPRCount = store.personalRecords.filter(
      (p) => p.achievedAt >= selStart && p.achievedAt < selEnd && p.type === '1rm',
    ).length

    const weekSessionIds = new Set(weekSessions.map((s) => s.id))
    const weekExerciseIds = new Set(
      store.sessionExercises
        .filter((se) => weekSessionIds.has(se.sessionId) && !se.isWarmup)
        .map((se) => se.exerciseId),
    )
    const hitMuscles = new Set<string>()
    for (const exId of weekExerciseIds) {
      const ex = store.exercises.find((e) => e.id === exId)
      if (ex) hitMuscles.add(ex.primaryMuscle)
    }

    return { weekSessions, weekVolume, weekPRCount, hitMuscles }
  }, [store, data, weekOffset])

  // ── État vide ──────────────────────────────────────────────────────────────
  if (store.sessions.length === 0) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <h1 className="gt-topbar__title">Progression</h1>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState
            icon="chart"
            title="Pas encore de données"
            sub="Termine quelques séances pour suivre ta progression."
          />
        </div>
      </div>
    )
  }

  const { currentWeekStart, weeklyVols, maxVol, recentPRs, progressions } = data
  const { weekSessions, weekVolume, weekPRCount, hitMuscles } = weekStats

  // Muscles touchés en premier, non touchés en second (atténués)
  const hitMuscleDisplay = MUSCLE_DISPLAY.filter((m) => m.groups.some((g) => hitMuscles.has(g)))
  const unhitMuscleDisplay = MUSCLE_DISPLAY.filter((m) => !m.groups.some((g) => hitMuscles.has(g)))

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <h1 className="gt-topbar__title">Progression</h1>
      </div>

      <div className="gt-screen__scroll">

        {/* ── Stats de la semaine sélectionnée ────────────────────────── */}
        <SectionHeader label={weekLabel(weekOffset, currentWeekStart)} />
        <div className="gt-statrow">
          <StatTile label="Séances" value={String(weekSessions.length)} />
          <StatTile label="Volume" value={`${formatVolume(weekVolume)} kg`} />
          <StatTile label="Records" value={String(weekPRCount)} />
        </div>

        {/* ── Volume 8 semaines — barres cliquables ─────────────────── */}
        <SectionHeader label="Volume hebdomadaire" />
        <Card style={{ padding: '12px 14px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
            {weeklyVols.map((w, i) => {
              const isSelected = w.offset === weekOffset
              return (
                <button
                  key={i}
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    alignSelf: 'stretch',
                    justifyContent: 'flex-end',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: 4,
                  }}
                  onClick={() => setWeekOffset(w.offset)}
                  aria-label={weekLabel(w.offset, currentWeekStart)}
                  aria-pressed={isSelected}
                >
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '3px 3px 0 0',
                      height: `${Math.max(3, Math.round((w.vol / maxVol) * 48))}px`,
                      background: isSelected ? 'var(--accent)' : w.isCurrent ? 'var(--accent)' : 'var(--surface2)',
                      opacity: isSelected ? 1 : w.isCurrent ? 0.45 : 0.7,
                      outline: isSelected ? '2px solid var(--accent)' : 'none',
                      outlineOffset: 2,
                      transition: 'opacity 0.15s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--fs-eyebrow)',
                      lineHeight: 1,
                      color: isSelected ? 'var(--accent)' : 'var(--dim)',
                      fontWeight: isSelected ? 700 : 400,
                      flexShrink: 0,
                    }}
                  >
                    {new Date(w.wStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── Muscles de la semaine — touchés en accent, non touchés atténués */}
        <SectionHeader label="Muscles travaillés" />
        <div className="gt-chips">
          {hitMuscleDisplay.map((m) => (
            <span
              key={m.key}
              className="gt-chip gt-chip--active"
              style={{ fontSize: 'var(--fs-caption)', padding: '5px 12px', minHeight: 'unset' }}
            >
              {m.label}
            </span>
          ))}
          {unhitMuscleDisplay.map((m) => (
            <span
              key={m.key}
              className="gt-chip"
              style={{ fontSize: 'var(--fs-caption)', padding: '5px 12px', minHeight: 'unset', opacity: 0.45 }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* ── Records récents — lignes avec DateBlock ───────────────────── */}
        {recentPRs.length > 0 && (
          <>
            <SectionHeader label="Records récents" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentPRs.map((pr) => (
                <Row
                  key={pr.id}
                  leading={<DateBlock date={pr.achievedAt} />}
                  label={pr.exerciseName}
                  value={
                    <span className="t-num" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {pr.estimated1RM.toFixed(1)} kg
                    </span>
                  }
                  chevron
                  onClick={() => nav.navigate('exerciseDetail', { exerciseId: pr.exerciseId })}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Progression 30 jours (fixe) ───────────────────────────────── */}
        {progressions.length > 0 && (
          <>
            <SectionHeader label="Progression — 30 jours" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {progressions.map((prog) => {
                const isNew = prog.delta === null
                return (
                  <Card
                    key={prog.exerciseId}
                    onClick={() => nav.navigate('exerciseDetail', { exerciseId: prog.exerciseId })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 'var(--fs-body)',
                            fontWeight: 500,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {prog.name}
                        </div>
                        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)', marginTop: 2 }}>
                          1RM estimé {prog.recentBest.toFixed(1)} kg
                        </div>
                      </div>
                      {isNew ? (
                        <span className="t-caption" style={{ color: 'var(--muted)', flexShrink: 0 }}>Nouveau</span>
                      ) : (
                        <DeltaPill value={prog.delta!} unit="kg" />
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
