// Génération automatique d'un DraftProgram à partir des réponses du wizard.
// Fonction pure : ne touche ni au store ni à l'IDB.
// Stratégie : curriculum codé (split × objectif × niveau) + sélection
// depuis le store filtré par équipement + primaryMuscle + popularité.

import type {
  Equipment, Exercise, MuscleGroup,
  ProgramGoal, ProgramLevel, Weekday, WorkoutType,
} from '../types'
import type { DraftPhase, DraftProgram, DraftWE, DraftWorkout } from '../components/programBuilder/programDraft'
import { PROGRAM_COLORS } from '../components/programBuilder/programDraft'
import { uuid } from './uuid'

// ── Types publics ────────────────────────────────────────────────────────────

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
  /** Équipements disponibles — tableau direct des valeurs Equipment sélectionnées. */
  equipment: Equipment[]
  level: ProgramLevel
  /** Jours explicitement choisis par l'utilisateur (optionnel — sinon par défaut). */
  selectedDays?: Weekday[]
  /** Muscles prioritaires (optionnel — vide = pas de préférence). */
  focusMuscles?: FocusMuscle[]
  /**
   * Durée totale du programme en semaines — override de DURATION_WEEKS[level].
   * Active la périodisation par blocs si ≥ 8 semaines.
   */
  totalWeeks?: number
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

// Specs fixes pour l'échauffement et les abdos (ajoutés systématiquement)
const WARMUP_SPEC: SetSpec = { sets: 2, repsMin: 10, repsMax: 10, restSec: 0,  range: false }
const CORE_SPEC:   SetSpec = { sets: 3, repsMin: 15, repsMax: 15, restSec: 60, range: false }

// ── Définition de slots ───────────────────────────────────────────────────────
// compound: true  → filtrer sur category === 'compound' uniquement
// compound: false → préférer isolation, fallback compound si aucun résultat

interface Slot {
  muscles: MuscleGroup[]
  compound: boolean
}

// Types internes au générateur — les variantes A/B ne font pas partie du WorkoutType
// public. Le DraftWorkout.type reçoit toujours le type public canonique :
//   fullbody-quad / fullbody-hip → 'fullbody'
//   upper-push / upper-pull      → 'upper'
//   lower-quad / lower-hip       → 'lower'
//   lower_pull                   → 'lower'  (chaîne postérieure : deadlift + tirage)
type InternalWorkoutType =
  | Exclude<WorkoutType, 'custom'>
  | 'fullbody-quad' | 'fullbody-hip'
  | 'upper-push'    | 'upper-pull'
  | 'lower-quad'    | 'lower-hip'
  | 'lower_pull'    | 'lower_push'

/** Retourne le WorkoutType public correspondant à un type interne. */
function toPublicType(t: InternalWorkoutType): Exclude<WorkoutType, 'custom'> {
  if (t === 'fullbody-quad' || t === 'fullbody-hip') return 'fullbody'
  if (t === 'upper-push'    || t === 'upper-pull')   return 'upper'
  if (t === 'lower-quad'    || t === 'lower-hip')    return 'lower'
  if (t === 'lower_pull' || t === 'lower_push')      return 'lower'
  return t
}

