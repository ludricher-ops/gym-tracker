import { useTheme } from './hooks/useTheme'
import { useSync } from './hooks/useSync'
import { StoreProvider, useStore } from './hooks/useStore'
import { NavProvider, useNavigation } from './nav/useNavigation'
import { TABS } from './nav/navigation'
import { SCREENS } from './nav/screenRegistry'
import { TabBar, EmptyState, UpdateBanner, ChromeGate } from './components/ui'
import { SessionModal } from './components/screens/SessionModal/SessionModal'

export function App() {
  return (
    <ChromeGate>
      <StoreProvider>
        <NavProvider>
          <AppShell />
        </NavProvider>
      </StoreProvider>
    </ChromeGate>
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
      </div>
      {!nav.modal && (
        <TabBar tabs={TABS} active={nav.activeTab} onSelect={nav.switchTab} />
      )}
      {nav.modal?.name === 'session' && typeof nav.modal.params?.sessionId === 'string' && (
        <SessionModal sessionId={nav.modal.params.sessionId} />
      )}
      <UpdateBanner />
    </div>
  )
}
