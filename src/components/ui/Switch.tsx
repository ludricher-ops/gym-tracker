interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`gt-switch ${checked ? 'gt-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="gt-switch__knob" />
    </button>
  )
}
