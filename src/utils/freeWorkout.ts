// Logique pure du wizard Séance libre.
// Algorithme de sélection validé selon les principes d'un coaching structuré :
//   1. Tri par popularité (exercices fondamentaux en tête)
//   2. Composés poly-articulaires en premier (recrutement maximal à frais)
//   3. Cap par zone musculaire (évite la surcharge d'un seul groupe)
//   4. Équilibre antagoniste (push → pull, quads → ischios)
//   5. Isolations pour compléter le volume
//   6. Adaptation objectif/séries selon énergie + sommeil

import type { Exercise } from '../types'

export type EnergyLevel    = 1 | 2 | 3 | 4 | 5
export type SleepQuality   = 'bad' | 'medium' | 'good'
export type WorkoutGoal    = 'force' | 'hypertrophie' | 'pump' | 'recup'
export type AvailableTime  = 20 | 30 | 45 | 60 | 90
export type EquipmentPreset = 'full' | 'dumbbells' | 'barbell' | 'bodyweight'

// Matériel accepté par preset — correspond aux valeurs Equipment de types.ts
const PRESET_GEAR: Record<EquipmentPreset, string[]> = {
  full:       ['barbell', 'dumbbell', 'cable', 'machine', 'pullup_bar', 'bodyweight'],
  barbell:    ['barbell', 'dumbbell', 'bodyweight'],
  dumbbells:  ['dumbbell', 'bodyweight'],
  bodyweight: ['bodyweight'],
}

// En mode Force : préférer les exercices barre (meilleur surcharge progressive)
const FORCE_PREFERRED_GEAR = new Set(['barbell', 'pullup_bar'])

export const EQUIPMENT_LABELS: Record<EquipmentPreset, { emoji: string; label: string; sub: string }> = {
  full:       { emoji: '🏋️', label: 'Salle complète',  sub: 'Barre, haltères, câbles, machines' },
  barbell:    { emoji: '🔩', label: 'Barre + disques', sub: 'Barre olympique et haltères'        },
  dumbbells:  { emoji: '💪', label: 'Haltères seuls',  sub: 'Haltères et poids de corps'         },
  bodyweight: { emoji: '🤸', label: 'Poids de corps',  sub: 'Aucun matériel nécessaire'          },
}

export interface FreeWorkoutInput {
  energyLevel:   EnergyLevel
  sleepQuality:  SleepQuality
  availableTime: AvailableTime
  goal:          WorkoutGoal
  targetZones:   string[]       // 'full_body' ou clés de MUSCLE_OPTIONS
  equipment:     EquipmentPreset
  /** Bibliothèque d'exercices du store — seuls ces exercices seront proposés. */
  library:       Exercise[]
}

export interface SuggestedExercise {
  name:    string
  emoji:   string
  sets:    number
  reps:    string
  restSec: number
  tip:     string
}

export interface SuggestedWorkout {
  exercises:      SuggestedExercise[]
  estimatedMin:   number
  goalLabel:      string
  intensityLabel: string
  adjustedGoal:   WorkoutGoal
}

// ── Profils par objectif ─────────────────────────────────────────────────────

type GoalProfile = {
  label:    string
  sets:     number
  reps:     string
  restSec:  number
  minPerEx: number   // temps estimé par exercice (minutes)
}

export const GOAL_PROFILES: Record<WorkoutGoal, GoalProfile> = {
  force:        { label: 'Force',        sets: 5, reps: '3-5',   restSec: 240, minPerEx: 16 },
  hypertrophie: { label: 'Hypertrophie', sets: 4, reps: '8-12',  restSec: 90,  minPerEx: 9  },
  pump:         { label: 'Pump',         sets: 3, reps: '15-20', restSec: 45,  minPerEx: 5  },
  recup:        { label: 'Récupération', sets: 2, reps: '12-15', restSec: 60,  minPerEx: 6  },
}

// ── Paires antagonistes à équilibrer ─────────────────────────────────────────
// Si un muscle de la colonne gauche est sélectionné, tenter d'inclure
// au moins un exercice du groupe droit (et vice-versa).

const ANTAGONIST_PAIRS: [string, string][] = [
  ['chest', 'back'],
  ['quads', 'hamstrings'],
  ['biceps', 'triceps'],
]

// ── Normalisation des groupes musculaires ────────────────────────────────────

const MUSCLE_NORMALIZE: Record<string, string> = {
  chest_upper:       'chest',
  chest_lower:       'chest',
  back_width:        'back',
  back_thickness:    'back',
  shoulders_front:   'shoulders',
  shoulders_lateral: 'shoulders',
  shoulders_rear:    'shoulders',
  forearms:          'biceps',
}

function norm(muscle: string): string {
  return MUSCLE_NORMALIZE[muscle] ?? muscle
}

