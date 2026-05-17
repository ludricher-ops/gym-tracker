// Génération de séries d'échauffement (ramp-up) pour un exercice composé,
// d'après le poids de travail (cahier 6.14).

export interface WarmupSet {
  weightKg: number
  reps: number
  label: string
}

/** Arrondit au pas de 2.5 kg le plus proche. */
function roundPlate(w: number): number {
  return Math.round(w / 2.5) * 2.5
}

/**
 * Échauffement progressif : barre à vide ×12, 50 % ×8, 70 % ×5. Renvoie un
 * tableau vide si le poids de travail n'excède pas la barre (échauffement
 * spécifique inutile).
 */
export function generateWarmup(workingWeightKg: number, barWeightKg = 20): WarmupSet[] {
  if (workingWeightKg <= barWeightKg) return []
  return [
    { weightKg: barWeightKg, reps: 12, label: 'Barre à vide' },
    { weightKg: roundPlate(workingWeightKg * 0.5), reps: 8, label: '50 %' },
    { weightKg: roundPlate(workingWeightKg * 0.7), reps: 5, label: '70 %' },
  ]
}
