import { useEffect, useState } from 'react'

/**
 * Secondes écoulées depuis `startedAt`. Basé sur l'horloge murale → reste
 * juste même si l'onglet a été mis en arrière-plan.
 */
export function useSessionTimer(startedAt: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return Math.max(0, Math.floor((now - startedAt) / 1000))
}
