// Helpers de dates en heure locale. La clé de jour locale (`localDayKey`)
// sert au calcul du streak et au regroupement des séances.

import type { WeekStart } from '../types'

const DAY_MS = 86_400_000

function toDate(d: Date | number): Date {
  return typeof d === 'number' ? new Date(d) : d
}

/** Clé de jour locale "YYYY-MM-DD" (insensible au fuseau d'affichage). */
export function localDayKey(d: Date | number): string {
  const date = toDate(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Minuit local du jour de `d`. */
export function startOfLocalDay(d: Date | number): Date {
  const date = toDate(d)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Deux instants tombent-ils le même jour local ? */
export function sameLocalDay(a: Date | number, b: Date | number): boolean {
  return localDayKey(a) === localDayKey(b)
}

/** Nombre de jours locaux entiers entre deux instants (b − a). */
export function daysBetween(a: Date | number, b: Date | number): number {
  const ms = startOfLocalDay(b).getTime() - startOfLocalDay(a).getTime()
  return Math.round(ms / DAY_MS)
}

export function addDays(d: Date | number, n: number): Date {
  const date = toDate(d)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

export function addWeeks(d: Date | number, n: number): Date {
  return addDays(d, n * 7)
}

/**
 * Plage [début, fin) de la semaine contenant `d`, selon le 1er jour de
 * semaine. `start` est à minuit local, `end` est le minuit 7 jours après.
 */
export function weekRange(
  d: Date | number,
  weekStart: WeekStart = 'monday',
): { start: Date; end: Date } {
  const date = startOfLocalDay(d)
  const dow = date.getDay() // 0 = dimanche … 6 = samedi
  const offset =
    weekStart === 'monday' ? (dow === 0 ? 6 : dow - 1) : dow
  const start = addDays(date, -offset)
  return { start, end: addDays(start, 7) }
}
