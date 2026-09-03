import { useMemo } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { buildExerciseStats } from '../../utils/exerciseStats'
import { formatVolume } from '../../utils/format'
import { formatWeight } from '../../utils/units'
import { MUSCLE_LABEL } from '../../utils/labels'
import { Card, EmptyState, Icon, StatTile } from '../ui'

export function ExerciseDetailScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const exerciseId = typeof params?.exerciseId === 'string' ? params.exerciseId : undefined
  const exercise = store.exercises.find((e) => e.id === exerciseId)
  const weightUnit = store.settings.preferences.weightUnit

  const stats = useMemo(
    () => (exerciseId ? buildExerciseStats(exerciseId, store) : null),
    [exerciseId, store],
  )

  if (!exercise || !stats) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Exercice</h1>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState icon="info" title="Exercice introuvable" />
        </div>
      </div>
    )
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{exercise.name}</h1>
      </div>

      <div className="gt-screen__scroll">
        <p className="t-caption">{MUSCLE_LABEL[exercise.primaryMuscle]}</p>

        {stats.bestPR && (
          <Card variant="accent">
            <p className="t-eyebrow" style={{ color: 'var(--accent-ink)', opacity: 0.7 }}>
              Record · 1RM estimé {Number(stats.bestPR.estimated1RM).toFixed(1)} kg
            </p>
            <p className="t-num" style={{ fontSize: 28, marginTop: 4 }}>
              {formatWeight(stats.bestPR.weightKg, weightUnit)} × {stats.bestPR.reps}
            </p>
          </Card>
        )}

        <div className="gt-statrow">
          <StatTile label="Tonnage" value={`${formatVolume(stats.totalTonnage)} kg`} />
          <StatTile label="Séries" value={String(stats.totalSets)} />
          <StatTile label="Séances" value={String(stats.performances.length)} />
        </div>

        <p className="t-eyebrow">Historique</p>
        {stats.performances.length === 0 ? (
          <p className="t-caption">Aucune performance enregistrée.</p>
        ) : (
          stats.performances.map((perf) => (
            <Card key={perf.sessionId}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <span style={{ fontWeight: 600 }}>
                  {new Date(perf.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="t-caption">1RM {Number(perf.best1RM).toFixed(0)} kg</span>
              </div>
              <div className="gt-chips" style={{ marginTop: 8 }}>
                {perf.sets.map((s) => (
                  <span
                    key={s.id}
                    className={`gt-chip ${s.isPersonalRecord ? 'gt-chip--active' : ''}`}
                  >
                    {formatWeight(s.weightKg, weightUnit)} × {s.reps}
                  </span>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
