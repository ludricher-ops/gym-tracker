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
      <span className="gt-stepper__value" aria-label={ariaLabel} aria-live="polite">
        {format ? format(num) : num.toFixed(decimals)}
        {!format && unit && <span className="gt-stepper__unit"> {unit}</span>}
      </span>
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
