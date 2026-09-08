// Logique pure du wizard Séance libre — sans dépendance IDB ni React.

export type EnergyLevel = 1 | 2 | 3 | 4 | 5
export type SleepQuality = 'bad' | 'medium' | 'good'
export type WorkoutGoal = 'force' | 'hypertrophie' | 'pump' | 'recup'
export type AvailableTime = 20 | 30 | 45 | 60 | 90

export interface FreeWorkoutInput {
  energyLevel: EnergyLevel
  sleepQuality: SleepQuality
  painZones: string[]
  availableTime: AvailableTime
  goal: WorkoutGoal
  targetZones: string[]  // 'full_body' ou valeurs de MUSCLE_GROUP_OPTIONS
}

export interface SuggestedExercise {
  name: string
  emoji: string
  sets: number
  reps: string
  restSec: number
  tip: string
}

export interface SuggestedWorkout {
  exercises: SuggestedExercise[]
  estimatedMin: number
  goalLabel: string
  intensityLabel: string
  adjustedGoal: WorkoutGoal
}

// ── Profils par objectif ─────────────────────────────────────────────────────

type GoalProfile = {
  label: string
  sets: number
  reps: string
  restSec: number
  minPerEx: number  // temps estimé par exercice (minutes)
}

export const GOAL_PROFILES: Record<WorkoutGoal, GoalProfile> = {
  force:        { label: 'Force',        sets: 4, reps: '4-6',   restSec: 180, minPerEx: 14 },
  hypertrophie: { label: 'Hypertrophie', sets: 4, reps: '8-12',  restSec: 90,  minPerEx: 9  },
  pump:         { label: 'Pump',         sets: 3, reps: '15-20', restSec: 45,  minPerEx: 5  },
  recup:        { label: 'Récupération', sets: 2, reps: '12-15', restSec: 60,  minPerEx: 6  },
}

// ── Catalogue d'exercices ────────────────────────────────────────────────────

type ExerciseTemplate = {
  name: string
  emoji: string
  muscles: string[]  // clés de MUSCLE_GROUP_OPTIONS
  tip: string
  priority: 1 | 2   // 1 = polyarticulaire, 2 = isolation
}

