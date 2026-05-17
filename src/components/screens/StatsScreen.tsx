import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { buildExerciseStats, exercisesWithHistory } from '../../utils/exerciseStats'
import { formatVolume } from '../../utils/format'
import { formatWeight } from '../../utils/units'
import { Button, Card, EmptyState, LineChart, Row, Segmented, StatTile } from '../ui'
import type { ChartPoint } from '../ui'

export function StatsScreen() {
  const store = useStore()
  const nav = useNavigation()
  const weightUnit = store.settings.preferences.weightUnit

  const historyIds = useMemo(() => exercisesWithHistory(store), [store])
  const exercises = useMemo(
    () =>
      historyIds
        .map((id) => store.exercises.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => e != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [historyIds, store.exercises],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const currentId = selectedId ?? exercises[0]?.id ?? null

  const stats = useMemo(
    () => (currentId ? buildExerciseStats(currentId, store) : null),
    [currentId, store],
  )

  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('3m')
  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (!stats) return []
    const days =
      period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180
        : period === '1y' ? 365 : Infinity
    const cutoff = Date.now() - days * 86_400_000
    return [...stats.performances]
      .filter((p) => p.date >= cutoff)
      .sort((a, b) => a.date - b.date)
      .map((p) => ({ x: p.date, y: p.best1RM }))
  }, [stats, period])

  if (exercises.length === 0) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <span className="gt-topbar__title">Progression</span>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState
            icon="chart"
            title="Pas encore de données"
            sub="Termine quelques séances pour suivre ta progression exercice par exercice."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <span className="gt-topbar__title">Progression</span>
      </div>

      <div className="gt-screen__scroll">
        <div className="gt-chips">
          {exercises.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`gt-chip ${e.id === currentId ? 'gt-chip--active' : ''}`}
              onClick={() => setSelectedId(e.id)}
            >
              {e.name}
            </button>
          ))}
        </div>

        {stats && (
          <>
            {stats.bestPR ? (
              <Card variant="accent">
                <p className="t-eyebrow" style={{ color: 'var(--accent-ink)', opacity: 0.7 }}>
                  Record personnel
                </p>
                <p className="t-num" style={{ fontSize: 30, marginTop: 4 }}>
                  {formatWeight(stats.bestPR.weightKg, weightUnit)} × {stats.bestPR.reps}
                </p>
                <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                  1RM estimé {stats.bestPR.estimated1RM.toFixed(1)} kg ·{' '}
                  {new Date(stats.bestPR.achievedAt).toLocaleDateString('fr-FR')}
                </p>
              </Card>
            ) : (
              <Card>
                <p className="t-caption">Aucun record enregistré sur cet exercice.</p>
              </Card>
            )}

            <Card>
              <p className="t-eyebrow" style={{ marginBottom: 10 }}>
                1RM estimé
              </p>
              <Segmented
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '1m', label: '1M' },
                  { value: '3m', label: '3M' },
                  { value: '6m', label: '6M' },
                  { value: '1y', label: '1A' },
                  { value: 'all', label: 'Tout' },
                ]}
              />
              <div style={{ marginTop: 12 }}>
                <LineChart points={chartPoints} />
              </div>
            </Card>

            <div className="gt-statrow">
              <StatTile label="Tonnage total" value={`${formatVolume(stats.totalTonnage)} kg`} />
              <StatTile label="Séries totales" value={String(stats.totalSets)} />
            </div>

            <p className="t-eyebrow">Dernières performances</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.performances.slice(0, 5).map((perf) => (
                <Row
                  key={perf.sessionId}
                  label={
                    perf.topSet
                      ? `${formatWeight(perf.topSet.weightKg, weightUnit)} × ${perf.topSet.reps}`
                      : '—'
                  }
                  sub={new Date(perf.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  value={`1RM ${perf.best1RM.toFixed(0)}`}
                />
              ))}
            </div>

            <Button
              variant="secondary"
              icon="trend"
              onClick={() => currentId && nav.navigate('exerciseDetail', { exerciseId: currentId })}
            >
              Voir tout l&apos;historique
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
