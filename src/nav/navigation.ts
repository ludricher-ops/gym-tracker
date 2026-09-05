// Définitions de navigation : 4 tabs (+ 1 optionnel compétition), chacun
// avec sa propre pile d'écrans, plus une modale plein écran (séance active).

import type { TabDef } from '../components/ui'

export type Tab = 'today' | 'history' | 'stats' | 'profile' | 'group'

export type ScreenName =
  | 'dashboard'
  | 'history'
  | 'sessionDetail'
  | 'sessionRecap'
  | 'stats'
  | 'exerciseDetail'
  | 'profile'
  | 'account'
  | 'preferences'
  | 'body'
  | 'goalsPrograms'
  | 'programsLibrary'
  | 'programDetail'
  | 'myExercises'
  | 'exerciseForm'
  | 'programBuilder'
  | 'programGenerator'
  | 'rattrapages'
  | 'group'
  | 'groupDetail'
  | 'rivalsStats'

export interface ScreenEntry {
  name: ScreenName
  params?: Record<string, unknown>
}

/** Modales plein écran posées au-dessus de la navigation à onglets. */
export type ModalName = 'session'

export interface ModalEntry {
  name: ModalName
  params?: Record<string, unknown>
}

/** Écran racine de chaque onglet. */
export const TAB_ROOT: Record<Tab, ScreenName> = {
  today: 'dashboard',
  history: 'history',
  stats: 'stats',
  profile: 'profile',
  group: 'group',
}

/** Onglets de base (mode compétition désactivé). */
export const TABS: TabDef<Tab>[] = [
  { key: 'today', label: "Aujourd'hui", icon: 'flame' },
  { key: 'history', label: 'Historique', icon: 'list' },
  { key: 'stats', label: 'Progression', icon: 'chart' },
  { key: 'profile', label: 'Moi', icon: 'user' },
]

/** Onglets avec le mode Rivals activé (Rivals en premier). */
export const TABS_COMPETITION: TabDef<Tab>[] = [
  { key: 'group', label: 'Rivals', icon: 'trophy' },
  { key: 'today', label: "Aujourd'hui", icon: 'flame' },
  { key: 'history', label: 'Historique', icon: 'list' },
  { key: 'stats', label: 'Progression', icon: 'chart' },
  { key: 'profile', label: 'Moi', icon: 'user' },
]

// ── Clé localStorage pour le mode compétition ────────────────────────────────

export const COMPETITION_KEY = 'gt-competition-mode'

export function isCompetitionEnabled(): boolean {
  try { return localStorage.getItem(COMPETITION_KEY) === 'true' } catch { return false }
}

export function setCompetitionEnabled(on: boolean): void {
  try { localStorage.setItem(COMPETITION_KEY, on ? 'true' : 'false') } catch { /* ignore */ }
}
