import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ModalProps {
  children: ReactNode
  /**
   * Appelé sur Échap. Pour la modale séance active, le parent y branche une
   * confirmation plutôt qu'une fermeture directe.
   */
  onRequestClose?: () => void
  /** Label annoncé par les lecteurs d'écran pour identifier la boîte de dialogue. */
  ariaLabel?: string
}

/** Modale plein écran posée par-dessus toute la navigation. */
export function Modal({ children, onRequestClose, ariaLabel }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onRequestClose)

  return (
    <div className="gt-overlay" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div className="gt-modal" ref={ref}>
        {children}
      </div>
    </div>
  )
}
