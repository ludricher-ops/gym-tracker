import { useMemo } from 'react'
import type { Session } from '../../../types'
import type { StoreApi } from '../../../hooks/useStore'
import { useSessionTimer } from '../../../hooks/useSessionTimer'
import { formatDuration, formatVolume } from '../../../utils/format'
import { Sheet, Button, Icon } from '../../ui'

interface SessionOverviewSheetProps {
  session: Session
  store: StoreApi
  currentExIndex: number
  onJump: (index: number) => void
  onAddExercise: () => void
  onFinish: () => void
  onClose: () => void
}

export function SessionOverviewSheet({
  session, store, currentExIndex, onJump, onAddExercise, onFinish, onClose,
}: SessionOverviewSheetProps) {
  const elapsed = useSessionTimer(session.startedAt)

  const rows = useMemo(() => {
    const ses = store.sessionExercises
      .filter((se) => se.sessionId === session.id)
      .sort((a, b) => a.order - b.order)
    return ses.map((se) => {
      const sets = store.sets.filter((s) => s.sessionExerciseId === se.id)
      const done = sets.filter((s) => s.completedAt != null)
      return {
        se,
        name: store.exercises.find((e) => e.id === se.exerciseId)?.name ?? 'Exercice',
        total: sets.length,
        done: done.length,
        hasPR: done.some((s) => s.isPersonalRecord),
      }
    })
  }, [store.sessionExercises, store.sets, store.exercises, session.id])

  const totalSets = rows.reduce((s, r) => s + r.total, 0)
  const doneSets = rows.reduce((s, r) => s + r.done, 0)
  const volume = rows.reduce((sum, r) => {
    const sets = store.sets.filter((s) => s.sessionExerciseId === r.se.id && s.completedAt != null && !s.isWarmup)
    return sum + sets.reduce((v, s) => v + s.weightKg * s.reps, 0)
  }, 0)

  return (
    <Sheet title="Vue d'ensemble" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="gt-statrow">
          <Stat value={`${doneSets}/${totalSets}`} label="Séries" />
          <Stat value={formatDuration(elapsed)} label="Durée" />
          <Stat value={`${formatVolume(volume)} kg`} label="Volume" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r, i) => (
            <button
              key={r.se.id}
              type="button"
              className={`gt-set ${i === currentExIndex ? 'gt-set--active' : ''}`}
              onClick={() => {
                onJump(i)
                onClose()
              }}
            >
              <span className="gt-set__perf" style={{ fontFamily: 'var(--font-ui)' }}>
                {r.se.supersetGroup && (
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {r.se.supersetGroup} ·{' '}
                  </span>
                )}
                {r.name}
              </span>
              {r.hasPR && (
                <span style={{ color: 'var(--accent)' }}>
                  <Icon name="bolt" size={16} />
                </span>
              )}
              <span className="gt-set__idx" style={{ width: 'auto', textAlign: 'right' }}>
                {r.done}/{r.total}
              </span>
            </button>
          ))}
        </div>

        <Button variant="secondary" icon="plus" onClick={() => { onAddExercise(); onClose() }}>
          Ajouter un exercice
        </Button>
        <Button variant="danger" icon="check" onClick={() => { onClose(); onFinish() }}>
          Terminer la séance
        </Button>
      </div>
    </Sheet>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="gt-stat">
      <div className="gt-stat__value" style={{ fontSize: 19 }}>
        {value}
      </div>
      <div className="gt-stat__label">{label}</div>
    </div>
  )
}
