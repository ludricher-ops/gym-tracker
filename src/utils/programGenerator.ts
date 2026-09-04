// Génération automatique d'un DraftProgram à partir des réponses du wizard.
// Fonction pure : ne touche ni au store ni à l'IDB.
// Stratégie : curriculum codé (split × objectif × niveau) + sélection
// depuis le store filtré par équipement + primaryMuscle + popularité.

import type {
  Equipment, Exercise, MuscleGroup,
  ProgramGoal, ProgramLevel, Weekday, WorkoutType,
} from '../types'
import type { DraftProgram, DraftWE, DraftWorkout } from '../components/programBuilder/programDraft'
import { PROGRAM_COLORS } from '../components/programBuilder/programDraft'
import { uuid } from './uuid'

// ── Types publics ────────────────────────────────────────────────────────────

export type GeneratorEquipment = 'full_gym' | 'dumbbell_barbell' | 'bodyweight'

/** Groupes musculaires larges sélectionnables dans le wizard. */
export type FocusMuscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'

/** Mapping FocusMuscle → MuscleGroup fins utilisés dans les slots. */
export const FOCUS_TO_MUSCLES: Record<FocusMuscle, MuscleGroup[]> = {
  chest:     ['chest', 'chest_upper', 'chest_lower'],
  back:      ['back', 'back_width', 'back_thickness'],
  shoulders: ['shoulders', 'shoulders_front', 'shoulders_lateral', 'shoulders_rear'],
  arms:      ['biceps', 'triceps', 'forearms'],
  legs:      ['quads', 'hamstrings', 'glutes', 'calves'],
  core:      ['core'],
}

export interface GeneratorParams {
  goal: ProgramGoal
  daysPerWeek: 2 | 3 | 4 | 5
  sessionDuration: 20 | 45 | 60 | 90
  equipment: GeneratorEquipment
  level: ProgramLevel
  /** Jours explicitement choisis par l'utilisateur (optionnel — sinon par défaut). */
  selectedDays?: Weekday[]
  /** Muscles prioritaires (optionnel — vide = pas de préférence). */
  focusMuscles?: FocusMuscle[]
}

// ── Équipement autorisé par choix ─────────────────────────────────────────────

const EQUIPMENT_FILTER: Record<GeneratorEquipment, Equipment[]> = {
  full_gym:         ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band'],
  dumbbell_barbell: ['barbell', 'dumbbell', 'bodyweight', 'kettlebell', 'band'],
  bodyweight:       ['bodyweight', 'band'],
}

// ── Paramètres de séries/répétitions par objectif ────────────────────────────

interface SetSpec {
  sets: number
  repsMin: number
  repsMax: number
  restSec: number
  /** true = repsMode 'range', false = repsMode 'fixed' */
  range: boolean
}

const COMPOUND_SPEC: Record<ProgramGoal, SetSpec> = {
  strength:    { sets: 5, repsMin: 3,  repsMax: 5,  restSec: 180, range: true  },
  hypertrophy: { sets: 4, repsMin: 8,  repsMax: 12, restSec: 90,  range: true  },
  endurance:   { sets: 3, repsMin: 15, repsMax: 20, restSec: 60,  range: true  },
  fat_loss:    { sets: 3, repsMin: 12, repsMax: 15, restSec: 60,  range: true  },
}

const ISOLATION_SPEC: Record<ProgramGoal, SetSpec> = {
  strength:    { sets: 3, repsMin: 5,  repsMax: 8,  restSec: 120, range: true  },
  hypertrophy: { sets: 3, repsMin: 10, repsMax: 15, restSec: 75,  range: true  },
  endurance:   { sets: 3, repsMin: 15, repsMax: 20, restSec: 45,  range: true  },
  fat_loss:    { sets: 3, repsMin: 12, repsMax: 15, restSec: 60,  range: true  },
}

// ── Définition de slots ───────────────────────────────────────────────────────
// compound: true  → filtrer sur category === 'compound' uniquement
// compound: false → préférer isolation, fallback compound si aucun résultat

interface Slot {
  muscles: MuscleGroup[]
  compound: boolean
}

