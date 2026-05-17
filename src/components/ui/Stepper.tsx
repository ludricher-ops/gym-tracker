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
  ariaLabel,
}: StepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const round = (n: number) => Number(n.toFixed(3))

  return (
    <div className="gt-stepper">
      <button
        type="button"
        className="gt-stepper__btn"
        aria-label={`${ariaLabel ?? ''} diminuer`}
        disabled={value <= min}
        onClick={() => onChange(clamp(round(value - step)))}
      >
        <Icon name="minus" size={20} />
      </button>
      <span className="gt-stepper__value" aria-label={ariaLabel} aria-live="polite">
        {value.toFixed(decimals)}
        {unit && <span className="gt-stepper__unit"> {unit}</span>}
      </span>
      <button
        type="button"
        className="gt-stepper__btn"
        aria-label={`${ariaLabel ?? ''} augmenter`}
        disabled={value >= max}
        onClick={() => onChange(clamp(round(value + step)))}
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