const EXERCISES: ExerciseTemplate[] = [
  // Pectoraux
  { name: 'Développé couché',       emoji: '🏋️', muscles: ['chest'],               tip: 'Omoplates serrées, pieds au sol, barre vers le bas du sternum',     priority: 1 },
  { name: 'Développé incliné',      emoji: '📐', muscles: ['chest', 'shoulders'],   tip: 'Inclinaison 30-45°, contrôle la descente sur 2 s',                  priority: 1 },
  { name: 'Écarté haltères',        emoji: '🦋', muscles: ['chest'],               tip: 'Coudes légèrement fléchis, arc maîtrisé, contraction en haut',       priority: 2 },
  { name: 'Pompes lestées',         emoji: '💥', muscles: ['chest', 'triceps'],     tip: 'Corps gainé, coudes à 45°, amplitude complète',                     priority: 2 },
  // Dos
  { name: 'Rowing haltère',         emoji: '🚣', muscles: ['back'],                tip: 'Dos plat, coude le long du flanc, tirage jusqu\'à la hanche',        priority: 1 },
  { name: 'Tirage poulie haute',    emoji: '⬇️', muscles: ['back', 'biceps'],      tip: 'Barre devant, coudes pointés vers le bas, omoplate en bas',          priority: 1 },
  { name: 'Tractions',              emoji: '🔝', muscles: ['back', 'biceps'],      tip: 'Amplitude complète, évite le balancement, expiration en montant',     priority: 1 },
  { name: 'Rowing barre',           emoji: '🏗️', muscles: ['back'],                tip: 'Légèrement penché (45°), dos plat, coudes hauts, barre vers nombril',priority: 1 },
  { name: 'Face pull',              emoji: '🎯', muscles: ['back', 'shoulders'],   tip: 'Coudes à hauteur des épaules, tirage vers le visage, rotation ext.',  priority: 2 },
  { name: 'Pull-over haltère',      emoji: '🌊', muscles: ['back', 'chest'],       tip: 'Bras légèrement fléchis, arc complet, respirer en montant',           priority: 2 },
  // Épaules
  { name: 'Développé militaire',    emoji: '🪖', muscles: ['shoulders'],           tip: 'Gainage fort, barre devant, pousse dans l\'axe du crâne',             priority: 1 },
  { name: 'Élévations latérales',   emoji: '🪁', muscles: ['shoulders'],           tip: 'Légère flexion coude, montée jusqu\'à l\'horizontale, descente lente',priority: 2 },
  { name: 'Oiseau haltères',        emoji: '🐦', muscles: ['shoulders', 'back'],   tip: 'Torse penché, bras légèrement fléchis, ouvre le dos',                 priority: 2 },
  // Biceps
  { name: 'Curl haltères',          emoji: '💪', muscles: ['biceps'],              tip: 'Coudes fixes contre le flanc, supination complète en haut',           priority: 1 },
  { name: 'Curl barre EZ',          emoji: '〰️', muscles: ['biceps'],              tip: 'Prise en supination, amplitude max, pas de balancement',              priority: 1 },
  { name: 'Curl marteau',           emoji: '🔨', muscles: ['biceps'],              tip: 'Prise neutre, mouvement lent et contrôlé, travaille le brachial',     priority: 2 },
  // Triceps
  { name: 'Dips',                   emoji: '↕️', muscles: ['triceps', 'chest'],    tip: 'Coudes proches du corps, amplitude complète, penché = plus de pecs',  priority: 1 },
  { name: 'Extension poulie haute', emoji: '🔗', muscles: ['triceps'],             tip: 'Coudes fixes le long du corps, extension jusqu\'au bout',              priority: 1 },
  { name: 'Kickback haltère',       emoji: '↗️', muscles: ['triceps'],             tip: 'Bras parallèle au sol en extension, contraction 1 s en haut',         priority: 2 },
  // Quadriceps
  { name: 'Squat barre',            emoji: '🏋️', muscles: ['quads', 'glutes'],     tip: 'Genoux dans l\'axe, descente jusqu\'au parallèle, talons au sol',     priority: 1 },
  { name: 'Presse à cuisses',       emoji: '🦿', muscles: ['quads', 'glutes'],     tip: 'Pieds écartés = plus fessiers, poussée par les talons',               priority: 1 },
  { name: 'Fentes marchées',        emoji: '🚶', muscles: ['quads', 'glutes'],     tip: 'Genou arrière proche du sol, torse droit, grand pas',                 priority: 1 },
  { name: 'Leg extension',          emoji: '🦵', muscles: ['quads'],               tip: 'Extension complète, descente lente (3 s), évite les surcharges',       priority: 2 },
  // Ischios
  { name: 'Soulevé de terre roum.', emoji: '🏗️', muscles: ['hamstrings', 'glutes'],tip: 'Dos plat, hanches en arrière (pas les genoux), charge près du corps', priority: 1 },
  { name: 'Leg curl couché',        emoji: '🔄', muscles: ['hamstrings'],          tip: 'Hanches au sol, curl complet, contraction 1 s en haut',               priority: 2 },
  { name: 'Good morning',           emoji: '🌅', muscles: ['hamstrings', 'back'],  tip: 'Charge légère, dos plat, flexion de hanches lente et contrôlée',      priority: 2 },
  // Fessiers
  { name: 'Hip thrust',             emoji: '🍑', muscles: ['glutes', 'hamstrings'],tip: 'Menton rentré, poussée par les talons, contraction forte en haut',    priority: 1 },
  { name: 'Squat bulgare',          emoji: '🇧🇬', muscles: ['glutes', 'quads'],    tip: 'Pied arrière sur banc, genou avant stable, descente verticale',        priority: 1 },
  { name: 'Fentes arrière',         emoji: '⬅️', muscles: ['glutes', 'quads'],     tip: 'Pied arrière loin, genou avant ne dépasse pas les orteils',           priority: 2 },
  // Abdos / Core
  { name: 'Gainage planche',        emoji: '📏', muscles: ['core'],                tip: 'Corps en ligne, respiration nasale, contracte les fessiers aussi',     priority: 1 },
  { name: 'Crunch câble',           emoji: '💢', muscles: ['core'],                tip: 'Flexion lombaires seule, coudes aux genoux, pas de tirage sur le cou', priority: 1 },
  { name: 'Relevé de jambes',       emoji: '🦵', muscles: ['core'],                tip: 'Bas du dos collé au banc, jambes tendues, descente contrôlée',         priority: 1 },
  { name: 'Russian twist',          emoji: '🌀', muscles: ['core'],                tip: 'Contrôle la rotation, expire en montant, pieds décollés = +dur',       priority: 2 },
  // Mollets
  { name: 'Mollets debout',         emoji: '🦶', muscles: ['calves'],              tip: 'Amplitude complète, montée lente (2 s), maintien 1 s en haut',         priority: 1 },
  { name: 'Mollets assis',          emoji: '💺', muscles: ['calves'],              tip: 'Isole le soléaire, charge légère, reps élevées (15-20)',               priority: 2 },
]

