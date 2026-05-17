// Wrapper IndexedDB brut, typé. Pas de dépendance externe.
//
// ⚠️ Règle critique : une transaction IndexedDB se ferme automatiquement dès
// qu'on `await` une promesse NON-IDB pendant qu'elle est ouverte. La fonction
// passée à `idbTx` doit donc être SYNCHRONE — elle enchaîne uniquement des
// appels IDB. Toute la logique outbox-atomique repose sur cette garantie.

import { DB_NAME, DB_VERSION, STORES } from './schema'

let dbPromise: Promise<IDBDatabase> | null = null

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Ouvre (et au besoin met à niveau) la base. Mémoïsé : une seule connexion. */
export function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const tx = req.transaction!
      for (const def of STORES) {
        const store = db.objectStoreNames.contains(def.name)
          ? tx.objectStore(def.name)
          : db.createObjectStore(
              def.name,
              def.keyPath === null
                ? { autoIncrement: true }
                : { keyPath: def.keyPath },
            )
        for (const idx of def.indexes ?? []) {
          if (!store.indexNames.contains(idx.name)) {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false })
          }
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB bloquée par un autre onglet'))
  })
  return dbPromise
}

/**
 * Exécute `fn` dans une transaction. `fn` DOIT être synchrone (aucun `await`
 * de promesse non-IDB). Sa valeur de retour est résolue à la fin de la
 * transaction (`oncomplete`), garantissant que toutes les écritures ont été
 * committées atomiquement.
 */
export async function idbTx<T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => T,
): Promise<T> {
  const db = await initDB()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeNames, mode)
    let result: T
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Transaction IDB annulée'))
    try {
      result = fn(tx)
    } catch (err) {
      tx.abort()
      reject(err)
    }
  })
}

export async function idbGet<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await initDB()
  const tx = db.transaction(store, 'readonly')
  return promisify<T | undefined>(tx.objectStore(store).get(key))
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await initDB()
  const tx = db.transaction(store, 'readonly')
  return promisify<T[]>(tx.objectStore(store).getAll())
}

export async function idbGetAllByIndex<T>(
  store: string,
  index: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
  const db = await initDB()
  const tx = db.transaction(store, 'readonly')
  return promisify<T[]>(tx.objectStore(store).index(index).getAll(query))
}

export async function idbGetAllKeys(store: string): Promise<IDBValidKey[]> {
  const db = await initDB()
  const tx = db.transaction(store, 'readonly')
  return promisify<IDBValidKey[]>(tx.objectStore(store).getAllKeys())
}

export async function idbDeleteKeys(store: string, keys: IDBValidKey[]): Promise<void> {
  if (keys.length === 0) return
  await idbTx([store], 'readwrite', (tx) => {
    const s = tx.objectStore(store)
    for (const key of keys) s.delete(key)
  })
}

export async function idbPut(store: string, value: unknown): Promise<void> {
  await idbTx([store], 'readwrite', (tx) => {
    tx.objectStore(store).put(value)
  })
}

export async function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  await idbTx([store], 'readwrite', (tx) => {
    tx.objectStore(store).delete(key)
  })
}

/** Vide tous les object stores (utilisé par "effacer toutes les données"). */
export async function idbClearAll(): Promise<void> {
  const names = STORES.map((s) => s.name)
  await idbTx(names, 'readwrite', (tx) => {
    for (const name of names) tx.objectStore(name).clear()
  })
}
