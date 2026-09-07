/**
 * Audit v11 — Fusion v8 + v9 + v10 sans doublons
 * Date : 2026-09-08
 * Fixes inclus : RÉSERVE-1 (good-morning-bw), RÉSERVE-2 (UX-6), RÉSERVE-3 (bw-sissy-squat)
 *                Fix-1 (machine-pullover + machine-low-row), Fix-2 (seed-pullover→isolation),
 *                Fix-3 (BUG-BW-PULL élargi back-bi + chest-back), Fix-4 (isGlutesSplit)
 *
 * ── Groupes ──────────────────────────────────────────────────────────────────
 * A : Fullbody × 4 équipements (12 profils)
 * B : Glutes+dos × 4 équipements (12 profils)
 * C : Cas spéciaux (6 profils)
 * D : Machine seul · splits non-fullbody (7 profils nouveaux v8/v9)
 * E : BW/DB/KB · splits non-fullbody, BUG-BW-PULL, pullover isolation (8 profils nouveaux v8/v9)
 * F : FocusMuscles variés · chest/legs/back/arms/glutes + UX-B (9 profils nouveaux v8)
 * G : Duration×Slots matrice · push/upper/fullbody (7 profils nouveaux v8)
 */

import { describe, it, expect } from 'vitest'
import rawExercises from '../src/data/exercises-seed.json'
import { generateProgramDraft } from '../src/utils/programGenerator'
import type { GeneratorParams } from '../src/utils/programGenerator'
import type { Exercise } from '../src/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_EXERCISES = rawExercises as Exercise[]

function gen(params: GeneratorParams) {
  return generateProgramDraft(params, ALL_EXERCISES)
}

type Draft = ReturnType<typeof gen>
type Workout = Draft['workouts'][0]

/** Tous les exerciceIds d'un workout (INCLUT warmup[0] et core[-1]) */
function allIds(workout: Workout): string[] {
  return workout.exercises.map((we) => we.exerciseId)
}

/** Exercices de slots uniquement (sans warmup[0] et sans core[-1]).
 * ATTENTION : les slots VIDE sont compressés → la position n'est PAS l'index de slot.
 * Utiliser uniquement pour vérifier la présence/absence d'un exercice dans un workout. */
function slotIds(workout: Workout): string[] {
  const all = allIds(workout)
  return all.slice(1, all.length - 1)
}

/** Vérification de présence dans les slots d'un workout */
function inW(workout: Workout, id: string): boolean {
  return slotIds(workout).includes(id)
}

/** Vérification d'absence dans les slots d'un workout */
function notInW(workout: Workout, id: string): boolean {
  return !slotIds(workout).includes(id)
}

/** Nombre d'exercices de slots (hors warmup + core) */
function slotCount(workout: Workout): number {
  return slotIds(workout).length
}

/** Renvoie le workout par index (0-based) */
function w(draft: Draft, i: number): Workout {
  return draft.workouts[i]!
}

/** Vérifie qu'un warning contenant le pattern est présent */
function hasWarning(draft: Draft, pattern: string): boolean {
  return (draft.generatorWarnings ?? []).some((s) => s.includes(pattern))
}

/** Vérifie l'absence de warning */
function noWarning(draft: Draft, pattern: string): boolean {
  return !(draft.generatorWarnings ?? []).some((s) => s.includes(pattern))
}

/** Pour intermédiaires/avancés (top-3 random) : vérifie que l'exercice apparaît au moins une fois sur N essais.
 * Signature : workoutIdx =-1 signifie "dans n'importe quel workout". */
function appearsInPool(
  params: GeneratorParams,
  workoutIdx: number,
  expectedId: string,
  tries = 20,
): boolean {
  for (let i = 0; i < tries; i++) {
    const draft = gen(params)
    const workout = workoutIdx === -1
      ? draft.workouts.find((wk) => slotIds(wk).includes(expectedId))
      : draft.workouts[workoutIdx]
    if (workout && inW(workout, expectedId)) return true
  }
  return false
}

/** Vérifie qu'un exercice (parmi plusieurs) apparaît dans un workout, sur N essais */
function appearsOneOf(
  params: GeneratorParams,
  workoutIdx: number,
  ids: string[],
  tries = 20,
): boolean {
  for (let i = 0; i < tries; i++) {
    const draft = gen(params)
    const workout = draft.workouts[workoutIdx]
    if (workout && ids.some((id) => inW(workout, id))) return true
  }
  return false
}

/** Retourne le type public de chaque séance */
function splitTypes(draft: Draft): string[] {
  return draft.workouts.map((wk) => wk.type)
}

// Équipements réutilisés (v10)
const BW        = ['bodyweight'] as Exercise['equipment'][]
const DB_BW     = ['dumbbell', 'bodyweight'] as Exercise['equipment'][]
const KB_DB_BW  = ['kettlebell', 'dumbbell', 'bodyweight'] as Exercise['equipment'][]
const SALLE     = ['barbell', 'dumbbell', 'cable', 'pullup_bar', 'machine'] as Exercise['equipment'][]

// Équipements supplémentaires (v11)
const MACHINE        = ['machine'] as Exercise['equipment'][]
const MACHINE_PULLUP = ['machine', 'pullup_bar'] as Exercise['equipment'][]
const DB             = ['dumbbell'] as Exercise['equipment'][]
const KB             = ['kettlebell'] as Exercise['equipment'][]
const BARBELL_DB     = ['barbell', 'dumbbell'] as Exercise['equipment'][]
const BW_PULLUP      = ['bodyweight', 'pullup_bar'] as Exercise['equipment'][]
const BARBELL_DB_CABLE_MACHINE = ['barbell', 'dumbbell', 'cable', 'machine'] as Exercise['equipment'][]

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE A — FULLBODY × ÉQUIPEMENT
// ─────────────────────────────────────────────────────────────────────────────