// Slots pour une séance de 60 min (référence).
// L'ajustement de durée réduit / augmente le nombre de slots pris.
const SLOTS: Record<InternalWorkoutType, Slot[]> = {
  push: [
    { muscles: ['chest', 'chest_upper', 'chest_lower'], compound: true  },
    { muscles: ['shoulders', 'shoulders_front'],         compound: true  },
    { muscles: ['chest', 'chest_upper', 'chest_lower'], compound: false },
    { muscles: ['triceps'],                              compound: false },
    { muscles: ['shoulders_lateral', 'shoulders'],       compound: false },
    { muscles: ['shoulders_rear'],                       compound: false }, // face pull / écarté penché — équilibre épaule
  ],
  pull: [
    { muscles: ['back_width', 'back'],                   compound: true  },
    { muscles: ['back_thickness', 'back'],               compound: true  },
    { muscles: ['back_thickness', 'back_width', 'back'], compound: false },
    { muscles: ['biceps'],                               compound: false },
    { muscles: ['shoulders_rear'],                       compound: false },
    { muscles: ['forearms'],                             compound: false },
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
    { muscles: ['chest', 'chest_upper'],                          compound: true  },
    { muscles: ['back_width', 'back_thickness', 'back'],           compound: true  }, // tirage vertical ou rowing selon équipement
    { muscles: ['shoulders', 'shoulders_front'],                  compound: true  }, // OHP
    { muscles: ['shoulders_lateral', 'shoulders_rear'],           compound: false }, // écarté / face pull
    { muscles: ['back_thickness', 'back'],                        compound: false },
    { muscles: ['chest', 'chest_lower'],                          compound: false },
    { muscles: ['biceps'],                                        compound: false },
    { muscles: ['triceps'],                                       compound: false },
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
    // Conservé pour compatibilité — non utilisé par le générateur automatique
    { muscles: ['quads', 'glutes'],                              compound: true  },
    { muscles: ['chest', 'chest_upper'],                         compound: true  },
    { muscles: ['back_width', 'back_thickness', 'back'],          compound: true  },
    { muscles: ['hamstrings', 'glutes'],                         compound: false },
    { muscles: ['shoulders_lateral', 'shoulders_rear', 'shoulders'], compound: false },
    { muscles: ['shoulders', 'shoulders_front'],                 compound: true  },
    { muscles: ['biceps'],                                       compound: false },
    { muscles: ['triceps'],                                      compound: false },
  ],
  // ── Patterns A/B upper ───────────────────────────────────────────────────────
  // upper-push (A) : bench-first — développé + tirage + OHP, puis fly + tris + écarté + bis
  // upper-pull (B) : traction-first — 2 composés dos + bench incliné, puis face pull + bis + isolation dos + tris
  'upper-push': [
    // Composés (bench-first)
    { muscles: ['chest', 'chest_upper'],                          compound: true  }, // Développé couché
    { muscles: ['back_width', 'back_thickness', 'back'],           compound: true  }, // Tirage / rowing
    { muscles: ['shoulders', 'shoulders_front'],                  compound: true  }, // OHP
    // Isolations
    { muscles: ['chest', 'chest_lower', 'chest_upper'],           compound: false }, // Fly pectoraux
    { muscles: ['triceps'],                                       compound: false },
    { muscles: ['shoulders_lateral'],                             compound: false }, // Écarté latéral
    { muscles: ['biceps'],                                        compound: false },
    { muscles: ['back_thickness', 'back'],                        compound: false }, // Isolation dos
  ],
  'upper-pull': [
    // Composés (traction-first — 2 composés dos)
    { muscles: ['back_width', 'back'],                            compound: true  }, // Traction / lat pulldown
    { muscles: ['back_thickness', 'back'],                        compound: true  }, // Rowing
    { muscles: ['chest', 'chest_upper'],                          compound: true  }, // Développé incliné
    // Isolations
    { muscles: ['shoulders_rear'],                                compound: false }, // Face pull (obligatoire)
    { muscles: ['biceps'],                                        compound: false },
    { muscles: ['back_thickness', 'back'],                        compound: false }, // Isolation dos
    { muscles: ['triceps'],                                       compound: false },
    { muscles: ['shoulders_lateral'],                             compound: false }, // Écarté latéral
  ],
  // ── Patterns A/B lower ───────────────────────────────────────────────────────
  // lower-quad (A) : squat-dominant — charge quadriceps en priorité
  // lower-hip  (B) : hip-dominant — fessiers et chaîne postérieure en priorité
  'lower-quad': [
    // Composés (squat-first)
    { muscles: ['quads', 'glutes'],               compound: true  }, // Squat / leg press
    { muscles: ['hamstrings', 'glutes'],           compound: true  }, // RDL
    // Isolations
    { muscles: ['quads'],                          compound: false }, // Leg extension
    { muscles: ['hamstrings'],                     compound: false }, // Leg curl
    { muscles: ['glutes'],                         compound: false }, // Hip abduction / donkey kick
    { muscles: ['calves'],                         compound: false },
  ],
  'lower-hip': [
    // Composés (hip thrust-first)
    { muscles: ['glutes', 'hamstrings'],           compound: true  }, // Hip thrust / sumo DL
    { muscles: ['quads', 'glutes'],                compound: true  }, // Fente bulgare / lunge / step-up
    // Isolations
    { muscles: ['glutes'],                         compound: false }, // Cable kickback / abducteur machine
    { muscles: ['hamstrings'],                     compound: false }, // Leg curl
    { muscles: ['quads'],                          compound: false }, // Leg extension
    { muscles: ['calves'],                         compound: false },
  ],
  // ── Chaîne postérieure (lower_pull) ─────────────────────────────────────────
  // Pour les utilisateurs qui ciblent jambes + dos (± core, ± bras).
  // Deadlift-first : le soulevé de terre est le mouvement roi qui travaille
  // simultanément ischio-jambiers, fessiers et érecteurs du rachis.
  // Structure : 1 composé jambes-dos → 2 composés dos → 1 composé jambes → isolations.
  'lower_pull': [
    // Composés (deadlift-first)
    { muscles: ['hamstrings', 'glutes'],                  compound: true  }, // Deadlift / RDL
    { muscles: ['back_width', 'back'],                    compound: true  }, // Traction / lat pulldown
    { muscles: ['back_thickness', 'back'],                compound: true  }, // Rowing barre / DB
    { muscles: ['quads', 'glutes'],                       compound: true  }, // Squat / leg press (couverture quads)
    // Isolations
    { muscles: ['glutes', 'hamstrings'],                  compound: false }, // Hip thrust / cable kickback
    { muscles: ['back_thickness', 'back_width', 'back'],  compound: false }, // Isolation dos
    { muscles: ['hamstrings'],                            compound: false }, // Leg curl
    { muscles: ['calves'],                                compound: false }, // Mollets (pos 8 — inclus si cap=8)
    { muscles: ['biceps'],                                compound: false }, // Curl (accessoire pull — pos 9, éjecté si cap=8)
  ],
  // ── Squat & Press (lower_push) ───────────────────────────────────────────────
  // Pour les utilisateurs qui ciblent jambes + push (± core, ± bras).
  // Pattern haltérophile / Wendler : squat-first puis overhead press ou bench.
  // Structure : composé quad → composé chest → composé OHP → composé postérieur → isolations.
  'lower_push': [
    // Composés (squat-first)
    { muscles: ['quads', 'glutes'],                       compound: true  }, // Squat / leg press
    { muscles: ['chest', 'chest_upper'],                  compound: true  }, // Développé couché / incliné
    { muscles: ['shoulders', 'shoulders_front'],          compound: true  }, // Overhead press
    { muscles: ['hamstrings', 'glutes'],                  compound: true  }, // RDL / good morning (post. chain)
    // Isolations
    { muscles: ['quads'],                                 compound: false }, // Leg extension
    { muscles: ['calves'],                                compound: false }, // Mollets (pos 6 — inclus si cap=8)
    { muscles: ['chest', 'chest_lower', 'chest_upper'],   compound: false }, // Fly pectoraux
    { muscles: ['glutes'],                                compound: false }, // Cable kickback / abducteur (pos 8)
    { muscles: ['triceps'],                               compound: false }, // Extension (accessoire press — pos 9, éjecté si cap=8)
  ],
  // ── Patterns A/B fullbody ─────────────────────────────────────────────────────
  // fullbody-quad (A) : dominance quadriceps — squat + développé + tirage + OHP
  // fullbody-hip  (B) : dominance postérieure — RDL + développé + traction + OHP
  // Règles coach : tous les composés en premier, OHP avant isolations, mollets systématiques.
  'fullbody-quad': [
    // Composés (tous en premier)
    { muscles: ['quads', 'glutes'],                    compound: true  }, // Squat / leg press
    { muscles: ['chest', 'chest_upper'],                compound: true  }, // Développé couché
    { muscles: ['back_width', 'back_thickness', 'back'], compound: true  }, // Tirage vertical / rowing
    { muscles: ['shoulders', 'shoulders_front'],        compound: true  }, // OHP
    // Isolations
    { muscles: ['hamstrings'],                          compound: false }, // Leg curl
    { muscles: ['shoulders_rear'],                      compound: false }, // Face pull (prioritaire)
    { muscles: ['biceps'],                              compound: false },
    { muscles: ['calves'],                              compound: false }, // Mollets (pos 8 — inclus si cap=8)
    { muscles: ['triceps'],                             compound: false }, // Accessoire press (pos 9, éjecté si cap=8)
  ],
  'fullbody-hip': [
    // Composés (tous en premier)
    { muscles: ['hamstrings', 'glutes'],                compound: true  }, // RDL / hip thrust
    { muscles: ['chest', 'chest_upper'],                compound: true  }, // Développé couché ou incliné
    { muscles: ['back_width', 'back'],                  compound: true  }, // Traction / tirage vertical
    { muscles: ['shoulders', 'shoulders_front'],        compound: true  }, // OHP
    // Isolations
    { muscles: ['quads'],                               compound: false }, // Leg extension
    { muscles: ['shoulders_lateral', 'shoulders_rear'], compound: false }, // Écarté / face pull
    { muscles: ['biceps'],                              compound: false },
    { muscles: ['calves'],                              compound: false }, // Mollets (pos 8 — inclus si cap=8)
    { muscles: ['triceps'],                             compound: false }, // Accessoire press (pos 9, éjecté si cap=8)
  ],
}

