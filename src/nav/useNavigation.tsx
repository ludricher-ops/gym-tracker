import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import {
  TAB_ROOT, type ModalEntry, type ModalName, type ScreenEntry,
  type ScreenName, type Tab,
} from './navigation'

interface NavApi {
  activeTab: Tab
  /** Écran au sommet de la pile de l'onglet actif. */
  currentScreen: ScreenEntry
  modal: ModalEntry | null
  canGoBack: boolean
  switchTab: (tab: Tab) => void
  navigate: (name: ScreenName, params?: Record<string, unknown>) => void
  /** Retour en arrière (via l'historique navigateur). */
  back: () => void
  popToRoot: () => void
  openModal: (name: ModalName, params?: Record<string, unknown>) => void
  closeModal: () => void
}

const NavContext = createContext<NavApi | null>(null)

const initialStacks = (): Record<Tab, ScreenEntry[]> => ({
  today: [{ name: TAB_ROOT.today }],
  history: [{ name: TAB_ROOT.history }],
  stats: [{ name: TAB_ROOT.stats }],
  profile: [{ name: TAB_ROOT.profile }],
})

export function NavProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [stacks, setStacks] = useState(initialStacks)
  const [modal, setModal] = useState<ModalEntry | null>(null)

  // Snapshot pour le handler popstate (évite de le recréer à chaque rendu).
  const snap = useRef({ activeTab, stacks, modal })
  snap.current = { activeTab, stacks, modal }

  const navigate = useCallback((name: ScreenName, params?: Record<string, unknown>) => {
    window.history.pushState({ gt: true }, '')
    setStacks((prev) => ({
      ...prev,
      [snap.current.activeTab]: [...prev[snap.current.activeTab], { name, params }],
    }))
  }, [])

  const openModal = useCallback((name: ModalName, params?: Record<string, unknown>) => {
    window.history.pushState({ gt: true }, '')
    setModal({ name, params })
  }, [])

  // Recule d'un cran : modale d'abord, puis sommet de pile.
  const popOne = useCallback(() => {
    const s = snap.current
    if (s.modal) {
      setModal(null)
      return
    }
    const stack = s.stacks[s.activeTab]
    if (stack.length > 1) {
      setStacks((prev) => ({
        ...prev,
        [s.activeTab]: prev[s.activeTab].slice(0, -1),
      }))
    }
  }, [])

  // L'affordance "retour" délègue à l'historique → un seul chemin de mutation.
  const back = useCallback(() => window.history.back(), [])
  const closeModal = useCallback(() => window.history.back(), [])

  useEffect(() => {
    const onPop = () => popOne()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [popOne])

  const switchTab = useCallback((tab: Tab) => setActiveTab(tab), [])

  const popToRoot = useCallback(() => {
    const s = snap.current
    setStacks((prev) => ({
      ...prev,
      [s.activeTab]: [prev[s.activeTab][0]],
    }))
  }, [])

  const stack = stacks[activeTab]
  const api = useMemo<NavApi>(
    () => ({
      activeTab,
      currentScreen: stack[stack.length - 1],
      modal,
      canGoBack: stack.length > 1 || modal != null,
      switchTab,
      navigate,
      back,
      popToRoot,
      openModal,
      closeModal,
    }),
    [activeTab, stack, modal, switchTab, navigate, back, popToRoot, openModal, closeModal],
  )

  return <NavContext.Provider value={api}>{children}</NavContext.Provider>
}

export function useNavigation(): NavApi {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNavigation hors de NavProvider')
  return ctx
}
