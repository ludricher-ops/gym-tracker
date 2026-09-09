// Créateur de séance standalone (WorkoutTemplate dans __libre__).
// Deux étapes : (1) Nom + type  →  (2) Exercices.
// Distinct du ProgramBuilderScreen qui gère un programme complet avec planning hebdo.

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

const LIBRE_PROG_NAME = '__libre__'

const WORKOUT_TYPES: WorkoutType[] = [
  'push', 'pull', 'legs', 'upper', 'lower', 'fullbody', 'custom',
]

type Step = 'info' | 'exercises'

export function SeanceBuilderScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [step, setStep] = useState<Step>('info')
  const [name, setName] = useState('')
  const [type, setType] = useState<WorkoutType>('custom')
  const [exercises, setExercises] = useState<DraftWE[]>([])
  const [exercisePicker, setExercisePicker] = useState<'warmup' | 'main' | 'ab' | false>(false)
  const [configIndex, setConfigIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const exMap = useMemo(
    () => new Map(store.exercises.map((e) => [e.id, e])),
    [store.exercises],
  )
  const exName = (id: string) => exMap.get(id)?.name ?? 'Exercice supprimé'
  const exTracking = (id: string) => exMap.get(id)?.trackingType ?? 'weight_reps'
  const exIsCardio = (id: string) => exMap.get(id)?.primaryMuscle === 'cardio'

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
    setExercises((prev) => {
      const list = prev.slice()
      list[index] = next
      return list
    })
  }

  const removeWE = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const moveExercise = (index: number, dir: -1 | 1) => {
    const we = exercises[index]
    if (!we) return
    const groupKey = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'
    const group = exercises
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => groupKey(w) === groupKey(we))
    const posInGroup = group.findIndex(({ i }) => i === index)
    const targetInGroup = posInGroup + dir
    if (targetInGroup < 0 || targetInGroup >= group.length) return
    const targetIndex = group[targetInGroup]?.i
    if (targetIndex === undefined) return
    setExercises((prev) => {
      const list = prev.slice()
      const a = list[index]
      const b = list[targetIndex]
      if (!a || !b) return list
      list[index] = b
      list[targetIndex] = a
      return list
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Trouver ou créer le programme-conteneur __libre__
      let hostProg = store.programs.find((p) => p.name === LIBRE_PROG_NAME)
      if (!hostProg) {
        hostProg = await store.program.save({
          id: uuid(),
          name: LIBRE_PROG_NAME,
          goal: 'hypertrophy',
          level: 'intermediate',
          durationWeeks: 4,
          sessionsPerWeek: 3,
          color: '#666666',
          isTemplate: false,
          isActive: false,
          weekTemplate: {},
          createdAt: Date.now(),
        })
      }

      // 2. Déduire les groupes musculaires depuis le type de séance
      const muscleGroupsByType: Record<WorkoutType, MuscleGroup[]> = {
        push:     ['chest', 'shoulders', 'triceps'],
        pull:     ['back', 'biceps'],
        legs:     ['quads', 'hamstrings', 'glutes', 'calves'],
        upper:    ['chest', 'back', 'shoulders'],
        lower:    ['quads', 'hamstrings', 'glutes'],
        fullbody: ['chest', 'back', 'shoulders', 'quads', 'glutes', 'core'],
        custom:   [],
      }
      const muscleGroups = muscleGroupsByType[type]

      // 3. Créer le WorkoutTemplate
      const wt = await store.workoutTemplate.save({
        id: uuid(),
        programId: hostProg.id,
        name: name.trim(),
        type,
        muscleGroups,
      })

      // 4. Persister les exercices
      for (const [i, ex] of exercises.entries()) {
        await store.workoutExerciseTemplate.save({
          id: uuid(),
          workoutTemplateId: wt.id,
          exerciseId: ex.exerciseId,
          order: i,
          supersetGroup: ex.supersetGroup,
          targetSets: ex.targetSets,
          repsMode: ex.repsMode,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          targetDurationSec: ex.targetDurationSec,
          targetRPE: ex.targetRPE,
          restSec: ex.restSec,
          autoProgress: ex.autoProgress,
          progressStepKg: ex.progressStepKg,
          notes: ex.notes,
          isWarmup: ex.isWarmup,
          isAb: ex.isAb,
        })
      }

      nav.back()
    } finally {
      setSaving(false)
    }
  }

  // ── Étape 1 : Nom + Type ─────────────────────────────────────────────────────

  if (step === 'info') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="close" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Nouvelle séance</h1>
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
              autoFocus
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
            Ajouter des exercices
          </Button>
        </PrimaryBar>
      </div>
    )
  }

  // ── Étape 2 : Exercices ──────────────────────────────────────────────────────

  const warmups = exercises.map((we, i) => ({ we, i })).filter(({ we }) => we.isWarmup)
  const abs = exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && we.isAb)
  const mains = exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && !we.isAb)

  const groupKey = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'

  const renderExRow = ({ we, i }: { we: DraftWE; i: number }) => {
    const exMedia = exMap.get(we.exerciseId)?.media
    const group = exercises.filter((w) => groupKey(w) === groupKey(we))
    const posInGroup = group.findIndex((w) => w.localId === we.localId)
    return (
      <div key={we.localId} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div
            role="button"
            tabIndex={0}
            className="gt-row"
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
            className="gt-iconbtn"
            style={{ height: 26 }}
            aria-label="Monter"
            disabled={posInGroup === 0}
            onClick={() => moveExercise(i, -1)}
          >
            <Icon name="chevron-right" size={16} className="gt-rot-up" />
          </button>
          <button
            className="gt-iconbtn"
            style={{ height: 26 }}
            aria-label="Descendre"
            disabled={posInGroup === group.length - 1}
            onClick={() => moveExercise(i, 1)}
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
          {saving ? 'Enregistrement…' : 'Sauvegarder la séance'}
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
