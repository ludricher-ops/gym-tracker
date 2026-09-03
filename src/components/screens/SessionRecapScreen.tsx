import { useMemo, useState } from 'react'
import type { SetRecord, TrackingType } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { buildSessionRecap, type RecapExercise } from '../../utils/sessionRecap'
import {
  deleteSession, recomputeSessionTotals, startSessionFromTemplate,
} from '../../utils/sessionOps'
import { localDayKey } from '../../utils/dates'
import { shareOrCopy } from '../../utils/feedback'
import { formatClock, formatDuration, formatVolume } from '../../utils/format'
import { formatWeight } from '../../utils/units'
import { uuid } from '../../utils/uuid'
import { Button, Card, EmptyState, Icon, Sheet, StatTile } from '../ui'
import { SetEditSheet } from './SetEditSheet'

export function SessionRecapScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const sessionId = typeof params?.sessionId === 'string' ? params.sessionId : undefined

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
  const [editTime, setEditTime] = useState(() => {
    if (!recap) return ''
    const d = new Date(recap.session.startedAt)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  const [editDuration, setEditDuration] = useState(
    recap ? Math.round((recap.session.durationSec ?? 0) / 60) : 0,
  )
  const [editSet, setEditSet] = useState<{ set: SetRecord; trackingType: TrackingType } | null>(null)

  if (!recap) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Récap</h1>
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
    const [hh, mm] = editTime.split(':').map(Number)
    let startedAt = session.startedAt
    if (y && m && d) {
      const orig = new Date(session.startedAt)
      startedAt = new Date(
        y, m - 1, d,
        Number.isFinite(hh) ? hh : orig.getHours(),
        Number.isFinite(mm) ? mm : orig.getMinutes(),
        0,
      ).getTime()
    }
    const durationSec = Math.max(0, Math.round(editDuration * 60))
    await store.session.save({
      ...session,
      name: editName.trim() || session.name,
      startedAt,
      endedAt: startedAt + durationSec * 1000,
      durationSec,
    })
    setEditOpen(false)
  }

  const del = async () => {
    if (!confirm(`Supprimer définitivement la séance « ${session.name} » ?`)) return
    await deleteSession(session, store)
    nav.back()
  }

  // Édition des séries d'une séance passée (recalcule les totaux ensuite).
  const saveSet = async (updated: SetRecord) => {
    await store.set.save(updated)
    await recomputeSessionTotals(session, store)
    setEditSet(null)
  }
  const deleteSet = async (s: SetRecord) => {
    await store.set.remove(s.id)
    await recomputeSessionTotals(session, store)
    setEditSet(null)
  }
  const addSet = async (ex: RecapExercise) => {
    const last = ex.sets[ex.sets.length - 1]
    const created = await store.set.save({
      id: uuid(),
      sessionExerciseId: ex.sessionExerciseId,
      index: (last?.index ?? -1) + 1,
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? 8,
      isWarmup: false,
      isFailure: false,
      isPersonalRecord: false,
      completedAt: session.startedAt,
    })
    await recomputeSessionTotals(session, store)
    setEditSet({ set: created, trackingType: ex.trackingType })
  }

  const fmtSet = (s: SetRecord, trackingType: TrackingType) => {
    if (trackingType === 'time') return formatClock(s.reps)
    if (trackingType === 'reps_only') return `${s.reps} reps`
    return `${s.weightKg}×${s.reps}`
  }

  const share = () => {
    const lines = [
      `${session.name} — ${start.toLocaleDateString('fr-FR')}`,
      `Durée ${formatDuration(recap.durationSec)} · Volume ${formatVolume(recap.totalVolumeKg)} kg · ${recap.completedSets} séries`,
      ...recap.exercises.map(
        (ex) => `${ex.name} : ${ex.sets.map((s) => fmtSet(s, ex.trackingType)).join(', ')}`,
      ),
    ]
    shareOrCopy(lines.join('\n'))
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="gt-topbar__title">{start.toLocaleDateString('fr-FR')}</h1>
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
                <button
                  key={s.id}
                  type="button"
                  className={`gt-chip ${s.isPersonalRecord ? 'gt-chip--active' : ''}`}
                  onClick={() => setEditSet({ set: s, trackingType: ex.trackingType })}
                >
                  {s.isWarmup ? '🔥 ' : ''}
                  {ex.trackingType === 'weight_reps'
                    ? `${formatWeight(s.weightKg, weightUnit)} × ${s.reps}`
                    : ex.trackingType === 'time'
                      ? formatClock(s.reps)
                      : `${s.reps} reps`}
                  {s.isPersonalRecord ? ' ★' : ''}
                </button>
              ))}
              <button type="button" className="gt-chip" onClick={() => addSet(ex)}>
                + série
              </button>
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
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="edit-time">
                Heure de début
              </label>
              <input
                id="edit-time"
                type="time"
                className="gt-input"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </div>
            <div className="gt-field">
              <label className="gt-field__label" htmlFor="edit-duration">
                Durée (minutes)
              </label>
              <input
                id="edit-duration"
                type="number"
                className="gt-input"
                value={editDuration || ''}
                onChange={(e) => setEditDuration(Number(e.target.value))}
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

      {editSet && (
        <SetEditSheet
          set={editSet.set}
          trackingType={editSet.trackingType}
          weightUnit={weightUnit}
          weightStep={store.settings.preferences.weightStep}
          onSave={saveSet}
          onDelete={deleteSet}
          onClose={() => setEditSet(null)}
        />
      )}
    </div>
  )
}
