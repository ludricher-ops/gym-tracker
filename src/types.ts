// Modèle de données Gym Track — adapté du cahier des charges (section 3) pour
// le web local-first. Toutes les entités persistées portent les champs de
// synchronisation de `Syncable`. Unités stockées en SI : poids en kg,
// longueurs en cm. La conversion d'affichage se fait à la lecture.

/** Champs de synchro portés par tout enregistrement persisté. */
export interface Syncable {
  id: string
  /** epoch ms — clé du last-write-wins. */
  updatedAt: number
  /** tombstone : true = supprimé (propagé via la synchro). */
  deleted: boolean
  /** true tant que le changement n'a pas été poussé au serveur. */
  dirty: boolean
}

export type MuscleGroup =
  | 'chest' | 'chest_upper' | 'chest_lower'
  | 'back' | 'back_width' | 'back_thickness'
  | 'shoulders' | 'shoulders_front' | 'shoulders_lateral' | 'shoulders_rear'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'core' | 'cardio'

export type Equipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'bodyweight' | 'kettlebell' | 'band'

export type ExerciseCategory = 'compound' | 'isolation'
export type TrackingType = 'weight_reps' | 'reps_only' | 'time'

export type WeightUnit = 'kg' | 'lb'
export type DistanceUnit = 'km' | 'mi'
export type MeasurementUnit = 'cm' | 'in'
export type ThemeMode = 'auto' | 'light' | 'dark'
export type Language = 'fr' | 'en'
export type WeekStart = 'monday' | 'sunday'
export type RpeScale = '6-10' | '1-10'
export type OneRMFormula = 'epley' | 'brzycki' | 'lombardi'

export type ProgramGoal = 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss'
export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutType =
  | 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody' | 'custom'
export type RepsMode = 'fixed' | 'range' | 'amrap'
export type Weekday =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'

/** Préférences utilisateur (cahier : UserPreferences). */
export interface UserPreferences {
  weightUnit: WeightUnit
  distanceUnit: DistanceUnit
  measurementUnit: MeasurementUnit
  defaultRestSec: number
  /** Incrément du stepper de poids pendant la séance (kg). */
  weightStep: number
  restSoundEnabled: boolean
  hapticsEnabled: boolean
  autoBarbellWeight: boolean
  autoWarmup: boolean
  theme: ThemeMode
  accentColor: string
  language: Language
  weekStart: WeekStart
  rpeScale: RpeScale
  oneRMFormula: OneRMFormula
  notificationsEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  /** sauter l'écran "Aperçu séance du jour". */
  skipDayPreview: boolean
  /** sauter le briefing pré-séance. */
  skipBriefing: boolean
  /** overlay de célébration à la validation d'un record pendant la séance. */
  prCelebrationEnabled: boolean
}

/**
 * Enregistrement de réglages unique (id = 'singleton'). Remplace les entités
 * User + UserPreferences du cahier — l'app est mono-utilisateur sans auth.
 */
export interface Settings extends Syncable {
  id: 'singleton'
  firstName: string
  lastName: string
  bio?: string
  gender?: 'male' | 'female' | 'other'
  birthDate?: string
  heightCm?: number
  createdAt: number
  preferences: UserPreferences
}

/**
 * Binaire d'un média d'exercice stocké localement et synchronisé au serveur.
 * La donnée est encodée en base64 (data URL) pour passer en JSON.
 */
export interface BlobRecord extends Syncable {
  /** data URL : "data:<mime>;base64,..." */
  dataUrl: string
  mime: string
  sizeBytes: number
}

/**
 * Média de démonstration d'un exercice (photo ou GIF). Le binaire est stocké
 * dans le store `blobs` (synchronisé) ; seules ces métadonnées voyagent avec
 * l'Exercise.
 */
