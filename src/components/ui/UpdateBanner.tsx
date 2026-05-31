import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Bannière discrète affichée quand une nouvelle version du Service Worker est
 * disponible. Évite les rechargements forcés pendant une séance active.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--tab-h, 56px) + 12px)',
        left: 12,
        right: 12,
        zIndex: 9999,
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,.15)',
      }}
    >
      <span className="t-caption" style={{ flex: 1 }}>
        Mise à jour disponible
      </span>
      <button
        type="button"
        className="gt-chip gt-chip--active"
        style={{ flexShrink: 0 }}
        onClick={() => updateServiceWorker(true)}
      >
        Actualiser
      </button>
    </div>
  )
}
