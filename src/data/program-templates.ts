import type { Program, WorkoutExerciseTemplate, WorkoutTemplate } from '../types'

// LWW : updatedAt = 1 garantit que les données utilisateur écrasent toujours le seed.
const S = 1

// ── Helpers ───────────────────────────────────────────────────────────────────

function prog(
  id: string,
  data: Omit<Program, 'id' | 'updatedAt' | 'deleted' | 'dirty'>
): Program {
  return { id, updatedAt: S, deleted: false, dirty: true, ...data }
}

function wt(
  id: string,
  data: Omit<WorkoutTemplate, 'id' | 'updatedAt' | 'deleted' | 'dirty'>
): WorkoutTemplate {
  return { id, updatedAt: S, deleted: false, dirty: true, ...data }
}

type WETInput = Omit<WorkoutExerciseTemplate, 'id' | 'updatedAt' | 'deleted' | 'dirty'>

function wet(id: string, data: WETInput): WorkoutExerciseTemplate {
  return { id, updatedAt: S, deleted: false, dirty: true, ...data }
}

// Raccourcis pour éviter la répétition du boilerplate Syncable dans wet()
const WARMUP_DEF = { targetSets: 1, autoProgress: false, progressStepKg: 0, restSec: 20 }
const AB_DEF = { targetSets: 3, autoProgress: false, progressStepKg: 0, restSec: 30, isAb: true }
const BW_DEF = { autoProgress: false, progressStepKg: 0 }
const WGT_DEF = { autoProgress: true, progressStepKg: 1 }

// ══════════════════════════════════════════════════════════════════════════════
// 1. IRON UPPER — haltères, 3j/sem, 13 semaines, hypertrophie débutant
// ══════════════════════════════════════════════════════════════════════════════

const IU = 'tpl-iu'

const iuProgram = prog(`${IU}-prog`, {
  name: 'Iron Upper',
  goal: 'hypertrophy',
  level: 'beginner',
  durationWeeks: 13,
  sessionsPerWeek: 3,
  color: '#f97316',
  isTemplate: true,
  isActive: false,
  weekTemplate: {
    monday: `${IU}-j1`,
    wednesday: `${IU}-j2`,
    friday: `${IU}-j3`,
  },
  createdAt: S,
})

const iuWorkoutTemplates: WorkoutTemplate[] = [
  wt(`${IU}-j1`, {
    programId: `${IU}-prog`,
    name: 'J1 · Poitrine & Dos',
    type: 'upper',
    muscleGroups: ['chest', 'back_thickness', 'back_width'],
  }),
  wt(`${IU}-j2`, {
    programId: `${IU}-prog`,
    name: 'J2 · Épaules & Bras',
    type: 'upper',
    muscleGroups: ['shoulders', 'shoulders_lateral', 'biceps', 'triceps'],
  }),
  wt(`${IU}-j3`, {
    programId: `${IU}-prog`,
    name: 'J3 · Full Upper',
    type: 'upper',
    muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  }),
]

// ── IU J1 : Poitrine & Dos ───────────────────────────────────────────────────

