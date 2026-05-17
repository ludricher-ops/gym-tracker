import { useCallback, useEffect, useRef, useState } from 'react'

export interface RestTimer {
  active: boolean
  /** Secondes restantes (0 quand terminé). */
  remainingSec: number
  /** Durée cible du repos en cours. */
  targetSec: number
  start: (durationSec: number) => void
  addTime: (sec: number) => void
  skip: () => void
}

/**
 * Timer de repos basé sur un timestamp de fin (`endsAt`) — le décompte reste
 * exact même si l'app passe en arrière-plan. `onComplete` est appelé une fois
 * quand le repos atteint zéro.
 */
export function useRestTimer(onComplete?: () => void): RestTimer {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [targetSec, setTargetSec] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)

  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  const remainingSec = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0

  useEffect(() => {
    if (endsAt != null && remainingSec === 0 && !fired.current) {
      fired.current = true
      onComplete?.()
    }
  }, [endsAt, remainingSec, onComplete])

  const start = useCallback((durationSec: number) => {
    fired.current = false
    setTargetSec(durationSec)
    setNow(Date.now())
    setEndsAt(Date.now() + durationSec * 1000)
  }, [])

  const addTime = useCallback((sec: number) => {
    setEndsAt((e) => {
      if (e == null) return e
      const next = e + sec * 1000
      if (next > Date.now()) fired.current = false
      return next
    })
  }, [])

  const skip = useCallback(() => {
    setEndsAt(null)
    fired.current = false
  }, [])

  return { active: endsAt != null, remainingSec, targetSec, start, addTime, skip }
}
