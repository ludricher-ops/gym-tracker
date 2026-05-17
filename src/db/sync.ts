// Moteur de synchronisation local-first. IndexedDB est la source de vérité ;
// le serveur n'est qu'un miroir de sauvegarde. Résolution last-write-wins.
//
// - push : draine l'outbox vers POST /api/sync/push
// - pull : récupère GET /api/sync/pull?since=<server_seq> et fusionne en LWW
//
// Le curseur de pull est stocké en localStorage (spécifique à l'appareil) —
// surtout pas dans `settings`, qui est lui-même synchronisé.

import type { OutboxEntry, Syncable } from '../types'
import { idbGet, idbGetAll, idbGetAllKeys, idbDeleteKeys, idbPut } from './idb'
import { OUTBOX_STORE } from './schema'

const CURSOR_KEY = 'gymtrack-sync-cursor'

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
    headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/sync/pull?since=${cursor}`)
    if (!res.ok) throw new Error(`sync/pull ${res.status}`)
    const data = (await res.json()) as {
      records: { store: string; record: Syncable }[]
      cursor: number
      hasMore: boolean
    }

    for (const { store, record } of data.records) {
      const local = await idbGet<Syncable>(store, record.id)
      // LWW : on n'écrase que si l'entrant est strictement plus récent.
      if (!local || record.updatedAt > local.updatedAt) {
        await idbPut(store, record) // écriture directe — pas de ré-entrée outbox
        applied++
      }
    }

    cursor = data.cursor
    hasMore = data.hasMore
    setCursor(cursor)
  }
  return applied
}

/** Synchro complète : pull puis push. Renvoie le nombre d'enregistrements reçus. */
export async function syncNow(): Promise<number> {
  const pulled = await pullChanges()
  await pushOutbox()
  return pulled
}