// ── Sélection du split ────────────────────────────────────────────────────────

type Split = InternalWorkoutType[]

/**
 * Déduit le type de séance dominant à partir des muscles ciblés.
 * Si l'utilisateur cible exclusivement un sous-groupe (ex. legs+core),
 * toutes les séances du programme seront de ce type.
 * Retourne null si les muscles couvrent trop de groupes (→ split par défaut).
 */
function workoutTypeFromFocus(
  focusMuscles: FocusMuscle[],
): Exclude<InternalWorkoutType, 'upper-push' | 'upper-pull' | 'lower-quad' | 'lower-hip' | 'fullbody-quad' | 'fullbody-hip'> | null {
  if (focusMuscles.length === 0) return null

  const hasLower = focusMuscles.includes('legs')
  const hasPush  = focusMuscles.includes('chest') || focusMuscles.includes('shoulders')
  const hasPull  = focusMuscles.includes('back')
  const hasArms  = focusMuscles.includes('arms')
  const hasCore  = focusMuscles.includes('core')
  const hasUpper = hasPush || hasPull || hasArms

  // Jambes seules (± core) → séances bas du corps
  if (hasLower && !hasUpper) return 'lower'
  // Core seul → null : le générateur produit un fullbody équilibré avec un exercice
  // core ajouté en queue de chaque séance (corePool). Retourner 'lower' ici serait
  // sémantiquement faux (l'utilisateur veut du gainage, pas des squats).
  if (hasCore && !hasLower && !hasUpper) return null
  // Push pur (poitrine / épaules, sans tirage ni jambes)
  if (hasPush && !hasPull && !hasLower) return 'push'
  // Pull pur (dos, sans poussée ni jambes)
  if (hasPull && !hasPush && !hasLower) return 'pull'
  // Haut du corps mixte (sans jambes)
  if (hasUpper && !hasLower) return 'upper'
  // Squat & Press : jambes + push (± core, ± bras, sans tirage)
  // → squat-first puis bench/OHP : pattern haltérophile classique (Wendler, crossfit).
  if (hasLower && hasPush && !hasPull) return 'lower_push'
  // Chaîne postérieure : jambes + dos (± core, ± bras, sans push)
  // → deadlift-first : le soulevé de terre travaille simultanément jambes et dos.
  if (hasLower && hasPull && !hasPush) return 'lower_pull'
  // Ambiguïté totale (push + pull + jambes, etc.) → split par défaut
  return null
}

