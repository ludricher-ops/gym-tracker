// Streak : nombre de jours consécutifs avec au moins une séance entraînée.
// Calculé en heure locale, remise à zéro à minuit (cahier section 7).

import { addDays, localDayKey, startOfLocalDay } from './dates'

/**
 * Streak courant à partir des clés de jour entraînées. Si aujourd'hui n'est
 * pas (encore) entraîné, le streak reste celui qui se termine hier.
 */
export function computeStreak(
  trainedDayKeys: Iterable<string>,
  today: Date | number = Date.now(),
): number {
  const set = new Set(trainedDayKeys)
  let cursor = startOfLocalDay(today)

  // Aujourd'hui non entraîné → on part d'hier (streak pas encore rompu).
  if (!set.has(localDayKey(cursor))) cursor = addDays(cursor, -1)

  let streak = 0
  while (set.has(localDayKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Plus longue série de jours consécutifs entraînés (record historique). */
export function longestStreak(trainedDayKeys: Iterable<string>): number {
  const keys = [...new Set(trainedDayKeys)].sort()
  if (keys.length === 0) return 0
  let best = 1
  let run = 1
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(`${keys[i - 1]}T00:00:00`)
    const cur = new Date(`${keys[i]}T00:00:00`)
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    run = diffDays === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

/** Le streak est-il en jeu (streak vivant mais aujourd'hui pas entraîné) ? */
export function streakInDanger(
  trainedDayKeys: Iterable<string>,
  now: Date | number = Date.now(),
): boolean {
  const set = new Set(trainedDayKeys)
  if (set.has(localDayKey(now))) return false
  return computeStreak(set, now) > 0
}
