// Tests des fonctions de validation/fusion extraites de syncRoutes.js.
// Logique pure — aucun accès à la base de données ni à Express.

import { describe, it, expect } from 'vitest'
import {
  ALLOWED_STORES,
  MAX_PUSH_BATCH,
  validateStoreRecord,
  validatePushBatch,
  mergePullRows,
  // @ts-expect-error — fichier JS sans types, import dynamique
} from '../src/server/syncRoutes.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeChange(store: string, overrides: Record<string, unknown> = {}) {
  return {
    store,
    record: {
      id: 'rec-1',
      updatedAt: Date.now(),
      ...overrides,
    },
  }
}

function makeRow(store: string, id: string, updatedAt: number, seq = 1, extra: Record<string, unknown> = {}) {
  return {
    store,
    id,
    data: { id, name: 'Test', ...extra },
    updated_at: updatedAt,
    server_seq: seq,
  }
}

// ── validateStoreRecord ───────────────────────────────────────────────────────

describe('validateStoreRecord', () => {
  it('passe pour un store sans champs requis (settings)', () => {
    expect(() => validateStoreRecord('settings', { id: 'x', updatedAt: 1 })).not.toThrow()
  })

  it('passe quand tous les champs requis sont présents (exercise)', () => {
    expect(() =>
      validateStoreRecord('exercises', {
        id: 'ex-1', updatedAt: 1,
        name: 'Squat', primaryMuscle: 'quadriceps', equipment: 'barbell',
      }),
    ).not.toThrow()
  })

  it('lève une erreur si un champ requis est absent (exercise sans name)', () => {
    expect(() =>
      validateStoreRecord('exercises', {
        id: 'ex-1', updatedAt: 1,
        primaryMuscle: 'quadriceps', equipment: 'barbell',
      }),
    ).toThrow('exercises: champ requis absent: name')
  })

  it('lève une erreur si un champ requis est vide (exercise, name="")', () => {
    expect(() =>
      validateStoreRecord('exercises', {
        id: 'ex-1', updatedAt: 1,
        name: '', primaryMuscle: 'quadriceps', equipment: 'barbell',
      }),
    ).toThrow('exercises: champ requis absent: name')
  })

  it('lève une erreur si un champ requis est null', () => {
    expect(() =>
      validateStoreRecord('programs', { id: 'p1', updatedAt: 1, name: 'A', goal: null, level: 'beginner' }),
    ).toThrow('programs: champ requis absent: goal')
  })

  it('passe pour un store inconnu (aucun champ requis, pas d\'erreur)', () => {
    // Store inconnu → STORE_REQUIRED_FIELDS ?? [] → aucune validation
    expect(() => validateStoreRecord('unknownStore', { id: 'x' })).not.toThrow()
  })

  it('passe pour un record workoutTemplate avec les champs minimaux', () => {
    expect(() =>
      validateStoreRecord('workoutTemplates', {
        id: 'wt-1', updatedAt: 1, name: 'Push A', programId: 'p1',
      }),
    ).not.toThrow()
  })
})

// ── validatePushBatch ─────────────────────────────────────────────────────────

describe('validatePushBatch', () => {
  it('passe avec un batch valide', () => {
    expect(() =>
      validatePushBatch([
        makeChange('settings'),
        makeChange('exercises', { name: 'DL', primaryMuscle: 'back', equipment: 'barbell' }),
      ]),
    ).not.toThrow()
  })

  it('lève si changes n\'est pas un tableau', () => {
    expect(() => validatePushBatch(null)).toThrow('changes[] requis')
    expect(() => validatePushBatch({ store: 'settings', record: {} })).toThrow('changes[] requis')
  })

  it(`lève si le batch dépasse MAX_PUSH_BATCH (${MAX_PUSH_BATCH})`, () => {
    const big = Array.from({ length: MAX_PUSH_BATCH + 1 }, () => makeChange('settings'))
    expect(() => validatePushBatch(big)).toThrow(`Trop d'entrées (max ${MAX_PUSH_BATCH})`)
  })

  it('passe exactement à MAX_PUSH_BATCH entrées', () => {
    const exact = Array.from({ length: MAX_PUSH_BATCH }, () => makeChange('settings'))
    expect(() => validatePushBatch(exact)).not.toThrow()
  })

  it('lève pour un store invalide', () => {
    expect(() => validatePushBatch([makeChange('privateData')])).toThrow('store invalide: privateData')
  })

  it('lève si record.id est absent', () => {
    expect(() => validatePushBatch([{ store: 'settings', record: { updatedAt: 1 } }]))
      .toThrow('record.id manquant ou vide')
  })

  it('lève si record.id est une chaîne vide', () => {
    expect(() => validatePushBatch([{ store: 'settings', record: { id: '', updatedAt: 1 } }]))
      .toThrow('record.id manquant ou vide')
  })

  it('lève si record.updatedAt est absent', () => {
    expect(() => validatePushBatch([{ store: 'settings', record: { id: 'x' } }]))
      .toThrow('record.updatedAt invalide')
  })

  it('lève si record.updatedAt est négatif', () => {
    expect(() => validatePushBatch([{ store: 'settings', record: { id: 'x', updatedAt: -1 } }]))
      .toThrow('record.updatedAt invalide')
  })

  it('lève si un champ requis manque dans un record exercise', () => {
    expect(() =>
      validatePushBatch([
        makeChange('exercises', { name: 'DL', primaryMuscle: 'back' /* equipment manquant */ }),
      ]),
    ).toThrow('exercises: champ requis absent: equipment')
  })

  it('lève pour une entrée null dans le tableau', () => {
    expect(() => validatePushBatch([null])).toThrow()
  })

  it('liste tous les stores autorisés — vérifie la couverture', () => {
    const expected = [
      'settings', 'exercises', 'programs', 'workoutTemplates',
      'workoutExerciseTemplates', 'sessions', 'sessionExercises',
      'sets', 'personalRecords', 'goals', 'bodyMeasurements', 'blobs',
    ]
    for (const store of expected) {
      expect(ALLOWED_STORES.has(store)).toBe(true)
    }
  })
})

