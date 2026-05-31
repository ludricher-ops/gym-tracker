import { useId, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface SheetProps {
  children: ReactNode
  onClose: () => void
  /** Titre optionnel rendu sous la poignée — lie automatiquement aria-labelledby. */
  title?: ReactNode
}

/** Bottom sheet glissable (cahier 4.4) — poignée + backdrop cliquable. */
export function Sheet({ children, onClose, title }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(ref, onClose)

  return (
    <div
      className="gt-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div className="gt-overlay__backdrop" onClick={onClose} />
      <div className="gt-sheet" ref={ref}>
        <div className="gt-sheet__handle" />
        {title && (
          <h2 id={titleId} style={{ padding: '4px 20px 0', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {title}
          </h2>
        )}
        <div className="gt-sheet__body">{children}</div>
      </div>
    </div>
  )
}
