interface ProgressBarProps {
  /** Progression de 0 à 1. */
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className="gt-progress"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="gt-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
