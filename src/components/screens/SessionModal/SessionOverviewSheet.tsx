import { useMemo, useState } from 'react'
import type { Session } from '../../../types'
import type { StoreApi } from '../../../hooks/useStore'
import { useSessionTimer } from '../../../hooks/useSessionTimer'
import { formatDuration, formatVolume } from '../../../utils/format'
import { Button, ExerciseRow, SectionHeader, Sheet } from '../../ui'

interface SessionOverviewSheetProps {
  session: Session
  store: StoreApi
  currentExIndex: number
  onJump: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddExercise: () => void
  onFinish: () => void
  onClose: () => void
}

export function SessionOverviewSheet({
  session, store, currentExIndex, onJump, onReorder, onAddExercise, onFinish, onClose,
}: SessionOverviewSheetProps) {
  // onReorder est conservé dans l'interface pour compatibilité ascendante ;
  // la poignée de glissement (ExerciseRow) remplace les chevrons.
  void onReorder

  const elapsed = useSessionTimer(session.startedAt)
  const [notes, setNotes] = useState(session.notes ?? '')

  const rows = useMemo(() => {
    const ses = store.sessionExercises
      .filter((se) => se.sessionId === session.id)
      .sort((a, b) => {
        const rank = (se: typeof a) => se.isWarmup ? 0 : se.isAb ? 2 : 1
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
        return a.order - b.order
      })
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
    const sets = store.sets.filter(
      (s) => s.sessionExerciseId === r.se.id && s.completedAt != null && !s.isWarmup,
    )
    return sum + sets.reduce((v, s) => v + s.weightKg * s.reps, 0)
  }, 0)

  const saveNotes = () => {
    if (notes !== (session.notes ?? '')) {
      store.session.save({ ...session, notes: notes.trim() || undefined })
    }
  }

  return (
    <Sheet title="Vue d'ensemble" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="gt-statrow">
          <Stat value={`${doneSets}/${totalSets}`} label="Séries" />
          <Stat value={formatDuration(elapsed)} label="Durée" />
          <Stat value={`${formatVolume(volume)} kg`} label="Volume" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r, i) => {
            const prev = i > 0 ? rows[i - 1]?.se : undefined
            const showWarmupLabel = r.se.isWarmup && (i === 0 || !prev?.isWarmup)
            const showWorkLabel = !r.se.isWarmup && !r.se.isAb && (prev?.isWarmup || prev?.isAb || i === 0)
            const showAbLabel = r.se.isAb && !prev?.isAb
            return (
              <div key={r.se.id}>
                {showWarmupLabel && <SectionHeader label="Échauffement" />}
                {showWorkLabel && <SectionHeader label="Exercices" />}
                {showAbLabel && <SectionHeader label="Abdominaux" />}
                {/* ExerciseRow avec poignée ≥ 44 px ; clic → sauter à cet exercice */}
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: i === currentExIndex ? 'var(--surface2)' : 'none',
                    border: 'none',
                    borderRadius: 8,
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onJump(i)
                    onClose()
                  }}
                >
                  <ExerciseRow
                    name={r.name}
                    setsTotal={r.total}
                    setsDone={r.done}
                  />
                </button>
              </div>
            )
          })}
        </div>

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="session-notes">
            Notes de séance
          </label>
          <textarea
            id="session-notes"
            className="gt-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Sensations, douleurs, points à retenir…"
          />
        </div>

        <Button
          variant="secondary"
          icon="plus"
          onClick={() => {
            saveNotes()
            onAddExercise()
            onClose()
          }}
        >
          Ajouter un exercice
        </Button>
        <Button
          icon="check"
          onClick={() => {
            saveNotes()
            onClose()
            onFinish()
          }}
        >
          Terminer la séance
        </Button>
      </div>
    </Sheet>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="gt-stat">
      <div className="gt-stat__value" style={{ fontSize: 'var(--fs-title)' }}>
        {value}
      </div>
      <div className="gt-stat__label">{label}</div>
    </div>
  )
}
