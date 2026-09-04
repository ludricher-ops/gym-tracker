// Composants des 4 étapes du créateur de programme. L'orchestrateur
// (ProgramBuilderScreen) détient le brouillon et passe ici les données.

import { useMemo, useState } from 'react'
import type { Exercise, MuscleGroup, ProgramGoal, Weekday, WorkoutType } from '../../types'
import type { StoreApi } from '../../hooks/useStore'
import { GOAL_LABEL, LEVEL_LABEL, WORKOUT_TYPE_LABEL } from '../../utils/labels'
import {
  Button, Card, Icon, PrimaryBar, Row, Segmented, Sheet,
} from '../ui'
import { MediaImage } from '../exercises/MediaImage'
import { MusclePicker } from '../exercises/MusclePicker'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseConfigSheet } from './ExerciseConfigSheet'
import {
  WEEKDAYS, WEEKDAY_LABEL, PROGRAM_COLORS, defaultWE, draftStats,
  type DraftProgram, type DraftWorkout, type DraftWE,
} from './programDraft'

const WORKOUT_TYPES: WorkoutType[] = [
  'push', 'pull', 'legs', 'upper', 'lower', 'fullbody', 'custom',
]

// ── Étape 1 — Méta ──────────────────────────────────────────────────

interface StepMetaProps {
  draft: DraftProgram
  update: (p: Partial<DraftProgram>) => void
  onNext: () => void
}