// Slots pour une séance de 60 min (référence).
// L'ajustement de durée réduit / augmente le nombre de slots pris.
const SLOTS: Record<Exclude<WorkoutType, 'custom'>, Slot[]> = {
  push: [
    { muscles: ['chest', 'chest_upper', 'chest_lower'], compound: true  },
    { muscles: ['shoulders', 'shoulders_front'],         compound: true  },
    { muscles: ['chest', 'chest_upper', 'chest_lower'], compound: false },
    { muscles: ['triceps'],                              compound: false },
    { muscles: ['shoulders_lateral', 'shoulders'],       compound: false },
    { muscles: ['triceps'],                              compound: false },
  ],
  pull: [
    { muscles: ['back_width', 'back'],                   compound: true  },
    { muscles: ['back_thickness', 'back'],               compound: true  },
    { muscles: ['back_thickness', 'back_width', 'back'], compound: false },
    { muscles: ['biceps'],                               compound: false },
    { muscles: ['shoulders_rear'],                       compound: false },
    { muscles: ['biceps', 'forearms'],                   compound: false },
  ],
  legs: [
    { muscles: ['quads'],                compound: true  },
    { muscles: ['hamstrings', 'glutes'], compound: true  },
    { muscles: ['quads'],                compound: false },
    { muscles: ['glutes'],               compound: false },
    { muscles: ['hamstrings'],           compound: false },
    { muscles: ['calves'],               compound: false },
  ],
  upper: [
    { muscles: ['chest', 'chest_upper'],               compound: true  },
    { muscles: ['back_width', 'back'],                  compound: true  },
    { muscles: ['shoulders', 'shoulders_front'],        compound: true  },
    { muscles: ['back_thickness', 'back'],              compound: false },
    { muscles: ['chest', 'chest_lower'],                compound: false },
    { muscles: ['biceps'],                              compound: false },
    { muscles: ['triceps'],                             compound: false },
  ],
  lower: [
    { muscles: ['quads'],                compound: true  },
    { muscles: ['hamstrings', 'glutes'], compound: true  },
    { muscles: ['quads'],                compound: false },
    { muscles: ['glutes'],               compound: false },
    { muscles: ['hamstrings'],           compound: false },
    { muscles: ['calves'],               compound: false },
  ],
  fullbody: [
    { muscles: ['quads', 'glutes'],          compound: true  },
    { muscles: ['chest', 'chest_upper'],     compound: true  },
    { muscles: ['back_width', 'back'],       compound: true  },
    { muscles: ['hamstrings', 'glutes'],     compound: false },
    { muscles: ['shoulders', 'shoulders_front'], compound: false },
    { muscles: ['biceps', 'triceps'],        compound: false },
  ],
}

// ── Sélection du split ────────────────────────────────────────────────────────

type Split = Exclude<WorkoutType, 'custom'>[]

function selectSplit(params: GeneratorParams): Split {
  const { goal, daysPerWeek, level } = params
  const isMass = goal === 'strength' || goal === 'hypertrophy'

  switch (daysPerWeek) {
    case 2: return ['fullbody', 'fullbody']
    case 3:
      if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']
      return ['fullbody', 'fullbody', 'fullbody']
    case 4:
      if (isMass) return ['upper', 'lower', 'upper', 'lower']
      return ['fullbody', 'fullbody', 'fullbody', 'fullbody']
    case 5:
      if (isMass && level !== 'beginner') return ['push', 'pull', 'legs', 'upper', 'lower']
      if (isMass) return ['upper', 'lower', 'upper', 'lower', 'fullbody']
      return ['fullbody', 'fullbody', 'fullbody', 'fullbody', 'fullbody']
  }
}

// ── Jours de la semaine par nombre de séances ─────────────────────────────────

const DAY_ASSIGNMENTS: Record<number, Weekday[]> = {
  2: ['monday', 'thursday'],
  3: ['monday', 'wednesday', 'friday'],
  4: ['monday', 'tuesday', 'thursday', 'friday'],
  5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
}

// ── Noms de séances ───────────────────────────────────────────────────────────

const WORKOUT_NAMES: Record<Exclude<WorkoutType, 'custom'>, string> = {
  push:     'Push — Poussée',
  pull:     'Pull — Tirage',
  legs:     'Legs — Jambes',
  upper:    'Upper — Haut du corps',
  lower:    'Lower — Bas du corps',
  fullbody: 'Full Body',
}