function exZones(ex: Exercise): string[] {
  // Garde contre les exercices IDB anciens dont secondaryMuscles serait undefined
  return Array.from(new Set([ex.primaryMuscle, ...(ex.secondaryMuscles ?? [])].map(norm)))
}

// ── Emoji par muscle principal ────────────────────────────────────────────────

const MUSCLE_EMOJI: Record<string, string> = {
  chest:             '📐',
  chest_upper:       '📐',
  chest_lower:       '📐',
  back:              '🚣',
  back_width:        '🔝',
  back_thickness:    '🚣',
  shoulders:         '🪖',
  shoulders_front:   '🪖',
  shoulders_lateral: '🪁',
  shoulders_rear:    '🐦',
  biceps:            '💪',
  triceps:           '↕️',
  forearms:          '💪',
  quads:             '🦵',
  hamstrings:        '🏗️',
  glutes:            '🍑',
  core:              '📏',
  calves:            '🦶',
  cardio:            '🏃',
}

// ── Conseil générique par catégorie ──────────────────────────────────────────

const TIP_COMPOUND  = "Amplitude complète, descente contrôlée, expiration à l'effort."
const TIP_ISOLATION = "Isolation stricte, contraction tenue 1 s, tempo lent en excentrique."

// ── Sélection d'un exercice dans un pool ──────────────────────────────────────

/**
 * Tente d'ajouter un exercice du pool qui :
 * 1. Couvre au moins une des zones cibles (targetZones)
 * 2. N'est pas déjà sélectionné
 * 3. Respecte le cap par zone (zoneCounts[zone] < maxPerZone)
 * Retourne l'exercice ajouté, ou null.
 */
function pickOne(
  pool: Exercise[],
  selected: Exercise[],
  targetZones: Set<string>,
  zoneCounts: Map<string, number>,
  maxPerZone: number,
  mustCoverNewZone = false,
): Exercise | null {
  for (const ex of pool) {
    if (selected.includes(ex)) continue
    const zones = exZones(ex).filter(z => targetZones.has(z))
    if (zones.length === 0) continue
    // Vérifier le cap par zone
    const overCap = zones.every(z => (zoneCounts.get(z) ?? 0) >= maxPerZone)
    if (overCap) continue
    // Si on exige une nouvelle zone, vérifier
    if (mustCoverNewZone) {
      const hasNew = zones.some(z => (zoneCounts.get(z) ?? 0) === 0)
      if (!hasNew) continue
    }
    return ex
  }
  return null
}

function addToSelected(
  ex: Exercise,
  selected: Exercise[],
  zoneCounts: Map<string, number>,
  targetZones: Set<string>,
): void {
  selected.push(ex)
  for (const z of exZones(ex)) {
    if (targetZones.has(z)) {
      zoneCounts.set(z, (zoneCounts.get(z) ?? 0) + 1)
    }
  }
}

// ── Génération du programme ──────────────────────────────────────────────────

