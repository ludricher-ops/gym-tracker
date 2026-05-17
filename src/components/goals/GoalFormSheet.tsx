import { useMemo, useState } from 'react'
import type { Goal, GoalType } from '../../types'
import { useStore } from '../../hooks/useStore'
import { GOAL_TYPE_LABEL } from '../../utils/labels'
import { isManualGoal } from '../../utils/goalProgress'
import { uuid } from '../../utils/uuid'
import { Sheet, Button } from '../ui'

interface GoalFormSheetProps {
  /** Présent = mode édition ; absent = création. */
  goal?: Goal
  onClose: () => void
}

const TYPES: GoalType[] = [
  'exercise_1rm', 'exercise_reps', 'sessions_per_week', 'bodyweight', 'custom',
]

function unitFor(type: GoalType, customUnit: string): string {
  switch (type) {
    case 'exercise_1rm':
    case 'bodyweight':
      return 'kg'
    case 'exercise_reps':
      return 'reps'
    case 'sessions_per_week':
      return 'séances'
    default:
      return customUnit.trim() || 'pts'
  }
}

export function GoalFormSheet({ goal, onClose }: GoalFormSheetProps) {
  const store = useStore()
  const editing = goal != null

  const [type, setType] = useState<GoalType>(goal?.type ?? 'exercise_1rm')
  const [exerciseId, setExerciseId] = useState(goal?.exerciseId ?? '')
  const [target, setTarget] = useState(goal?.targetValue ?? 0)
  const [manualValue, setManualValue] = useState(goal?.manualValue ?? 0)
  const [customTitle, setCustomTitle] = useState(
    goal && goal.type === 'custom' ? goal.title : '',
  )
  const [customUnit, setCustomUnit] = useState(
    goal && goal.type === 'custom' ? goal.unit : '',
  )
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')

  const exercises = useMemo(
    () => [...store.exercises].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [store.exercises],
  )

  const needsExercise = type === 'exercise_1rm' || type === 'exercise_reps'
  const canSave =
    target > 0 &&
    (!needsExercise || exerciseId !== '') &&
    (type !== 'custom' || customTitle.trim() !== '')

  const buildTitle = (): string => {
    if (type === 'custom') return customTitle.trim()
    if (needsExercise) {
      const name = store.exercises.find((e) => e.id === exerciseId)?.name ?? 'Exercice'
      return `${name} · ${type === 'exercise_1rm' ? '1RM' : 'reps'}`
    }
    return GOAL_TYPE_LABEL[type]
  }

  const save = async () => {
    if (!canSave) return
    await store.goal.save({
      id: goal?.id ?? uuid(),
      type,
      title: buildTitle(),
      exerciseId: needsExercise ? exerciseId : undefined,
      targetValue: target,
      manualValue: isManualGoal(type) ? manualValue : undefined,
      unit: unitFor(type, customUnit),
      deadline: deadline || undefined,
      createdAt: goal?.createdAt ?? Date.now(),
    })
    onClose()
  }

  const del = async () => {
    if (!goal) return
    if (!confirm(`Supprimer l'objectif « ${goal.title} » ?`)) return
    await store.goal.remove(goal.id)
    onClose()
  }

  return (
    <Sheet title={editing ? "Modifier l'objectif" : 'Nouvel objectif'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="gt-field">
          <span className="gt-field__label">Type d&apos;objectif</span>
          <div className="gt-chips">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`gt-chip ${type === t ? 'gt-chip--active' : ''}`}
                disabled={editing}
                onClick={() => setType(t)}
              >
                {GOAL_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {needsExercise && (
          <div className="gt-field">
            <span className="gt-field__label">Exercice</span>
            <select
              className="gt-input"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === 'custom' && (
          <>
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="goal-title">
                Intitulé
              </label>
              <input
                id="goal-title"
                className="gt-input"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex. Tenir un L-sit"
              />
            </div>
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="goal-unit">
                Unité
              </label>
              <input
                id="goal-unit"
                className="gt-input"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Ex. secondes"
              />
            </div>
          </>
        )}

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="goal-target">
            Cible ({unitFor(type, customUnit)})
          </label>
          <input
            id="goal-target"
            type="number"
            className="gt-input"
            value={target || ''}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </div>

        {isManualGoal(type) && (
          <div className="gt-field">
            <label className="gt-field__label" htmlFor="goal-current">
              Valeur actuelle ({unitFor(type, customUnit)})
            </label>
            <input
              id="goal-current"
              type="number"
              className="gt-input"
              value={manualValue || ''}
              onChange={(e) => setManualValue(Number(e.target.value))}
            />
          </div>
        )}

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="goal-deadline">
            Échéance (optionnel)
          </label>
          <input
            id="goal-deadline"
            type="date"
            className="gt-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <Button icon="check" onClick={save} disabled={!canSave}>
          {editing ? 'Enregistrer' : "Créer l'objectif"}
        </Button>
        {editing && (
          <Button variant="ghost" icon="trash" onClick={del}>
            Supprimer l&apos;objectif
          </Button>
        )}
      </div>
    </Sheet>
  )
}