export interface ExerciseMedia {
  type: 'photo' | 'gif'
  /** clé dans le store `blobs` — média importé localement. */
  blobId?: string
  /** URL distante — média référencé par lien (alternative à blobId). */
  url?: string
  mime: string
  sizeBytes: number
  /** largeur / hauteur — pour préserver le cadrage à l'affichage. */
  aspectRatio: number
  importedAt: number
}

export interface Exercise extends Syncable {
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  category: ExerciseCategory
  trackingType: TrackingType
  instructions?: string
  media?: ExerciseMedia
  isCustom: boolean
  isWarmupExercise?: boolean
  popularity?: number
  usageCount?: number
  createdAt: number
}

/** Référence d'un WorkoutTemplate dans le planning hebdo d'un programme. */
export type WeeklyTemplate = Partial<Record<Weekday, string>>

export interface Program extends Syncable {
  name: string
  goal: ProgramGoal
  level: ProgramLevel
  durationWeeks: number
  sessionsPerWeek: number
  color: string
  isTemplate: boolean
  isActive: boolean
  startedAt?: number
  archivedAt?: number
  weekTemplate: WeeklyTemplate
  createdAt: number
}

export interface WorkoutTemplate extends Syncable {
  programId: string
  name: string
  type: WorkoutType
  muscleGroups: MuscleGroup[]
}

export interface WorkoutExerciseTemplate extends Syncable {
  workoutTemplateId: string
  exerciseId: string
  order: number
  supersetGroup?: string
  targetSets: number
  repsMode: RepsMode
  targetRepsMin: number
  targetRepsMax?: number
  targetDurationSec?: number
  targetRPE?: number
  restSec: number
  autoProgress: boolean
  progressStepKg: number
  notes?: string
  isWarmup?: boolean
  isAb?: boolean
}

export interface Session extends Syncable {
  workoutTemplateId?: string
  programId?: string
  programWeek?: number
  programSessionLabel?: string
  name: string
  startedAt: number
  endedAt?: number
  durationSec?: number
  totalVolumeKg?: number
  totalSets: number
  completedSets: number
  notes?: string
}

export interface SessionExercise extends Syncable {
  sessionId: string
  exerciseId: string
  order: number
  supersetGroup?: string
  isWarmup?: boolean
  isAb?: boolean
}

export interface SetRecord extends Syncable {
  sessionExerciseId: string
  index: number
  weightKg: number
  reps: number
  rpe?: number
  restAfterSec?: number
  isWarmup: boolean
  isFailure: boolean
  completedAt?: number
  isPersonalRecord: boolean
}

export type GoalType =
  | 'exercise_1rm'
  | 'exercise_reps'
  | 'sessions_per_week'
  | 'bodyweight'
  | 'custom'

export interface Goal extends Syncable {
  type: GoalType
  title: string
  /** requis pour les types exercise_*. */
  exerciseId?: string
  targetValue: number
  /** valeur courante — uniquement pour les types manuels (bodyweight, custom). */
  manualValue?: number
  unit: string
  /** échéance optionnelle "YYYY-MM-DD". */
  deadline?: string
  createdAt: number
}

export interface BodyMeasurement extends Syncable {
  takenAt: number
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  bicepCm?: number
  thighCm?: number
  calfCm?: number
  bodyFatPct?: number
}

export type PRType = '1rm' | 'reps_at_weight' | 'volume_set' | 'volume_session'

export interface PersonalRecord extends Syncable {
  exerciseId: string
  type: PRType
  weightKg: number
  reps: number
  estimated1RM: number
  setId: string
  achievedAt: number
}

/** Entrée du journal de changements (store `outbox`, clé auto-incrémentée). */
export interface OutboxEntry {
  seq?: number
  store: SyncStoreName
  id: string
  updatedAt: number
}

/** Stores synchronisables (tous sauf `outbox`). */
export type SyncStoreName =
  | 'settings' | 'exercises' | 'programs' | 'workoutTemplates'
  | 'workoutExerciseTemplates' | 'sessions' | 'sessionExercises'
  | 'sets' | 'personalRecords' | 'goals' | 'bodyMeasurements'
  | 'blobs'