// ── Ajustement du nombre de slots selon la durée ──────────────────────────────

function adjustedSlotCount(base: number, duration: 20 | 45 | 60 | 90): number {
  if (duration === 20) return Math.max(2, Math.floor(base * 0.5))
  if (duration === 45) return Math.max(3, Math.floor(base * 0.75))
  if (duration === 90) return Math.min(base + 2, 8)
  return base
}

// ── Noms et couleurs de programme ─────────────────────────────────────────────

const PROGRAM_NAMES: Record<ProgramGoal, string> = {
  hypertrophy: 'Prise de masse',
  strength:    'Force',
  endurance:   'Endurance',
  fat_loss:    'Remise en forme',
}

const LEVEL_SUFFIX: Record<ProgramLevel, string> = {
  beginner:     'Débutant',
  intermediate: 'Intermédiaire',
  advanced:     'Confirmé',
}

const GOAL_COLOR_INDEX: Record<ProgramGoal, number> = {
  hypertrophy: 0, // #c8f000
  strength:    1, // #ff8a3d
  endurance:   2, // #5b9dff
  fat_loss:    3, // #ff5d8f
}

const DURATION_WEEKS: Record<ProgramLevel, number> = {
  beginner:     8,
  intermediate: 12,
  advanced:     16,
}

// ── Sélection d'un exercice pour un slot ──────────────────────────────────────

// ── Réordonnancement des slots selon les muscles ciblés ───────────────────────
// Les composés ciblés passent avant les composés non ciblés, puis idem pour
// les isolations. L'ordre compound-before-isolation est toujours préservé.

function reorderSlotsByFocus(slots: Slot[], focused: Set<MuscleGroup>): Slot[] {
  if (focused.size === 0) return slots
  const byFocus = (a: Slot, b: Slot) => {
    const aF = a.muscles.some((m) => focused.has(m)) ? 0 : 1
    const bF = b.muscles.some((m) => focused.has(m)) ? 0 : 1
    return aF - bF
  }
  const compounds  = slots.filter((s) => s.compound).sort(byFocus)
  const isolations = slots.filter((s) => !s.compound).sort(byFocus)
  return [...compounds, ...isolations]
}

// ── Sélection d'un exercice pour un slot ──────────────────────────────────────

