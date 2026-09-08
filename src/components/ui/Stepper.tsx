import { useRef, useState } from 'react'
import { Icon } from './Icon'

interface StepperProps {
  value: number
  onChange: (next: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  /** Décimales affichées (utile pour les pas de 2.5 kg). */
  decimals?: number
  /** Formateur personnalisé — remplace value.toFixed() + unit (ex. min→secondes). */
  format?: (value: number) => string
  ariaLabel?: string
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  unit,
  decimals = 0,
  format,
  ariaLabel,
}: StepperProps) {
  // Coerce à number : les données IDB peuvent stocker des strings (legacy)
  const num = Number(value)
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const round = (n: number) => Number(Number(n).toFixed(3))

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(num.toFixed(decimals))
    setEditing(true)
    // focus au prochain tick (après le rendu de l'input)
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  const commitEdit = () => {
    const parsed = parseFloat(draft.replace(',', '.'))
    if (!isNaN(parsed)) {
      onChange(clamp(round(parsed)))
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <div className="gt-stepper">
      <button
        type="button"
        className="gt-stepper__btn"
        aria-label={`${ariaLabel ?? ''} diminuer`}
        disabled={num <= min}
        onClick={() => onChange(clamp(round(num - step)))}
      >
        <Icon name="minus" size={20} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="gt-stepper__input"
          type="number"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
        />
      ) : (
        <span
          className="gt-stepper__value"
          aria-label={ariaLabel}
          aria-live="polite"
          onClick={startEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit() }}
          style={{ cursor: 'text' }}
        >
          {format ? format(num) : num.toFixed(decimals)}
          {!format && unit && <span className="gt-stepper__unit"> {unit}</span>}
        </span>
      )}

      <button
        type="button"
        className="gt-stepper__btn"
        aria-label={`${ariaLabel ?? ''} augmenter`}
        disabled={num >= max}
        onClick={() => onChange(clamp(round(num + step)))}
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
