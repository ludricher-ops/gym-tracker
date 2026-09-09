// Créateur / éditeur de séance standalone (WorkoutTemplate dans __libre__).
// Mode création : nav.navigate('seanceBuilder')
// Mode édition  : nav.navigate('seanceBuilder', { id: wt.id })
// Deux étapes : (1) Nom + type  →  (2) Exercices.

import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { WORKOUT_TYPE_LABEL } from '../../utils/labels'
import { uuid } from '../../utils/uuid'
import { Button, Icon, PrimaryBar } from '../ui'
import { ExercisePicker } from '../programBuilder/ExercisePicker'
import { ExerciseConfigSheet } from '../programBuilder/ExerciseConfigSheet'
import { defaultWE, type DraftWE } from '../programBuilder/programDraft'
import { MediaImage } from '../exercises/MediaImage'
import type { MuscleGroup, WorkoutType } from '../../types'
import type { ScreenProps } from '../../nav/screenRegistry'

const LIBRE_PROG_NAME = '__libre__'

const WORKOUT_TYPES: WorkoutType[] = [
  'push', 'pull', 'legs', 'upper', 'lower', 'fullbody', 'custom',
]

const MUSCLE_GROUPS_BY_TYPE: Record<WorkoutType, MuscleGroup[]> = {
  push:     ['chest', 'shoulders', 'triceps'],
  pull:     ['back', 'biceps'],
  legs:     ['quads', 'hamstrings', 'glutes', 'calves'],
  upper:    ['chest', 'back', 'shoulders'],
  lower:    ['quads', 'hamstrings', 'glutes'],
  fullbody: ['chest', 'back', 'shoulders', 'quads', 'glutes', 'core'],
  custom:   [],
}

type Step = 'info' | 'exercises'

