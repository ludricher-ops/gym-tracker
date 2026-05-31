// Moteur de synchronisation local-first. IndexedDB est la source de vérité ;
// le serveur n'est qu'un miroir de sauvegarde. Résolution last-write-wins.
//
// - push : draine l'outbox vers POST /api/sync/push
// - pull : récupère GET /api/sync/pull?since=<server_seq> et fusionne en LWW
//
// Le curseur de pull est stocké en localStorage (spécifique à l'appareil) —
// surtout pas dans `settings`, qui est lui-même synchronisé.

import type { OutboxEntry, Syncable } from '../types'
import { idbBatchGet, idbGet, idbGetAll, idbGetAllKeys, idbDeleteKeys, idbTx } from './idb'
import { OUTBOX_STORE } from './schema'

const CURSOR_KEY = 'gymtrack-sync-cursor'
// Secret partagé optionnel — si VITE_SYNC_SECRET est défini au build, il est
// envoyé dans chaque requête de synchro. Le serveur l'accepte ou rejette via SYNC_SECRET.
const SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET as string | undefined

function syncHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {}
  if (json) h['Content-Type'] = 'application/json'
  if (SYNC_SECRET) h['Authorization'] = `Bearer ${SYNC_SECRET}`
  return h
}

function getCursor(): number {
  return Number(localStorage.getItem(CURSOR_KEY) || 0)
}
function setCursor(n: number): void {
  localStorage.setItem(CURSOR_KEY, String(n))
}

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
    headers: syncHeaders(),
    body: JSON.stringify({ changes }),
  })
  if (!res.ok) throw new Error(`sync/push ${res.status}`)

  // On ne supprime que les entrées lues — celles ajoutées pendant l'appel
  // réseau restent pour le prochain push.
  await idbDeleteKeys(OUTBOX_STORE, keys)
  return changes.length
}

/** Récupère les changements serveur et les fusionne (LWW). Renvoie le nombre appliqué. */
export async function pullChanges(): Promise<number> {
  let cursor = getCursor()
  let applied = 0
  let hasMore = true

  while (hasMore) {
    const res = await fetch(`/api/sync/pull?since=${cursor}`, {
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

/** Synchro complète : push d'abord (LWW), puis pull. Renvoie le nombre d'enregistrements reçus. */
export async function syncNow(): Promise<number> {
  await pushOutbox()
  return pullChanges()
}
