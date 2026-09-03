import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { exercisesWithHistory, buildExerciseStats } from '../../utils/exerciseStats'
import { formatVolume } from '../../utils/format'
import { weekRange } from '../../utils/dates'
import { Card, EmptyState, StatTile } from '../ui'
import type { MuscleGroup, WeekStart } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne le timestamp du début de la semaine contenant `ts`, selon la préférence utilisateur. */
function startOfWeekPref(ts: number, pref: WeekStart): number {
  return weekRange(ts, pref).start.getTime()
}

/** Label court pour une semaine passée (offset 0 = cette semaine). */
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

  // 0 = semaine courante, 7 = il y a 7 semaines
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStartPref = store.settings.preferences.weekStart

  const data = useMemo(() => {
    const now = Date.now()
    const currentWeekStart = startOfWeekPref(now, weekStartPref)

    // ── Volume 8 semaines (fixe, toujours les 8 dernières) ───────────────
    const weeklyVols = Array.from({ length: 8 }, (_, i) => {
      const offset = 7 - i // 7 semaines ago → courant
      const wStart = currentWeekStart - offset * 7 * 86_400_000
      const wEnd = wStart + 7 * 86_400_000
      const vol = store.sessions
        .filter((s) => s.endedAt != null && s.startedAt >= wStart && s.startedAt < wEnd)
        .reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0)
      return { vol, offset, isCurrent: offset === 0 }
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

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <h1 className="gt-topbar__title">Progression</h1>
      </div>

      <div className="gt-screen__scroll">

        {/* ── Stats de la semaine sélectionnée ────────────────────────── */}
        <p className="t-eyebrow" style={{ marginBottom: 8 }}>
          {weekLabel(weekOffset, currentWeekStart)}
        </p>
        <div className="gt-statrow">
          <StatTile label="Séances" value={String(weekSessions.length)} />
          <StatTile label="Volume" value={`${formatVolume(weekVolume)} kg`} />
          <StatTile label="Records" value={String(weekPRCount)} />
        </div>

        {/* ── Volume 8 semaines — barres cliquables ─────────────────── */}
        <p className="t-eyebrow" style={{ margin: '20px 0 8px' }}>Volume hebdomadaire</p>
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
                      fontSize: 9,
                      lineHeight: 1,
                      color: isSelected ? 'var(--accent)' : 'var(--dim)',
                      fontWeight: isSelected ? 700 : 400,
                      flexShrink: 0,
                    }}
                  >
                    {`S${i + 1}`}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── Muscles de la semaine sélectionnée ───────────────────────── */}
        <p className="t-eyebrow" style={{ margin: '20px 0 8px' }}>
          Muscles travaillés
        </p>
        <div className="gt-chips">
          {MUSCLE_DISPLAY.map((m) => {
            const hit = m.groups.some((g) => hitMuscles.has(g))
            return (
              <span
                key={m.key}
                className={`gt-chip${hit ? ' gt-chip--active' : ''}`}
                style={{ fontSize: 12, padding: '5px 12px', minHeight: 'unset' }}
              >
                {m.label}
              </span>
            )
          })}
        </div>

        {/* ── Records récents (tous temps) ─────────────────────────────── */}
        {recentPRs.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ margin: '20px 0 8px' }}>Records récents</p>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentPRs.map((pr, i) => (
                  <button
                    key={pr.id}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'inherit',
                      textAlign: 'left',
                    }}
                    onClick={() => nav.navigate('exerciseDetail', { exerciseId: pr.exerciseId })}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: i === 0 ? 'var(--accent)' : 'var(--surface2)',
                        border: i === 0 ? 'none' : '1.5px solid var(--dim)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                      {pr.exerciseName}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                        {pr.estimated1RM.toFixed(1)} kg 1RM
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {new Date(pr.achievedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── Progression 30 jours (fixe) ───────────────────────────────── */}
        {progressions.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ margin: '20px 0 8px' }}>Progression — 30 jours</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {progressions.map((prog) => {
                const isUp = prog.delta !== null && prog.delta > 0
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
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {prog.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          1RM estimé {prog.recentBest.toFixed(1)} kg
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 20,
                          flexShrink: 0,
                          background: isUp ? 'var(--accent)' : 'var(--surface2)',
                          color: isUp
                            ? 'var(--accent-ink)'
                            : isNew
                              ? 'var(--muted)'
                              : 'var(--dim)',
                        }}
                      >
                        {isNew
                          ? 'Nouveau'
                          : prog.delta! > 0
                            ? `+${prog.delta!.toFixed(1)} kg`
                            : prog.delta === 0
                              ? '='
                              : `${prog.delta!.toFixed(1)} kg`}
                      </span>
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
