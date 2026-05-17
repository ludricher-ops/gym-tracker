// Progression automatique du poids : +progressStepKg dès que la dernière
// performance atteint le haut de la fourchette de reps (cahier 6.12 + 7).

import type { RepsMode } from '../types'

export interface ProgressionInput {
  repsMode: RepsMode
  targetRepsMin: number
  targetRepsMax?: number
  autoProgress: boolean
  progressStepKg: number
}

/** Plafond de reps au-delà duquel on augmente la charge. */
function repsCeiling(p: ProgressionInput): number {
  // En mode plage on vise le haut de la fourchette ; sinon la cible unique.
  return p.repsMode === 'range' ? (p.targetRepsMax ?? p.targetRepsMin) : p.targetRepsMin
}

/** La dernière performance justifie-t-elle d'augmenter la charge ? */
export function shouldProgress(lastReps: number, p: ProgressionInput): boolean {
  if (!p.autoProgress) return false
  return lastReps >= repsCeiling(p)
}

/** Poids cible de la prochaine séance pour cet exercice (en kg). */
export function nextTargetWeight(
  lastWeightKg: number,
  lastReps: number,
  p: ProgressionInput,
): number {
  if (lastWeightKg <= 0) return lastWeightKg
  return shouldProgress(lastReps, p) ? lastWeightKg + p.progressStepKg : lastWeightKg
}
