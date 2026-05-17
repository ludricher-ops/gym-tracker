import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface SheetProps {
  children: ReactNode
  onClose: () => void
  /** Titre optionnel rendu sous la poignée. */
  title?: ReactNode
}

/** Bottom sheet glissable (cahier 4.4) — poignée + backdrop cliquable. */
export function Sheet({ children, onClose, title }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onClose)

  return (
    <div className="gt-overlay" role="dialog" aria-modal="true">
      <div className="gt-overlay__backdrop" onClick={onClose} />
      <div className="gt-sheet" ref={ref}>
        <div className="gt-sheet__handle" />
        {title && (
          <div style={{ padding: '4px 20px 0', fontWeight: 700, fontSize: 16 }}>{title}</div>
        )}
        <div className="gt-sheet__body">{children}</div>
      </div>
    </div>
  )
}
