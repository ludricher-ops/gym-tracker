// Détection de records personnels (PR). À la validation d'une série, on
// compare la performance à l'historique de l'exercice (cahier 6.2 + 7).

import type { OneRMFormula } from '../types'
import { estimate1RM } from './oneRM'

export interface PerformedSet {
  weightKg: number
  reps: number
}

export interface PRResult {
  estimated1RM: number
  /** Meilleur 1RM estimé AVANT cette série (0 si aucun historique). */
  previousBest1RM: number
  /** 1RM estimé supérieur au meilleur précédent. */
  is1RM: boolean
  /** Volume de la série (poids × reps) supérieur au meilleur précédent. */
  isVolumeSet: boolean
  /** Plus de reps qu'avant à ce poids exact. */
  isRepsAtWeight: boolean
}

export function isAnyPR(r: PRResult): boolean {
  return r.is1RM || r.isVolumeSet || r.isRepsAtWeight
}

/**
 * Détecte les PR d'une série par rapport à `history` (séries de travail déjà
 * réalisées sur le MÊME exercice, hors échauffement). Une toute première
 * série valide est un PR sur tous les axes.
 */
export function detectPRs(
  current: PerformedSet,
  history: PerformedSet[],
  formula: OneRMFormula = 'epley',
): PRResult {
  const estimated1RM = estimate1RM(current.weightKg, current.reps, formula)

  if (current.weightKg <= 0 || current.reps <= 0) {
    return {
      estimated1RM,
      previousBest1RM: 0,
      is1RM: false,
      isVolumeSet: false,
      isRepsAtWeight: false,
    }
  }
  if (history.length === 0) {
    return {
      estimated1RM,
      previousBest1RM: 0,
      is1RM: true,
      isVolumeSet: true,
      isRepsAtWeight: true,
    }
  }

  const bestE1RM = Math.max(...history.map((h) => estimate1RM(h.weightKg, h.reps, formula)))
  const bestVolume = Math.max(...history.map((h) => h.weightKg * h.reps))
  const sameWeight = history.filter((h) => h.weightKg === current.weightKg)
  const currentVolume = current.weightKg * current.reps

  return {
    estimated1RM,
    previousBest1RM: bestE1RM,
    is1RM: estimated1RM > bestE1RM,
    isVolumeSet: currentVolume > bestVolume,
    isRepsAtWeight:
      sameWeight.length > 0 && current.reps > Math.max(...sameWeight.map((h) => h.reps)),
  }
}
