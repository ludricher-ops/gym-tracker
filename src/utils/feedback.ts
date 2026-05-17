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