function pickExercise(
  slot: Slot,
  available: Exercise[],
  usedInWorkout: Set<string>,
  usedGlobally: Set<string>,
  level: ProgramLevel,
  focused: Set<MuscleGroup>,
): Exercise | null {
  // Filtrer par muscle cible
  let candidates = available.filter(
    (ex) => slot.muscles.includes(ex.primaryMuscle) && !usedInWorkout.has(ex.id),
  )

  if (slot.compound) {
    // Compound strict : filtrer sur la catégorie
    const compoundOnly = candidates.filter((ex) => ex.category === 'compound')
    if (compoundOnly.length > 0) candidates = compoundOnly
    // Sinon on garde tous les candidats (fallback)
  } else {
    // Préférer isolation, mais ne pas bloquer si aucun
    const isolationFirst = candidates.filter((ex) => ex.category === 'isolation')
    if (isolationFirst.length > 0) candidates = isolationFirst
  }

  // Trier : muscles ciblés d'abord, puis non-utilisé globalement, puis popularité desc
  candidates.sort((a, b) => {
    if (focused.size > 0) {
      const aF = focused.has(a.primaryMuscle) ? 0 : 1
      const bF = focused.has(b.primaryMuscle) ? 0 : 1
      if (aF !== bF) return aF - bF
    }
    const aUsed = usedGlobally.has(a.id) ? 1 : 0
    const bUsed = usedGlobally.has(b.id) ? 1 : 0
    if (aUsed !== bUsed) return aUsed - bUsed
    return (b.popularity ?? 0) - (a.popularity ?? 0)
  })

  // Débutants : toujours le mouvement le plus canonique (popularité max).
  // Intermédiaires / Confirmés : variation dans le top-3 pour plus de diversité.
  if (level === 'beginner') return candidates[0] ?? null
  const pool = candidates.slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

// ── DraftWE depuis un exercice + spec ─────────────────────────────────────────

function makeDraftWE(exercise: Exercise, spec: SetSpec): DraftWE {
  return {
    localId: uuid(),
    exerciseId: exercise.id,
    targetSets: spec.sets,
    repsMode: spec.range ? 'range' : 'fixed',
    targetRepsMin: spec.repsMin,
    targetRepsMax: spec.repsMax,
    restSec: spec.restSec,
    autoProgress: true,
    progressStepKg: exercise.equipment === 'bodyweight' ? 0 : 2.5,
  }
}

// ── Fonction principale ───────────────────────────────────────────────────────

export function generateProgramDraft(
  params: GeneratorParams,
  exercises: Exercise[],
): DraftProgram {
  const { goal, daysPerWeek, sessionDuration, equipment, level, selectedDays, focusMuscles } = params

  // Construire le Set<MuscleGroup> des muscles ciblés une seule fois
  const focusedMuscles = new Set<MuscleGroup>(
    (focusMuscles ?? []).flatMap((f) => FOCUS_TO_MUSCLES[f]),
  )

  // Exercices disponibles selon l'équipement (hors warmup, hors supprimés)
  const allowed = new Set(EQUIPMENT_FILTER[equipment])
  const available = exercises.filter(
    (ex) => !ex.deleted && !ex.isWarmupExercise && allowed.has(ex.equipment),
  )

  const split = selectSplit(params)
  // Jours choisis par l'utilisateur ou défaut par nombre de séances
  const days: Weekday[] = (selectedDays && selectedDays.length === daysPerWeek)
    ? selectedDays
    : (DAY_ASSIGNMENTS[daysPerWeek] ?? ['monday', 'wednesday', 'friday'] as Weekday[])

  // IDs d'exercices utilisés dans l'ensemble du programme (pour varier entre séances du même type)
  const usedGlobally = new Set<string>()

  // Compteur par type de séance (pour nommer "Full Body A / B / C")
  const typeCount = new Map<string, number>()

  const workouts: DraftWorkout[] = []

  for (const workoutType of split) {
    const count = (typeCount.get(workoutType) ?? 0) + 1
    typeCount.set(workoutType, count)

    // Réordonner les slots : muscles ciblés montent avant la coupure de durée
    const rawSlots = SLOTS[workoutType] ?? []
    const baseSlots = reorderSlotsByFocus(rawSlots, focusedMuscles)
    const slotCount = adjustedSlotCount(baseSlots.length, sessionDuration)
    const slots = baseSlots.slice(0, slotCount)

    const usedInWorkout = new Set<string>()
    const draftExercises: DraftWE[] = []

    for (const slot of slots) {
      const spec = slot.compound ? COMPOUND_SPEC[goal]! : ISOLATION_SPEC[goal]!
      const ex = pickExercise(slot, available, usedInWorkout, usedGlobally, level, focusedMuscles)
      if (!ex) continue

      usedInWorkout.add(ex.id)
      usedGlobally.add(ex.id)
      draftExercises.push(makeDraftWE(ex, spec))
    }

    // Nommage : suffixe A/B/C si le type apparaît plusieurs fois dans la semaine
    const totalOfType = split.filter((t) => t === workoutType).length
    const suffix = totalOfType > 1 ? ` ${String.fromCharCode(64 + count)}` : ''
    const name = `${WORKOUT_NAMES[workoutType]}${suffix}`

    workouts.push({
      localId: uuid(),
      name,
      type: workoutType,
      muscleGroups: [],
      exercises: draftExercises,
    })
  }

  // Assignation des jours
  const week: DraftProgram['week'] = {}
  for (let i = 0; i < days.length && i < workouts.length; i++) {
    const day = days[i]
    const workout = workouts[i]
    if (day && workout) week[day] = workout.localId
  }

  return {
    name: `${PROGRAM_NAMES[goal]!} · ${LEVEL_SUFFIX[level]}`,
    goal,
    level,
    durationWeeks: DURATION_WEEKS[level]!,
    sessionsPerWeek: daysPerWeek,
    color: PROGRAM_COLORS[GOAL_COLOR_INDEX[goal]!] ?? PROGRAM_COLORS[0]!,
    workouts,
    week,
  }
}