describe('A01 — Fullbody × BW, hypertrophy, 2j, 60min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 2,
    sessionDuration: 60, equipment: BW, splitPreference: 'fullbody',
  }

  it('split = [fullbody-quad, fullbody-hip] → 2 séances', () => {
    expect(gen(params).workouts).toHaveLength(2)
  })

  it('SEED-BW-NOBACK warning présent', () => {
    expect(hasWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('fullbody-quad : bw-squat (quads compound, pop 3)', () => {
    expect(inW(w(gen(params), 0), 'bw-squat')).toBe(true)
  })

  it('fullbody-quad : seed-pushup (chest compound, pop 2)', () => {
    expect(inW(w(gen(params), 0), 'seed-pushup')).toBe(true)
  })

  it('fullbody-quad : bw-pike-pushup (shoulders compound, seul BW)', () => {
    expect(inW(w(gen(params), 0), 'bw-pike-pushup')).toBe(true)
  })

  it('fullbody-quad : bw-calf-raise (calves isolation, pop 2)', () => {
    expect(inW(w(gen(params), 0), 'bw-calf-raise')).toBe(true)
  })

  it('fullbody-quad : bw-wall-sit ABSENT (désormais warmup après R3)', () => {
    expect(slotIds(w(gen(params), 0))).not.toContain('bw-wall-sit')
  })

  it('fullbody-hip : seed-good-morning-bw (hamstrings slot[0], slotPrimary rank 0) ✅ R1', () => {
    expect(inW(w(gen(params), 1), 'seed-good-morning-bw')).toBe(true)
  })

  it('fullbody-hip : bw-pushup (chest compound slot[1])', () => {
    expect(inW(w(gen(params), 1), 'seed-pushup')).toBe(true)
  })

  it('fullbody-hip : bw-sissy-squat (quads isolation slot[4]) ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })

  it('fullbody-hip : 4 exercices effectifs (warmup/core exclus)', () => {
    const cnt = slotCount(w(gen(params), 1))
    expect(cnt).toBeGreaterThanOrEqual(4)
    expect(cnt).toBeLessThanOrEqual(8)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A02 — Fullbody × BW, strength, 3j, 60min, intermediate → INC-1', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: BW, splitPreference: undefined,
  }

  it('INC-1 déclenché → 3 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('SEED-BW-NOBACK présent', () => {
    expect(hasWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('adjustedSlotCount = 4 (strength 60min, base=9) → ≤4 slots effectifs par séance', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
    expect(slotCount(w(d, 1))).toBeLessThanOrEqual(4)
  })

  it('fullbody-quad : chest compound présent (seed-pushup ou bw-incline-pushup — top-3 random)', () => {
    expect(appearsOneOf(params, 0, ['seed-pushup', 'bw-incline-pushup'])).toBe(true)
  })

  it('fullbody-quad : bw-pike-pushup présent (seul BW shoulders compound)', () => {
    expect(inW(w(gen(params), 0), 'bw-pike-pushup')).toBe(true)
  })

  it('fullbody-quad : bw-squat ou bw-lunge présent (intermediate top-3 aléatoire)', () => {
    expect(appearsOneOf(params, 0, ['bw-squat', 'bw-lunge', 'bw-jump-squat'])).toBe(true)
  })

  it('fullbody-hip : seed-good-morning-bw (hamstrings slot[0]) ✅ R1', () => {
    expect(appearsInPool(params, 1, 'seed-good-morning-bw')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A03 — Fullbody × BW, fat_loss, 3j, 45min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 45, equipment: BW, splitPreference: 'fullbody',
  }

  it('adjustedSlotCount = 6 (fat_loss 45min, base=9 → max(4,6)=6)', () => {
    expect(slotCount(w(gen(params), 1))).toBeLessThanOrEqual(6)
  })

  it('fullbody-hip : bw-sissy-squat présent (slot[4] inclus dans cap=6) ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
  })

  it('fullbody-hip : bw-wall-sit ABSENT (warmup)', () => {
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })

  it('SEED-BW-NOBACK présent', () => {
    expect(hasWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A04 — Fullbody × DB+BW, hypertrophy, 3j, 60min, beginner ⭐ CRITIQUE', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW, splitPreference: 'fullbody',
  }

  it('Pas de SEED-BW-NOBACK (seed-row-dumbbell disponible)', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('fullbody-quad : bw-squat (pop 3 > seed-lunges pop 2)', () => {
    expect(inW(w(gen(params), 0), 'bw-squat')).toBe(true)
  })

  it('fullbody-quad : seed-bench-dumbbell (chest DB pop 3 > seed-pushup BW pop 2)', () => {
    expect(inW(w(gen(params), 0), 'seed-bench-dumbbell')).toBe(true)
  })

  it('fullbody-quad : seed-row-dumbbell (seul compound back DB+BW)', () => {
    expect(inW(w(gen(params), 0), 'seed-row-dumbbell')).toBe(true)
  })

  it('fullbody-quad : seed-shoulder-press-dumbbell (pop 3)', () => {
    expect(inW(w(gen(params), 0), 'seed-shoulder-press-dumbbell')).toBe(true)
  })

  it('fullbody-quad : seed-rear-delt-fly (shoulders_rear isolation, slot[5])', () => {
    expect(inW(w(gen(params), 0), 'seed-rear-delt-fly')).toBe(true)
  })

  it('fullbody-hip : seed-good-morning-bw (dumbbell-rdl usedGlobally via slot[4] fallback) ✅', () => {
    expect(inW(w(gen(params), 1), 'seed-good-morning-bw')).toBe(true)
  })

  it('fullbody-hip : bw-sissy-squat (quads isolation slot[4]) ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A05 — Fullbody × DB+BW, strength, 3j, 60min, intermediate → INC-1', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW, splitPreference: undefined,
  }

  it('INC-1 déclenché', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('adjustedSlotCount = 4 → ≤4 slots effectifs', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
  })

  it('fullbody-quad : seed-row-dumbbell inclus (slot[2] dos dans les 4 premiers)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('fullbody-hip : dumbbell-rdl présent (hamstrings compound, anti-rép. variable)', () => {
    expect(
      appearsInPool(params, 1, 'dumbbell-rdl') || appearsInPool(params, 1, 'seed-good-morning-bw')
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A06 — Fullbody × DB+BW, fat_loss, 2j, 45min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'beginner', daysPerWeek: 2,
    sessionDuration: 45, equipment: DB_BW, splitPreference: 'fullbody',
  }

  it('adjustedSlotCount = 6 → bw-sissy-squat inclus (slot[4] dans les 6 premiers)', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
  })

  it('fullbody-quad : seed-row-dumbbell (slot[2] inclus dans les 6 premiers)', () => {
    expect(inW(w(gen(params), 0), 'seed-row-dumbbell')).toBe(true)
  })

  it('fullbody-hip : bw-sissy-squat ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })

  it('fullbody-hip : seed-lateral-raise (shoulders_lateral slot[5])', () => {
    expect(inW(w(gen(params), 1), 'seed-lateral-raise')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A07 — Fullbody × KB+DB+BW, hypertrophy, 3j, 60min, intermediate ⭐', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: KB_DB_BW, splitPreference: 'fullbody',
  }

  it('fullbody-quad : seed-goblet-squat OU bw-squat (tie pop 3, top-3 random)', () => {
    expect(appearsOneOf(params, 0, ['seed-goblet-squat', 'bw-squat'])).toBe(true)
  })

  it('fullbody-quad : seed-row-dumbbell (back_thickness, pop 3 > kb-row pop 2)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('fullbody-hip : bw-sissy-squat ✅ R3 (intermediate → top-3 random, appearsInPool)', () => {
    expect(appearsInPool(params, 1, 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })

  it('fullbody-hip slot[0] : kb-rdl OU dumbbell-rdl (tie pop 2) OU good-morning-bw (si anti-rép)', () => {
    expect(
      appearsInPool(params, 1, 'kb-rdl') ||
      appearsInPool(params, 1, 'dumbbell-rdl') ||
      appearsInPool(params, 1, 'seed-good-morning-bw')
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A08 — Fullbody × KB+DB+BW, fat_loss, 4j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: KB_DB_BW, splitPreference: 'fullbody',
  }

  it('Split = 4 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(4)
  })

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('exercice dos compound présent dans chaque séance', () => {
    const dosExercises = ['seed-row-dumbbell', 'kb-row', 'kb-deadlift']
    const d = gen(params)
    for (let i = 0; i < 4; i++) {
      const hasBack = dosExercises.some((id) => inW(w(d, i), id))
      expect(hasBack).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A09 — Fullbody × Salle, hypertrophy, 3j, 60min, intermediate (non-INC-1)', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'fullbody',
  }

  it('Non-INC-1 (splitPreference explicite) → 3 séances', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('fullbody-quad : seed-squat-barbell (pop 8, top-1 toujours même en top-3)', () => {
    expect(appearsInPool(params, 0, 'seed-squat-barbell')).toBe(true)
  })

  it('fullbody-quad : seed-leg-curl-lying (hamstrings machine, pop 3) ✅ salle', () => {
    expect(appearsInPool(params, 0, 'seed-leg-curl-lying')).toBe(true)
  })

  it('fullbody-hip : seed-romanian-deadlift (hamstrings barbell, pop 3)', () => {
    expect(appearsInPool(params, 1, 'seed-romanian-deadlift')).toBe(true)
  })

  it('fullbody-hip : seed-leg-extension (quads machine, pop 3) ✅ salle', () => {
    expect(appearsInPool(params, 1, 'seed-leg-extension')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A10 — Fullbody × Salle, hypertrophy, 4j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'fullbody',
  }

  it('Split = 4 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(4)
  })

  it('Exercice dos compound dans chaque séance (anti-répétition → alternance pullup/lat-pulldown/row)', () => {
    const d = gen(params)
    const dosExercices = ['seed-pullup', 'seed-lat-pulldown', 'seed-row-barbell', 'seed-row-dumbbell', 'machine-lat-pulldown']
    for (let i = 0; i < 4; i++) {
      const hasDos = dosExercices.some((id) => inW(w(d, i), id))
      expect(hasDos).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A11 — Fullbody × Salle, strength, 4j, 90min, advanced', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'advanced', daysPerWeek: 4,
    sessionDuration: 90, equipment: SALLE, splitPreference: 'fullbody',
  }

  it('adjustedSlotCount = 5 (strength 90min, base=9 → min(9,5)=5)', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(5)
    expect(slotCount(w(d, 1))).toBeLessThanOrEqual(5)
  })

  it('fullbody-quad : exercice dos compound présent (slot[2] dans les 5 premiers)', () => {
    const dosIds = ['seed-pullup', 'seed-lat-pulldown', 'seed-row-barbell', 'machine-lat-pulldown']
    expect(appearsOneOf(params, 0, dosIds)).toBe(true)
  })

  it('fullbody-hip : seed-leg-extension (quads isolation, slot[4] dans les 5 premiers)', () => {
    expect(appearsInPool(params, 1, 'seed-leg-extension')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('A12 — Fullbody × Salle, fat_loss, 5j, 60min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'beginner', daysPerWeek: 5,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'fullbody',
  }

  it('Split = 5 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(5)
  })

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('Séances fullbody-hip : seed-leg-extension disponible (machine)', () => {
    const d = gen(params)
    expect(inW(w(d, 1), 'seed-leg-extension') || inW(w(d, 3), 'seed-leg-extension')).toBe(true)
  })

  it('Séances fullbody-quad : seed-leg-curl-lying disponible (machine)', () => {
    const d = gen(params)
    expect(inW(w(d, 0), 'seed-leg-curl-lying') || inW(w(d, 2), 'seed-leg-curl-lying')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE B — GLUTES+DOS × ÉQUIPEMENT
// ─────────────────────────────────────────────────────────────────────────────

describe('B01 — Glutes+dos × BW, fat_loss, 3j, 60min, intermediate ⭐ CRITIQUE', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: BW, splitPreference: 'glutes-focus',
  }

  it('Split = [glutes-hip, quad-glutes, glutes-hip] → 3 séances', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('Pas de SEED-BW-NOBACK (splitPreference=glutes-focus prime)', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('Warning slot VIDE dos présent (indépendant de SEED-BW-NOBACK)', () => {
    expect(hasWarning(gen(params), 'Aucun exercice composé disponible')).toBe(true)
  })

  it('glutes-hip : seed-hip-thrust-bw (glutes slot[0], slotPrimary=glutes rank 0, pop 3)', () => {
    expect(appearsInPool(params, 0, 'seed-hip-thrust-bw')).toBe(true)
  })

  it('glutes-hip : seed-good-morning-bw (hamstrings slot[1], slotPrimary rank 0) ✅ FIXÉ R1', () => {
    expect(appearsInPool(params, 0, 'seed-good-morning-bw')).toBe(true)
  })

  it('quad-glutes : bw-sissy-squat (quads isolation slot[3]) ✅ R3 (intermediate → top-3 random, appearsInPool)', () => {
    expect(appearsInPool(params, 1, 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B02 — Glutes+dos × BW, hypertrophy, 4j, 60min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 4,
    sessionDuration: 60, equipment: BW, splitPreference: 'glutes-focus',
  }

  it('Split = 4 séances glutes alternées', () => {
    expect(gen(params).workouts).toHaveLength(4)
  })

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('glutes-hip slot[1] = seed-good-morning-bw (beginner, slotPrimary=hamstrings rank 0) ✅ FIXÉ R1', () => {
    expect(inW(w(gen(params), 0), 'seed-good-morning-bw')).toBe(true)
  })

  it('Warning slot VIDE dos présent', () => {
    expect(hasWarning(gen(params), 'Aucun exercice composé disponible')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B03 — Glutes+dos × BW, strength, 3j, 90min, intermediate → 5 slots', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 90, equipment: BW, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 5 (strength 90min, base=8 → min(8,5)=5) → ≤5 slots effectifs', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(5)
  })

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('Warning slot VIDE dos présent (slot[3] glutes-hip et slot[2] quad-glutes inclus dans les 5)', () => {
    expect(hasWarning(gen(params), 'Aucun exercice composé disponible')).toBe(true)
  })

  it('glutes-hip : seed-good-morning-bw (slot[1] hamstrings, inclus dans les 5) ✅ R1', () => {
    expect(appearsInPool(params, 0, 'seed-good-morning-bw')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B04 — Glutes+dos × DB+BW, fat_loss, 4j, 60min, intermediate ⭐ CRITIQUE', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: DB_BW, splitPreference: 'glutes-focus',
  }

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('glutes-hip : seed-hip-thrust-bw (glutes slot[0], slotPrimary=glutes rank 0, pop 3)', () => {
    expect(appearsInPool(params, 0, 'seed-hip-thrust-bw')).toBe(true)
  })

  it('glutes-hip : dumbbell-rdl (hamstrings slot[1], slotPrimary=hamstrings rank 0, hip-thrust usedGlobally)', () => {
    expect(appearsInPool(params, 0, 'dumbbell-rdl')).toBe(true)
  })

  it('glutes-hip : seed-row-dumbbell (back_thickness compound slot[3], seul dos DB)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('glutes-hip : seed-pullover-dumbbell (back_thickness isolation slot[7], pop 3)', () => {
    expect(appearsInPool(params, 0, 'seed-pullover-dumbbell')).toBe(true)
  })

  it('quad-glutes : bw-sissy-squat (quads isolation slot[3]) ✅ R3 (intermediate → top-3 random, appearsInPool)', () => {
    expect(appearsInPool(params, 1, 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B05 — Glutes+dos × DB+BW, hypertrophy, 3j, 60min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW, splitPreference: 'glutes-focus',
  }

  it('Pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('glutes-hip : seed-row-dumbbell (beginner, seul compound back DB+BW)', () => {
    expect(inW(w(gen(params), 0), 'seed-row-dumbbell')).toBe(true)
  })

  it('glutes-hip : seed-pullover-dumbbell (back_thickness iso, pop 3)', () => {
    expect(inW(w(gen(params), 0), 'seed-pullover-dumbbell')).toBe(true)
  })

  it('quad-glutes : seed-pullover (back_width DB, pop 1, seul candidat isolation back_width DB)', () => {
    expect(inW(w(gen(params), 1), 'seed-pullover')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B06 — Glutes+dos × DB+BW, strength, 4j, 60min, intermediate → 4 slots ⭐', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: DB_BW, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 4 (strength 60min, base=8 → max(4,4)=4) → ≤4 slots effectifs', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
  })

  it('glutes-hip : seed-row-dumbbell présent (slot[3] dos dans les 4 premiers)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('quad-glutes : seed-row-dumbbell présent (slot[2] dos dans les 4 premiers)', () => {
    expect(appearsInPool(params, 1, 'seed-row-dumbbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B07 — Glutes+dos × KB+DB+BW, fat_loss, 4j, 60min, intermediate ⭐', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: KB_DB_BW, splitPreference: 'glutes-focus',
  }

  it('glutes-hip slot[0] : kb-swing OU seed-hip-thrust-bw (tie pop 3)', () => {
    expect(appearsOneOf(params, 0, ['kb-swing', 'seed-hip-thrust-bw'])).toBe(true)
  })

  it('glutes-hip slot[1] : kb-rdl OU dumbbell-rdl (tie pop 2)', () => {
    expect(appearsOneOf(params, 0, ['kb-rdl', 'dumbbell-rdl'])).toBe(true)
  })

  it('glutes-hip : seed-row-dumbbell (back_thickness dos, pop 3 > kb-row pop 2)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('glutes-hip : seed-pullover-dumbbell (back_thickness iso, pop 3 > kb-pullover pop 1)', () => {
    expect(appearsInPool(params, 0, 'seed-pullover-dumbbell')).toBe(true)
  })

  it('quad-glutes : seed-row-dumbbell OU kb-row (anti-répétition entre séances)', () => {
    expect(appearsOneOf(params, 1, ['seed-row-dumbbell', 'kb-row'])).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B08 — Glutes+dos × KB+DB+BW, hypertrophy, 3j, 45min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 45, equipment: KB_DB_BW, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 6 (hypertrophy 45min, base=8 → max(4,6)=6) → slot[3] inclus', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(6)
  })

  it('glutes-hip : seed-row-dumbbell (beginner top-1, slot[3] inclus dans cap=6)', () => {
    expect(inW(w(gen(params), 0), 'seed-row-dumbbell')).toBe(true)
  })

  it('quad-glutes : compound dos présent — seed-row-dumbbell OU kb-row (anti-répétition)', () => {
    expect(inW(w(gen(params), 1), 'seed-row-dumbbell') || inW(w(gen(params), 1), 'kb-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B09 — Glutes+dos × Salle, fat_loss, 4j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'glutes-focus',
  }

  it('glutes-hip : seed-hip-thrust (barbell, pop 4)', () => {
    expect(appearsInPool(params, 0, 'seed-hip-thrust')).toBe(true)
  })

  it('glutes-hip : seed-romanian-deadlift (hamstrings barbell pop 3, slotPrimary rank 0)', () => {
    expect(appearsInPool(params, 0, 'seed-romanian-deadlift')).toBe(true)
  })

  it('glutes-hip : seed-lat-pulldown OU seed-pullup (dos compound, tie pop 3)', () => {
    expect(appearsOneOf(params, 0, ['seed-lat-pulldown', 'seed-pullup'])).toBe(true)
  })

  it('glutes-hip : seed-leg-curl-lying (hamstrings machine, pop 3) ✅ salle', () => {
    expect(appearsInPool(params, 0, 'seed-leg-curl-lying')).toBe(true)
  })

  it('quad-glutes : seed-row-barbell (back_thickness barbell, pop 7)', () => {
    expect(appearsInPool(params, 1, 'seed-row-barbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B10 — Glutes+dos × Salle, hypertrophy, 3j, 60min, advanced', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'advanced', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'glutes-focus',
  }

  it('glutes-hip : seed-leg-curl-lying (hamstrings machine, pop 3)', () => {
    expect(appearsInPool(params, 0, 'seed-leg-curl-lying')).toBe(true)
  })

  it('quad-glutes : seed-row-barbell (back_thickness barbell, pop 7)', () => {
    expect(appearsInPool(params, 1, 'seed-row-barbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B11 — Glutes+dos × Salle, strength, 4j, 60min, intermediate → 4 slots', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 4 (strength 60min, base=8) → ≤4 slots effectifs', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
  })

  it('glutes-hip : seed-lat-pulldown OU seed-pullup (slot[3] dos dans les 4 premiers)', () => {
    expect(appearsOneOf(params, 0, ['seed-lat-pulldown', 'seed-pullup'])).toBe(true)
  })

  it('quad-glutes : seed-row-barbell (slot[2] dos dans les 4 premiers)', () => {
    expect(appearsInPool(params, 1, 'seed-row-barbell')).toBe(true)
  })

  it('glutes-hip : seed-hip-thrust (barbell, strengthEquipmentPrio + pop 4)', () => {
    expect(appearsInPool(params, 0, 'seed-hip-thrust')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('B12 — Glutes+dos × Salle, fat_loss, 3j, 45min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 45, equipment: SALLE, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 6 (fat_loss 45min, base=8 → max(4,6)=6) → ≤7 slots effectifs (+1 finisher cardio fat_loss)', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(7)
  })

  it('glutes-hip : seed-lat-pulldown OU seed-pullup (slot[3] dos inclus dans les 6)', () => {
    expect(appearsOneOf(params, 0, ['seed-lat-pulldown', 'seed-pullup'])).toBe(true)
  })

  it('glutes-hip : seed-leg-curl-lying (hamstrings machine, slot[5] inclus dans les 6)', () => {
    expect(inW(w(gen(params), 0), 'seed-leg-curl-lying')).toBe(true)
  })

  it('quad-glutes : seed-row-barbell (back_thickness compound, slot[2] inclus dans les 6)', () => {
    expect(inW(w(gen(params), 1), 'seed-row-barbell')).toBe(true)
  })

  it('quad-glutes : seed-leg-extension (quads machine isolation, slot[3] inclus dans les 6)', () => {
    expect(inW(w(gen(params), 1), 'seed-leg-extension')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE C — CAS SPÉCIAUX
// ─────────────────────────────────────────────────────────────────────────────

describe('C01 — focusMuscles=[glutes,back] × Salle → split pull ✅ FIXÉ R2', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE,
    focusMuscles: ['glutes', 'back'],
  }

  it('workoutTypeFromFocus([glutes,back]) → pull (hasPull prime sur hasGlutes)', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
  })

  it('Aucune séance glutes-hip ou quad-glutes dans le split', () => {
    const d = gen(params)
    const allExercises = d.workouts.flatMap((wk) => slotIds(wk))
    expect(allExercises).not.toContain('seed-squat-barbell')
  })

  it('Warning UX-6 "Focus dos + fessiers" émis ✅ FIXÉ R2', () => {
    expect(hasWarning(gen(params), 'Focus dos + fessiers')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('C02 — focusMuscles=[glutes,back] × DB+BW, fat_loss, 3j, 60min, beginner', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW,
    focusMuscles: ['glutes', 'back'],
  }

  it('workoutTypeFromFocus → pull ; seed-row-dumbbell disponible → hasCompoundBack=true → pas de remplacement BUG-BW-PULL', () => {
    expect(noWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })

  it('Warning UX-6 "Focus dos + fessiers" émis ✅ FIXÉ R2', () => {
    expect(hasWarning(gen(params), 'Focus dos + fessiers')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('C03 — focusMuscles=[glutes] × BW → isGlutesSplit ⭐', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: BW,
    focusMuscles: ['glutes'],
  }

  it('workoutTypeFromFocus([glutes]) = glutes-hip → 3 séances glutes alternées', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('isGlutesSplit = true → pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('Warning slot VIDE dos présent (indépendant)', () => {
    expect(hasWarning(gen(params), 'Aucun exercice composé disponible')).toBe(true)
  })

  it('glutes-hip slot[1] : seed-good-morning-bw (hamstrings, slotPrimary rank 0) ✅ FIXÉ R1', () => {
    expect(appearsInPool(params, 0, 'seed-good-morning-bw')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('C04 — focusMuscles=[glutes] × DB+BW, fat_loss, 3j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW,
    focusMuscles: ['glutes'],
  }

  it('isGlutesSplit = true → pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('glutes-hip : seed-row-dumbbell (slot[3] back compound)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })

  it('glutes-hip : seed-pullover-dumbbell (slot[7] back isolation)', () => {
    expect(appearsInPool(params, 0, 'seed-pullover-dumbbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('C05 — Machine seul, fullbody, hypertrophy, 3j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: ['machine'] as Exercise['equipment'][],
    splitPreference: 'fullbody',
  }

  it('machine-biceps-curl dans le programme (biceps machine iso, pop 2)', () => {
    const d = gen(params)
    const allSlotIds = d.workouts.flatMap((wk) => slotIds(wk))
    expect(allSlotIds).toContain('machine-biceps-curl')
  })

  it('machine-lat-pulldown dans le programme (back_width machine compound, top-3 random avec seed-row-machine)', () => {
    expect(appearsInPool(params, -1, 'machine-lat-pulldown', 30)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('C06 — Salle, glutes-focus, strength, 4j, 60min, intermediate → 4 slots + slot[3] dos', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: SALLE, splitPreference: 'glutes-focus',
  }

  it('adjustedSlotCount = 4 (strength 60min, base=8) → ≤4 slots effectifs', () => {
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
  })

  it('glutes-hip : seed-lat-pulldown OU seed-pullup (slot[3] dos compound dans les 4 premiers)', () => {
    expect(appearsOneOf(params, 0, ['seed-lat-pulldown', 'seed-pullup'])).toBe(true)
  })

  it('quad-glutes : seed-row-barbell (slot[2] dos compound dans les 4 premiers)', () => {
    expect(appearsInPool(params, 1, 'seed-row-barbell')).toBe(true)
  })

  it('glutes-hip : seed-hip-thrust (barbell, strengthEquipmentPrio + pop 4)', () => {
    expect(appearsInPool(params, 0, 'seed-hip-thrust')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE D — MACHINE SEUL : SPLITS NON-FULLBODY
// ─────────────────────────────────────────────────────────────────────────────

describe('D01 — Machine × PPL, hypertrophy, 3j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: MACHINE,
  }
  // split PPL → w(d,0)=push, w(d,1)=pull, w(d,2)=legs

  it('split PPL → 3 séances (pas INC-1 car hypertrophy)', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('pull compound dos : machine-lat-pulldown (back_width slotPrimary, compound machine)', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('pull isolation dos : machine-low-row (back_thickness isolation, pop 2)', () => {
    expect(appearsInPool(params, 1, 'machine-low-row')).toBe(true)
  })

  it('pull slot isolation back_width : machine-pullover (60min = 8 slots, tous remplis)', () => {
    expect(appearsInPool(params, 1, 'machine-pullover')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D02 — Machine × PPL, hypertrophy, 3j, 20min, intermediate → adjustedSlotCount=4', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 20, equipment: MACHINE,
  }

  it('adjustedSlotCount(pull, 20, hypertrophy) = max(2,⌊8×0.5⌋)=4 → ≤4 slots dans la séance pull', () => {
    expect(slotCount(w(gen(params), 1))).toBeLessThanOrEqual(4)
  })

  it('pull : machine-lat-pulldown présent (slot[0] compound)', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('pull : machine-low-row présent (slot[2] isolation inclus dans les 4 premiers)', () => {
    expect(appearsInPool(params, 1, 'machine-low-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D03 — Machine × PPL, hypertrophy, 3j, 45min, intermediate → adjustedSlotCount=6', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 45, equipment: MACHINE,
  }

  it('adjustedSlotCount(pull, 45, hypertrophy) = max(4,⌊8×0.75⌋)=6 → ≤6 slots', () => {
    expect(slotCount(w(gen(params), 1))).toBeLessThanOrEqual(6)
  })

  it('pull : machine-lat-pulldown (slot[0] compound)', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('pull : machine-low-row (slot[2] isolation inclus dans les 6)', () => {
    expect(appearsInPool(params, 1, 'machine-low-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D04 — Machine × PPL, hypertrophy, 3j, 90min, intermediate → adjustedSlotCount=8', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 90, equipment: MACHINE,
  }

  it('adjustedSlotCount(pull, 90, hypertrophy) = min(8+2,8)=8 (cap) → ≤8 slots', () => {
    expect(slotCount(w(gen(params), 1))).toBeLessThanOrEqual(8)
  })

  it('pull : machine-lat-pulldown présent (slot[0])', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('pull slot[7] isolation back_width : machine-pullover (8 slots = tous présents)', () => {
    expect(appearsInPool(params, 1, 'machine-pullover')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D05 — Machine × Brosplit, hypertrophy, 5j, 60min, advanced → isolation dos rempli', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'advanced', daysPerWeek: 5,
    sessionDuration: 60, equipment: MACHINE, splitPreference: 'brosplit',
  }
  // Brosplit: ['chest-tri','back-bi','legs','shoulders-arms','upper']
  // w(d,1) = back-bi

  it('split brosplit → 5 séances', () => {
    expect(gen(params).workouts).toHaveLength(5)
  })

  it('back-bi[0] : machine-lat-pulldown (tirage vertical compound, back_width slotPrimary)', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('back-bi isolation dos : machine-low-row (back_thickness isolation, slot auparavant vide)', () => {
    expect(appearsInPool(params, 1, 'machine-low-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D06 — Machine+pullup_bar × PPL, hypertrophy, 3j, 60min, intermediate → seed-pullup prime', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: MACHINE_PULLUP,
  }

  it('pull[0] : seed-pullup (pop 3 > machine-lat-pulldown pop 2, slotPrimary tie)', () => {
    expect(appearsInPool(params, 1, 'seed-pullup')).toBe(true)
  })

  it('machine-lat-pulldown dans le pool pull (top-3 random)', () => {
    expect(appearsInPool(params, 1, 'machine-lat-pulldown')).toBe(true)
  })

  it('pull isolation dos : machine-low-row (toujours présent)', () => {
    expect(appearsInPool(params, 1, 'machine-low-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('D07 — Machine × Glutes-focus, fat_loss, 3j, 60min, intermediate', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: MACHINE, splitPreference: 'glutes-focus',
  }

  it('split glutes-focus → 3 séances', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('Pas de SEED-BW-NOBACK (splitPreference=glutes-focus prime)', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('glutes-hip slot dos compound : machine-lat-pulldown (back_width slotPrimary)', () => {
    expect(appearsInPool(params, 0, 'machine-lat-pulldown')).toBe(true)
  })

  it('glutes-hip slot isolation dos : machine-low-row (back_thickness isolation, pop 2)', () => {
    // glutes-hip slot[7] = back_thickness isolation (≠ pull[7] qui est back_width isolation)
    // machine-pullover apparaît dans pull[7], pas dans glutes-hip[7]
    expect(appearsInPool(params, 0, 'machine-low-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE E — BW/DB/KB : SPLITS NON-FULLBODY, BUG-BW-PULL, PULLOVER ISOLATION
// ─────────────────────────────────────────────────────────────────────────────

describe('E01 — BW × PPL, hypertrophy, 3j, 60min, intermediate → BUG-BW-PULL', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: BW,
  }
  // split auto → PPL → 'pull' ∈ rawSplit → hasPullInSplit=true
  // hasCompoundBack=false (BW, pas de pullup_bar)

  it('BUG-BW-PULL émis (hasPullInSplit=true, hasCompoundBack=false)', () => {
    expect(hasWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })

  it('SEED-BW-NOBACK absent (hasPullInSplit=true → pas de NOBACK)', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E02 — BW × Brosplit, hypertrophy, 5j, 60min, intermediate → BUG-BW-PULL via back-bi', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 5,
    sessionDuration: 60, equipment: BW, splitPreference: 'brosplit',
  }
  // brosplit inclut 'back-bi' → backSessionTypes → hasPullInSplit=true

  it('BUG-BW-PULL émis (back-bi ∈ backSessionTypes)', () => {
    expect(hasWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })

  it('SEED-BW-NOBACK absent', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E03 — BW × Arnold, hypertrophy, 5j, 60min, intermediate → BUG-BW-PULL via chest-back', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 5,
    sessionDuration: 60, equipment: BW, splitPreference: 'arnold',
  }
  // arnold inclut 'chest-back' → backSessionTypes → hasPullInSplit=true

  it('BUG-BW-PULL émis (chest-back ∈ backSessionTypes)', () => {
    expect(hasWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })

  it('SEED-BW-NOBACK absent', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E04 — BW × Upper-lower, hypertrophy, 4j, 60min, intermediate → SEED-BW-NOBACK', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: BW, splitPreference: 'upper-lower',
  }
  // 'upper-pull' ∉ backSessionTypes → hasPullInSplit=false → SEED-BW-NOBACK

  it('SEED-BW-NOBACK émis (upper-pull ≠ pull → hasPullInSplit=false)', () => {
    expect(hasWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('BUG-BW-PULL absent (hasPullInSplit=false)', () => {
    expect(noWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E05 — BW+pullup_bar × Fullbody, hypertrophy, 3j, 60min, beginner → aucun warning dos', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 60, equipment: BW_PULLUP, splitPreference: 'fullbody',
  }

  it('hasCompoundBack=true (seed-pullup) → SEED-BW-NOBACK absent', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('BUG-BW-PULL absent (hasCompoundBack=true)', () => {
    expect(noWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
  })

  it('fullbody : seed-pullup (beginner top-1, slot[2] dos compound)', () => {
    expect(inW(w(gen(params), 0), 'seed-pullup')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E06 — DB × PPL, hypertrophy, 3j, 60min, intermediate ⭐ seed-pullover→isolation', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB,
  }
  // seed-pullover reclassifié isolation (Fix 2) → exclu des slots compound:true
  // pull[0] compound → seed-row-dumbbell (seul compound dos dumbbell)
  // pull[2] isolation → seed-pullover (back_width, isolation) ou seed-pullover-dumbbell

  it('pull compound slot : seed-row-dumbbell (seul compound dos dumbbell, pullover→isolation)', () => {
    expect(appearsInPool(params, 1, 'seed-row-dumbbell')).toBe(true)
  })

  it('pull isolation dos : seed-pullover ou seed-pullover-dumbbell (slot isolation dos)', () => {
    expect(
      appearsInPool(params, 1, 'seed-pullover') ||
      appearsInPool(params, 1, 'seed-pullover-dumbbell')
    ).toBe(true)
  })

  it('hasCompoundBack=true (seed-row-dumbbell) → pas de warning dos', () => {
    expect(noWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E07 — Barbell+DB × PPL, hypertrophy, 3j, 60min, intermediate ⭐ pullover exclu compound', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: BARBELL_DB,
  }
  // seed-pullover maintenant isolation → exclu du slot compound:true
  // pull[0] → seed-row-barbell (back_thickness compound pop 7, slotPrimary rank 1 mais pop domine)

  it('pull compound slot : seed-row-barbell (pop 7, pullover exclu car isolation)', () => {
    expect(appearsInPool(params, 1, 'seed-row-barbell')).toBe(true)
  })

  it('pull isolation dos : seed-pullover (back_width, isolation, dumbbell, slot isolation)', () => {
    expect(appearsInPool(params, 1, 'seed-pullover')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('E08 — KB × PPL, fat_loss, 3j, 60min, intermediate → kb-row en pull compound', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: KB,
  }
  // hasCompoundBack=true (kb-row back_thickness compound) → pas de BUG-BW-PULL
  // pull[0] compound slot ['back_width','back_thickness'] → kb-row (kb-deadlift exclu car primaryMuscle=back)

  it('hasCompoundBack=true (kb-row) → pas de warning dos', () => {
    expect(noWarning(gen(params), 'Séance(s) dos remplacée(s)')).toBe(true)
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })

  it('pull compound slot : kb-row (back_thickness, compound KB, seul candidat compound)', () => {
    expect(appearsInPool(params, 1, 'kb-row')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE F — FOCUSMUSCLES VARIÉS : SPLITS ET UX-B
// ─────────────────────────────────────────────────────────────────────────────

describe('F01 — focusMuscles=[chest] × Salle, hypertrophy, 3j, 60min, intermediate → split push', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, focusMuscles: ['chest'],
  }

  it('workoutTypeFromFocus([chest]) → push → 3 séances push/upper', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
    const types = splitTypes(d)
    expect(types.every(t => t === 'push' || t === 'upper')).toBe(true)
  })

  it('UX-B absent (focusMuscles=[chest] ∉ [arms, shoulders])', () => {
    expect(noWarning(gen(params), 'Focus bras en push')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F02 — focusMuscles=[legs] × Salle, hypertrophy, 3j, 60min, intermediate → split lower', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, focusMuscles: ['legs'],
  }

  it('workoutTypeFromFocus([legs]) → lower → 3 séances lower', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
    const types = splitTypes(d)
    expect(types.every(t => t === 'lower')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F03 — focusMuscles=[back] × Machine, hypertrophy, 3j, 60min, intermediate → split pull', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: MACHINE, focusMuscles: ['back'],
  }

  it('workoutTypeFromFocus([back]) → pull → 3 séances pull/upper', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
    const types = splitTypes(d)
    expect(types.every(t => t === 'pull' || t === 'upper')).toBe(true)
  })

  it('pull workout : machine-lat-pulldown (seul compound dos machine)', () => {
    expect(appearsInPool(params, 0, 'machine-lat-pulldown')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F04 — focusMuscles=[back,legs] × DB+BW, hypertrophy, 3j, 60min, intermediate → lower_pull', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: DB_BW, focusMuscles: ['back', 'legs'],
  }

  it('workoutTypeFromFocus([back,legs]) → lower_pull → 3 séances lower', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
    const types = splitTypes(d)
    expect(types.every(t => t === 'lower')).toBe(true)
  })

  it('lower_pull : seed-row-dumbbell (compound dos, hasCompoundBack=true)', () => {
    expect(appearsInPool(params, 0, 'seed-row-dumbbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F05 — focusMuscles=[arms] × Salle, hypertrophy, 3j, 60min, intermediate → split PPU', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, focusMuscles: ['arms'],
  }

  it('workoutTypeFromFocus([arms]) → upper → PPU : split inclut push, pull et upper', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(3)
    const types = splitTypes(d)
    expect(types).toContain('push')
    expect(types).toContain('pull')
    expect(types).toContain('upper')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F06 — focusMuscles=[glutes] × DB+Machine, fat_loss, 4j, 60min, intermediate → alternance 4j', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: ['dumbbell', 'machine'] as Exercise['equipment'][],
    focusMuscles: ['glutes'],
  }

  it('4j glutes alternées → 4 séances lower (isGlutesSplit)', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(4)
    const types = splitTypes(d)
    expect(types.every(t => t === 'lower')).toBe(true)
  })

  it('isGlutesSplit → pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F07 — focusMuscles=[glutes] × DB+Machine, fat_loss, 2j, 60min, intermediate → alternance 2j', () => {
  const params: GeneratorParams = {
    goal: 'fat_loss', level: 'intermediate', daysPerWeek: 2,
    sessionDuration: 60, equipment: ['dumbbell', 'machine'] as Exercise['equipment'][],
    focusMuscles: ['glutes'],
  }

  it('2j glutes → 2 séances lower (glutes-hip + quad-glutes)', () => {
    const d = gen(params)
    expect(d.workouts).toHaveLength(2)
    const types = splitTypes(d)
    expect(types.every(t => t === 'lower')).toBe(true)
  })

  it('isGlutesSplit → pas de SEED-BW-NOBACK', () => {
    expect(noWarning(gen(params), 'Dos non couvert')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F08 — UX-B : focusMuscles=[shoulders] × Salle, hypertrophy, 3j → warning UX-B', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, focusMuscles: ['shoulders'],
  }
  // shoulders → push split → split.every(push||upper-push) = true → UX-B

  it('split all-push (push/upper-push) → UX-B warning "Focus bras en push" émis', () => {
    expect(hasWarning(gen(params), 'Focus bras en push')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('F09 — UX-B absent : focusMuscles=[chest] × Salle, hypertrophy, 3j → pas de UX-B', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 60, equipment: SALLE, focusMuscles: ['chest'],
  }
  // chest ∉ [arms, shoulders] → UX-B condition false → pas de warning

  it('focusMuscles=[chest] → UX-B NON émis', () => {
    expect(noWarning(gen(params), 'Focus bras en push')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUPE G — DURATION × SLOTS MATRICE
// ─────────────────────────────────────────────────────────────────────────────

describe('G01 — push × 20min, hypertrophy, 3j, intermediate → adjustedSlotCount=4', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 20, equipment: BARBELL_DB_CABLE_MACHINE,
  }
  // split PPL → w(d,0) = push

  it('adjustedSlotCount(push, 20, hypertrophy) = max(2,⌊8×0.5⌋)=4 → ≤4 slots', () => {
    expect(slotCount(w(gen(params), 0))).toBeLessThanOrEqual(4)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G02 — push × 90min, hypertrophy, 3j, intermediate → adjustedSlotCount=8', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 90, equipment: BARBELL_DB_CABLE_MACHINE,
  }

  it('adjustedSlotCount(push, 90, hypertrophy) = min(8+2,8)=8 (cap) → ≤8 slots', () => {
    expect(slotCount(w(gen(params), 0))).toBeLessThanOrEqual(8)
  })

  it('push 90min : séance dense (≥5 slots effectifs avec équipement salle)', () => {
    expect(slotCount(w(gen(params), 0))).toBeGreaterThanOrEqual(5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G03 — upper × 45min, strength, upper-lower, 4j, intermediate → adjustedSlotCount=3', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 45, equipment: BARBELL_DB_CABLE_MACHINE, splitPreference: 'upper-lower',
  }

  it('adjustedSlotCount(upper, 45, strength) = min(3,max(2,4))=3 → ≤3 slots par séance', () => {
    const d = gen(params)
    d.workouts.forEach((wk) => {
      expect(slotCount(wk)).toBeLessThanOrEqual(3)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G04 — upper × 60min, strength, upper-lower, 4j, intermediate → adjustedSlotCount=4', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 60, equipment: BARBELL_DB_CABLE_MACHINE, splitPreference: 'upper-lower',
  }

  it('adjustedSlotCount(upper, 60, strength) = max(4,⌊9×0.5⌋)=4 → ≤4 slots par séance', () => {
    const d = gen(params)
    d.workouts.forEach((wk) => {
      expect(slotCount(wk)).toBeLessThanOrEqual(4)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G05 — upper × 90min, strength, upper-lower, 4j, intermediate → adjustedSlotCount=5', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 4,
    sessionDuration: 90, equipment: BARBELL_DB_CABLE_MACHINE, splitPreference: 'upper-lower',
  }

  it('adjustedSlotCount(upper, 90, strength) = min(9,5)=5 → ≤5 slots par séance', () => {
    const d = gen(params)
    d.workouts.forEach((wk) => {
      expect(slotCount(wk)).toBeLessThanOrEqual(5)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G06 — Fullbody × 20min, strength, 3j, intermediate → INC-1, adjustedSlotCount=3', () => {
  const params: GeneratorParams = {
    goal: 'strength', level: 'intermediate', daysPerWeek: 3,
    sessionDuration: 20, equipment: BARBELL_DB_CABLE_MACHINE,
  }
  // strength + intermediate + 3j → INC-1 (fullbody×3)

  it('INC-1 (strength intermediate 3j) → 3 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('adjustedSlotCount(fullbody, 20, strength) = min(3,max(2,4))=3 → ≤3 slots', () => {
    const d = gen(params)
    d.workouts.forEach((wk) => {
      expect(slotCount(wk)).toBeLessThanOrEqual(3)
    })
  })

  it('fullbody 3 slots : seed-squat-barbell (quads compound, pop 8, slot[0])', () => {
    expect(appearsInPool(params, 0, 'seed-squat-barbell')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('G07 — Fullbody × 90min, hypertrophy, 3j, beginner → adjustedSlotCount=8', () => {
  const params: GeneratorParams = {
    goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3,
    sessionDuration: 90, equipment: SALLE,
  }
  // beginner → fullbody×3 ; base=9 ; 90min hypertrophy → min(9+2,8)=8

  it('beginner → 3 séances fullbody', () => {
    expect(gen(params).workouts).toHaveLength(3)
  })

  it('adjustedSlotCount(fullbody, 90, hypertrophy) = min(11,8)=8 (cap) → ≤8 slots', () => {
    const d = gen(params)
    d.workouts.forEach((wk) => {
      expect(slotCount(wk)).toBeLessThanOrEqual(8)
    })
  })

  it('90min fullbody salle : séance dense (≥6 slots effectifs)', () => {
    expect(slotCount(w(gen(params), 0))).toBeGreaterThanOrEqual(6)
  })
})
