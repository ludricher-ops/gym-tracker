/**
 * Tests du générateur automatique de programmes (programGenerator.ts).
 *
 * Stratégie : level='beginner' partout → pickExercise retourne toujours
 * candidates[0] (le plus populaire après tri) → résultats déterministes
 * sans mock de Math.random.
 */
import { describe, it, expect } from 'vitest'
import { generateProgramDraft, adjustedSpec } from '../src/utils/programGenerator'
import type { Exercise } from '../src/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function mkEx(
  id: string,
  primaryMuscle: Exercise['primaryMuscle'],
  equipment: Exercise['equipment'],
  category: Exercise['category'],
  opts: { isWarmup?: boolean; popularity?: number } = {},
): Exercise {
  return {
    id,
    name: id,
    primaryMuscle,
    secondaryMuscles: [],
    equipment,
    category,
    trackingType: 'weight_reps',
    isWarmupExercise: opts.isWarmup ?? false,
    isCustom: false,
    popularity: opts.popularity ?? 5,
    updatedAt: 0,
    deleted: false,
    dirty: false,
    createdAt: 0,
  }
}

/** Pool couvrant tous les slots possibles de tous les splits. */
const POOL: Exercise[] = [
  // ── Échauffement ─────────────────────────────────────────────────────────
  mkEx('wu-bw',   'chest',          'bodyweight', 'compound',  { isWarmup: true, popularity: 5 }),
  mkEx('wu-band', 'shoulders_rear', 'band',       'isolation', { isWarmup: true, popularity: 4 }),

  // ── Abdos / core ─────────────────────────────────────────────────────────
  mkEx('core-bw',    'core', 'bodyweight', 'isolation', { popularity: 5 }),
  mkEx('core-cable', 'core', 'cable',      'isolation', { popularity: 4 }),

  // ── Quadriceps ───────────────────────────────────────────────────────────
  mkEx('squat-bb',  'quads', 'barbell',    'compound', { popularity: 10 }),
  mkEx('squat-bw',  'quads', 'bodyweight', 'compound', { popularity:  3 }),
  mkEx('leg-ext',   'quads', 'machine',    'isolation', { popularity: 5 }),
  mkEx('lunge-bw',  'quads', 'bodyweight', 'compound', { popularity: 2 }),

  // ── Poitrine ─────────────────────────────────────────────────────────────
  mkEx('bench-bb',   'chest',       'barbell',    'compound',  { popularity: 10 }),
  mkEx('pushup',     'chest',       'bodyweight', 'compound',  { popularity:  7 }),
  mkEx('fly-db',     'chest',       'dumbbell',   'isolation', { popularity:  5 }),
  mkEx('fly-bw',     'chest',       'bodyweight', 'isolation', { popularity:  3 }),
  mkEx('incline-bb', 'chest_upper', 'barbell',    'compound',  { popularity:  6 }),

  // ── Dos ──────────────────────────────────────────────────────────────────
  mkEx('pullup',    'back_width',     'bodyweight', 'compound',  { popularity: 9 }),
  mkEx('lat-cable', 'back_width',     'cable',      'compound',  { popularity: 8 }),
  mkEx('row-bb',    'back_thickness', 'barbell',    'compound',  { popularity: 9 }),
  mkEx('row-db',    'back_thickness', 'dumbbell',   'compound',  { popularity: 7 }),
  mkEx('pullover',  'back',           'bodyweight', 'isolation', { popularity: 3 }),

  // ── Épaules ──────────────────────────────────────────────────────────────
  mkEx('ohp-bb',    'shoulders',         'barbell',    'compound',  { popularity: 9 }),
  mkEx('pike-pu',   'shoulders',         'bodyweight', 'compound',  { popularity: 6 }),
  mkEx('lateral',   'shoulders_lateral', 'dumbbell',   'isolation', { popularity: 5 }),
  mkEx('rear-delt', 'shoulders_rear',    'dumbbell',   'isolation', { popularity: 4 }),
  mkEx('front-raise','shoulders_front',  'dumbbell',   'isolation', { popularity: 4 }),

  // ── Ischio-jambiers ───────────────────────────────────────────────────────
  mkEx('rdl-bb',   'hamstrings', 'barbell',    'compound',  { popularity: 8 }),
  mkEx('rdl-db',   'hamstrings', 'dumbbell',   'compound',  { popularity: 5 }),
  mkEx('leg-curl', 'hamstrings', 'machine',    'isolation', { popularity: 5 }),
  mkEx('nordic',   'hamstrings', 'bodyweight', 'isolation', { popularity: 4 }),

  // ── Fessiers ─────────────────────────────────────────────────────────────
  mkEx('hip-thrust', 'glutes', 'barbell',    'compound',  { popularity: 8 }),
  mkEx('glute-bw',   'glutes', 'bodyweight', 'isolation', { popularity: 4 }),

  // ── Biceps ───────────────────────────────────────────────────────────────
  mkEx('curl-bb', 'biceps', 'barbell',    'isolation', { popularity: 8 }),
  mkEx('curl-bw', 'biceps', 'bodyweight', 'isolation', { popularity: 4 }),

  // ── Triceps ──────────────────────────────────────────────────────────────
  mkEx('dip',      'triceps', 'bodyweight', 'compound',  { popularity: 8 }),
  mkEx('pushdown', 'triceps', 'cable',      'isolation', { popularity: 7 }),
  mkEx('tri-ext',  'triceps', 'dumbbell',   'isolation', { popularity: 5 }),

  // ── Avant-bras ───────────────────────────────────────────────────────────
  mkEx('wrist-curl', 'forearms', 'barbell', 'isolation', { popularity: 4 }),

  // ── Mollets ──────────────────────────────────────────────────────────────
  mkEx('calf-bb', 'calves', 'barbell',    'isolation', { popularity: 5 }),
  mkEx('calf-bw', 'calves', 'bodyweight', 'isolation', { popularity: 6 }),
]

