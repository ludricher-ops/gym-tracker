// Amorçage au premier lancement : réglages par défaut + exercices built-in.
// Idempotent — ne fait rien si le singleton `settings` existe déjà.
//
// Toutes les données de seed utilisent updatedAt:1 (epoch+1 ms) afin que les
// vraies données du serveur (timestamp réel) gagnent toujours le LWW lors du
// pull qui suit un vidage de cache. Cela garantit la restauration des données
// personnelles (profil, exercices modifiés…) après une réinstallation.

import rawExercises from '../data/exercises-seed.json'
import type {
  Equipment, Exercise, ExerciseCategory, MuscleGroup, Settings,
  TrackingType, UserPreferences,
} from '../types'
import { DEFAULT_ACCENT } from '../theme/accents'
import { buildTemplateRecords } from '../data/program-templates'
import { idbTx, idbGet, idbGetAll } from './idb'
import { OUTBOX_STORE } from './schema'

interface SeedExerciseMedia {
  url?: string
  mime: string
  type: 'photo' | 'gif'
  sizeBytes: number
  importedAt: number
  aspectRatio: number
}

interface SeedExercise {
  id: string
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  category: ExerciseCategory
  trackingType: TrackingType
  popularity: number
  isWarmupExercise?: boolean
  media?: SeedExerciseMedia
}

const SEED_EXERCISES = rawExercises as SeedExercise[]

export const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  measurementUnit: 'cm',
  defaultRestSec: 90,
  weightStep: 1,
  restSoundEnabled: true,
  hapticsEnabled: true,
  autoBarbellWeight: false,
  autoWarmup: false,
  theme: 'dark',
  accentColor: DEFAULT_ACCENT,
  language: 'fr',
  weekStart: 'monday',
  rpeScale: '6-10',
  oneRMFormula: 'epley',
  notificationsEnabled: false,
  skipDayPreview: false,
  skipBriefing: false,
  prCelebrationEnabled: true,
}

// Timestamp utilisé pour les champs `updatedAt` du seed. Doit rester très bas
// (1 ms) afin que toute donnée serveur (timestamp réel) gagne le LWW au pull.
const SEED_UPDATED_AT = 1

/**
 * Injecte les exercices built-in manquants dans l'IDB (idempotent).
 * S'exécute à chaque lancement pour que les nouveaux exercices ajoutés
 * dans exercises-seed.json soient disponibles pour les utilisateurs existants.
 * Patche également le champ `media` des exercices existants qui n'ont pas d'image
 * mais dont le seed en fournit une (ex : URL corrigée après un 403/404).
 */
async function ensureBuiltinExercises(now: number): Promise<void> {
  const allExercises = await idbGetAll<Exercise>('exercises')
  const existingMap = new Map(allExercises.map((e) => [e.id, e]))

  const toInsert: Exercise[] = []
  const toUpdateMedia: Exercise[] = []

  for (const ex of SEED_EXERCISES) {
    const existing = existingMap.get(ex.id)
    const seedMedia = ex.media?.url
      ? { type: ex.media.type, url: ex.media.url, mime: ex.media.mime,
          sizeBytes: ex.media.sizeBytes, importedAt: ex.media.importedAt,
          aspectRatio: ex.media.aspectRatio }
      : undefined

    if (!existing) {
      // Exercice absent → insertion complète
      toInsert.push({
        id: ex.id,
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        category: ex.category,
        trackingType: ex.trackingType,
        instructions: undefined,
        isCustom: false,
        isWarmupExercise: ex.isWarmupExercise,
        popularity: ex.popularity,
        usageCount: 0,
        media: seedMedia,
        createdAt: now,
        updatedAt: SEED_UPDATED_AT,
        deleted: false,
        dirty: true,
      })
    } else if (!existing.media?.url && seedMedia) {
      // Exercice présent mais sans image → patch media uniquement.
      // On utilise `now` (et non SEED_UPDATED_AT) pour que le push écrase bien
      // la version serveur qui n'a pas encore ce champ media, et que les pulls
      // suivants ne réécrasent pas le patch (LWW : le plus grand timestamp gagne).
      toUpdateMedia.push({ ...existing, media: seedMedia, updatedAt: now, dirty: true })
    }
  }

  if (toInsert.length === 0 && toUpdateMedia.length === 0) return

  await idbTx(['exercises', OUTBOX_STORE], 'readwrite', (tx) => {
    const store = tx.objectStore('exercises')
    const outbox = tx.objectStore(OUTBOX_STORE)
    for (const ex of toInsert) {
      store.put(ex)
      outbox.add({ store: 'exercises', id: ex.id, updatedAt: SEED_UPDATED_AT })
    }
    for (const ex of toUpdateMedia) {
      store.put(ex)
      outbox.add({ store: 'exercises', id: ex.id, updatedAt: ex.updatedAt })
    }
  })
}

export async function ensureSeed(): Promise<void> {
  const now = Date.now()

  // Toujours vérifier les exercices manquants (nouveaux exercices ajoutés au seed
  // après l'installation initiale) — idempotent, ne touche pas aux données existantes.
  await ensureBuiltinExercises(now)

  // Le reste (settings, programmes) ne s'applique qu'au premier lancement.
  const existing = await idbGet<Settings>('settings', 'singleton')
  if (existing) return

  // Les exercices sont déjà insérés par ensureBuiltinExercises() ci-dessus.
  // Il reste à créer les programmes et les settings (premier lancement uniquement).

  // Programmes built-in (templates) — updatedAt remplacé par SEED_UPDATED_AT.
  const tpl = buildTemplateRecords(now)
  const stamp = <T extends { id: string; updatedAt: number }>(arr: T[]): T[] =>
    arr.map((r) => ({ ...r, updatedAt: SEED_UPDATED_AT }))

  await idbTx(
    ['programs', 'workoutTemplates', 'workoutExerciseTemplates', OUTBOX_STORE],
    'readwrite',
    (tx) => {
      const outbox = tx.objectStore(OUTBOX_STORE)
      const put = (storeName: string, rows: { id: string; updatedAt: number }[]) => {
        const s = tx.objectStore(storeName)
        for (const row of rows) {
          s.put(row)
          outbox.add({ store: storeName, id: row.id, updatedAt: SEED_UPDATED_AT })
        }
      }
      put('programs', stamp(tpl.programs))
      put('workoutTemplates', stamp(tpl.workoutTemplates))
      put('workoutExerciseTemplates', stamp(tpl.workoutExerciseTemplates))
    },
  )

  // Settings — écriture directe (bypasse repo.save qui stamperait updatedAt:now).
  const settings: Settings = {
    id: 'singleton',
    firstName: '',
    lastName: '',
    createdAt: now,
    preferences: DEFAULT_PREFERENCES,
    updatedAt: SEED_UPDATED_AT,
    deleted: false,
    dirty: true,
  }
  await idbTx(['settings', OUTBOX_STORE], 'readwrite', (tx) => {
    tx.objectStore('settings').put(settings)
    tx.objectStore(OUTBOX_STORE).add({ store: 'settings', id: 'singleton', updatedAt: SEED_UPDATED_AT })
  })
}