function selectSplit(params: GeneratorParams): Split {
  const { goal, daysPerWeek, level, focusMuscles = [] } = params
  const isMass = goal === 'strength' || goal === 'hypertrophy'

  // Si les muscles ciblés désignent clairement un type de séance, l'utiliser
  // pour toutes les séances. Pour le bas du corps, alterner lower-quad / lower-hip
  // (squat-dominant vs hip-dominant). Pour le haut du corps, alterner upper-push /
  // upper-pull (poussée-dominant vs tirage-dominant) — variété structurelle A/B.
  const focusType = workoutTypeFromFocus(focusMuscles)
  if (focusType) {
    if (focusType === 'lower') {
      return Array.from({ length: daysPerWeek }, (_, i) =>
        i % 2 === 0 ? 'lower-quad' : 'lower-hip',
      ) as Split
    }
    if (focusType === 'upper') {
      return Array.from({ length: daysPerWeek }, (_, i) =>
        i % 2 === 0 ? 'upper-push' : 'upper-pull',
      ) as Split
    }
    return Array.from({ length: daysPerWeek }, () => focusType) as Split
  }

  // Split par défaut basé sur l'objectif et la fréquence
  switch (daysPerWeek) {
    case 2:
      return ['fullbody-quad', 'fullbody-hip']

    case 3:
      // Mass + intermédiaire/confirmé → PPL classique
      if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']
      // Non-mass + intermédiaire/confirmé → Push/Pull/Full Body (haut 2×, bas 1× via fullbody)
      if (!isMass && level !== 'beginner') return ['push', 'pull', 'fullbody-quad']
      // Débutants → fullbody A/B/A
      return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']

    case 4:
      // Mass → upper-push/lower-quad/upper-pull/lower-hip (structure A/B pour upper ET lower)
      if (isMass) return ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']
      // Non-mass + intermédiaire/confirmé → Push/Pull/Lower A/Full Body
      if (level !== 'beginner') return ['push', 'pull', 'lower-quad', 'fullbody-quad']
      // Débutants non-mass → fullbody A/B/A/B
      return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad', 'fullbody-hip']

    case 5:
      // Mass + intermédiaire/confirmé → PPL + upper + lower (chaque type 1×, pas besoin d'A/B)
      if (isMass && level !== 'beginner') return ['push', 'pull', 'legs', 'upper', 'lower']
      // Mass + débutant → upper-push/lower-quad/upper-pull/lower-hip/fullbody
      if (isMass) return ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'fullbody-quad']
      // Non-mass + intermédiaire/confirmé → Push/Pull/Lower-A/Lower-B/Full Body
      if (level !== 'beginner') return ['push', 'pull', 'lower-quad', 'lower-hip', 'fullbody-quad']
      // Débutants non-mass → fullbody A/B/A/B/A
      return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad', 'fullbody-hip', 'fullbody-quad']
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

const WORKOUT_NAMES: Record<InternalWorkoutType, string> = {
  push:     'Push — Poussée',
  pull:     'Pull — Tirage',
  legs:     'Legs — Jambes',
  upper:    'Upper — Haut du corps',
  lower:    'Lower — Bas du corps',
  fullbody: 'Full Body',
  'upper-push':    'Upper — Haut du corps',
  'upper-pull':    'Upper — Haut du corps',
  'lower-quad':    'Lower — Bas du corps',
  'lower-hip':     'Lower — Bas du corps',
  'lower_pull':    'Lower — Chaîne postérieure',
  'lower_push':    'Lower — Squat & Press',
  'fullbody-quad': 'Full Body',
  'fullbody-hip':  'Full Body',
}

// ── Ajustement du nombre de slots selon la durée et l'objectif ───────────────
// La force impose des repos de 180 s (vs 60–90 s en hypertrophie), ce qui réduit
// sensiblement le nombre d'exercices réalisables dans le créneau déclaré.
//
// Barème force (timing réel estimé avec warmup + core) :
//   20 min → ×0.5  min 2 slots   (créneau très court)
//   45 min → ×0.5  min 2 slots   (créneau court)
//   60 min → ×0.5  min 4 slots   → 4 slots ≈ 65-70 min effectifs
//            (anciennement ×0.75, donnait 6 slots pour les templates 8-9 slots → ~80 min)
//   90 min → min(base, 6)         → 6 slots ≈ 80 min effectifs
//            (anciennement base, donnait 9 slots pour fullbody → ~115 min)
//
// Les autres objectifs (hypertrophie, endurance, fat_loss) gardent le barème normal.

function adjustedSlotCount(
  base: number,
  duration: 20 | 45 | 60 | 90,
  goal: ProgramGoal,
): number {
  const isStrength = goal === 'strength'
  if (duration === 20) return Math.max(2, Math.floor(base * 0.5))
  if (duration === 45) return isStrength
    ? Math.max(2, Math.floor(base * 0.5))
    : Math.max(3, Math.floor(base * 0.75))
  if (duration === 60) return isStrength
    ? Math.max(4, Math.floor(base * 0.5))   // 4 slots pour tous les templates
    : base
  // 90 min
  return isStrength
    ? Math.min(base, 6)                      // cap à 6 — base=6 inchangé, base 8-9 → 6
    : Math.min(base + 2, 8)
}

// ── Ajustement du nombre de séries selon la durée ────────────────────────────
// Pour les séances courtes, on réduit les séries proportionnellement pour que
// la durée réelle (travail + repos) corresponde à la durée annoncée.
// 20 min → ×0.5 (min 2)   45 min → ×0.75 (min 2)   60/90 min → inchangé

export function adjustedSpec(spec: SetSpec, duration: 20 | 45 | 60 | 90): SetSpec {
  if (duration === 60 || duration === 90) return spec
  const factor = duration === 20 ? 0.5 : 0.75
  return { ...spec, sets: Math.max(2, Math.floor(spec.sets * factor)) }
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

// Priorité d'équipement pour les slots compound en objectif force.
// Barbell > Machine/câble > Haltères/KB > Élastique > Poids du corps.
function strengthEquipmentPrio(eq: Equipment): number {
  switch (eq) {
    case 'barbell':    return 0
    case 'machine':    return 1
    case 'cable':      return 1
    case 'dumbbell':   return 2
    case 'kettlebell': return 2
    case 'band':       return 3
    default:           return 4 // bodyweight
  }
}

function pickExercise(
  slot: Slot,
  available: Exercise[],
  usedInWorkout: Set<string>,
  usedGlobally: Set<string>,
  level: ProgramLevel,
  focused: Set<MuscleGroup>,
  goal: ProgramGoal,
): Exercise | null {
  // Filtrer par muscle cible (et exclure les exercices désactivés popularity=0)
  let candidates = available.filter(
    (ex) =>
      slot.muscles.includes(ex.primaryMuscle) &&
      !usedInWorkout.has(ex.id) &&
      (ex.popularity ?? 1) > 0,
  )

  if (slot.compound) {
    // Compound strict : filtrer sur la catégorie
    const compoundOnly = candidates.filter((ex) => ex.category === 'compound')
    if (compoundOnly.length > 0) {
      candidates = compoundOnly
    } else {
      // Aucun compound disponible → signal via valeur sentinelle pour déclencher un warning
      return null
    }
  } else {
    // Préférer isolation, mais ne pas bloquer si aucun
    const isolationFirst = candidates.filter((ex) => ex.category === 'isolation')
    if (isolationFirst.length > 0) candidates = isolationFirst
  }

  // Trier : muscles ciblés d'abord, puis muscle principal du slot (slot.muscles[0]),
  // puis (force+compound) équipement chargé, puis non-utilisé globalement, puis popularité desc.
  // Le critère slot.muscles[0] garantit que fullbody-quad démarre par un quad-dominant
  // (squat) et non un glute-dominant (hip thrust), même si ce dernier a plus de popularité.
  candidates.sort((a, b) => {
    if (focused.size > 0) {
      const aF = focused.has(a.primaryMuscle) ? 0 : 1
      const bF = focused.has(b.primaryMuscle) ? 0 : 1
      if (aF !== bF) return aF - bF
    }
    const slotPrimary = slot.muscles[0]
    if (slotPrimary) {
      const aP = a.primaryMuscle === slotPrimary ? 0 : 1
      const bP = b.primaryMuscle === slotPrimary ? 0 : 1
      if (aP !== bP) return aP - bP
    }
    if (goal === 'strength' && slot.compound) {
      const eqDiff = strengthEquipmentPrio(a.equipment) - strengthEquipmentPrio(b.equipment)
      if (eqDiff !== 0) return eqDiff
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
  const progressStepKg =
    exercise.equipment === 'bodyweight' || exercise.equipment === 'band' ? 0 : 2.5
  return {
    localId: uuid(),
    exerciseId: exercise.id,
    targetSets: spec.sets,
    repsMode: spec.range ? 'range' : 'fixed',
    targetRepsMin: spec.repsMin,
    targetRepsMax: spec.repsMax,
    restSec: spec.restSec,
    autoProgress: progressStepKg > 0,
    progressStepKg,
  }
}

// ── Périodisation par blocs ───────────────────────────────────────────────────
// Moins de 8 semaines → pas de périodisation (trop court pour 4 phases).
// 8-9 sem  : Adaptation 2 + Progression 3-4 + Intensification 2 + Décharge 1
// 10-11 sem: Adaptation 2 + Progression 4-5 + Intensification 3 + Décharge 1
// 12-15 sem: Adaptation 2 + Progression 5+  + Intensification 3 + Décharge 2
// 16+ sem  : Adaptation 2 + Progression 8+  + Intensification 4 + Décharge 2
//
// Les modificateurs de séries/reps varient selon l'objectif :
//   strength    → intensification via charge (−reps)
//   hypertrophy → intensification via volume dense (+série, −reps légères)
//   endurance   → intensification via travail total (+série, +reps)
//   fat_loss    → intensification via densité (même séries, +reps)

type PhaseModSet = { setsModifier: number; repsOffset: number }
type GoalPhaseConfig = {
  adaptation: PhaseModSet & { description: string }
  intensification: PhaseModSet & { description: string }
  deload: PhaseModSet & { description: string }
}

export const PHASE_CONFIG_BY_GOAL: Record<ProgramGoal, GoalPhaseConfig> = {
  strength: {
    adaptation:      { setsModifier: -1, repsOffset: +3, description: 'Maîtrise des mouvements, charges légères, volume modéré' },
    // repsOffset: -2 et non -3 pour garantir repsMin ≥ 1 (COMPOUND_SPEC.strength.repsMin = 3 → 3-2=1)
    intensification: { setsModifier:  0, repsOffset: -2, description: 'Charges maximales, répétitions faibles (1–3 reps)' },
    deload:          { setsModifier: -2, repsOffset: +4, description: 'Récupération active, 50 % du volume habituel' },
  },
  hypertrophy: {
    adaptation:      { setsModifier: -1, repsOffset: +2, description: 'Volume modéré, apprentissage des patterns' },
    intensification: { setsModifier: +1, repsOffset: -2, description: 'Volume maximal, densité accrue, charges lourdes' },
    deload:          { setsModifier: -2, repsOffset:  0, description: 'Récupération, volume minimal' },
  },
  endurance: {
    adaptation:      { setsModifier: -1, repsOffset: -2, description: 'Initiation progressive, travail léger' },
    intensification: { setsModifier: +1, repsOffset: +3, description: 'Volume et répétitions maximaux, endurance peak' },
    deload:          { setsModifier: -2, repsOffset:  0, description: 'Récupération active, volume réduit' },
  },
  fat_loss: {
    adaptation:      { setsModifier: -1, repsOffset:  0, description: 'Circuits légers, prise en main du rythme' },
    intensification: { setsModifier:  0, repsOffset: +3, description: 'Densité maximale, répétitions élevées' },
    deload:          { setsModifier: -1, repsOffset:  0, description: 'Récupération active, intensité réduite' },
  },
}

/** Clé de focus de phase — même union que DraftPhase['focus']. */
export type PhaseKey = 'adaptation' | 'progression' | 'intensification' | 'deload'

const PHASE_ORDER: Record<PhaseKey, number> = {
  adaptation: 1, progression: 2, intensification: 3, deload: 4,
}

/** Retourne true si `current` est au moins aussi avancée que `required`. */
export function phaseAtLeast(current: PhaseKey, required: PhaseKey): boolean {
  return PHASE_ORDER[current] >= PHASE_ORDER[required]
}

export function buildPhases(totalWeeks: number, goal: ProgramGoal = 'strength'): DraftPhase[] | undefined {
  if (totalWeeks < 8) return undefined

  const cfg = PHASE_CONFIG_BY_GOAL[goal]
  const adapt     = 2                                              // max 2 semaines
  const deload    = totalWeeks >= 12 ? 2 : 1
  const intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)
  const progress  = Math.max(1, totalWeeks - adapt - intensive - deload)

  let w = 1
  const phases: DraftPhase[] = []

  phases.push({
    name: 'Adaptation',
    focus: 'adaptation',
    weekStart: w,
    weekEnd: w + adapt - 1,
    description: cfg.adaptation.description,
    setsModifier: cfg.adaptation.setsModifier,
    repsOffset: cfg.adaptation.repsOffset,
  })
  w += adapt

  phases.push({
    name: 'Progression',
    focus: 'progression',
    weekStart: w,
    weekEnd: w + progress - 1,
    description: 'Volume et charge standards, montée progressive',
  })
  w += progress

  phases.push({
    name: 'Intensification',
    focus: 'intensification',
    weekStart: w,
    weekEnd: w + intensive - 1,
    description: cfg.intensification.description,
    setsModifier: cfg.intensification.setsModifier,
    repsOffset: cfg.intensification.repsOffset,
  })
  w += intensive

  phases.push({
    name: 'Décharge',
    focus: 'deload',
    weekStart: w,
    weekEnd: totalWeeks,
    description: cfg.deload.description,
    setsModifier: cfg.deload.setsModifier,
    repsOffset: cfg.deload.repsOffset,
  })

  return phases
}

// ── Fonction principale ───────────────────────────────────────────────────────

/** Labels français courts pour les muscles — utilisés dans les warnings. */
const MUSCLE_LABEL: Partial<Record<MuscleGroup, string>> = {
  chest: 'pectoraux', chest_upper: 'pec. supérieur', chest_lower: 'pec. inférieur',
  back: 'dos', back_width: 'dos (largeur)', back_thickness: 'dos (épaisseur)',
  shoulders: 'épaules', shoulders_front: 'épaules (avant)', shoulders_lateral: 'épaules (latéral)',
  shoulders_rear: 'épaules (arrière)',
  quads: 'quadriceps', hamstrings: 'ischio-jambiers', glutes: 'fessiers', calves: 'mollets',
  biceps: 'biceps', triceps: 'triceps', forearms: 'avant-bras', core: 'abdominaux',
}

export function generateProgramDraft(
  params: GeneratorParams,
  exercises: Exercise[],
): DraftProgram {
  const { goal, daysPerWeek, sessionDuration, equipment, level, selectedDays, focusMuscles, totalWeeks } = params
  const durationWeeks = totalWeeks ?? DURATION_WEEKS[level]!

  // Construire le Set<MuscleGroup> des muscles ciblés une seule fois
  const focusedMuscles = new Set<MuscleGroup>(
    (focusMuscles ?? []).flatMap((f) => FOCUS_TO_MUSCLES[f]),
  )

  // Exercices disponibles selon l'équipement (hors warmup, hors supprimés)
  const allowed = new Set(equipment)
  const available = exercises.filter(
    (ex) => !ex.deleted && !ex.isWarmupExercise && allowed.has(ex.equipment),
  )

  // Pools pour échauffement et abdos — filtrés par équipement disponible ou bodyweight.
  // Garantit qu'un user poids du corps ne voit pas "Band pull-apart" ou "Crunch poulie".
  const warmupPool = exercises.filter(
    (ex) => !ex.deleted && ex.isWarmupExercise &&
    (allowed.has(ex.equipment) || ex.equipment === 'bodyweight'),
  )
  const corePool = exercises.filter(
    (ex) => !ex.deleted && !ex.isWarmupExercise && ex.primaryMuscle === 'core' &&
    (allowed.has(ex.equipment) || ex.equipment === 'bodyweight'),
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
  // Warnings collectés lors de la génération (slots composés sans exercice disponible).
  // Dédupliqués par clé "{workoutType}:{muscle}" pour éviter les répétitions cross-séances.
  const warnKeys = new Set<string>()
  const generatorWarnings: string[] = []

  for (const workoutType of split) {
    // Clé canonique : variantes A/B comptent ensemble pour le suffixe (upper-push + upper-pull = Upper A/B)
    const canon = toPublicType(workoutType)
    const count = (typeCount.get(canon) ?? 0) + 1
    typeCount.set(canon, count)

    // Réordonner les slots : muscles ciblés montent avant la coupure de durée
    const rawSlots = SLOTS[workoutType] ?? []
    const baseSlots = reorderSlotsByFocus(rawSlots, focusedMuscles)
    const slotCount = adjustedSlotCount(baseSlots.length, sessionDuration, goal)
    const slots = baseSlots.slice(0, slotCount)

    const usedInWorkout = new Set<string>()
    const draftExercises: DraftWE[] = []

    for (const slot of slots) {
      const baseSpec = slot.compound ? COMPOUND_SPEC[goal]! : ISOLATION_SPEC[goal]!
      const spec = adjustedSpec(baseSpec, sessionDuration)
      const ex = pickExercise(slot, available, usedInWorkout, usedGlobally, level, focusedMuscles, goal)
      if (!ex) {
        // Slot composé vide → émettre un warning (dédupliqué par muscle principal)
        if (slot.compound) {
          const primaryMuscle = slot.muscles[0]
          const warnKey = `${workoutType}:${primaryMuscle ?? ''}`
          if (primaryMuscle && !warnKeys.has(warnKey)) {
            warnKeys.add(warnKey)
            const label = MUSCLE_LABEL[primaryMuscle] ?? primaryMuscle
            generatorWarnings.push(
              `Aucun exercice composé disponible pour "${label}" avec votre équipement.`,
            )
          }
        }
        continue
      }

      usedInWorkout.add(ex.id)
      usedGlobally.add(ex.id)
      draftExercises.push(makeDraftWE(ex, spec))
    }

    // Séances très courtes (≤ 20 min) : warmup réduit à 1 série, core supprimé.
    // Le warmup + core représentent ~8 min fixes, soit ~40 % d'une séance de 20 min.
    const isVeryShort = sessionDuration <= 20
    const effectiveWarmupSpec: SetSpec = isVeryShort ? { ...WARMUP_SPEC, sets: 1 } : WARMUP_SPEC

    // Échauffement en tête — varie par rotation entre les séances
    if (warmupPool.length > 0) {
      const warmupEx = warmupPool[workouts.length % warmupPool.length]
      if (warmupEx) {
        const we = makeDraftWE(warmupEx, effectiveWarmupSpec)
        we.autoProgress = false
        draftExercises.unshift(we)
      }
    }

    // Abdos en queue — supprimé pour les séances ≤ 20 min (crédit temps insuffisant)
    if (!isVeryShort && corePool.length > 0) {
      const coreEx = corePool[workouts.length % corePool.length]
      if (coreEx) {
        draftExercises.push(makeDraftWE(coreEx, CORE_SPEC))
      }
    }

    // Nommage : suffixe A/B/C si le type canonique apparaît plusieurs fois dans la semaine
    const totalOfType = split.filter((t) => toPublicType(t) === canon).length
    const suffix = totalOfType > 1 ? ` ${String.fromCharCode(64 + count)}` : ''
    const name = `${WORKOUT_NAMES[workoutType]}${suffix}`

    // Type public du DraftWorkout : les variantes internes se projettent sur leur type public
    const publicType = toPublicType(workoutType)

    workouts.push({
      localId: uuid(),
      name,
      type: publicType,
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

  // ── Warnings contextuels (non liés aux slots) ──────────────────────────────

  // UX-C : Force pour débutant — specs 5×3-5 présupposent une technique maîtrisée
  if (goal === 'strength' && level === 'beginner') {
    generatorWarnings.unshift(
      'Force pour débutant : les specs 5×3–5 supposent une technique parfaite. ' +
      'Envisagez de commencer en hypertrophie (4×8–12) pour ancrer les patterns de mouvement.',
    )
  }

  // UX-H : Volume élevé pour débutant
  if (level === 'beginner' && daysPerWeek >= 5) {
    generatorWarnings.push(
      'Volume élevé pour débutant : 5 séances/semaine génère un volume proche d\'un programme intermédiaire. ' +
      'Commencez à 3–4 jours pour favoriser la récupération.',
    )
  }

  // UX-D : Programme unilatéral (push only, pull only, lower only) = spécialisation
  const publicTypes = new Set(split.map(toPublicType))
  if (publicTypes.size === 1) {
    const t = [...publicTypes][0]
    if (t === 'push' || t === 'pull' || t === 'lower') {
      generatorWarnings.push(
        'Programme de spécialisation : toutes les séances ciblent le même groupe. ' +
        'Convient pour un bloc court (4–6 semaines) mais ne constitue pas un programme complet.',
      )
    }
  }

  // UX-B : Focus "bras" ou "épaules" + split push → biceps structurellement absent
  if (split.every((t) => t === 'push') && (focusMuscles ?? []).some((f) => f === 'arms' || f === 'shoulders')) {
    generatorWarnings.push(
      'Focus bras en push : le biceps n\'est pas ciblé en séance push. ' +
      'Pour des bras complets, envisagez un focus "haut du corps" (chest + back) incluant aussi le dos.',
    )
  }

  // UX-5 : Déséquilibre push/pull → risque posture et épaule
  // Détecte un split sans aucune séance de tirage (pull, upper-pull, lower_pull ou fullbody).
  const hasPullSession = split.some(
    (t) => t === 'pull' || t === 'upper-pull' || t === 'lower_pull' || t === 'fullbody-quad' || t === 'fullbody-hip',
  )
  const hasPushSession = split.some(
    (t) => t === 'push' || t === 'upper-push' || t === 'lower_push',
  )
  if (hasPushSession && !hasPullSession) {
    generatorWarnings.push(
      'Déséquilibre push/pull : aucune séance de tirage dans la semaine. ' +
      'Les muscles postérieurs (rhomboïdes, rotateurs de l\'épaule) restent sous-sollicités, ' +
      'ce qui favorise une posture avancée et les douleurs à l\'épaule à terme. ' +
      'Ajoutez au moins 1 séance pull ou haut du corps complet.',
    )
  }

  // UX-6 : Explication quand le focus muscles change le type de programme de façon contre-intuitive
  const fm = focusMuscles ?? []
  if (fm.length > 0) {
    const hasFocusLower = fm.includes('legs')
    const hasFocusPush  = fm.includes('chest') || fm.includes('shoulders')
    const hasFocusPull  = fm.includes('back')
    const hasFocusArms  = fm.includes('arms')
    const hasFocusCore  = fm.includes('core')
    const hasFocusUpper = hasFocusPush || hasFocusPull || hasFocusArms

    // "Core seul" → programme fullbody (counter-intuitif : l'utilisateur attend du gainage, pas des squats)
    if (hasFocusCore && !hasFocusLower && !hasFocusUpper) {
      generatorWarnings.unshift(
        'Focus gainage : "core" seul ne définit pas de type de séance — le programme généré est un full body ' +
        'équilibré avec 1 exercice de gainage en fin de séance. Pour un programme 100 % gainage, ' +
        'combinez avec un autre groupe (ex. core + haut du corps).',
      )
    }
    // "Bras seul" → programme upper complet (l'utilisateur attend des curls, reçoit aussi bench press et tractions)
    else if (hasFocusArms && !hasFocusPush && !hasFocusPull && !hasFocusLower) {
      generatorWarnings.unshift(
        'Focus bras : "arms" seul génère un programme haut du corps complet (poitrine, dos, épaules + bras) ' +
        'avec priorité donnée aux exercices de bras. Les bras étant des muscles assistants, ' +
        'ils progressent mieux dans un contexte de programme haut du corps.',
      )
    }
    // Push + pull + jambes (ou toute combinaison "totale") → fullbody par défaut
    else if (hasFocusLower && hasFocusPush && hasFocusPull) {
      generatorWarnings.unshift(
        'Sélection complète : votre focus couvre poitrine, dos et jambes — le programme généré est un full body ' +
        'avec priorité donnée aux muscles sélectionnés. Tous les groupes musculaires sont entraînés.',
      )
    }
  }

  return {
    name: `${PROGRAM_NAMES[goal]!} · ${LEVEL_SUFFIX[level]}`,
    goal,
    level,
    durationWeeks,
    sessionsPerWeek: daysPerWeek,
    color: PROGRAM_COLORS[GOAL_COLOR_INDEX[goal]!] ?? PROGRAM_COLORS[0]!,
    workouts,
    week,
    phases: buildPhases(durationWeeks, goal),
    generatorWarnings: generatorWarnings.length > 0 ? generatorWarnings : undefined,
  }
}