export function StepMeta({ draft, update, onNext }: StepMetaProps) {
  return (
    <>
      <div className="gt-screen__scroll">
        <div className="gt-field">
          <label className="gt-field__label" htmlFor="prog-name">
            Nom du programme
          </label>
          <input
            id="prog-name"
            className="gt-input"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ex. Ma prise de masse"
            autoFocus
          />
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Objectif</span>
          <div className="gt-chips">
            {(Object.keys(GOAL_LABEL) as ProgramGoal[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`gt-chip ${draft.goal === g ? 'gt-chip--active' : ''}`}
                onClick={() => update({ goal: g })}
              >
                {GOAL_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Niveau</span>
          <Segmented
            value={draft.level}
            onChange={(level) => update({ level })}
            options={[
              { value: 'beginner', label: LEVEL_LABEL.beginner },
              { value: 'intermediate', label: LEVEL_LABEL.intermediate },
              { value: 'advanced', label: LEVEL_LABEL.advanced },
            ]}
          />
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Durée : {draft.durationWeeks} semaines</span>
          <input
            type="range"
            min={4}
            max={52}
            value={draft.durationWeeks}
            onChange={(e) => update({ durationWeeks: Number(e.target.value) })}
            aria-label="Durée en semaines"
          />
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Séances par semaine (objectif)</span>
          <div className="gt-chips">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                className={`gt-chip ${draft.sessionsPerWeek === n ? 'gt-chip--active' : ''}`}
                onClick={() => update({ sessionsPerWeek: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Couleur</span>
          <div className="gt-chips">
            {PROGRAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Couleur ${c}`}
                onClick={() => update({ color: c })}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: c,
                  border: draft.color === c ? '3px solid var(--text)' : '3px solid transparent',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <PrimaryBar>
        <Button onClick={onNext} disabled={!draft.name.trim()} icon="arrow">
          Continuer
        </Button>
      </PrimaryBar>
    </>
  )
}

// ── Étape 2 — Structure de la semaine ───────────────────────────────

interface StepWeekProps {
  draft: DraftProgram
  addWorkout: (type: WorkoutType) => string
  assignDay: (day: (typeof WEEKDAYS)[number], localId: string | null) => void
  onEditWorkout: (localId: string) => void
  onNext: () => void
}

export function StepWeek({ draft, addWorkout, assignDay, onEditWorkout, onNext }: StepWeekProps) {
  const [addingDay, setAddingDay] = useState<(typeof WEEKDAYS)[number] | null>(null)
  const stats = draftStats(draft)

  const workoutById = (id: string) => draft.workouts.find((w) => w.localId === id)

  return (
    <>
      <div className="gt-screen__scroll">
        <div className="gt-statrow">
          <MiniStat value={stats.trainingDays} label="Séances" />
          <MiniStat value={stats.restDays} label="Repos" />
          <MiniStat value={stats.totalExercises} label="Exercices" />
        </div>

        {WEEKDAYS.map((day) => {
          const localId = draft.week[day]
          const workout = localId ? workoutById(localId) : undefined
          if (workout) {
            return (
              <div key={day} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 38, fontWeight: 700, color: 'var(--muted)' }}>
                  {WEEKDAY_LABEL[day]}
                </span>
                <div style={{ flex: 1 }}>
                  <Row
                    label={workout.name}
                    sub={`${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''}`}
                    chevron
                    onClick={() => onEditWorkout(workout.localId)}
                  />
                </div>
                <button
                  className="gt-iconbtn"
                  aria-label="Retirer cette séance du jour"
                  onClick={() => assignDay(day, null)}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )
          }
          return (
            <div key={day} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 38, fontWeight: 700, color: 'var(--dim)' }}>
                {WEEKDAY_LABEL[day]}
              </span>
              <button
                className="gt-row"
                style={{ flex: 1, color: 'var(--muted)' }}
                onClick={() => setAddingDay(day)}
              >
                <span className="gt-row__icon">
                  <Icon name="plus" size={18} />
                </span>
                <span className="gt-row__body">
                  <span className="gt-row__label" style={{ color: 'var(--muted)' }}>
                    Repos — ajouter une séance
                  </span>
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <PrimaryBar>
        <Button onClick={onNext} disabled={stats.trainingDays === 0} icon="arrow">
          Revue du programme
        </Button>
      </PrimaryBar>

      {addingDay && (
        <Sheet title="Ajouter une séance" onClose={() => setAddingDay(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {draft.workouts.length > 0 && (
              <div>
                <p className="t-eyebrow" style={{ marginBottom: 8 }}>
                  Séances existantes
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {draft.workouts.map((w) => (
                    <Row
                      key={w.localId}
                      label={w.name}
                      sub={`${w.exercises.length} exercice(s)`}
                      onClick={() => {
                        assignDay(addingDay, w.localId)
                        setAddingDay(null)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="t-eyebrow" style={{ marginBottom: 8 }}>
                Nouvelle séance
              </p>
              <div className="gt-chips">
                {WORKOUT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="gt-chip"
                    onClick={() => {
                      const id = addWorkout(t)
                      assignDay(addingDay, id)
                      setAddingDay(null)
                      onEditWorkout(id)
                    }}
                  >
                    {WORKOUT_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Sheet>
      )}
    </>
  )
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="gt-stat">
      <div className="gt-stat__value">{value}</div>
      <div className="gt-stat__label">{label}</div>
    </div>
  )
}

// ── Étape 3 — Éditer une séance ─────────────────────────────────────

interface StepEditWorkoutProps {
  workout: DraftWorkout
  store: StoreApi
  onChange: (patch: Partial<DraftWorkout>) => void
  onRemove: () => void
  onDuplicate: () => void
  onBack: () => void
}

export function StepEditWorkout({
  workout, store, onChange, onRemove, onDuplicate, onBack,
}: StepEditWorkoutProps) {
  const [musclePicker, setMusclePicker] = useState(false)
  const [exercisePicker, setExercisePicker] = useState<'warmup' | 'main' | 'ab' | false>(false)
  const [configIndex, setConfigIndex] = useState<number | null>(null)

  const exMap = useMemo(
    () => new Map(store.exercises.map((e) => [e.id, e])),
    [store.exercises],
  )
  const exName = (id: string) => exMap.get(id)?.name ?? 'Exercice supprimé'
  const exTracking = (id: string) => exMap.get(id)?.trackingType ?? 'weight_reps'
  const exIsCardio = (id: string) => exMap.get(id)?.primaryMuscle === 'cardio'

  const moveExercise = (index: number, dir: -1 | 1) => {
    const we = workout.exercises[index]
    if (!we) return
    const groupKey = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'
    const group = workout.exercises
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => groupKey(w) === groupKey(we))
    const posInGroup = group.findIndex(({ i }) => i === index)
    const targetInGroup = posInGroup + dir
    if (targetInGroup < 0 || targetInGroup >= group.length) return
    const targetIndex = group[targetInGroup]?.i
    if (targetIndex === undefined) return
    const list = workout.exercises.slice()
    const a = list[index]
    const b = list[targetIndex]
    if (!a || !b) return
    list[index] = b
    list[targetIndex] = a
    onChange({ exercises: list })
  }

  const addExercises = (ids: string[], mode: 'main' | 'warmup' | 'ab' = 'main') => {
    onChange({
      exercises: [
        ...workout.exercises,
        ...ids.map((id) => ({
          ...defaultWE(id, exTracking(id), mode === 'ab', mode === 'warmup'),
          isWarmup: mode === 'warmup' ? true : undefined,
          isAb:     mode === 'ab'     ? true : undefined,
        })),
      ],
    })
  }

  const updateWE = (index: number, next: DraftWE) => {
    const list = workout.exercises.slice()
    list[index] = next
    onChange({ exercises: list })
  }

  const removeWE = (index: number) => {
    onChange({ exercises: workout.exercises.filter((_, i) => i !== index) })
  }

  return (
    <>
      <div className="gt-screen__scroll">
        <div className="gt-field">
          <label className="gt-field__label" htmlFor="wk-name">
            Nom de la séance
          </label>
          <input
            id="wk-name"
            className="gt-input"
            value={workout.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <Row
          icon="target"
          label="Groupes musculaires"
          value={
            workout.muscleGroups.length
              ? `${workout.muscleGroups.length} sélectionné(s)`
              : 'Aucun'
          }
          chevron
          onClick={() => setMusclePicker(true)}
        />

        {(() => {
          const warmups = workout.exercises.map((we, i) => ({ we, i })).filter(({ we }) => we.isWarmup)
          const abs    = workout.exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && we.isAb)
          const mains   = workout.exercises.map((we, i) => ({ we, i })).filter(({ we }) => !we.isWarmup && !we.isAb)
          const groupKey = (w: DraftWE) => w.isWarmup ? 'warmup' : w.isAb ? 'ab' : 'main'

          const renderRow = ({ we, i }: { we: DraftWE; i: number }) => {
            const exMedia = exMap.get(we.exerciseId)?.media
            const group = workout.exercises.filter((w) => groupKey(w) === groupKey(we))
            const posInGroup = group.findIndex((w) => w.localId === we.localId)
            return (
              <div key={we.localId} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Row
                    leading={exMedia ? (
                      <div style={{ width: 40, flex: 'none' }}>
                        <MediaImage blobId={exMedia.blobId} url={exMedia.url} alt="" height={40} radius={8} />
                      </div>
                    ) : undefined}
                    label={
                      <>
                        {we.supersetGroup && (
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {we.supersetGroup} ·{' '}
                          </span>
                        )}
                        {exName(we.exerciseId)}
                      </>
                    }
                    sub={
                      exTracking(we.exerciseId) === 'time'
                        ? `${we.targetSets} × ${we.targetDurationSec ?? 30}s · repos ${we.restSec}s`
                        : `${we.targetSets} × ${
                            we.repsMode === 'range'
                              ? `${we.targetRepsMin}-${we.targetRepsMax}`
                              : we.targetRepsMin
                          } · repos ${we.restSec}s`
                    }
                    chevron
                    onClick={() => setConfigIndex(i)}
                  />
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
            <>
              {warmups.length > 0 && (
                <>
                  <p className="t-eyebrow" style={{ marginTop: 6 }}>Échauffement ({warmups.length})</p>
                  {warmups.map(renderRow)}
                </>
              )}
              <p className="t-eyebrow" style={{ marginTop: warmups.length > 0 ? 10 : 6 }}>
                Exercices ({mains.length})
              </p>
              {mains.map(renderRow)}
              {abs.length > 0 && (
                <>
                  <p className="t-eyebrow" style={{ marginTop: 10 }}>Abdominaux ({abs.length})</p>
                  {abs.map(renderRow)}
                </>
              )}
            </>
          )
        })()}

        <Button variant="secondary" icon="plus" onClick={() => setExercisePicker('main')}>
          Ajouter un exercice
        </Button>
        <Button variant="ghost" icon="plus" onClick={() => setExercisePicker('warmup')}>
          Ajouter un échauffement
        </Button>
        <Button variant="ghost" icon="plus" onClick={() => setExercisePicker('ab')}>
          Ajouter un abdominal
        </Button>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" icon="copy" onClick={onDuplicate}>
            Dupliquer
          </Button>
          <Button variant="ghost" icon="trash" onClick={onRemove}>
            Supprimer
          </Button>
        </div>
      </div>

      <PrimaryBar>
        <Button onClick={onBack} icon="check">
          Terminer la séance
        </Button>
      </PrimaryBar>

      {musclePicker && (
        <MusclePicker
          mode="multi"
          value={workout.muscleGroups}
          onConfirm={(groups: MuscleGroup[]) => onChange({ muscleGroups: groups })}
          onClose={() => setMusclePicker(false)}
        />
      )}
      {exercisePicker && (
        <ExercisePicker
          alreadyAdded={workout.exercises.map((e) => e.exerciseId)}
          onConfirm={(ids) => addExercises(ids, exercisePicker)}
          onClose={() => setExercisePicker(false)}
          warmupMode={exercisePicker === 'warmup'}
        />
      )}
      {configIndex != null && workout.exercises[configIndex] && (
        <ExerciseConfigSheet
          we={workout.exercises[configIndex]}
          exerciseName={exName(workout.exercises[configIndex].exerciseId)}
          trackingType={exTracking(workout.exercises[configIndex].exerciseId)}
          isCardio={exIsCardio(workout.exercises[configIndex].exerciseId)}
          onChange={(next) => updateWE(configIndex, next)}
          onRemove={() => removeWE(configIndex)}
          onClose={() => setConfigIndex(null)}
        />
      )}
    </>
  )
}

// ── Étape 4 — Revue ─────────────────────────────────────────────────

interface StepReviewProps {
  draft: DraftProgram
  exercises: Exercise[]
  startDate: string
  setStartDate: (v: string) => void
  hasActiveProgram: string | null
  saving: boolean
  isEditing: boolean
  onActivate: () => void
  onSave: () => void
}

export function StepReview({
  draft, exercises, startDate, setStartDate, hasActiveProgram, saving, isEditing, onActivate, onSave,
}: StepReviewProps) {
  const stats = draftStats(draft)
  return (
    <>
      <div className="gt-screen__scroll">
        {/* En-tête programme */}
        <Card variant="accent">
          <p className="t-eyebrow" style={{ color: 'var(--accent-ink)', opacity: 0.7 }}>
            {GOAL_LABEL[draft.goal]}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
            {draft.name || 'Sans nom'}
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            <ReviewMetric value={draft.durationWeeks} label="semaines" />
            <ReviewMetric value={stats.trainingDays} label="jours/sem" />
            <ReviewMetric value={stats.totalExercises} label="exercices" />
          </div>
        </Card>

        {/* Rythme hebdomadaire avec type de séance */}
        <div>
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>Rythme hebdomadaire</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {WEEKDAYS.map((day) => {
              const wtLocalId = draft.week[day]
              const workout = wtLocalId ? draft.workouts.find((w) => w.localId === wtLocalId) : undefined
              return (
                <div
                  key={day}
                  style={{
                    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8,
                    background: workout ? 'var(--accent)' : 'var(--surface2)',
                    color: workout ? 'var(--accent-ink)' : 'var(--dim)',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{WEEKDAY_LABEL[day]}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>
                    {workout
                      ? (workout.type === 'custom' ? workout.name : WORKOUT_TYPE_LABEL[workout.type])
                      : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cartes de séances avec miniatures */}
        <p className="t-eyebrow">Séances</p>
        {draft.workouts.map((w) => {
          const day = (Object.keys(draft.week) as Weekday[]).find((d) => draft.week[d] === w.localId)
          const dayLabel = day ? WEEKDAY_LABEL[day] : undefined
          return (
            <Card key={w.localId} style={{ padding: 0, overflow: 'clip' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 8px', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--surface2)', border: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="dumbbell" size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  {dayLabel && <div className="t-eyebrow" style={{ marginBottom: 2 }}>{dayLabel}</div>}
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--ink)' }}>
                    {w.name}
                  </div>
                  <div className="t-caption" style={{ marginTop: 2, color: 'var(--dim)' }}>
                    {w.exercises.length} exercice{w.exercises.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {w.exercises.length > 0 && (
                <div style={{
                  display: 'flex', gap: 6, padding: '0 14px 12px',
                  overflowX: 'auto', scrollbarWidth: 'none',
                }}>
                  {w.exercises.map((dwe) => {
                    const ex = exercises.find((e) => e.id === dwe.exerciseId)
                    return (
                      <div
                        key={dwe.localId}
                        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
                      >
                        <ReviewExThumb url={ex?.media?.url} />
                        <span style={{
                          fontSize: 9, color: 'var(--dim)', maxWidth: 52,
                          textAlign: 'center', lineHeight: 1.2,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {ex?.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}

        {!isEditing && (
          <div className="gt-field">
            <label className="gt-field__label" htmlFor="prog-start">
              Date de démarrage
            </label>
            <input
              id="prog-start"
              type="date"
              className="gt-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        )}

        {!isEditing && hasActiveProgram && (
          <Card variant="flat">
            <p className="t-caption">
              ⚠️ Remplace ton programme actuel «&nbsp;{hasActiveProgram}&nbsp;». Il sera
              archivé — l&apos;historique reste accessible.
            </p>
          </Card>
        )}
      </div>

      <PrimaryBar>
        {isEditing ? (
          <Button onClick={onSave} disabled={saving} icon="check">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        ) : (
          <Button onClick={onActivate} disabled={saving} icon="check">
            {saving ? 'Activation…' : 'Activer le programme'}
          </Button>
        )}
      </PrimaryBar>
    </>
  )
}

function ReviewExThumb({ url }: { url?: string }) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 12,
      background: 'var(--surface2)', border: '0.5px solid var(--border)',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {url ? (
        <img
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 70%' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <Icon name="dumbbell" size={20} />
      )}
    </div>
  )
}

function ReviewMetric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, opacity: 0.75 }}>{label}</div>
    </div>
  )
}
