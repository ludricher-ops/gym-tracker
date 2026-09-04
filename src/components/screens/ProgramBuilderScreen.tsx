import { useEffect, useMemo, useState } from 'react'
import type { WorkoutType } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { localDayKey } from '../../utils/dates'
import { WORKOUT_TYPE_LABEL } from '../../utils/labels'
import { activateProgram } from '../../utils/programOps'
import { uuid } from '../../utils/uuid'
import { Icon } from '../ui'
import {
  StepMeta, StepWeek, StepEditWorkout, StepReview,
} from '../programBuilder/BuilderSteps'
import {
  commitDraft, updateDraft, draftFromProgram, emptyDraft,
  type DraftProgram, type DraftWorkout, type DraftWE,
} from '../programBuilder/programDraft'
import { hasPendingDraft, consumePendingDraft } from '../../utils/generatorDraft'

type View = { step: 1 } | { step: 2 } | { step: 3; workoutLocalId: string } | { step: 4 }

const STEP_TITLE = ['Programme', 'Structure de la semaine', 'Éditer la séance', 'Revue']

function parseDateInput(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return Date.now()
  return new Date(y, m - 1, d).getTime()
}

export function ProgramBuilderScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const fromId = typeof params?.fromProgramId === 'string' ? params.fromProgramId : undefined

  const isEditing = !!fromId

  // hasPendingDraft() doit être vérifié AVANT consumePendingDraft() dans le draft
  const [view, setView] = useState<View>(() => hasPendingDraft() ? { step: 4 } : { step: 1 })

  const [draft, setDraft] = useState<DraftProgram>(() => {
    const pending = consumePendingDraft()
    if (pending) return pending
    if (fromId) {
      const p = store.programs.find((x) => x.id === fromId)
      if (p) return draftFromProgram(p, store)
    }
    return emptyDraft()
  })
  const [startDate, setStartDate] = useState(localDayKey(Date.now()))
  const [saving, setSaving] = useState(false)

  const activeProgram = useMemo(
    () => store.programs.find((p) => p.isActive) ?? null,
    [store.programs],
  )

  // ── Mutations du brouillon ──
  const update = (p: Partial<DraftProgram>) => setDraft((d) => ({ ...d, ...p }))

  const updateWorkout = (localId: string, p: Partial<DraftWorkout>) =>
    setDraft((d) => ({
      ...d,
      workouts: d.workouts.map((w) => (w.localId === localId ? { ...w, ...p } : w)),
    }))

  const addWorkout = (type: WorkoutType): string => {
    const localId = uuid()
    const count = draft.workouts.filter((w) => w.type === type).length
    const workout: DraftWorkout = {
      localId,
      name: WORKOUT_TYPE_LABEL[type] + (count > 0 ? ` ${count + 1}` : ''),
      type,
      muscleGroups: [],
      exercises: [],
    }
    setDraft((d) => ({ ...d, workouts: [...d.workouts, workout] }))
    return localId
  }

  const removeWorkout = (localId: string) => {
    setDraft((d) => {
      const week = { ...d.week }
      for (const day of Object.keys(week) as (keyof typeof week)[]) {
        if (week[day] === localId) delete week[day]
      }
      return { ...d, workouts: d.workouts.filter((w) => w.localId !== localId), week }
    })
    setView({ step: 2 })
  }

  const duplicateWorkout = (localId: string) => {
    const src = draft.workouts.find((w) => w.localId === localId)
    if (!src) return
    const copy: DraftWorkout = {
      localId: uuid(),
      name: `${src.name} (copie)`,
      type: src.type,
      muscleGroups: [...src.muscleGroups],
      exercises: src.exercises.map((e): DraftWE => ({ ...e, localId: uuid() })),
    }
    setDraft((d) => ({ ...d, workouts: [...d.workouts, copy] }))
    setView({ step: 2 })
  }

  const assignDay = (day: keyof DraftProgram['week'], localId: string | null) => {
    setDraft((d) => {
      const week = { ...d.week }
      if (localId) week[day] = localId
      else delete week[day]
      return { ...d, week }
    })
  }

  const close = () => {
    const msg = isEditing
      ? 'Annuler les modifications ?'
      : 'Abandonner la création du programme ?'
    if (draft.workouts.length > 0 || draft.name.trim()) {
      if (!confirm(msg)) return
    }
    nav.back()
  }

  const activate = async () => {
    setSaving(true)
    try {
      const created = await commitDraft(draft, store)
      await activateProgram(created, parseDateInput(startDate), store)
      // Réinitialise la pile de l'onglet courant et bascule sur l'accueil
      // pour que l'utilisateur voie immédiatement son nouveau programme actif.
      nav.popToRoot()
      nav.switchTab('today')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!fromId) return
    setSaving(true)
    try {
      await updateDraft(fromId, draft, store)
      nav.back()
    } finally {
      setSaving(false)
    }
  }

  const editingWorkout =
    view.step === 3 ? draft.workouts.find((w) => w.localId === view.workoutLocalId) : undefined

  // Garde-fou : si la séance éditée a disparu, revenir à la structure.
  useEffect(() => {
    if (view.step === 3 && !editingWorkout) setView({ step: 2 })
  }, [view, editingWorkout])

  const stepNum = view.step
  const onLeft = view.step === 3 ? () => setView({ step: 2 }) : close

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={onLeft} aria-label="Retour">
          <Icon name={view.step === 3 ? 'arrow' : 'close'} size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{STEP_TITLE[stepNum - 1]}</h1>
        <span className="t-caption" style={{ fontWeight: 700 }}>
          {stepNum}/4
        </span>
      </div>

      {view.step === 1 && (
        <StepMeta draft={draft} update={update} onNext={() => setView({ step: 2 })} />
      )}
      {view.step === 2 && (
        <StepWeek
          draft={draft}
          addWorkout={addWorkout}
          assignDay={assignDay}
          onEditWorkout={(id) => setView({ step: 3, workoutLocalId: id })}
          onNext={() => setView({ step: 4 })}
        />
      )}
      {view.step === 3 && editingWorkout && (
        <StepEditWorkout
          workout={editingWorkout}
          store={store}
          onChange={(patch) => updateWorkout(editingWorkout.localId, patch)}
          onRemove={() => removeWorkout(editingWorkout.localId)}
          onDuplicate={() => duplicateWorkout(editingWorkout.localId)}
          onBack={() => setView({ step: 2 })}
        />
      )}
      {view.step === 4 && (
        <StepReview
          draft={draft}
          startDate={startDate}
          setStartDate={setStartDate}
          hasActiveProgram={activeProgram?.name ?? null}
          saving={saving}
          isEditing={isEditing}
          onActivate={activate}
          onSave={saveEdit}
        />
      )}
    </div>
  )
}
