import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { buildSessionRecap } from '../../utils/sessionRecap'
import { deleteSession, startSessionFromTemplate } from '../../utils/sessionOps'
import { localDayKey } from '../../utils/dates'
import { formatDuration, formatVolume } from '../../utils/format'
import { formatWeight } from '../../utils/units'
import { Button, Card, EmptyState, Icon, Sheet, StatTile } from '../ui'

export function SessionRecapScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const sessionId = params?.sessionId as string | undefined

  const recap = useMemo(
    () => (sessionId ? buildSessionRecap(sessionId, store) : null),
    [sessionId, store],
  )
  const [notes, setNotes] = useState(recap?.session.notes ?? '')
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(recap?.session.name ?? '')
  const [editDate, setEditDate] = useState(
    recap ? localDayKey(recap.session.startedAt) : '',
  )

  if (!recap) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <span className="gt-topbar__title">Récap</span>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState icon="info" title="Séance introuvable" />
        </div>
      </div>
    )
  }

  const { session, previous } = recap
  const weightUnit = store.settings.preferences.weightUnit
  const workoutTemplate = session.workoutTemplateId
    ? store.workoutTemplates.find((w) => w.id === session.workoutTemplateId)
    : undefined
  const start = new Date(session.startedAt)
  const end = session.endedAt ? new Date(session.endedAt) : null
  const timeRange = `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${
    end ? ` → ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''
  }`

  const saveNotes = () => {
    if (notes !== (session.notes ?? '')) {
      store.session.save({ ...session, notes: notes.trim() || undefined })
    }
  }

  const saveEdit = async () => {
    const [y, m, d] = editDate.split('-').map(Number)
    let startedAt = session.startedAt
    let endedAt = session.endedAt
    if (y && m && d) {
      const orig = new Date(session.startedAt)
      startedAt = new Date(
        y, m - 1, d, orig.getHours(), orig.getMinutes(), orig.getSeconds(),
      ).getTime()
      const delta = startedAt - session.startedAt
      if (endedAt != null) endedAt += delta
    }
    await store.session.save({
      ...session,
      name: editName.trim() || session.name,
      startedAt,
      endedAt,
    })
    setEditOpen(false)
  }

  const del = async () => {
    if (!confirm(`Supprimer définitivement la séance « ${session.name} » ?`)) return
    await deleteSession(session, store)
    nav.back()
  }

  const share = () => {
    const lines = [
      `${session.name} — ${start.toLocaleDateString('fr-FR')}`,
      `Durée ${formatDuration(recap.durationSec)} · Volume ${formatVolume(recap.totalVolumeKg)} kg · ${recap.completedSets} séries`,
      ...recap.exercises.map(
        (ex) => `${ex.name} : ${ex.sets.map((s) => `${s.weightKg}×${s.reps}`).join(', ')}`,
      ),
    ]
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {})
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="gt-topbar__title">{start.toLocaleDateString('fr-FR')}</div>
          <div className="t-caption">{timeRange}</div>
        </div>
        <button className="gt-iconbtn" onClick={() => setEditOpen(true)} aria-label="Modifier">
          <Icon name="edit" size={20} />
        </button>
        <button className="gt-iconbtn" onClick={share} aria-label="Partager">
          <Icon name="copy" size={20} />
        </button>
      </div>

      <div className="gt-screen__scroll">
        <Card variant="accent">
          <p style={{ fontWeight: 700, fontSize: 18 }}>{session.name}</p>
          {session.programWeek != null && (
            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              Semaine {session.programWeek}
            </p>
          )}
        </Card>

        <div className="gt-statrow">
          <StatTile
            label="Volume"
            value={`${formatVolume(recap.totalVolumeKg)} kg`}
            delta={previous ? Math.round(recap.totalVolumeKg - previous.volumeKg) : undefined}
          />
          <StatTile
            label="Durée"
            value={formatDuration(recap.durationSec)}
            delta={
              previous
                ? Math.round((recap.durationSec - previous.durationSec) / 60)
                : undefined
            }
            deltaUnit=" min"
          />
          <StatTile
            label="RPE moyen"
            value={recap.avgRPE != null ? recap.avgRPE.toFixed(1) : '—'}
          />
        </div>

        {recap.prCount > 0 && (
          <Card variant="flat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--accent)' }}>
                <Icon name="bolt" size={20} />
              </span>
              <span style={{ fontWeight: 600 }}>
                {recap.prCount} record{recap.prCount > 1 ? 's' : ''} personnel
                {recap.prCount > 1 ? 's' : ''} battu{recap.prCount > 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        )}

        {recap.muscleSlices.length > 0 && (
          <div>
            <p className="t-eyebrow" style={{ marginBottom: 8 }}>
              Volume par groupe musculaire
            </p>
            <div
              style={{
                display: 'flex',
                height: 12,
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                background: 'var(--surface2)',
              }}
            >
              {recap.muscleSlices.map((s, i) => (
                <div
                  key={s.region}
                  style={{
                    width: `${s.pct * 100}%`,
                    background: 'var(--accent)',
                    opacity: 1 - i * 0.16,
                  }}
                />
              ))}
            </div>
            <div className="gt-chips" style={{ marginTop: 8 }}>
              {recap.muscleSlices.map((s) => (
                <span key={s.region} className="t-caption">
                  {s.region} {Math.round(s.pct * 100)}%
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="t-eyebrow">Exercices</p>
        {recap.exercises.map((ex) => (
          <Card key={ex.sessionExerciseId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700 }}>
                {ex.supersetGroup && (
                  <span style={{ color: 'var(--accent)' }}>{ex.supersetGroup} · </span>
                )}
                {ex.name}
              </span>
              <span className="t-caption">{formatVolume(ex.tonnageKg)} kg</span>
            </div>
            <div className="gt-chips" style={{ marginTop: 8 }}>
              {ex.sets.map((s) => (
                <span
                  key={s.id}
                  className={`gt-chip ${s.isPersonalRecord ? 'gt-chip--active' : ''}`}
                >
                  {s.isWarmup ? '🔥 ' : ''}
                  {formatWeight(s.weightKg, weightUnit)} × {s.reps}
                  {s.isPersonalRecord ? ' ★' : ''}
                </span>
              ))}
            </div>
          </Card>
        ))}

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="recap-notes">
            Notes
          </label>
          <textarea
            id="recap-notes"
            className="gt-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Sensations, douleurs, points à retenir…"
          />
        </div>

        {workoutTemplate && (
          <Button
            icon="bolt"
            onClick={async () => {
              saveNotes()
              const fresh = await startSessionFromTemplate(workoutTemplate, store)
              nav.openModal('session', { sessionId: fresh.id })
            }}
          >
            Refaire cette séance
          </Button>
        )}
        <Button variant="secondary" onClick={() => { saveNotes(); nav.back() }}>
          Terminé
        </Button>
      </div>

      {editOpen && (
        <Sheet title="Modifier la séance" onClose={() => setEditOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="edit-name">
                Nom de la séance
              </label>
              <input
                id="edit-name"
                className="gt-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="edit-date">
                Date
              </label>
              <input
                id="edit-date"
                type="date"
                className="gt-input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <Button icon="check" onClick={saveEdit}>
              Enregistrer
            </Button>
            <Button variant="ghost" icon="trash" onClick={del}>
              Supprimer la séance
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
