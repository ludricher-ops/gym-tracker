import { useTheme } from './hooks/useTheme'
import { useSync } from './hooks/useSync'
import { StoreProvider, useStore } from './hooks/useStore'
import { NavProvider, useNavigation } from './nav/useNavigation'
import { TABS } from './nav/navigation'
import { SCREENS } from './nav/screenRegistry'
import { TabBar, EmptyState, UpdateBanner, ChromeGate } from './components/ui'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { SessionModal } from './components/screens/SessionModal/SessionModal'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginScreen } from './components/screens/LoginScreen'

export function App() {
  return (
    <ChromeGate>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ChromeGate>
  )
}

/** Affiche le login si non connecté, l'app sinon. */
function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    // Écran de chargement minimal pendant la vérification du cookie
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'var(--accent)',
          opacity: 0.6,
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <StoreProvider>
      <NavProvider>
        <AppShell />
      </NavProvider>
    </StoreProvider>
  )
}

function AppShell() {
  const store = useStore()
  useTheme(store.settings.preferences.theme, store.settings.preferences.accentColor)
  useSync(store.reload)

  const nav = useNavigation()
  const Screen = SCREENS[nav.currentScreen.name]

  return (
    <div className="gt-app">
      <div className="gt-app__screen">
        <ErrorBoundary>
          {Screen ? (
            <Screen params={nav.currentScreen.params} />
          ) : (
            <div className="gt-screen">
              <div className="gt-screen__scroll">
                <EmptyState
                  icon="info"
                  title="Écran à venir"
                  sub={`« ${nav.currentScreen.name} » sera disponible dans un prochain jalon.`}
                />
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
      {!nav.modal && (
        <TabBar tabs={TABS} active={nav.activeTab} onSelect={nav.switchTab} />
      )}
      {nav.modal?.name === 'session' && typeof nav.modal.params?.sessionId === 'string' && (
        <ErrorBoundary>
          <SessionModal sessionId={nav.modal.params.sessionId} />
        </ErrorBoundary>
      )}
      <UpdateBanner />
    </div>
  )
}
