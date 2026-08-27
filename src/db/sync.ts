// Moteur de synchronisation local-first. IndexedDB est la source de vérité ;
// le serveur n'est qu'un miroir de sauvegarde. Résolution last-write-wins.
//
// - push : draine l'outbox vers POST /api/sync/push
// - pull : récupère GET /api/sync/pull?since=<server_seq> et fusionne en LWW
//
// Auth : cookie httpOnly gt_session — envoyé automatiquement via credentials:'include'.
// Le curseur de pull est stocké en localStorage, scopé par userId.

import type { OutboxEntry, Syncable } from '../types'
import { idbBatchGet, idbGet, idbGetAll, idbGetAllKeys, idbDeleteKeys, idbTx } from './idb'
import { OUTBOX_STORE } from './schema'

// ── État partagé (userId courant) ─────────────────────────────────────────────

let _userId: number | null = null

/** Appelé par AuthContext après login/logout. */
export function setSyncUserId(id: number | null): void {
  _userId = id
}

// ── Curseur de pull (localStorage, scopé par userId) ─────────────────────────

function cursorKey(): string {
  return _userId ? `gymtrack-sync-cursor-${_userId}` : 'gymtrack-sync-cursor'
}

function getCursor(): number {
  return Number(localStorage.getItem(cursorKey()) || 0)
}
function setCursor(n: number): void {
  localStorage.setItem(cursorKey(), String(n))
}

/** Remet le curseur à zéro (appelé après login pour forcer un full-pull). */
export function resetSyncCursor(): void {
  if (_userId) localStorage.removeItem(`gymtrack-sync-cursor-${_userId}`)
  localStorage.removeItem('gymtrack-sync-cursor')
}

// ── Headers communs ───────────────────────────────────────────────────────────

function syncHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {}
  if (json) h['Content-Type'] = 'application/json'
  return h
}

// ── Push ──────────────────────────────────────────────────────────────────────

/** Draine l'outbox vers le serveur. Renvoie le nombre d'enregistrements poussés. */
export async function pushOutbox(): Promise<number> {
  const [entries, keys] = await Promise.all([
    idbGetAll<OutboxEntry>(OUTBOX_STORE),
    idbGetAllKeys(OUTBOX_STORE),
  ])
  if (entries.length === 0) return 0

  // Dédoublonnage : un seul push par (store, id), état le plus récent.
  const latest = new Map<string, OutboxEntry>()
  for (const e of entries) {
    const key = `${e.store}/${e.id}`
    const prev = latest.get(key)
    if (!prev || e.updatedAt >= prev.updatedAt) latest.set(key, e)
  }

  const changes: { store: string; record: Syncable }[] = []
  for (const entry of latest.values()) {
    const record = await idbGet<Syncable>(entry.store, entry.id)
    if (record) changes.push({ store: entry.store, record })
  }

  const res = await fetch('/api/sync/push', {
    method: 'POST',
    credentials: 'include',
    headers: syncHeaders(),
    body: JSON.stringify({ changes }),
  })
  if (!res.ok) throw new Error(`sync/push ${res.status}`)

  // On ne supprime que les entrées lues — celles ajoutées pendant l'appel
  // réseau restent pour le prochain push.
  await idbDeleteKeys(OUTBOX_STORE, keys)
  return changes.length
}

// ── Pull ──────────────────────────────────────────────────────────────────────

/** Récupère les changements serveur et les fusionne (LWW). Renvoie le nombre appliqué. */
export async function pullChanges(): Promise<number> {
  let cursor = getCursor()
  let applied = 0
  let hasMore = true

  while (hasMore) {
    const res = await fetch(`/api/sync/pull?since=${cursor}`, {
      credentials: 'include',
      headers: syncHeaders(false),
    })
    if (!res.ok) throw new Error(`sync/pull ${res.status}`)
    const data = (await res.json()) as {
      records: { store: string; record: Syncable }[]
      cursor: number
      hasMore: boolean
    }

    // Batch LWW : regroupe les records par store pour réduire le nombre de
    // transactions IDB (1 lecture + 1 écriture par store au lieu de 2N).
    const byStore = new Map<string, { store: string; record: Syncable }[]>()
    for (const item of data.records) {
      const arr = byStore.get(item.store) ?? []
      arr.push(item)
      byStore.set(item.store, arr)
    }
    for (const [storeName, items] of byStore) {
      const ids = items.map((i) => i.record.id)
      const existing = await idbBatchGet<Syncable>(storeName, ids)
      const toWrite = items
        .filter(({ record }) => {
          const local = existing.get(record.id)
          return !local || record.updatedAt > local.updatedAt
        })
        .map(({ record }) => record)
      if (toWrite.length === 0) continue
      applied += toWrite.length
      // Écriture en lot — pas de ré-entrée outbox (données venant du serveur).
      await idbTx([storeName], 'readwrite', (tx) => {
        const s = tx.objectStore(storeName)
        for (const record of toWrite) s.put(record)
      })
    }

    cursor = data.cursor
    hasMore = data.hasMore
    setCursor(cursor)
  }
  return applied
}

// ── Sync complète ─────────────────────────────────────────────────────────────

/** Synchro complète : push d'abord (LWW), puis pull. Renvoie le nombre d'enregistrements reçus. */
export async function syncNow(): Promise<number> {
  await pushOutbox()
  return pullChanges()
}
