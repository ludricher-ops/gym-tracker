interface ProgressBarProps {
  /** Progression de 0 à 1. */
  value: number
  /** Label annoncé par les lecteurs d'écran. */
  ariaLabel?: string
}

export function ProgressBar({ value, ariaLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className="gt-progress"
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="gt-progress__fill" style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  )
}
