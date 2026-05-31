// Retours sensoriels : bip sonore + vibration. Échoue silencieusement si
// l'API n'est pas disponible ou bloquée par le navigateur.

export function playBeep(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.42)
    osc.onended = () => ctx.close()
    // Fallback : certains navigateurs (Safari) ne déclenchent pas onended.
    // Les navigateurs limitent à ~6 AudioContext simultanés ; forcer la fermeture évite le blocage.
    setTimeout(() => { if (ctx.state !== 'closed') void ctx.close() }, 600)
  } catch {
    /* audio indisponible — ignoré */
  }
}

export function vibrate(ms = 180): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* vibration indisponible — ignoré */
  }
}

/** Demande (une fois) l'autorisation des notifications, si pas déjà décidée. */
export function requestNotificationPermission(): void {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  } catch {
    /* notifications indisponibles — ignoré */
  }
}

/** Affiche une notification locale si l'autorisation a été accordée. */
export function notify(title: string, body?: string): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  } catch {
    /* notifications indisponibles — ignoré */
  }
}

/**
 * Partage via la feuille de partage native (Web Share API) ; repli sur la
 * copie dans le presse-papiers si indisponible (desktop).
 */
export async function shareOrCopy(text: string): Promise<void> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return
    } catch {
      // Partage annulé ou échoué — on retombe sur le presse-papiers.
    }
  }
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    /* presse-papiers indisponible — ignoré */
  }
}
