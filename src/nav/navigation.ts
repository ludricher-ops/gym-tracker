// Définitions de navigation : 4 tabs, chacun avec sa propre pile d'écrans,
// plus une modale plein écran (séance active) gérée en état top-level.

import type { TabDef } from '../components/ui'

export type Tab = 'today' | 'history' | 'stats' | 'profile'

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
  | 'goalsPrograms'
  | 'programsLibrary'
  | 'programDetail'
  | 'myExercises'
  | 'exerciseForm'
  | 'programBuilder'

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
}

export const TABS: TabDef<Tab>[] = [
  { key: 'today', label: "Aujourd'hui", icon: 'flame' },
  { key: 'history', label: 'Historique', icon: 'list' },
  { key: 'stats', label: 'Stats', icon: 'chart' },
  { key: 'profile', label: 'Profil', icon: 'user' },
]