export function generateFreeWorkout(input: FreeWorkoutInput): SuggestedWorkout {

  // ── 0. Ajustement énergie / objectif ─────────────────────────────────────

  const adjustedEnergy: EnergyLevel = input.sleepQuality === 'bad'
    ? (Math.max(1, input.energyLevel - 1) as EnergyLevel)
    : input.energyLevel

  const adjustedGoal: WorkoutGoal = (() => {
    if (adjustedEnergy === 1) return 'recup'
    if (adjustedEnergy === 2 && (input.goal === 'force' || input.goal === 'hypertrophie')) return 'pump'
    return input.goal
  })()

  const profile = GOAL_PROFILES[adjustedGoal]
  const numExercises = Math.max(3, Math.min(10, Math.floor(input.availableTime / profile.minPerEx)))

  // ── 1. Zones cibles ───────────────────────────────────────────────────────

  const ALL_ZONES   = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core', 'calves']
  const isFullBody  = input.targetZones.includes('full_body')
  const targetZones = new Set(isFullBody ? ALL_ZONES : input.targetZones)

  // ── 2. Filtrage bibliothèque ──────────────────────────────────────────────

  const availableGear = new Set(PRESET_GEAR[input.equipment])

  const eligible = input.library.filter(ex => {
    if (ex.deleted || ex.isWarmupExercise) return false
    if (!availableGear.has(ex.equipment)) return false
    if (ex.primaryMuscle === 'cardio') return false
    return exZones(ex).some(z => targetZones.has(z))
  })

  // ── 3. Tri par pertinence ─────────────────────────────────────────────────
  // • En Force : barre en tête (surcharge progressive optimale)
  // • Toujours : popularité décroissante (exercices fondamentaux en premier)

  const sortScore = (ex: Exercise): number => {
    let score = ex.popularity ?? 0
    if (adjustedGoal === 'force' && FORCE_PREFERRED_GEAR.has(ex.equipment)) score += 100
    return score
  }

  const compounds  = eligible.filter(e => e.category === 'compound').sort((a, b) => sortScore(b) - sortScore(a))
  const isolations = eligible.filter(e => e.category === 'isolation').sort((a, b) => sortScore(b) - sortScore(a))

  // ── 4. Cap par zone ───────────────────────────────────────────────────────
  // Full body ou > 5 zones : 1 exercice par zone pour la couverture initiale.
  // Sessions focalisées (≤ 4 zones) : jusqu'à 3 par zone.

  const maxPerZone = targetZones.size <= 4 ? 3 : 2

  const selected: Exercise[] = []
  const zoneCounts  = new Map<string, number>()

  // ── 5. Phase A — composés couvrant de nouvelles zones ────────────────────

  for (const ex of compounds) {
    if (selected.length >= numExercises) break
    const ex2 = pickOne([ex], selected, targetZones, zoneCounts, maxPerZone, true)
    if (ex2) addToSelected(ex2, selected, zoneCounts, targetZones)
  }

  // ── 6. Phase B — équilibre antagoniste ───────────────────────────────────
  // Pour chaque paire antagoniste (chest↔back, quads↔ischios, biceps↔triceps) :
  // si une des zones est représentée mais pas l'autre, tenter d'en ajouter une.

  if (selected.length < numExercises) {
    for (const [zoneA, zoneB] of ANTAGONIST_PAIRS) {
      if (selected.length >= numExercises) break
      const hasA = (zoneCounts.get(zoneA) ?? 0) > 0
      const hasB = (zoneCounts.get(zoneB) ?? 0) > 0
      if (hasA && !hasB && targetZones.has(zoneB)) {
        const missing = new Set([zoneB])
        const ex = pickOne(compounds, selected, missing, zoneCounts, maxPerZone)
          ?? pickOne(isolations, selected, missing, zoneCounts, maxPerZone)
        if (ex) addToSelected(ex, selected, zoneCounts, targetZones)
      } else if (hasB && !hasA && targetZones.has(zoneA)) {
        const missing = new Set([zoneA])
        const ex = pickOne(compounds, selected, missing, zoneCounts, maxPerZone)
          ?? pickOne(isolations, selected, missing, zoneCounts, maxPerZone)
        if (ex) addToSelected(ex, selected, zoneCounts, targetZones)
      }
    }
  }

  // ── 7. Phase C — volume : isolations pour compléter ──────────────────────

  for (const ex of isolations) {
    if (selected.length >= numExercises) break
    const ex2 = pickOne([ex], selected, targetZones, zoneCounts, maxPerZone)
    if (ex2) addToSelected(ex2, selected, zoneCounts, targetZones)
  }

  // ── 8. Phase D — compléter si manque (repasser sur composés, cap levé) ──

  if (selected.length < numExercises) {
    for (const ex of [...compounds, ...isolations]) {
      if (selected.length >= numExercises) break
      if (!selected.includes(ex)) {
        const zones = exZones(ex).filter(z => targetZones.has(z))
        if (zones.length > 0) addToSelected(ex, selected, zoneCounts, targetZones)
      }
    }
  }

  // ── 9. Ajustement séries selon énergie ───────────────────────────────────

  const setCount = Math.max(2, profile.sets - (adjustedEnergy <= 2 ? 1 : 0))

  // ── 10. Mise en forme finale ──────────────────────────────────────────────

  const exercises: SuggestedExercise[] = selected.map(ex => ({
    name:    ex.name,
    emoji:   MUSCLE_EMOJI[ex.primaryMuscle] ?? '💪',
    sets:    setCount,
    reps:    profile.reps,
    restSec: profile.restSec,
    tip:     ex.instructions ?? (ex.category === 'compound' ? TIP_COMPOUND : TIP_ISOLATION),
  }))

  // Estimation durée totale
  const [lo, hi] = (() => {
    const parts = profile.reps.split('-')
    const a = parseInt(parts[0] ?? '8', 10)
    const b = parseInt(parts[1] ?? a.toString(), 10)
    return [a, b]
  })()
  const avgReps = (lo + hi) / 2
  const estimatedMin = Math.round(
    exercises.reduce((acc, ex) => acc + ex.sets * (avgReps * 3 + ex.restSec) / 60 + 1, 0)
  )

  const intensityLabel =
    adjustedEnergy <= 2 ? 'Allégée' :
    adjustedEnergy === 3 ? 'Modérée' :
    adjustedEnergy === 4 ? 'Standard' : 'Intensive'

  return { exercises, estimatedMin, goalLabel: profile.label, intensityLabel, adjustedGoal }
}