const iuJ1Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${IU}-j1-01`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-shoulder-circles',  order: 1,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j1-02`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-jumping-jacks',     order: 2,  repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${IU}-j1-03`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-mountain-climbers', order: 3,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j1-04`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-superman',          order: 4,  repsMode: 'fixed', targetRepsMin: 12, isWarmup: true }),
  wet(`${IU}-j1-05`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-walking-lunges',    order: 5,  repsMode: 'fixed', targetRepsMin: 20, restSec: 30, isWarmup: true }),
  // Superset A — Poitrine + Dos
  wet(`${IU}-j1-06`, { ...WGT_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-bench-dumbbell',          order: 6,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'A' }),
  wet(`${IU}-j1-07`, { ...WGT_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-row-dumbbell',            order: 7,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 90, supersetGroup: 'A' }),
  // Superset B — Pec supérieur + Tirage
  wet(`${IU}-j1-08`, { ...WGT_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-incline-bench-dumbbell', order: 8,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'B' }),
  wet(`${IU}-j1-09`, { ...WGT_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-pullover',               order: 9,  targetSets: 4, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 90, supersetGroup: 'B' }),
  // Isolation
  wet(`${IU}-j1-10`, { ...WGT_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-fly-dumbbell',           order: 10, targetSets: 3, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 90 }),
  // Abdos
  wet(`${IU}-j1-11`, { ...AB_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-plank',          order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${IU}-j1-12`, { ...AB_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-leg-raise',      order: 12, repsMode: 'fixed', targetRepsMin: 15 }),
  wet(`${IU}-j1-13`, { ...AB_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-crunch',         order: 13, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${IU}-j1-14`, { ...AB_DEF, workoutTemplateId: `${IU}-j1`, exerciseId: 'seed-scissors',       order: 14, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ── IU J2 : Épaules & Bras ───────────────────────────────────────────────────

const iuJ2Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${IU}-j2-01`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-shoulder-circles',  order: 1,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j2-02`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-jumping-jacks',     order: 2,  repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${IU}-j2-03`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-mountain-climbers', order: 3,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j2-04`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-superman',          order: 4,  repsMode: 'fixed', targetRepsMin: 12, isWarmup: true }),
  wet(`${IU}-j2-05`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-walking-lunges',    order: 5,  repsMode: 'fixed', targetRepsMin: 20, restSec: 30, isWarmup: true }),
  // Superset A — Épaules
  wet(`${IU}-j2-06`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-shoulder-press-dumbbell', order: 6,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'A' }),
  wet(`${IU}-j2-07`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-lateral-raise',           order: 7,  targetSets: 4, repsMode: 'fixed', targetRepsMin: 15,                   restSec: 90, supersetGroup: 'A' }),
  // Superset B — Biceps + Triceps
  wet(`${IU}-j2-08`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-curl-dumbbell',    order: 8,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'B' }),
  wet(`${IU}-j2-09`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-triceps-overhead', order: 9,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 90, supersetGroup: 'B' }),
  // Superset C — Isolation bras
  wet(`${IU}-j2-10`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-curl-hammer',    order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12, restSec: 0,  supersetGroup: 'C' }),
  wet(`${IU}-j2-11`, { ...BW_DEF,  workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-triceps-dips',   order: 11, targetSets: 3, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 90, supersetGroup: 'C', autoProgress: false }),
  // Isolation arrière épaule
  wet(`${IU}-j2-12`, { ...WGT_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-rear-delt-fly',  order: 12, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 90 }),
  // Abdos
  wet(`${IU}-j2-13`, { ...AB_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-side-plank',     order: 13, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${IU}-j2-14`, { ...AB_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-russian-twist',  order: 14, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${IU}-j2-15`, { ...AB_DEF, workoutTemplateId: `${IU}-j2`, exerciseId: 'seed-bicycle-crunch', order: 15, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ── IU J3 : Full Upper ───────────────────────────────────────────────────────

const iuJ3Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${IU}-j3-01`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-shoulder-circles',  order: 1,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j3-02`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-jumping-jacks',     order: 2,  repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${IU}-j3-03`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-mountain-climbers', order: 3,  repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${IU}-j3-04`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-superman',          order: 4,  repsMode: 'fixed', targetRepsMin: 12, isWarmup: true }),
  wet(`${IU}-j3-05`, { ...WARMUP_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-walking-lunges',    order: 5,  repsMode: 'fixed', targetRepsMin: 20, restSec: 30, isWarmup: true }),
  // Superset A — Poitrine incliné + Dos
  wet(`${IU}-j3-06`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-incline-bench-dumbbell', order: 6,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'A' }),
  wet(`${IU}-j3-07`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-row-dumbbell',           order: 7,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 90, supersetGroup: 'A' }),
  // Superset B — Épaules + Biceps
  wet(`${IU}-j3-08`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-shoulder-press-dumbbell', order: 8,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 0,  supersetGroup: 'B' }),
  wet(`${IU}-j3-09`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-curl-dumbbell',           order: 9,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 90, supersetGroup: 'B' }),
  // Superset C — Triceps + Latéral
  wet(`${IU}-j3-10`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-triceps-overhead', order: 10, targetSets: 3, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 0,  supersetGroup: 'C' }),
  wet(`${IU}-j3-11`, { ...WGT_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-lateral-raise',    order: 11, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15,                   restSec: 90, supersetGroup: 'C' }),
  // Abdos
  wet(`${IU}-j3-12`, { ...AB_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-plank',                 order: 12, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${IU}-j3-13`, { ...AB_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-leg-raise',             order: 13, repsMode: 'fixed', targetRepsMin: 15 }),
  wet(`${IU}-j3-14`, { ...AB_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-vertical-leg-crunch',   order: 14, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${IU}-j3-15`, { ...AB_DEF, workoutTemplateId: `${IU}-j3`, exerciseId: 'seed-heel-touch',            order: 15, repsMode: 'fixed', targetRepsMin: 30 }),
]

// ══════════════════════════════════════════════════════════════════════════════
// 2. 3 SEMAINES SANS MATÉRIEL — bodyweight, 3j/sem, 3 semaines, force débutant
// ══════════════════════════════════════════════════════════════════════════════

const BW = 'tpl-bw'

const bwProgram = prog(`${BW}-prog`, {
  name: '3 semaines sans matériel',
  goal: 'strength',
  level: 'beginner',
  durationWeeks: 3,
  sessionsPerWeek: 3,
  color: '#22c55e',
  isTemplate: true,
  isActive: false,
  weekTemplate: {
    monday: `${BW}-j1`,
    wednesday: `${BW}-j2`,
    friday: `${BW}-j3`,
  },
  createdAt: S,
})

const bwWorkoutTemplates: WorkoutTemplate[] = [
  wt(`${BW}-j1`, {
    programId: `${BW}-prog`,
    name: 'J1 · Haut du corps & Core',
    type: 'upper',
    muscleGroups: ['chest', 'triceps', 'back', 'core'],
  }),
  wt(`${BW}-j2`, {
    programId: `${BW}-prog`,
    name: 'J2 · Bas du corps & Fessiers',
    type: 'lower',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
  }),
  wt(`${BW}-j3`, {
    programId: `${BW}-prog`,
    name: 'J3 · Full body & Cardio',
    type: 'fullbody',
    muscleGroups: ['chest', 'quads', 'glutes', 'core', 'cardio'],
  }),
]

// ── BW J1 : Haut du corps ────────────────────────────────────────────────────

const bwJ1Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${BW}-j1-01`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-jumping-jacks',     order: 1, repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${BW}-j1-02`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-shoulder-circles',  order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${BW}-j1-03`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-mountain-climbers', order: 3, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${BW}-j1-04`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-inchworm',          order: 4, repsMode: 'fixed', targetRepsMin: 10, restSec: 30, isWarmup: true }),
  // Superset A — Poussée + Gainage dorsal
  wet(`${BW}-j1-05`, { ...BW_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-pushup',    order: 5, targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 15, restSec: 0,  supersetGroup: 'A', autoProgress: false }),
  wet(`${BW}-j1-06`, { ...BW_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-superman',  order: 6, targetSets: 4, repsMode: 'fixed', targetRepsMin: 12,                   restSec: 60, supersetGroup: 'A', autoProgress: false }),
  // Superset B — Triceps + Stabilisation
  wet(`${BW}-j1-07`, { ...BW_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-triceps-dips', order: 7, targetSets: 3, repsMode: 'range', targetRepsMin: 8, targetRepsMax: 12, restSec: 0,  supersetGroup: 'B', autoProgress: false }),
  wet(`${BW}-j1-08`, { ...BW_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-bird-dog',    order: 8, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12,                   restSec: 60, supersetGroup: 'B', autoProgress: false }),
  // Tractions
  wet(`${BW}-j1-09`, { ...BW_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-pullup', order: 9, targetSets: 3, repsMode: 'range', targetRepsMin: 4, targetRepsMax: 8, restSec: 90, autoProgress: false }),
  // Abdos
  wet(`${BW}-j1-10`, { ...AB_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-plank',          order: 10, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${BW}-j1-11`, { ...AB_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-crunch',          order: 11, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${BW}-j1-12`, { ...AB_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-leg-raise',       order: 12, repsMode: 'fixed', targetRepsMin: 12 }),
  wet(`${BW}-j1-13`, { ...AB_DEF, workoutTemplateId: `${BW}-j1`, exerciseId: 'seed-bicycle-crunch',  order: 13, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ── BW J2 : Bas du corps ─────────────────────────────────────────────────────

const bwJ2Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${BW}-j2-01`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-bodyweight-squat', order: 1, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${BW}-j2-02`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-walking-lunges',   order: 2, repsMode: 'fixed', targetRepsMin: 16, isWarmup: true }),
  wet(`${BW}-j2-03`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-glute-bridge',     order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${BW}-j2-04`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-leg-swings',       order: 4, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${BW}-j2-05`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-hip-9090',         order: 5, repsMode: 'fixed', targetRepsMin: 10, restSec: 30, isWarmup: true }),
  // Main
  wet(`${BW}-j2-06`, { ...BW_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-bodyweight-squat',    order: 6,  targetSets: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 60, autoProgress: false }),
  wet(`${BW}-j2-07`, { ...BW_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-walking-lunges',      order: 7,  targetSets: 3, repsMode: 'fixed', targetRepsMin: 16, restSec: 60, autoProgress: false }),
  wet(`${BW}-j2-08`, { ...BW_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-glute-bridge',        order: 8,  targetSets: 4, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  wet(`${BW}-j2-09`, { ...BW_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-bulgarian-split-squat', order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12, restSec: 60, autoProgress: false }),
  wet(`${BW}-j2-10`, { ...BW_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-clamshell',           order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 45, autoProgress: false }),
  // Abdos
  wet(`${BW}-j2-11`, { ...AB_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-side-plank',  order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${BW}-j2-12`, { ...AB_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-russian-twist', order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${BW}-j2-13`, { ...AB_DEF, workoutTemplateId: `${BW}-j2`, exerciseId: 'seed-heel-touch',    order: 13, repsMode: 'fixed', targetRepsMin: 30 }),
]

// ── BW J3 : Full body & Cardio ───────────────────────────────────────────────

const bwJ3Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${BW}-j3-01`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-jumping-jacks',     order: 1, repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${BW}-j3-02`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-mountain-climbers', order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${BW}-j3-03`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-bodyweight-squat',  order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${BW}-j3-04`, { ...WARMUP_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-walking-lunges',    order: 4, repsMode: 'fixed', targetRepsMin: 16, restSec: 30, isWarmup: true }),
  // Main
  wet(`${BW}-j3-05`, { ...BW_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-burpee',            order: 5, targetSets: 4, repsMode: 'fixed', targetRepsMin: 10, restSec: 90, autoProgress: false }),
  wet(`${BW}-j3-06`, { ...BW_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-pushup',            order: 6, targetSets: 3, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 15, restSec: 60, autoProgress: false }),
  wet(`${BW}-j3-07`, { ...BW_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-bodyweight-squat',  order: 7, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  wet(`${BW}-j3-08`, { ...BW_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-glute-bridge',      order: 8, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  // Abdos
  wet(`${BW}-j3-09`, { ...AB_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-plank',    order: 9,  repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${BW}-j3-10`, { ...AB_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-leg-raise', order: 10, repsMode: 'fixed', targetRepsMin: 12 }),
  wet(`${BW}-j3-11`, { ...AB_DEF, workoutTemplateId: `${BW}-j3`, exerciseId: 'seed-scissors',  order: 11, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ══════════════════════════════════════════════════════════════════════════════
// 3. GALBE & FORCE — MACHINES — femmes, 3j/sem, 8 semaines, hypertrophie
// ══════════════════════════════════════════════════════════════════════════════

const WM = 'tpl-wm'

const wmProgram = prog(`${WM}-prog`, {
  name: 'Galbe & Force · Machines',
  goal: 'hypertrophy',
  level: 'beginner',
  durationWeeks: 8,
  sessionsPerWeek: 3,
  color: '#ec4899',
  isTemplate: true,
  isActive: false,
  weekTemplate: {
    monday: `${WM}-j1`,
    wednesday: `${WM}-j2`,
    friday: `${WM}-j3`,
  },
  createdAt: S,
})

const wmWorkoutTemplates: WorkoutTemplate[] = [
  wt(`${WM}-j1`, {
    programId: `${WM}-prog`,
    name: 'J1 · Cuisses & Fessiers',
    type: 'legs',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
  }),
  wt(`${WM}-j2`, {
    programId: `${WM}-prog`,
    name: 'J2 · Fessiers & Ischio',
    type: 'legs',
    muscleGroups: ['glutes', 'hamstrings', 'quads'],
  }),
  wt(`${WM}-j3`, {
    programId: `${WM}-prog`,
    name: 'J3 · Circuit Bas corps & Abdos',
    type: 'fullbody',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
  }),
]

// ── WM J1 : Cuisses & Fessiers ───────────────────────────────────────────────

const wmJ1Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WM}-j1-01`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-glute-bridge',     order: 1, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j1-02`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-leg-swings',       order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${WM}-j1-03`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-clamshell',        order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j1-04`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-walking-lunges',   order: 4, repsMode: 'fixed', targetRepsMin: 16, isWarmup: true }),
  wet(`${WM}-j1-05`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-bodyweight-squat', order: 5, repsMode: 'fixed', targetRepsMin: 15, restSec: 30, isWarmup: true }),
  // Main — machines/poids
  wet(`${WM}-j1-06`, { ...WGT_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-leg-press',  order: 6,  targetSets: 4, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 120 }),
  wet(`${WM}-j1-07`, { ...WGT_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-hack-squat', order: 7,  targetSets: 3, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 120 }),
  wet(`${WM}-j1-08`, { ...WGT_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-hip-thrust', order: 8,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 120 }),
  wet(`${WM}-j1-09`, { ...WGT_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-leg-extension', order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 90 }),
  wet(`${WM}-j1-10`, { ...WGT_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-hip-abduction', order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 90 }),
  // Abdos
  wet(`${WM}-j1-11`, { ...AB_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-plank',      order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${WM}-j1-12`, { ...AB_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-crunch',      order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WM}-j1-13`, { ...AB_DEF, workoutTemplateId: `${WM}-j1`, exerciseId: 'seed-heel-touch',  order: 13, repsMode: 'fixed', targetRepsMin: 30 }),
]

// ── WM J2 : Fessiers & Ischio ────────────────────────────────────────────────

const wmJ2Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WM}-j2-01`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-glute-bridge', order: 1, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j2-02`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-clamshell',    order: 2, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j2-03`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-hip-9090',     order: 3, repsMode: 'fixed', targetRepsMin: 10, isWarmup: true }),
  wet(`${WM}-j2-04`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-leg-swings',   order: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 30, isWarmup: true }),
  // Main — fessiers & ischio
  wet(`${WM}-j2-05`, { ...WGT_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-romanian-deadlift', order: 5,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 120 }),
  wet(`${WM}-j2-06`, { ...WGT_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-hip-thrust',       order: 6,  targetSets: 4, repsMode: 'range', targetRepsMin: 10, targetRepsMax: 12, restSec: 120 }),
  wet(`${WM}-j2-07`, { ...WGT_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-leg-curl-lying',   order: 7,  targetSets: 3, repsMode: 'range', targetRepsMin: 12, targetRepsMax: 15, restSec: 90 }),
  wet(`${WM}-j2-08`, { ...WGT_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-hip-abduction',    order: 8,  targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 90 }),
  wet(`${WM}-j2-09`, { ...WGT_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-glute-kickback',   order: 9,  targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 90 }),
  // Abdos
  wet(`${WM}-j2-10`, { ...AB_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-side-plank',     order: 10, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${WM}-j2-11`, { ...AB_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-bicycle-crunch', order: 11, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WM}-j2-12`, { ...AB_DEF, workoutTemplateId: `${WM}-j2`, exerciseId: 'seed-russian-twist',  order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ── WM J3 : Circuit Bas corps & Abdos ────────────────────────────────────────

const wmJ3Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WM}-j3-01`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-walking-lunges',   order: 1, repsMode: 'fixed', targetRepsMin: 16, isWarmup: true }),
  wet(`${WM}-j3-02`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-bodyweight-squat', order: 2, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j3-03`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-glute-bridge',     order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WM}-j3-04`, { ...WARMUP_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-leg-swings',       order: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 30, isWarmup: true }),
  // Superset A — Quadriceps + Ischio
  wet(`${WM}-j3-05`, { ...WGT_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-leg-press',      order: 5, targetSets: 4, repsMode: 'fixed', targetRepsMin: 12, restSec: 0,  supersetGroup: 'A' }),
  wet(`${WM}-j3-06`, { ...WGT_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-leg-curl-seated', order: 6, targetSets: 4, repsMode: 'fixed', targetRepsMin: 12, restSec: 90, supersetGroup: 'A' }),
  // Superset B — Fessiers + Abducteurs
  wet(`${WM}-j3-07`, { ...WGT_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-hip-thrust',    order: 7, targetSets: 4, repsMode: 'fixed', targetRepsMin: 12, restSec: 0,  supersetGroup: 'B' }),
  wet(`${WM}-j3-08`, { ...WGT_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-hip-abduction', order: 8, targetSets: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 90, supersetGroup: 'B' }),
  // Isolation
  wet(`${WM}-j3-09`, { ...WGT_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-leg-extension', order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 90 }),
  // Abdos circuit
  wet(`${WM}-j3-10`, { ...AB_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-plank',                order: 10, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${WM}-j3-11`, { ...AB_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-leg-raise',             order: 11, repsMode: 'fixed', targetRepsMin: 15 }),
  wet(`${WM}-j3-12`, { ...AB_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-scissors',              order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WM}-j3-13`, { ...AB_DEF, workoutTemplateId: `${WM}-j3`, exerciseId: 'seed-vertical-leg-crunch',   order: 13, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ══════════════════════════════════════════════════════════════════════════════
// 4. GALBE & FORCE — MAISON — femmes, bodyweight, 3j/sem, 8 semaines
// ══════════════════════════════════════════════════════════════════════════════

const WB = 'tpl-wb'

const wbProgram = prog(`${WB}-prog`, {
  name: 'Galbe & Force · Maison',
  goal: 'hypertrophy',
  level: 'beginner',
  durationWeeks: 8,
  sessionsPerWeek: 3,
  color: '#a855f7',
  isTemplate: true,
  isActive: false,
  weekTemplate: {
    tuesday: `${WB}-j1`,
    thursday: `${WB}-j2`,
    saturday: `${WB}-j3`,
  },
  createdAt: S,
})

const wbWorkoutTemplates: WorkoutTemplate[] = [
  wt(`${WB}-j1`, {
    programId: `${WB}-prog`,
    name: 'J1 · Cuisses & Fessiers',
    type: 'legs',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
  }),
  wt(`${WB}-j2`, {
    programId: `${WB}-prog`,
    name: 'J2 · Fessiers & Abducteurs',
    type: 'legs',
    muscleGroups: ['glutes', 'hamstrings', 'core'],
  }),
  wt(`${WB}-j3`, {
    programId: `${WB}-prog`,
    name: 'J3 · Full body & Cardio',
    type: 'fullbody',
    muscleGroups: ['quads', 'glutes', 'chest', 'core', 'cardio'],
  }),
]

// ── WB J1 : Cuisses & Fessiers (maison) ─────────────────────────────────────

const wbJ1Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WB}-j1-01`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-glute-bridge',     order: 1, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WB}-j1-02`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-leg-swings',       order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${WB}-j1-03`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-clamshell',        order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WB}-j1-04`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-bodyweight-squat', order: 4, repsMode: 'fixed', targetRepsMin: 15, restSec: 30, isWarmup: true }),
  // Main
  wet(`${WB}-j1-05`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-bodyweight-squat', order: 5, targetSets: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 60, autoProgress: false }),
  wet(`${WB}-j1-06`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-hip-thrust-bw',    order: 6, targetSets: 4, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  wet(`${WB}-j1-07`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-walking-lunges',   order: 7, targetSets: 3, repsMode: 'fixed', targetRepsMin: 16, restSec: 60, autoProgress: false }),
  wet(`${WB}-j1-08`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-donkey-kick',      order: 8, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 45, autoProgress: false }),
  wet(`${WB}-j1-09`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-curtsy-lunge',     order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12, restSec: 60, autoProgress: false }),
  wet(`${WB}-j1-10`, { ...BW_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-glute-bridge',     order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 60, autoProgress: false }),
  // Abdos
  wet(`${WB}-j1-11`, { ...AB_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-plank',     order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${WB}-j1-12`, { ...AB_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-crunch',     order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WB}-j1-13`, { ...AB_DEF, workoutTemplateId: `${WB}-j1`, exerciseId: 'seed-leg-raise',  order: 13, repsMode: 'fixed', targetRepsMin: 12 }),
]

// ── WB J2 : Fessiers & Abducteurs (maison) ───────────────────────────────────

const wbJ2Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WB}-j2-01`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-hip-9090',   order: 1, repsMode: 'fixed', targetRepsMin: 10, isWarmup: true }),
  wet(`${WB}-j2-02`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-leg-swings', order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${WB}-j2-03`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-bird-dog',   order: 3, repsMode: 'fixed', targetRepsMin: 12, isWarmup: true }),
  wet(`${WB}-j2-04`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-superman',   order: 4, repsMode: 'fixed', targetRepsMin: 12, restSec: 30, isWarmup: true }),
  // Main
  wet(`${WB}-j2-05`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-bulgarian-split-squat', order: 5, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12, restSec: 60, autoProgress: false }),
  wet(`${WB}-j2-06`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-hip-thrust-bw',        order: 6, targetSets: 4, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  wet(`${WB}-j2-07`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-fire-hydrant',         order: 7, targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 45, autoProgress: false }),
  wet(`${WB}-j2-08`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-donkey-kick',          order: 8, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 45, autoProgress: false }),
  wet(`${WB}-j2-09`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-curtsy-lunge',         order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 12, restSec: 60, autoProgress: false }),
  wet(`${WB}-j2-10`, { ...BW_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-glute-bridge',         order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 20, restSec: 60, autoProgress: false }),
  // Abdos
  wet(`${WB}-j2-11`, { ...AB_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-side-plank',    order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 30 }),
  wet(`${WB}-j2-12`, { ...AB_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-bicycle-crunch', order: 12, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WB}-j2-13`, { ...AB_DEF, workoutTemplateId: `${WB}-j2`, exerciseId: 'seed-scissors',       order: 13, repsMode: 'fixed', targetRepsMin: 20 }),
]

// ── WB J3 : Full body & Cardio (maison) ─────────────────────────────────────

const wbJ3Wet: WorkoutExerciseTemplate[] = [
  // Échauffement
  wet(`${WB}-j3-01`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-jumping-jacks',     order: 1, repsMode: 'fixed', targetRepsMin: 30, isWarmup: true }),
  wet(`${WB}-j3-02`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-mountain-climbers', order: 2, repsMode: 'fixed', targetRepsMin: 20, isWarmup: true }),
  wet(`${WB}-j3-03`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-bodyweight-squat',  order: 3, repsMode: 'fixed', targetRepsMin: 15, isWarmup: true }),
  wet(`${WB}-j3-04`, { ...WARMUP_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-walking-lunges',    order: 4, repsMode: 'fixed', targetRepsMin: 16, restSec: 30, isWarmup: true }),
  // Main
  wet(`${WB}-j3-05`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-bodyweight-squat', order: 5, targetSets: 4, repsMode: 'fixed', targetRepsMin: 20, restSec: 60, autoProgress: false }),
  wet(`${WB}-j3-06`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-burpee',           order: 6, targetSets: 3, repsMode: 'fixed', targetRepsMin: 10, restSec: 90, autoProgress: false }),
  wet(`${WB}-j3-07`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-hip-thrust-bw',    order: 7, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 60, autoProgress: false }),
  wet(`${WB}-j3-08`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-pushup',           order: 8, targetSets: 3, repsMode: 'range', targetRepsMin: 8, targetRepsMax: 12, restSec: 60, autoProgress: false }),
  wet(`${WB}-j3-09`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-donkey-kick',      order: 9, targetSets: 3, repsMode: 'fixed', targetRepsMin: 15, restSec: 45, autoProgress: false }),
  wet(`${WB}-j3-10`, { ...BW_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-walking-lunges',   order: 10, targetSets: 3, repsMode: 'fixed', targetRepsMin: 16, restSec: 60, autoProgress: false }),
  // Abdos
  wet(`${WB}-j3-11`, { ...AB_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-plank',                order: 11, repsMode: 'fixed', targetRepsMin: 1, targetDurationSec: 45 }),
  wet(`${WB}-j3-12`, { ...AB_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-leg-raise',             order: 12, repsMode: 'fixed', targetRepsMin: 12 }),
  wet(`${WB}-j3-13`, { ...AB_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-vertical-leg-crunch',   order: 13, repsMode: 'fixed', targetRepsMin: 20 }),
  wet(`${WB}-j3-14`, { ...AB_DEF, workoutTemplateId: `${WB}-j3`, exerciseId: 'seed-heel-touch',            order: 14, repsMode: 'fixed', targetRepsMin: 30 }),
]

// ══════════════════════════════════════════════════════════════════════════════
// Exports
// ══════════════════════════════════════════════════════════════════════════════

// Iron Upper et 3 Semaines Sans Matériel sont gérés directement en DB via
// les scripts recreate-iron-upper.mjs et create-sans-materiel.mjs — ils ne
// font pas partie du seed générique (ils référencent des exercices spécifiques).
export const PROGRAM_TEMPLATES: Program[] = [
  wmProgram,
  wbProgram,
]

interface TemplateRecords {
  programs: Program[]
  workoutTemplates: WorkoutTemplate[]
  workoutExerciseTemplates: WorkoutExerciseTemplate[]
}

export function buildTemplateRecords(_now: number): TemplateRecords {
  return {
    programs: PROGRAM_TEMPLATES,
    workoutTemplates: [
      ...wmWorkoutTemplates,
      ...wbWorkoutTemplates,
    ],
    workoutExerciseTemplates: [
      ...wmJ1Wet, ...wmJ2Wet, ...wmJ3Wet,
      ...wbJ1Wet, ...wbJ2Wet, ...wbJ3Wet,
    ],
  }
}
