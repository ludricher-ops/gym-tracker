import type { Settings, UserPreferences } from '../types'
import { useStore } from './useStore'

/** Accès pratique aux réglages + mutateurs ciblés (profil / préférences). */
export function useSettings() {
  const store = useStore()
  const { settings } = store

  const updateProfile = (patch: Partial<Settings>) =>
    store.saveSettings({ ...settings, ...patch })

  const updatePreferences = (patch: Partial<UserPreferences>) =>
    store.saveSettings({
      ...settings,
      preferences: { ...settings.preferences, ...patch },
    })

  return { settings, preferences: settings.preferences, updateProfile, updatePreferences }
}