// ── Génération du programme ──────────────────────────────────────────────────

export function generateFreeWorkout(input: FreeWorkoutInput): SuggestedWorkout {
  // Ajuster l'énergie en fonction du sommeil
  const adjustedEnergy: EnergyLevel = input.sleepQuality === 'bad'
    ? (Math.max(1, input.energyLevel - 1) as EnergyLevel)
    : input.energyLevel

  // Adapter l'objectif selon l'énergie réelle
  const adjustedGoal: WorkoutGoal = (() => {
    if (adjustedEnergy === 1) return 'recup'
    if (adjustedEnergy === 2 && input.goal === 'force') return 'hypertrophie'
    return input.goal
  })()

  const profile = GOAL_PROFILES[adjustedGoal]

  // Nombre d'exercices selon le temps disponible
  const numExercises = Math.max(3, Math.min(10, Math.floor(input.availableTime / profile.minPerEx)))

  // Zones cibles (résoudre full_body + exclure zones douloureuses)
  const allMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core', 'calves']
  const isFullBody = input.targetZones.includes('full_body')
  const targetMuscles = (isFullBody ? allMuscles : input.targetZones)
    .filter(z => !input.painZones.includes(z))

  // Candidats : exercices couvrant au moins un muscle cible sans zone douloureuse
  const candidates = EXERCISES.filter(ex =>
    ex.muscles.some(m => targetMuscles.includes(m)) &&
    !ex.muscles.every(m => input.painZones.includes(m))
  )

  // Sélection : couvrir un maximum de zones, polyarticulaires en premier
  const selected: ExerciseTemplate[] = []
  const coveredMuscles = new Set<string>()

  // 1er passage : poly-articulaires couvrant de nouvelles zones
  for (const ex of candidates.filter(e => e.priority === 1)) {
    if (selected.length >= numExercises) break
    const newMuscles = ex.muscles.filter(m => !coveredMuscles.has(m))
    if (newMuscles.length > 0) {
      selected.push(ex)
      for (const m of ex.muscles) coveredMuscles.add(m)
    }
  }

  // 2e passage : poly-articulaires restants (volume supplémentaire)
  for (const ex of candidates.filter(e => e.priority === 1)) {
    if (selected.length >= numExercises) break
    if (!selected.includes(ex)) selected.push(ex)
  }

  // 3e passage : isolations pour compléter
  for (const ex of candidates.filter(e => e.priority === 2)) {
    if (selected.length >= numExercises) break
    if (!selected.includes(ex)) selected.push(ex)
  }

  // Réduire les séries si énergie très basse
  const setCount = Math.max(2, profile.sets - (adjustedEnergy === 1 ? 1 : 0))

  const exercises: SuggestedExercise[] = selected.slice(0, numExercises).map(ex => ({
    name: ex.name,
    emoji: ex.emoji,
    sets: setCount,
    reps: profile.reps,
    restSec: profile.restSec,
    tip: ex.tip,
  }))

  // Estimation de la durée totale
  const parts = profile.reps.split('-')
  const lo = parseInt(parts[0] ?? '8', 10)
  const hi = parseInt(parts[1] ?? lo.toString(), 10)
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