// Équipements courants utilisés dans les tests
const FULL_GYM: Exercise['equipment'][]  = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']
const BODYWEIGHT: Exercise['equipment'][] = ['bodyweight']

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retourne les exerciseId du premier workout (warmup + main + core). */
function firstWorkoutIds(
  params: Parameters<typeof generateProgramDraft>[0],
  pool = POOL,
): string[] {
  return generateProgramDraft(params, pool).workouts[0]!.exercises.map((e) => e.exerciseId)
}

/** Retourne les types de workout générés (push / pull / legs / fullbody…). */
function splitTypes(params: Parameters<typeof generateProgramDraft>[0], pool = POOL): string[] {
  return generateProgramDraft(params, pool).workouts.map((w) => w.type)
}

// ── Sélection du split ────────────────────────────────────────────────────────

describe('selectSplit', () => {
  it('2 j → fullbody × 2', () => {
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 2, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }))
      .toEqual(['fullbody', 'fullbody'])
  })

  it('3 j + force + intermédiaire → PPL', () => {
    expect(splitTypes({ goal: 'strength', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'intermediate' }))
      .toEqual(['push', 'pull', 'legs'])
  })

  it('3 j + force + débutant → fullbody × 3', () => {
    expect(splitTypes({ goal: 'strength', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }))
      .toEqual(['fullbody', 'fullbody', 'fullbody'])
  })

  it('4 j + hypertrophie → upper/lower alternés', () => {
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 4, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }))
      .toEqual(['upper', 'lower', 'upper', 'lower'])
  })

  it('5 j + force + intermédiaire → PPL + upper + lower', () => {
    expect(splitTypes({ goal: 'strength', daysPerWeek: 5, sessionDuration: 60, equipment: FULL_GYM, level: 'intermediate' }))
      .toEqual(['push', 'pull', 'legs', 'upper', 'lower'])
  })
})

// ── Jours assignés ─────────────────────────────────────────────────────────────