// ── mergePullRows ─────────────────────────────────────────────────────────────

describe('mergePullRows', () => {
  it('retourne un tableau vide si tout est vide', () => {
    expect(mergePullRows([], [], [])).toEqual([])
  })

  it('retourne les rows d\'une seule source', () => {
    const rows = [makeRow('exercises', 'ex-1', 100, 5)]
    const result = mergePullRows(rows, [], [])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ store: 'exercises', serverSeq: 5 })
    expect(result[0].record).toMatchObject({ id: 'ex-1' })
  })

  it('fusionne les trois sources sans doublon', () => {
    const templateRows = [makeRow('exercises', 'ex-1', 100, 1)]
    const sharedRows   = [makeRow('blobs',     'b-1',  200, 2)]
    const ownRows      = [makeRow('settings',  's-1',  300, 3)]
    const result = mergePullRows(templateRows, sharedRows, ownRows)
    expect(result).toHaveLength(3)
  })

  it('les ownRows prennent la priorité sur templateRows à même (store, id) si updatedAt >=', () => {
    const templateRows = [makeRow('exercises', 'ex-1', 100, 1, { name: 'Template' })]
    const ownRows      = [makeRow('exercises', 'ex-1', 200, 2, { name: 'OwnNewer' })]
    const result = mergePullRows(templateRows, [], ownRows)
    expect(result).toHaveLength(1)
    expect(result[0].record).toMatchObject({ name: 'OwnNewer' })
    expect(result[0].serverSeq).toBe(2)
  })

  it('templateRow gagne si son updatedAt est strictement plus récent que ownRow', () => {
    const templateRows = [makeRow('exercises', 'ex-1', 300, 1, { name: 'TemplateNewer' })]
    const ownRows      = [makeRow('exercises', 'ex-1', 100, 2, { name: 'OwnOlder' })]
    const result = mergePullRows(templateRows, [], ownRows)
    expect(result).toHaveLength(1)
    // ownRow ne gagne pas car updatedAt < templateRow.updatedAt
    expect(result[0].record).toMatchObject({ name: 'TemplateNewer' })
  })

  it('ownRow gagne à égalité de updatedAt (il écrase en dernier)', () => {
    const templateRows = [makeRow('exercises', 'ex-1', 100, 1, { name: 'Template' })]
    const ownRows      = [makeRow('exercises', 'ex-1', 100, 2, { name: 'OwnSameTs' })]
    const result = mergePullRows(templateRows, [], ownRows)
    expect(result).toHaveLength(1)
    expect(result[0].record).toMatchObject({ name: 'OwnSameTs' })
  })

  it('sharedBlobRows écrase templateRows (même store+id), puis ownRows peut encore écraser sharedRows', () => {
    const templateRows = [makeRow('blobs', 'b-1', 100, 1, { src: 'tpl' })]
    const sharedRows   = [makeRow('blobs', 'b-1', 200, 2, { src: 'shared' })]
    const ownRows      = [makeRow('blobs', 'b-1', 300, 3, { src: 'own' })]
    const result = mergePullRows(templateRows, sharedRows, ownRows)
    expect(result).toHaveLength(1)
    expect(result[0].record).toMatchObject({ src: 'own' })
  })

  it('convertit server_seq en nombre même si c\'est une chaîne', () => {
    // pg retourne parfois les BIGSERIAL en string
    const rows = [{ store: 'settings', id: 's-1', data: { id: 's-1' }, updated_at: '100', server_seq: '42' }]
    const result = mergePullRows(rows, [], [])
    expect(result[0].serverSeq).toBe(42)
    expect(typeof result[0].serverSeq).toBe('number')
  })

  it('gère de nombreuses rows sans collision', () => {
    const ownRows = Array.from({ length: 100 }, (_, i) =>
      makeRow('sessions', `s-${i}`, i * 10, i),
    )
    const result = mergePullRows([], [], ownRows)
    expect(result).toHaveLength(100)
  })
})
