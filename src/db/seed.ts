// Amorçage au premier lancement : réglages par défaut + exercices built-in.
// Idempotent — ne fait rien si le singleton `settings` existe déjà.

import rawExercises from '../data/exercises-seed.json'
import type {
  Equipment, Exercise, ExerciseCategory, MuscleGroup, Settings,
  TrackingType, UserPreferences,
} from '../types'
import { DEFAULT_ACCENT } from '../theme/accents'
import { buildTemplateRecords } from '../data/program-templates'
import { settingsRepo } from './repo'
import { idbTx } from './idb'
import { OUTBOX_STORE } from './schema'

interface SeedExercise {
  id: string
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  category: ExerciseCategory
  trackingType: TrackingType
  popularity: number
}

const SEED_EXERCISES = rawExercises as SeedExercise[]

export const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  measurementUnit: 'cm',
  defaultRestSec: 90,
  restSoundEnabled: true,
  hapticsEnabled: true,
  autoBarbellWeight: false,
  theme: 'dark',
  accentColor: DEFAULT_ACCENT,
  language: 'fr',
  weekStart: 'monday',
  rpeScale: '6-10',
  oneRMFormula: 'epley',
  notificationsEnabled: false,
  skipDayPreview: false,
  skipBriefing: false,
}

export async function ensureSeed(): Promise<void> {
  const existing = await settingsRepo.get('singleton')
  if (existing) return

  const now = Date.now()

  // Insertion en masse des exercices : une seule transaction (entité +
  // outbox) au lieu de 70+ — plus rapide et toujours atomique.
  const exercises: Exercise[] = SEED_EXERCISES.map((ex) => ({
    id: ex.id,
    name: ex.name,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    category: ex.category,
    trackingType: ex.trackingType,
    instructions: undefined,
    isCustom: false,
    popularity: ex.popularity,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    deleted: false,
    dirty: true,
  }))

  await idbTx(['exercises', OUTBOX_STORE], 'readwrite', (tx) => {
    const store = tx.objectStore('exercises')
    const outbox = tx.objectStore(OUTBOX_STORE)
    for (const ex of exercises) {
      store.put(ex)
      outbox.add({ store: 'exercises', id: ex.id, updatedAt: ex.updatedAt })
    }
  })

  // Programmes built-in (templates) + leurs séances et exercices.
  const tpl = buildTemplateRecords(now)
  await idbTx(
    ['programs', 'workoutTemplates', 'workoutExerciseTemplates', OUTBOX_STORE],
    'readwrite',
    (tx) => {
      const outbox = tx.objectStore(OUTBOX_STORE)
      const put = (storeName: string, rows: { id: string }[]) => {
        const s = tx.objectStore(storeName)
        for (const row of rows) {
          s.put(row)
          outbox.add({ store: storeName, id: row.id, updatedAt: now })
        }
      }
      put('programs', tpl.programs)
      put('workoutTemplates', tpl.workoutTemplates)
      put('workoutExerciseTemplates', tpl.workoutExerciseTemplates)
    },
  )

  const settings: Omit<Settings, 'updatedAt' | 'deleted' | 'dirty'> = {
    id: 'singleton',
    firstName: '',
    lastName: '',
    createdAt: now,
    preferences: DEFAULT_PREFERENCES,
  }
  await settingsRepo.save(settings)
}
