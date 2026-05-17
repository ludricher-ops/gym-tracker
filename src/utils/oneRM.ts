// Estimation du 1RM (répétition maximale). Trois formules au choix de
// l'utilisateur (cahier 6.4 + UserPreferences.oneRMFormula).

import type { OneRMFormula } from '../types'

/** Epley : weight × (1 + reps / 30). */
export function epley(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

/**
 * Brzycki : weight × 36 / (37 − reps). Diverge à mesure que reps approche 37
 * et devient invalide au-delà — on retombe alors sur Epley.
 */
export function brzycki(weight: number, reps: number): number {
  if (reps <= 1) return weight
  if (reps >= 37) return epley(weight, reps)
  return (weight * 36) / (37 - reps)
}

/** Lombardi : weight × reps^0.10. */
export function lombardi(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * Math.pow(reps, 0.1)
}

/** 1RM estimé selon la formule choisie. */
export function estimate1RM(
  weight: number,
  reps: number,
  formula: OneRMFormula = 'epley',
): number {
  if (weight <= 0 || reps <= 0) return 0
  switch (formula) {
    case 'brzycki':
      return brzycki(weight, reps)
    case 'lombardi':
      return lombardi(weight, reps)
    case 'epley':
    default:
      return epley(weight, reps)
  }
}
