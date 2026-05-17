import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ModalProps {
  children: ReactNode
  /**
   * Appelé sur Échap. Pour la modale séance active, le parent y branche une
   * confirmation plutôt qu'une fermeture directe.
   */
  onRequestClose?: () => void
}

/** Modale plein écran posée par-dessus toute la navigation. */
export function Modal({ children, onRequestClose }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onRequestClose)

  return (
    <div className="gt-overlay" role="dialog" aria-modal="true">
      <div className="gt-modal" ref={ref}>
        {children}
      </div>
    </div>
  )
}
