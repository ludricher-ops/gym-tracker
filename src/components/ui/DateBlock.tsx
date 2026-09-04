// Bloc date 44×44 : numéro du jour en mono 17px + mois abrégé 9px.
// variant="accent" : fond accent, texte accent-ink.
// Usage : <DateBlock date={session.startedAt} />
//         <DateBlock date={new Date()} accent />

const MONTHS_FR = [
  'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
  'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
] as const

interface DateBlockProps {
  /** Timestamp (ms) ou objet Date */
  date: Date | number
  accent?: boolean
}

export function DateBlock({ date, accent = false }: DateBlockProps) {
  const d = typeof date === 'number' ? new Date(date) : date
  const month = MONTHS_FR[d.getMonth()]
  return (
    <div className={`gt-dateblock${accent ? ' gt-dateblock--accent' : ''}`}>
      <span className="gt-dateblock__day">{d.getDate()}</span>
      {month != null && <span className="gt-dateblock__month">{month}</span>}
    </div>
  )
}