export function SeanceBuilderScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()

  const editId = typeof params?.id === 'string' ? params.id : undefined
  const isEditing = !!editId

  // ── Charge les données existantes en mode édition ────────────────────────────
  const existingWt = useMemo(
    () => editId ? store.workoutTemplates.find((w) => w.id === editId) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editId], // volontaire : on ne recharge pas si le store change pendant l'édition
  )

  const initialExercises = useMemo((): DraftWE[] => {
    if (!editId) return []
    return store.workoutExerciseTemplates
      .filter((e) => e.workoutTemplateId === editId && !e.deleted)
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        localId: uuid(),
        exerciseId: e.exerciseId,
        supersetGroup: e.supersetGroup,
        targetSets: e.targetSets,
        repsMode: e.repsMode,
        targetRepsMin: e.targetRepsMin,
        targetRepsMax: e.targetRepsMax,
        targetDurationSec: e.targetDurationSec,
        targetRPE: e.targetRPE,
        restSec: e.restSec,
        autoProgress: e.autoProgress,
        progressStepKg: e.progressStepKg,
        notes: e.notes,
        isWarmup: e.isWarmup,
        isAb: e.isAb,
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const [step, setStep] = useState<Step>('info')
  const [name, setName] = useState(() => existingWt?.name ?? '')
  const [type, setType] = useState<WorkoutType>(() => existingWt?.type ?? 'custom')
  const [exercises, setExercises] = useState<DraftWE[]>(() => initialExercises)
  const [exercisePicker, setExercisePicker] = useState<'warmup' | 'main' | 'ab' | false>(false)
  const [configIndex, setConfigIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Vérifier si cette séance appartient à un programme template (suppression admin-only)
  const isTemplateSrc = useMemo(() => {
    if (!existingWt) return false
    return !!store.programs.find((p) => p.id === existingWt.programId)?.isTemplate
  }, [existingWt, store.programs])

  const canDelete = !isTemplateSrc || store.isAdmin

  // ── Map exercices ────────────────────────────────────────────────────────────
  const exMap = useMemo(
    () => new Map(store.exercises.map((e) => [e.id, e])),
    [store.exercises],
  )
  const exName = (id: string) => exMap.get(id)?.name ?? 'Exercice supprimé'
  const exTracking = (id: string) => exMap.get(id)?.trackingType ?? 'weight_reps'
  const exIsCardio = (id: string) => exMap.get(id)?.primaryMuscle === 'cardio'

  // ── Mutations exercices ──────────────────────────────────────────────────────
  const addExercises = (ids: string[], mode: 'main' | 'warmup' | 'ab' = 'main') => {
    setExercises((prev) => [
      ...prev,
      ...ids.map((id) => ({
        ...defaultWE(id, exTracking(id), mode === 'ab', mode === 'warmup'),
        isWarmup: mode === 'warmup' ? true : undefined,
        isAb: mode === 'ab' ? true : undefined,
      })),
    ])
  }

  const updateWE = (index: number, next: DraftWE) => {
    setExercises((prev) => { const l = prev.slice(); l[index] = next; return l })
  }

  const removeWE = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const moveExercise = (index: number, dir: -1 | 1) => {
    const we = exercises[index]
    if (!we) return
    const gk = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'
    const group = exercises.map((w, i) => ({ w, i })).filter(({ w }) => gk(w) === gk(we))
    const pos = group.findIndex(({ i }) => i === index)
    const target = group[pos + dir]?.i
    if (target === undefined) return
    setExercises((prev) => {
      const l = prev.slice()
      const a = l[index]; const b = l[target]
      if (!a || !b) return l
      l[index] = b; l[target] = a
      return l
    })
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const persistExercises = async (wtId: string) => {
    for (const [i, ex] of exercises.entries()) {
      await store.workoutExerciseTemplate.save({
        id: uuid(), workoutTemplateId: wtId, exerciseId: ex.exerciseId, order: i,
        supersetGroup: ex.supersetGroup, targetSets: ex.targetSets,
        repsMode: ex.repsMode, targetRepsMin: ex.targetRepsMin, targetRepsMax: ex.targetRepsMax,
        targetDurationSec: ex.targetDurationSec, targetRPE: ex.targetRPE,
        restSec: ex.restSec, autoProgress: ex.autoProgress, progressStepKg: ex.progressStepKg,
        notes: ex.notes, isWarmup: ex.isWarmup, isAb: ex.isAb,
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const muscleGroups = MUSCLE_GROUPS_BY_TYPE[type]

      if (isEditing && existingWt) {
        // — Mode édition : mettre à jour le template existant —
        // 1. Supprimer les anciens exercices
        const oldExercises = store.workoutExerciseTemplates.filter(
          (e) => e.workoutTemplateId === existingWt.id
        )
        for (const e of oldExercises) await store.workoutExerciseTemplate.remove(e.id)
        // 2. Mettre à jour le WorkoutTemplate
        await store.workoutTemplate.save({ ...existingWt, name: name.trim(), type, muscleGroups })
        // 3. Créer les nouveaux exercices
        await persistExercises(existingWt.id)
      } else {
        // — Mode création —
        // 1. Trouver ou créer __libre__
        let hostProg = store.programs.find((p) => p.name === LIBRE_PROG_NAME)
        if (!hostProg) {
          hostProg = await store.program.save({
            id: uuid(), name: LIBRE_PROG_NAME,
            goal: 'hypertrophy', level: 'intermediate',
            durationWeeks: 4, sessionsPerWeek: 3, color: '#666666',
            isTemplate: false, isActive: false, weekTemplate: {}, createdAt: Date.now(),
          })
        }
        // 2. Créer le WorkoutTemplate
        const wt = await store.workoutTemplate.save({
          id: uuid(), programId: hostProg.id, name: name.trim(), type, muscleGroups,
        })
        // 3. Créer les exercices
        await persistExercises(wt.id)
      }

      nav.back()
    } finally {
      setSaving(false)
    }
  }

  // ── Suppression ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!existingWt || !canDelete) return
    if (!confirm(`Supprimer définitivement "${existingWt.name}" ?`)) return
    setDeleting(true)
    try {
      const linked = store.workoutExerciseTemplates.filter(
        (e) => e.workoutTemplateId === existingWt.id
      )
      for (const e of linked) await store.workoutExerciseTemplate.remove(e.id)
      await store.workoutTemplate.remove(existingWt.id)
      nav.back()
    } finally {
      setDeleting(false)
    }
  }

  // ── Rendu étape 1 : Nom + Type ───────────────────────────────────────────────

  if (step === 'info') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name={isEditing ? 'arrow' : 'close'} size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">
            {isEditing ? 'Modifier la séance' : 'Nouvelle séance'}
          </h1>
          {/* Supprimer — icône corbeille dans la topbar (édition seulement) */}
          {isEditing && canDelete && (
            <button
              className="gt-iconbtn"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Supprimer la séance"
              style={{ color: 'var(--danger, #e53e3e)' }}
            >
              <Icon name="trash" size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="gt-screen__scroll">
          <div className="gt-field">
            <label className="gt-field__label" htmlFor="seance-name">
              Nom de la séance
            </label>
            <input
              id="seance-name"
              className="gt-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Push A, Legs volume…"
              autoFocus={!isEditing}
            />
          </div>

          <div className="gt-field">
            <span className="gt-field__label">Type de séance</span>
            <div className="gt-chips">
              {WORKOUT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`gt-chip ${type === t ? 'gt-chip--active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {WORKOUT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PrimaryBar>
          <Button
            onClick={() => setStep('exercises')}
            disabled={!name.trim()}
            icon="arrow"
          >
            {isEditing ? 'Modifier les exercices' : 'Ajouter des exercices'}
          </Button>
        </PrimaryBar>
      </div>
    )
  }

  // ── Rendu étape 2 : Exercices ────────────────────────────────────────────────

  const warmups = exercises.map((we, i) => ({ we, i })).filter(({ we }) => we.isWarmup)
  const abs     = exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && we.isAb)
  const mains   = exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && !we.isAb)
  const gk = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'

  const renderExRow = ({ we, i }: { we: DraftWE; i: number }) => {
    const exMedia = exMap.get(we.exerciseId)?.media
    const group = exercises.filter((w) => gk(w) === gk(we))
    const pos = group.findIndex((w) => w.localId === we.localId)
    return (
      <div key={we.localId} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div
            role="button" tabIndex={0} className="gt-row"
            onClick={() => setConfigIndex(i)}
            onKeyDown={(e) => e.key === 'Enter' && setConfigIndex(i)}
            style={{ cursor: 'pointer' }}
          >
            {exMedia && (
              <div className="gt-row__leading" style={{ width: 40, flex: 'none' }}>
                <MediaImage blobId={exMedia.blobId} url={exMedia.url} alt="" height={40} radius={8} />
              </div>
            )}
            <span className="gt-row__body">
              <span className="gt-row__label">{exName(we.exerciseId)}</span>
              <span className="gt-row__sub">
                {exTracking(we.exerciseId) === 'time'
                  ? `${we.targetSets} × ${we.targetDurationSec ?? 30}s · repos ${we.restSec}s`
                  : `${we.targetSets} × ${
                      we.repsMode === 'range'
                        ? `${we.targetRepsMin}-${we.targetRepsMax}`
                        : we.targetRepsMin
                    } · repos ${we.restSec}s`}
              </span>
            </span>
            <Icon name="chevron-right" size={16} className="gt-row__chevron" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            className="gt-iconbtn" style={{ height: 26 }} aria-label="Monter"
            disabled={pos === 0} onClick={() => moveExercise(i, -1)}
          >
            <Icon name="chevron-right" size={16} className="gt-rot-up" />
          </button>
          <button
            className="gt-iconbtn" style={{ height: 26 }} aria-label="Descendre"
            disabled={pos === group.length - 1} onClick={() => moveExercise(i, 1)}
          >
            <Icon name="chevron-right" size={16} className="gt-rot-down" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={() => setStep('info')} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{name || 'Nouvelle séance'}</h1>
        {isEditing && canDelete && (
          <button
            className="gt-iconbtn"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Supprimer la séance"
            style={{ color: 'var(--danger, #e53e3e)' }}
          >
            <Icon name="trash" size={20} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="gt-screen__scroll">
        {warmups.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ marginTop: 6 }}>Échauffement ({warmups.length})</p>
            {warmups.map(renderExRow)}
          </>
        )}
        <p className="t-eyebrow" style={{ marginTop: warmups.length > 0 ? 10 : 6 }}>
          Exercices ({mains.length})
        </p>
        {mains.map(renderExRow)}
        {abs.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ marginTop: 10 }}>Abdominaux ({abs.length})</p>
            {abs.map(renderExRow)}
          </>
        )}

        <Button variant="secondary" icon="plus" onClick={() => setExercisePicker('main')}>
          Ajouter un exercice
        </Button>
        <Button variant="ghost" icon="plus" onClick={() => setExercisePicker('warmup')}>
          Ajouter un échauffement
        </Button>
        <Button variant="ghost" icon="plus" onClick={() => setExercisePicker('ab')}>
          Ajouter un abdominal
        </Button>
      </div>

      <PrimaryBar>
        <Button
          onClick={handleSave}
          disabled={saving || exercises.length === 0}
          icon="check"
        >
          {saving
            ? 'Enregistrement…'
            : isEditing ? 'Enregistrer les modifications' : 'Sauvegarder la séance'}
        </Button>
      </PrimaryBar>

      {exercisePicker && (
        <ExercisePicker
          alreadyAdded={exercises.map((e) => e.exerciseId)}
          onConfirm={(ids) => addExercises(ids, exercisePicker)}
          onClose={() => setExercisePicker(false)}
          warmupMode={exercisePicker === 'warmup'}
        />
      )}
      {configIndex != null && exercises[configIndex] && (
        <ExerciseConfigSheet
          we={exercises[configIndex]}
          exerciseName={exName(exercises[configIndex].exerciseId)}
          trackingType={exTracking(exercises[configIndex].exerciseId)}
          isCardio={exIsCardio(exercises[configIndex].exerciseId)}
          onChange={(next) => updateWE(configIndex, next)}
          onRemove={() => { removeWE(configIndex); setConfigIndex(null) }}
          onClose={() => setConfigIndex(null)}
        />
      )}
    </div>
  )
}
