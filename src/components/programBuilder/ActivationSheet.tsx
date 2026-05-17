import { useState } from 'react'
import type { Program } from '../../types'
import type { StoreApi } from '../../hooks/useStore'
import { activateProgram } from '../../utils/programOps'
import { addDays, localDayKey } from '../../utils/dates'
import { Sheet, Button, Card } from '../ui'

interface ActivationSheetProps {
  program: Program
  store: StoreApi
  onClose: () => void
  onActivated: () => void
}

function parseDate(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return Date.now()
  return new Date(y, m - 1, d).getTime()
}

function nextMonday(): Date {
  const today = new Date()
  const dow = today.getDay()
  const delta = dow === 1 ? 7 : (8 - dow) % 7 || 7
  return addDays(today, delta)
}

export function ActivationSheet({ program, store, onClose, onActivated }: ActivationSheetProps) {
  const [date, setDate] = useState(localDayKey(Date.now()))
  const [busy, setBusy] = useState(false)
  const active = store.programs.find((p) => p.isActive && p.id !== program.id)

  const quick: { label: string; value: string }[] = [
    { label: "Aujourd'hui", value: localDayKey(Date.now()) },
    { label: 'Demain', value: localDayKey(addDays(new Date(), 1)) },
    { label: 'Lundi prochain', value: localDayKey(nextMonday()) },
  ]

  const confirm = async () => {
    setBusy(true)
    try {
      await activateProgram(program, parseDate(date), store)
      onActivated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="Activer le programme" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="t-caption">
          {program.name} · {program.durationWeeks} semaines
        </p>

        {active && (
          <Card variant="flat">
            <p className="t-caption">
              ⚠️ Remplace ton programme actuel «&nbsp;{active.name}&nbsp;». Il sera
              archivé — l&apos;historique reste accessible.
            </p>
          </Card>
        )}

        <div className="gt-field">
          <span className="gt-field__label">Date de démarrage</span>
          <div className="gt-chips" style={{ marginBottom: 8 }}>
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                className={`gt-chip ${date === q.value ? 'gt-chip--active' : ''}`}
                onClick={() => setDate(q.value)}
              >
                {q.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            className="gt-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <Button onClick={confirm} disabled={busy} icon="check">
          {busy ? 'Activation…' : 'Activer maintenant'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Sheet>
  )
}
