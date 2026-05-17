import { useCallback, useEffect, useRef, useState } from 'react'
import { syncNow } from '../db/sync'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

/**
 * Synchronisation en arrière-plan. Déclenchée au démarrage, au retour en
 * ligne, au retour au premier plan et toutes les 20 s. Après un pull non
 * vide, recharge le store React via `reload`.
 */
export function useSync(reload: () => Promise<void>) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSync, setLastSync] = useState<number | null>(null)
  const running = useRef(false)

  const run = useCallback(async () => {
    if (running.current) return
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    running.current = true
    setStatus('syncing')
    try {
      const pulled = await syncNow()
      if (pulled > 0) await reload()
      setStatus('idle')
      setLastSync(Date.now())
    } catch {
      // Hors-ligne ou serveur indisponible : l'app reste pleinement
      // fonctionnelle sur IndexedDB, on retentera au prochain déclencheur.
      setStatus('error')
    } finally {
      running.current = false
    }
  }, [reload])

  useEffect(() => {
    run()
    const onOnline = () => run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    const id = setInterval(run, 20_000)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(id)
    }
  }, [run])

  return { status, lastSync, syncNow: run }
}
