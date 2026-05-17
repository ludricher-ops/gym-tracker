import { useEffect } from 'react'
import type { ThemeMode } from '../types'
import { inkFor } from '../theme/accents'

// Applique le thème (clair/sombre/auto) et l'accent à <html>. Le mode `auto`
// suit la préférence système et réagit à ses changements.

export function useTheme(theme: ThemeMode, accentColor: string) {
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const resolved = theme === 'auto' ? (mq.matches ? 'dark' : 'light') : theme
      root.dataset.theme = resolved
    }
    apply()

    if (theme === 'auto') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent-ink', inkFor(accentColor))
  }, [accentColor])
}