describe('day assignments', () => {
  it('2 j → lundi + jeudi', () => {
    const d = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
    expect(Object.keys(d.week).sort()).toEqual(['monday', 'thursday'])
  })

  it('3 j → lundi, mercredi, vendredi', () => {
    const d = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 3, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
    expect(Object.keys(d.week).sort()).toEqual(['friday', 'monday', 'wednesday'])
  })

  it('selectedDays remplace les jours par défaut', () => {
    const d = generateProgramDraft({
      goal: 'fat_loss', daysPerWeek: 3, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner',
      selectedDays: ['tuesday', 'thursday', 'saturday'],
    }, POOL)
    expect(Object.keys(d.week).sort()).toEqual(['saturday', 'thursday', 'tuesday'])
  })
})

// ── Warmup et core ────────────────────────────────────────────────────────────

describe('warmup — position et spec', () => {
  const baseParams = { goal: 'hypertrophy' as const, daysPerWeek: 3 as const, sessionDuration: 60 as const, equipment: FULL_GYM, level: 'beginner' as const }

  it('le premier exercice du workout est un warmup', () => {
    const d = generateProgramDraft(baseParams, POOL)
    const firstWE = d.workouts[0]!.exercises[0]!
    expect(firstWE.exerciseId).toBe('wu-bw')
  })

  it('warmup : 2 séries, repsMode fixed, repos 0 s, autoProgress false', () => {
    const d = generateProgramDraft(baseParams, POOL)
    const we = d.workouts[0]!.exercises[0]!
    expect(we.targetSets).toBe(2)
    expect(we.repsMode).toBe('fixed')
    expect(we.targetRepsMin).toBe(10)
    expect(we.targetRepsMax).toBe(10)
    expect(we.restSec).toBe(0)
    expect(we.autoProgress).toBe(false)
  })
})

describe('core — position et spec', () => {
  const baseParams = { goal: 'hypertrophy' as const, daysPerWeek: 3 as const, sessionDuration: 60 as const, equipment: FULL_GYM, level: 'beginner' as const }

  it('le dernier exercice du workout est un core', () => {
    const d = generateProgramDraft(baseParams, POOL)
    const exercises = d.workouts[0]!.exercises
    const lastWE = exercises.at(-1)!
    // core-bw est le premier dans corePool (ordre POOL) — workout n°0 → index 0
    expect(lastWE.exerciseId).toBe('core-bw')
  })

  it('core : 3 séries, repsMode fixed, repos 60 s', () => {
    const d = generateProgramDraft(baseParams, POOL)
    const we = d.workouts[0]!.exercises.at(-1)!
    expect(we.targetSets).toBe(3)
    expect(we.repsMode).toBe('fixed')
    expect(we.targetRepsMin).toBe(15)
    expect(we.targetRepsMax).toBe(15)
    expect(we.restSec).toBe(60)
  })
})

// ── Filtrage équipement pour warmup/core ─────────────────────────────────────

