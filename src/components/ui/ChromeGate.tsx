import { useState } from 'react'

function isChrome() {
  const ua = navigator.userAgent
  return /Chrome\//.test(ua) && !/Chromium\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)
}

function isMobile() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

function openInChrome() {
  const url = window.location.href
  // Android intent fallback (fonctionne même si le scheme googlechrome:// n'est pas enregistré)
  const intent = `intent:${url}#Intent;scheme=https;package=com.android.chrome;end`
  // iOS : googlechromes:// pour https
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isIOS) {
    window.location.href = `googlechromes://${url.replace(/^https?:\/\//, '')}`
  } else {
    window.location.href = intent
  }
}

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false)

  if (!isMobile() || isChrome() || isStandalone() || dismissed) {
    return <>{children}</>
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center', gap: '1.25rem',
    }}>
      <span style={{ fontSize: '3rem' }}>⚠️</span>
      <p className="t-title" style={{ color: 'var(--text-primary)', margin: 0 }}>
        Ouvre dans Chrome
      </p>
      <p className="t-body" style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '280px' }}>
        Cette application fonctionne mieux dans Chrome. Certaines fonctionnalités peuvent ne pas marcher dans ton navigateur actuel.
      </p>
      <button
        className="gt-btn gt-btn--primary"
        style={{ width: '100%', maxWidth: '280px' }}
        onClick={openInChrome}
      >
        Ouvrir dans Chrome
      </button>
      <button
        className="gt-btn gt-btn--ghost"
        style={{ width: '100%', maxWidth: '280px' }}
        onClick={() => setDismissed(true)}
      >
        Continuer quand même
      </button>
    </div>
  )
}
