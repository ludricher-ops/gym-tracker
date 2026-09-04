// Singleton en mémoire pour passer un DraftProgram du wizard
// vers le ProgramBuilderScreen sans serialiser un objet complexe dans les params.

import type { DraftProgram } from '../components/programBuilder/programDraft'

let pending: DraftProgram | null = null

export function setPendingDraft(draft: DraftProgram): void {
  pending = draft
}

/** Retourne true si un draft est en attente — à appeler AVANT consumePendingDraft. */
export function hasPendingDraft(): boolean {
  return pending !== null
}

/** Consomme et retourne le draft en attente (le vide ensuite). */
export function consumePendingDraft(): DraftProgram | null {
  const d = pending
  pending = null
  return d
}