describe('warmup/core — filtrage par équipement', () => {
  it('user poids du corps : warmup bodyweight uniquement (pas élastique)', () => {
    const ids = firstWorkoutIds({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' })
    expect(ids[0]).toBe('wu-bw')
    expect(ids).not.toContain('wu-band')
  })

  it('user poids du corps : core bodyweight uniquement (pas câble)', () => {
    const ids = firstWorkoutIds({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' })
    expect(ids.at(-1)).toBe('core-bw')
    expect(ids).not.toContain('core-cable')
  })

  it('user avec élastique : warmup élastique accessible', () => {
    // wu-bw (pop 5) et wu-band (pop 4) sont tous les deux dans le pool
    // premier workout → warmupPool[0 % 2] = wu-bw (premier dans POOL)
    // vérifie au moins que wu-band n'est PAS exclu du pool via le 2e workout
    const d = generateProgramDraft({ goal: 'endurance', daysPerWeek: 2, sessionDuration: 60, equipment: ['band', 'bodyweight'], level: 'beginner' }, POOL)
    const secondIds = d.workouts[1]!.exercises.map((e) => e.exerciseId)
    // workout 1 → warmupPool[1 % 2] = wu-band
    expect(secondIds[0]).toBe('wu-band')
  })
})

// ── Priorité équipement (force + compound) ────────────────────────────────────

describe('strengthEquipmentPrio', () => {
  it('objectif force : barbell prioritaire sur poids du corps pour compound', () => {
    // squat-bb (barbell, pop 10) et squat-bw (bodyweight, pop 3) tous les deux dispo
    // prio équipement : barbell(0) < bodyweight(4) → squat-bb doit être choisi
    const ids = firstWorkoutIds({
      goal: 'strength', daysPerWeek: 2, sessionDuration: 60,
      equipment: ['barbell', 'bodyweight'], level: 'beginner',
    })
    expect(ids).toContain('squat-bb')
    expect(ids).not.toContain('squat-bw')
  })

  it('objectif hypertrophie : popularité prime (pas de prio équipement)', () => {
    // Hypertrophie : pas de prio équipement → squat-bb (pop 10) reste en tête via popularité
    const ids = firstWorkoutIds({
      goal: 'hypertrophy', daysPerWeek: 2, sessionDuration: 60,
      equipment: ['barbell', 'bodyweight'], level: 'beginner',
    })
    // squat-bb doit être là (plus populaire, pas de raison de prendre squat-bw)
    expect(ids).toContain('squat-bb')
  })
})

// ── Slots fullbody (8 slots — biceps ET triceps indépendants) ─────────────────
// SLOTS.fullbody : quads, chest, back, ham/glutes, sh_lat/rear, shoulders OHP, biceps, triceps

describe('fullbody — 8 slots (biceps et triceps séparés)', () => {
  const params = { goal: 'hypertrophy' as const, daysPerWeek: 2 as const, sessionDuration: 60 as const, equipment: FULL_GYM, level: 'beginner' as const }

  it('le workout fullbody contient un exercice biceps', () => {
    const ids = firstWorkoutIds(params)
    const bicepsExs = POOL.filter((e) => e.primaryMuscle === 'biceps').map((e) => e.id)
    expect(ids.some((id) => bicepsExs.includes(id))).toBe(true)
  })

  it('le workout fullbody contient un exercice triceps', () => {
    const ids = firstWorkoutIds(params)
    const tricepsExs = POOL.filter((e) => e.primaryMuscle === 'triceps').map((e) => e.id)
    expect(ids.some((id) => tricepsExs.includes(id))).toBe(true)
  })

  it('fullbody 60 min = 8 slots + 1 warmup + 1 core = 10 exercices', () => {
    const ids = firstWorkoutIds(params)
    expect(ids).toHaveLength(10)
  })
})

// ── Slot forearms standalone (non couplé aux biceps) ─────────────────────────

describe('pull — slot forearms indépendant', () => {
  it('le workout pull contient un exercice forearms distinct du biceps', () => {
    // PPL : level intermédiaire requis (beginner → fullbody)
    const d = generateProgramDraft({ goal: 'strength', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'intermediate' }, POOL)
    const pullWorkout = d.workouts.find((w) => w.type === 'pull')!
    const exIds = pullWorkout.exercises.map((e) => e.exerciseId)
    const forearmExs  = POOL.filter((e) => e.primaryMuscle === 'forearms').map((e) => e.id)
    const bicepsExs   = POOL.filter((e) => e.primaryMuscle === 'biceps').map((e) => e.id)
    // Un exercice forearms doit être présent
    expect(exIds.some((id) => forearmExs.includes(id))).toBe(true)
    // Un exercice biceps doit aussi être présent (slot distinct)
    expect(exIds.some((id) => bicepsExs.includes(id))).toBe(true)
  })
})

// ── Pas de doublons intra-workout ─────────────────────────────────────────────

describe('no duplicate exercises within a workout', () => {
  it('tous les exerciceId sont uniques dans un même workout', () => {
    const d = generateProgramDraft({ goal: 'hypertrophy', daysPerWeek: 4, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }, POOL)
    for (const w of d.workouts) {
      const ids = w.exercises.map((e) => e.exerciseId)
      expect(ids).toHaveLength(new Set(ids).size)
    }
  })
})

// ── Nommage des workouts ──────────────────────────────────────────────────────

describe('workout naming', () => {
  it('fullbody × 2 → "Full Body A" et "Full Body B"', () => {
    const d = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
    expect(d.workouts[0]!.name).toBe('Full Body A')
    expect(d.workouts[1]!.name).toBe('Full Body B')
  })

  it('PPL → pas de suffixe lettre', () => {
    // level intermediate requis : beginner 3j force → fullbody
    const d = generateProgramDraft({ goal: 'strength', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'intermediate' }, POOL)
    expect(d.workouts[0]!.name).toBe('Push — Poussée')
    expect(d.workouts[1]!.name).toBe('Pull — Tirage')
    expect(d.workouts[2]!.name).toBe('Legs — Jambes')
  })

  it('upper/lower × 2 → "Upper A/B" et "Lower A/B"', () => {
    const d = generateProgramDraft({ goal: 'hypertrophy', daysPerWeek: 4, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }, POOL)
    const names = d.workouts.map((w) => w.name)
    expect(names).toContain('Upper — Haut du corps A')
    expect(names).toContain('Upper — Haut du corps B')
    expect(names).toContain('Lower — Bas du corps A')
    expect(names).toContain('Lower — Bas du corps B')
  })
})

// ── Ajustement de durée ───────────────────────────────────────────────────────

describe('adjustedSlotCount — durée de séance', () => {
  // Fullbody base = 8 slots (après ajout slot back_thickness)
  const base = { goal: 'hypertrophy' as const, daysPerWeek: 2 as const, equipment: FULL_GYM, level: 'beginner' as const }

  it('20 min → max(2, floor(8×0.5)) = 4 slots + warmup + core = 6 exercices', () => {
    const ids = firstWorkoutIds({ ...base, sessionDuration: 20 })
    expect(ids).toHaveLength(6)
  })

  it('45 min → max(3, floor(8×0.75)) = 6 slots + warmup + core = 8 exercices', () => {
    const ids = firstWorkoutIds({ ...base, sessionDuration: 45 })
    expect(ids).toHaveLength(8)
  })

  it('60 min → 8 slots + warmup + core = 10 exercices', () => {
    const ids = firstWorkoutIds({ ...base, sessionDuration: 60 })
    expect(ids).toHaveLength(10)
  })

  it('90 min → min(8+2,8)=8 → slice limité à 8 éléments → idem 60 min = 10 exercices', () => {
    // adjustedSlotCount(8, 90) = min(10,8) = 8 (cap à 8)
    // SLOTS.fullbody a exactement 8 entrées → même résultat qu'à 60 min
    const ids = firstWorkoutIds({ ...base, sessionDuration: 90 })
    expect(ids).toHaveLength(10)
  })
})

// ── Ajustement de séries selon la durée ──────────────────────────────────────

describe('adjustedSpec — sets selon sessionDuration', () => {
  const compound4 = { sets: 4, repsMin: 8, repsMax: 12, restSec: 90, range: true as const }
  const compound5 = { sets: 5, repsMin: 3, repsMax: 5,  restSec: 180, range: true as const }
  const compound3 = { sets: 3, repsMin: 15, repsMax: 20, restSec: 60, range: true as const }

  it('60 min → inchangé', () => {
    expect(adjustedSpec(compound4, 60).sets).toBe(4)
    expect(adjustedSpec(compound5, 60).sets).toBe(5)
  })

  it('90 min → inchangé', () => {
    expect(adjustedSpec(compound4, 90).sets).toBe(4)
  })

  it('45 min → floor(sets × 0.75), min 2', () => {
    expect(adjustedSpec(compound4, 45).sets).toBe(3)  // floor(4×0.75)=3
    expect(adjustedSpec(compound5, 45).sets).toBe(3)  // floor(5×0.75)=3
    expect(adjustedSpec(compound3, 45).sets).toBe(2)  // floor(3×0.75)=2
  })

  it('20 min → floor(sets × 0.5), min 2', () => {
    expect(adjustedSpec(compound4, 20).sets).toBe(2)  // floor(4×0.5)=2
    expect(adjustedSpec(compound5, 20).sets).toBe(2)  // floor(5×0.5)=2
    expect(adjustedSpec(compound3, 20).sets).toBe(2)  // floor(3×0.5)=1 → min 2
  })

  it('repsMin/repsMax/restSec inchangés', () => {
    const s = adjustedSpec(compound4, 20)
    expect(s.repsMin).toBe(compound4.repsMin)
    expect(s.repsMax).toBe(compound4.repsMax)
    expect(s.restSec).toBe(compound4.restSec)
  })

  it('20 min hypertrophy fullbody : targetSets = 2 pour tous les exercices principaux', () => {
    const d = generateProgramDraft(
      { goal: 'hypertrophy', daysPerWeek: 2, sessionDuration: 20, equipment: FULL_GYM, level: 'beginner' },
      POOL,
    )
    const mainWEs = d.workouts[0]!.exercises.filter((we) => {
      const ex = POOL.find((e) => e.id === we.exerciseId)
      return ex && !ex.isWarmupExercise && ex.primaryMuscle !== 'core'
    })
    for (const we of mainWEs) {
      expect(we.targetSets).toBe(2)
    }
  })
})

// ── Propriétés du programme généré ───────────────────────────────────────────

describe('generateProgramDraft — propriétés générales', () => {
  it('le nombre de séances correspond à daysPerWeek', () => {
    for (const daysPerWeek of [2, 3, 4, 5] as const) {
      const d = generateProgramDraft({ goal: 'fat_loss', daysPerWeek, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
      expect(d.workouts).toHaveLength(daysPerWeek)
    }
  })

  it('la durée du programme correspond au niveau', () => {
    const beginner = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
    const advanced = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'advanced' }, POOL)
    expect(beginner.durationWeeks).toBe(8)
    expect(advanced.durationWeeks).toBe(16)
  })

  it('chaque jour du week map correspond à un workout existant', () => {
    const d = generateProgramDraft({ goal: 'hypertrophy', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner' }, POOL)
    const workoutIds = new Set(d.workouts.map((w) => w.localId))
    for (const id of Object.values(d.week)) {
      expect(workoutIds.has(id)).toBe(true)
    }
  })

  it('poids du corps : autoProgress false + progressStepKg 0 pour tout exercice BW', () => {
    const d = generateProgramDraft({ goal: 'fat_loss', daysPerWeek: 2, sessionDuration: 60, equipment: BODYWEIGHT, level: 'beginner' }, POOL)
    const mainExercises = d.workouts[0]!.exercises.slice(1, -1) // exclut warmup + core
    for (const we of mainExercises) {
      const ex = POOL.find((e) => e.id === we.exerciseId)!
      if (ex.equipment === 'bodyweight') {
        expect(we.progressStepKg).toBe(0)
      }
    }
  })
})

// ── workoutTypeFromFocus — comportement sémantique ────────────────────────────
// Vérifié via splitTypes() : workoutTypeFromFocus contrôle le type de TOUTES les
// séances quand il retourne une valeur non-null.
//
// FocusMuscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'
//   hasLower = includes('legs')
//   hasPush  = includes('chest') || includes('shoulders')
//   hasPull  = includes('back')
//   hasArms  = includes('arms')
//   hasUpper = hasPush || hasPull || hasArms
//
// Règles :
//   legs (± core), !upper        → 'lower'
//   core seul, !lower, !upper    → null  (fullbody équilibré — FIX BUG #3)
//   push seul, !pull, !legs      → 'push'
//   pull seul, !push, !legs      → 'pull'
//   upper mixte, !legs           → 'upper'
//   ambiguë / tout le corps      → null  (split par défaut)

describe('workoutTypeFromFocus — via splitTypes', () => {
  // Base : beginner 2j → sans focus = fullbody × 2
  const base = { goal: 'hypertrophy' as const, daysPerWeek: 2 as const, sessionDuration: 60 as const, equipment: FULL_GYM, level: 'beginner' as const }

  it('[BUG #3 fix] core seul → null → split fullbody (pas lower)', () => {
    // Régression critique : avant le fix, core seul retournait 'lower' (squats pour du gainage).
    expect(splitTypes({ ...base, focusMuscles: ['core'] }))
      .toEqual(['fullbody', 'fullbody'])
  })

  it('legs seul → lower × 2', () => {
    expect(splitTypes({ ...base, focusMuscles: ['legs'] }))
      .toEqual(['lower', 'lower'])
  })

  it('legs + core → lower × 2 (core ne neutralise pas legs)', () => {
    expect(splitTypes({ ...base, focusMuscles: ['legs', 'core'] }))
      .toEqual(['lower', 'lower'])
  })

  it('chest seul → push × 2', () => {
    expect(splitTypes({ ...base, focusMuscles: ['chest'] }))
      .toEqual(['push', 'push'])
  })

  it('shoulders seul → push × 2', () => {
    expect(splitTypes({ ...base, focusMuscles: ['shoulders'] }))
      .toEqual(['push', 'push'])
  })

  it('back seul → pull × 2', () => {
    expect(splitTypes({ ...base, focusMuscles: ['back'] }))
      .toEqual(['pull', 'pull'])
  })

  it('arms seul → upper × 2 (bras = haut du corps mixte)', () => {
    expect(splitTypes({ ...base, focusMuscles: ['arms'] }))
      .toEqual(['upper', 'upper'])
  })

  it('chest + back → upper × 2 (push + pull = haut mixte)', () => {
    expect(splitTypes({ ...base, focusMuscles: ['chest', 'back'] }))
      .toEqual(['upper', 'upper'])
  })

  it('chest + back + legs (tout le corps) → null → split par défaut fullbody', () => {
    // Ambiguïté totale → workoutTypeFromFocus retourne null → selectSplit par défaut
    expect(splitTypes({ ...base, focusMuscles: ['chest', 'back', 'legs'] }))
      .toEqual(['fullbody', 'fullbody'])
  })

  it('sans focusMuscles → split par défaut fullbody (contrôle)', () => {
    expect(splitTypes({ ...base }))
      .toEqual(['fullbody', 'fullbody'])
  })
})

// ── selectSplit — focusMuscles override indépendant du daysPerWeek ────────────
// Quand workoutTypeFromFocus retourne un type non-null, il remplace le split
// normal quel que soit le nombre de jours ou le niveau.

describe('selectSplit — focusMuscles override', () => {
  it('legs, 3j, beginner → lower × 3 (override PPL/fullbody)', () => {
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 3, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner', focusMuscles: ['legs'] }))
      .toEqual(['lower', 'lower', 'lower'])
  })

  it('chest, 4j, beginner → push × 4 (override upper/lower)', () => {
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 4, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner', focusMuscles: ['chest'] }))
      .toEqual(['push', 'push', 'push', 'push'])
  })

  it('chest + back, 5j, intermediate → upper × 5 (override PPL+upper+lower)', () => {
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 5, sessionDuration: 60, equipment: FULL_GYM, level: 'intermediate', focusMuscles: ['chest', 'back'] }))
      .toEqual(['upper', 'upper', 'upper', 'upper', 'upper'])
  })

  it('core seul, 4j, beginner → null → upper/lower par défaut (pas lower)', () => {
    // [BUG #3 fix] le split par défaut 4j beginner est upper/lower alternés,
    // pas lower × 4. Vérification que core seul ne force PAS lower.
    expect(splitTypes({ goal: 'hypertrophy', daysPerWeek: 4, sessionDuration: 60, equipment: FULL_GYM, level: 'beginner', focusMuscles: ['core'] }))
      .toEqual(['upper', 'lower', 'upper', 'lower'])
  })
})
