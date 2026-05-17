// Règles de validation d'une série (cahier section 7).

/** Une série est invalide seulement si poids ET reps sont nuls. */
export function isValidSet(weightKg: number, reps: number): boolean {
  return !(weightKg <= 0 && reps <= 0)
}

/** Au-delà de 30 reps, on affiche un avertissement (saisie probablement erronée). */
export function repsLookSuspicious(reps: number): boolean {
  return reps > 30
}
