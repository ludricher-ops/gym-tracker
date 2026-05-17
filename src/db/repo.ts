// Repositories typés par store. Toute écriture passe par `save`/`remove`,
// qui met à jour l'entité ET ajoute une entrée à l'`outbox` dans la MÊME
// transaction IndexedDB (atomique) — la synchro ne peut donc jamais rater
// un changement.

import type {
  Syncable, Settings, Exercise, Program, WorkoutTemplate,
  WorkoutExerciseTemplate, Session, SessionExercise, SetRecord,
  PersonalRecord, OutboxEntry, SyncStoreName,
} from '../types'
import { idbGet, idbGetAll, idbGetAllByIndex, idbTx } from './idb'
import { OUTBOX_STORE } from './schema'

/** Données d'un nouvel enregistrement, sans les champs de synchro. */
export type NewRecord<T extends Syncable> = Omit<T, 'updatedAt' | 'deleted' | 'dirty'>

export interface Repo<T extends Syncable> {
  /** Tous les enregistrements vivants (tombstones exclus). */
  all(): Promise<T[]>
  /** Un enregistrement par id (undefined si absent ou supprimé). */
  get(id: string): Promise<T | undefined>
  /** Enregistrements vivants filtrés par index. */
  byIndex(index: string, value: IDBValidKey | IDBKeyRange): Promise<T[]>
  /** Insère ou met à jour. Estampille updatedAt/dirty + écrit l'outbox. */
  save(record: NewRecord<T> | T): Promise<T>
  /** Suppression logique (tombstone) + outbox. */
  remove(id: string): Promise<void>
}

function makeRepo<T extends Syncable>(storeName: SyncStoreName): Repo<T> {
  const stampAndWrite = async (record: T): Promise<T> => {
    const entry: OutboxEntry = {
      store: storeName,
      id: record.id,
      updatedAt: record.updatedAt,
    }
    await idbTx([storeName, OUTBOX_STORE], 'readwrite', (tx) => {
      tx.objectStore(storeName).put(record)
      tx.objectStore(OUTBOX_STORE).add(entry)
    })
    return record
  }

  return {
    async all() {
      const rows = await idbGetAll<T>(storeName)
      return rows.filter((r) => !r.deleted)
    },

    async get(id) {
      const row = await idbGet<T>(storeName, id)
      return row && !row.deleted ? row : undefined
    },

    async byIndex(index, value) {
      const rows = await idbGetAllByIndex<T>(storeName, index, value)
      return rows.filter((r) => !r.deleted)
    },

    async save(record) {
      const stamped = {
        ...(record as T),
        updatedAt: Date.now(),
        deleted: false,
        dirty: true,
      } as T
      return stampAndWrite(stamped)
    },

    async remove(id) {
      const existing = await idbGet<T>(storeName, id)
      if (!existing) return
      await stampAndWrite({
        ...existing,
        deleted: true,
        updatedAt: Date.now(),
        dirty: true,
      })
    },
  }
}

export const settingsRepo = makeRepo<Settings>('settings')
export const exerciseRepo = makeRepo<Exercise>('exercises')
export const programRepo = makeRepo<Program>('programs')
export const workoutTemplateRepo = makeRepo<WorkoutTemplate>('workoutTemplates')
export const workoutExerciseTemplateRepo =
  makeRepo<WorkoutExerciseTemplate>('workoutExerciseTemplates')
export const sessionRepo = makeRepo<Session>('sessions')
export const sessionExerciseRepo = makeRepo<SessionExercise>('sessionExercises')
export const setRepo = makeRepo<SetRecord>('sets')
export const personalRecordRepo = makeRepo<PersonalRecord>('personalRecords')
