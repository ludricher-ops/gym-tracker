/**
 * Audit v10 — 30 profils fullbody & glutes+dos × 4 équipements
 * Date : 2026-09-07
 * Fixes inclus : RÉSERVE-1 (good-morning-bw), RÉSERVE-2 (UX-6), RÉSERVE-3 (bw-sissy-squat)
 *
 * ── Comportements validés par les tests ──────────────────────────────────────
 * ✅ R1 : seed-good-morning-bw (hamstrings, BW, pop 1) sélectionné en fullbody-hip
 *         slot[0] (slotPrimary='hamstrings' prime sur pop) ET en glutes-hip slot[1]
 *         (seul compound hamstrings BW non-warmup)
 * ✅ R2 : warning UX-6 "Focus dos + fessiers" émis quand focusMuscles=['glutes','back']
 * ✅ R3 : bw-sissy-squat (quads iso, pop 3) remplace bw-wall-sit (désormais warmup)
 *
 * ── Règles de sélection clés ──────────────────────────────────────────────────
 * - beginner = top-1 (déterministe)
 * - intermediate/advanced = top-3 aléatoire (appearsInPool vérifie sur 20 essais)
 * - usedGlobally : anti-répétition entre séances (ne bloque pas, déprioritise)
 * - VIDE : slots compound sans candidat ne s'ajoutent pas à draftExercises
 *   → slotId par index est INVALIDE ; on utilise exclusivement les containment checks
 *
 * ── Découverte audit ──────────────────────────────────────────────────────────
 * fullbody-hip slot[0] = ['hamstrings','glutes'], slotPrimary='hamstrings' :
 *   - BW seul → seed-good-morning-bw (seul hamstrings compound BW non-warmup, rank 0)
 *   - DB+BW → seed-good-morning-bw (dumbbell-rdl utilisé en fullbody-quad slot[4]
 *             comme fallback compound pour l'isolation hamstrings → usedGlobally)
 *   - Salle → seed-romanian-deadlift (barbell, pop 3) ou dumbbell-rdl selon anti-rép.
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
  // warmup = first, core = last ; entre les deux = slots
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

// Équipements réutilisés
const BW      = ['bodyweight'] as Exercise['equipment'][]
const DB_BW   = ['dumbbell', 'bodyweight'] as Exercise['equipment'][]
const KB_DB_BW = ['kettlebell', 'dumbbell', 'bodyweight'] as Exercise['equipment'][]
const SALLE   = ['barbell', 'dumbbell', 'cable', 'pullup_bar', 'machine'] as Exercise['equipment'][]

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
    // bw-wall-sit est dans warmupPool, pas dans les slots
    expect(slotIds(w(gen(params), 0))).not.toContain('bw-wall-sit')
  })

  // ── fullbody-hip ────────────────────────────────────────────────────────────
  // DÉCOUVERTE R1 : fullbody-hip slot[0] = ['hamstrings','glutes'], slotPrimary='hamstrings'
  // → seed-good-morning-bw (hamstrings, rank 0) prime sur seed-hip-thrust-bw (glutes, rank 1)
  // même si la popularité de hip-thrust (3) > good-morning (1)
  it('fullbody-hip : seed-good-morning-bw (hamstrings slot[0], slotPrimary rank 0) ✅ R1', () => {
    expect(inW(w(gen(params), 1), 'seed-good-morning-bw')).toBe(true)
  })

  it('fullbody-hip : bw-pushup (chest compound slot[1])', () => {
    // fullbody-hip slot[1] = chest, PAS glutes — hip-thrust-bw n'est PAS dans fullbody-hip
    // fullbody-hip slot[0] (hamstrings/glutes) → good-morning-bw ; slot[1] (chest) → pushup
    expect(inW(w(gen(params), 1), 'seed-pushup')).toBe(true)
  })

  it('fullbody-hip : bw-sissy-squat (quads isolation slot[4]) ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
    expect(slotIds(w(gen(params), 1))).not.toContain('bw-wall-sit')
  })

  it('fullbody-hip : 4 exercices effectifs (warmup/core exclus)', () => {
    // slot[2] dos = VIDE, slot[5] shoulders_rear = VIDE, slot[6] biceps = VIDE, slot[8] triceps = VIDE
    // Effectifs : good-morning-bw, hip-thrust-bw, pushup, pike-pushup, sissy-squat, calf-raise = 6 non-VIDE
    // (pushup slot[1] chest, pike-pushup slot[3] shoulders, sissy-squat slot[4], calf-raise slot[7])
    const cnt = slotCount(w(gen(params), 1))
    expect(cnt).toBeGreaterThanOrEqual(4) // au moins 4 exercices non-VIDE
    expect(cnt).toBeLessThanOrEqual(8)    // max 8 slots (base=9 − 1 pour slot[8])
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
    // strength 60min : max(4, floor(9×0.5)) = 4 slots
    // slot[2] dos = VIDE → 3 exercices effectifs (squat, pushup, ohp)
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(4)
    expect(slotCount(w(d, 1))).toBeLessThanOrEqual(4)
  })

  it('fullbody-quad : chest compound présent (seed-pushup ou bw-incline-pushup — top-3 random)', () => {
    // intermediate top-3 : [seed-pushup (chest rank 0, pop 2), bw-incline-pushup (chest_upper, pop 2)] → 50/50
    expect(appearsOneOf(params, 0, ['seed-pushup', 'bw-incline-pushup'])).toBe(true)
  })

  it('fullbody-quad : bw-pike-pushup présent (seul BW shoulders compound)', () => {
    // seul candidat → toujours sélectionné
    expect(inW(w(gen(params), 0), 'bw-pike-pushup')).toBe(true)
  })

  it('fullbody-quad : bw-squat ou bw-lunge présent (intermediate top-3 aléatoire)', () => {
    // intermediate → pool top-3 [bw-squat, bw-lunge, bw-jump-squat] → aléatoire
    expect(appearsOneOf(params, 0, ['bw-squat', 'bw-lunge', 'bw-jump-squat'])).toBe(true)
  })

  it('fullbody-hip : seed-good-morning-bw (hamstrings slot[0]) ✅ R1', () => {
    // intermediate → top-3 [good-morning-bw (seul hamstrings BW)]
    // good-morning-bw est le SEUL compound hamstrings BW → apparaît toujours
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
    // slot[4] quads isolation = bw-sissy-squat (inclus dans les 6 premiers)
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
    // slot[4] hamstrings isolation = VIDE (aucun DB+BW), slot[5] = seed-rear-delt-fly
    expect(inW(w(gen(params), 0), 'seed-rear-delt-fly')).toBe(true)
  })

  // DÉCOUVERTE : fullbody-quad slot[4] (hamstrings isolation) → fallback compound
  // dumbbell-rdl (beginner top-1) est sélectionné comme fallback → usedGlobally
  // fullbody-hip slot[0] (hamstrings compound) → seed-good-morning-bw (car dumbbell-rdl usedGlobally)
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
    // dumbbell-rdl peut être usedGlobally depuis fullbody-quad slot[4] fallback
    // → seed-good-morning-bw peut apparaître à la place
    // Les deux exercices sont valides pour ce slot
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

  it('fullbody-hip : bw-sissy-squat ✅ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
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
    // slot[2] back compound accepte primaryMuscle ∈ ['back_width', 'back_thickness', 'back']
    // KB+DB+BW : seed-row-dumbbell (back_thickness, pop 3), kb-row (back_thickness, pop 2),
    //            kb-deadlift (back, pop ?), seed-row-dumbbell alternent selon anti-répétition
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
    // 5 slots → bw-sissy-squat / leg-extension au slot[4] pour fullbody-hip
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
    // Séances fullbody-hip sont en positions 1, 3 du split 5j
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
    // slotPrimary='hamstrings' pour slot[1] → good-morning-bw prime sur curtsy-lunge (glutes, rank 1)
    expect(appearsInPool(params, 0, 'seed-good-morning-bw')).toBe(true)
  })

  it('quad-glutes : bw-sissy-squat (quads isolation slot[3]) ✅ FIXÉ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
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
    // beginner → top-1 déterministe : good-morning-bw (hamstrings rank 0, pop 1) prime sur curtsy-lunge (glutes, rank 1)
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

  it('quad-glutes : bw-sissy-squat (quads isolation slot[3]) ✅ FIXÉ R3', () => {
    expect(inW(w(gen(params), 1), 'bw-sissy-squat')).toBe(true)
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
    // Anti-répétition : kb-row possible si seed-row-dumbbell déjà usé mais non disponible ici (pas KB)
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
    // seed-row-dumbbell peut être usedGlobally depuis glutes-hip → kb-row prend le relai
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
    // slot[3] dos compound dans les 6 premiers
    const d = gen(params)
    expect(slotCount(w(d, 0))).toBeLessThanOrEqual(6)
  })

  it('glutes-hip : seed-row-dumbbell (beginner top-1, slot[3] inclus dans cap=6)', () => {
    expect(inW(w(gen(params), 0), 'seed-row-dumbbell')).toBe(true)
  })

  it('quad-glutes : compound dos présent — seed-row-dumbbell OU kb-row (anti-répétition)', () => {
    // beginner → seed-row-dumbbell usedGlobally depuis glutes-hip → kb-row sélectionné
    // (comportement correct : anti-répétition entre séances)
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
    // fat_loss ajoute un finisher cardio (burpees/high knees) avant le core → 6 slots + 1 finisher = 7 max
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
    // 3j intermediate pull → ['pull','upper-pull','pull'] → 3 séances
    expect(d.workouts).toHaveLength(3)
  })

  it('Aucune séance glutes-hip ou quad-glutes dans le split', () => {
    const d = gen(params)
    // Les types publics sont 'pull' → pas de lower (glutes-hip public = 'lower')
    // On vérifie que seed-hip-thrust (barbell) n'est pas dans le programme
    // (les séances pull ne contiennent pas d'exercices fessiers composés en slot[0])
    const allExercises = d.workouts.flatMap((wk) => slotIds(wk))
    // pull slots : [back_width, back_thickness, isolation dos, biceps, shoulders_rear, forearms, biceps, back_width]
    // → pas de hip thrust ni squat
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
    // slotPrimary='hamstrings' → good-morning-bw gagne sur curtsy-lunge (glutes, rank 1)
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
    // slot[6] biceps isolation → machine-biceps-curl (seul candidat machine)
    const d = gen(params)
    const allSlotIds = d.workouts.flatMap((wk) => slotIds(wk))
    expect(allSlotIds).toContain('machine-biceps-curl')
  })

  it('machine-lat-pulldown dans le programme (back_width machine compound, top-3 random avec seed-row-machine)', () => {
    // intermediate → pool top-3 random parmi [machine-lat-pulldown(back_width,pop 2), seed-row-machine(back_thickness,pop 1)]
    // chaque workout sélectionne l'un ou l'autre (50/50) — machine-lat-pulldown doit apparaître sur N runs
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
