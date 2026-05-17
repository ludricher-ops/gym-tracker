// Schéma IndexedDB. Un object store par entité du cahier + `outbox`
// (journal append-only des changements à pousser au serveur).

import type { SyncStoreName } from '../types'

export const DB_NAME = 'gymtrack'
export const DB_VERSION = 1

export interface IndexDef {
  name: string
  keyPath: string
  unique?: boolean
}

export interface StoreDef {
  name: string
  /** null = clé auto-incrémentée (cas du store `outbox`). */
  keyPath: string | null
  indexes?: IndexDef[]
}

/** Stores synchronisables — tous les changements transitent par l'outbox. */
export const SYNC_STORES: SyncStoreName[] = [
  'settings',
  'exercises',
  'programs',
  'workoutTemplates',
  'workoutExerciseTemplates',
  'sessions',
  'sessionExercises',
  'sets',
  'personalRecords',
]

export const OUTBOX_STORE = 'outbox'

export const STORES: StoreDef[] = [
  { name: 'settings', keyPath: 'id' },
  {
    name: 'exercises',
    keyPath: 'id',
    // Pas d'index sur isCustom : un booléen n'est pas une clé IndexedDB
    // valide. Le filtrage custom/built-in se fait en mémoire (jeu réduit).
    indexes: [{ name: 'primaryMuscle', keyPath: 'primaryMuscle' }],
  },
  // programs : pas d'index sur isActive (booléen non indexable).
  { name: 'programs', keyPath: 'id' },
  {
    name: 'workoutTemplates',
    keyPath: 'id',
    indexes: [{ name: 'programId', keyPath: 'programId' }],
  },
  {
    name: 'workoutExerciseTemplates',
    keyPath: 'id',
    indexes: [{ name: 'workoutTemplateId', keyPath: 'workoutTemplateId' }],
  },
  {
    name: 'sessions',
    keyPath: 'id',
    indexes: [
      { name: 'startedAt', keyPath: 'startedAt' },
      { name: 'endedAt', keyPath: 'endedAt' },
    ],
  },
  {
    name: 'sessionExercises',
    keyPath: 'id',
    indexes: [{ name: 'sessionId', keyPath: 'sessionId' }],
  },
  {
    name: 'sets',
    keyPath: 'id',
    indexes: [{ name: 'sessionExerciseId', keyPath: 'sessionExerciseId' }],
  },
  {
    name: 'personalRecords',
    keyPath: 'id',
    indexes: [{ name: 'exerciseId', keyPath: 'exerciseId' }],
  },
  { name: OUTBOX_STORE, keyPath: null },
]
