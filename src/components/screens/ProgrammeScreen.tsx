import { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { GOAL_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { Card, EmptyState, Icon, Pill, Row } from '../ui'
import type { WorkoutTemplate, WorkoutType } from '../../types'

type View = 'hub' | 'programmes' | 'seances'

const WORKOUT_FILTER: { key: WorkoutType | 'all'; label: string }[] = [
  { key: 'all',      label: 'Tous'      },
  { key: 'push',     label: 'Push'      },
  { key: 'pull',     label: 'Pull'      },
  { key: 'legs',     label: 'Legs'      },
  { key: 'upper',    label: 'Upper'     },
  { key: 'lower',    label: 'Lower'     },
  { key: 'fullbody', label: 'Full body' },
]

export function ProgrammeScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [view, setView] = useState<View>('hub')
  const [seancesTypeFilter, setSeancesTypeFilter] = useState<WorkoutType | 'all'>('all')

  // ── Action sheet état ────────────────────────────────────────────────────────
  const [selectedWt, setSelectedWt] = useState<WorkoutTemplate | null>(null)
  const [sheetMode, setSheetMode] = useState<'menu' | 'rename' | 'confirm-delete'>('menu')
  const [renameValue, setRenameValue] = useState('')
  const [saving, setSaving] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sheetMode === 'rename') {
      setTimeout(() => renameInputRef.current?.focus(), 50)
    }
  }, [sheetMode])

  const openSheet = (wt: WorkoutTemplate) => {
    setSelectedWt(wt)
    setRenameValue(wt.name)
    setSheetMode('menu')
  }
  const closeSheet = () => { setSelectedWt(null) }

  const handleRename = async () => {
    if (!selectedWt || !renameValue.trim()) return
    setSaving(true)
    try {
      await store.workoutTemplate.save({ ...selectedWt, name: renameValue.trim() })
      closeSheet()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedWt) return
    setSaving(true)
    try {
      // Supprimer les exercices liés d'abord
      const linked = store.workoutExerciseTemplates.filter(
        (et) => et.workoutTemplateId === selectedWt.id
      )
      for (const et of linked) {
        await store.workoutExerciseTemplate.remove(et.id)
      }
      await store.workoutTemplate.remove(selectedWt.id)
      closeSheet()
    } finally {
      setSaving(false)
    }
  }

  // ── Données ──────────────────────────────────────────────────────────────────

  const mine = useMemo(
    () => store.programs.filter((p) => !p.isTemplate && p.name !== '__libre__'),
    [store.programs],
  )
  const templates = useMemo(
    () =>
      store.programs
        .filter((p) => p.isTemplate)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [store.programs],
  )

  const allWorkouts = useMemo(
    () => store.workoutTemplates.filter((w) => !w.deleted),
    [store.workoutTemplates],
  )

  const { filteredPersoWorkouts, filteredTemplateWorkouts } = useMemo(() => {
    const visible = seancesTypeFilter === 'all'
      ? allWorkouts
      : allWorkouts.filter((w) => w.type === seancesTypeFilter)
    const perso: typeof visible = []
    const tmpl: typeof visible = []
    for (const wt of visible) {
      const prog = store.programs.find((p) => p.id === wt.programId)
      if (prog?.isTemplate) tmpl.push(wt)
      else perso.push(wt)
    }
    return { filteredPersoWorkouts: perso, filteredTemplateWorkouts: tmpl }
  }, [allWorkouts, seancesTypeFilter, store.programs])

  // ── Rendu ────────────────────────────────────────────────────────────────────

  const renderProgramRow = (id: string) => {
    const p = store.programs.find((x) => x.id === id)
    if (!p) return null
    const s = programSummary(p, store)
    return (
      <Row
        key={p.id}
        label={p.name}
        sub={`${GOAL_LABEL[p.goal]} · ${s.trainingDays} j/sem · ${s.exerciseCount} exos`}
        value={p.isActive ? <Pill variant="accent">ACTIF</Pill> : undefined}
        chevron
        onClick={() => nav.navigate('programDetail', { id: p.id })}
      />
    )
  }

  const renderSeanceRow = (wt: WorkoutTemplate) => (
    <div
      key={wt.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Icône / emoji */}
      <div style={{
        width: 42, minWidth: 42, display: 'flex', alignItems: 'center',
        justifyContent: 'center', paddingLeft: 14,
      }}>
        {wt.icon
          ? <span style={{ fontSize: 20, lineHeight: 1 }}>{wt.icon}</span>
          : <Icon name="dumbbell" size={18} strokeWidth={1.8} />
        }
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 10px' }}>
        <div style={{
          fontWeight: 600, fontSize: 'var(--fs-body)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {wt.name}
        </div>
        {wt.type !== 'custom' && (
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-muted)', marginTop: 2 }}>
            {wt.type.charAt(0).toUpperCase() + wt.type.slice(1)}
          </div>
        )}
      </div>

      {/* Bouton ⋯ */}
      <button
        onClick={() => openSheet(wt)}
        aria-label="Options"
        style={{
          background: 'none', border: 'none',
          color: 'var(--fg-muted)', cursor: 'pointer',
          padding: '12px 14px', display: 'flex', alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, letterSpacing: 1 }}>⋯</span>
      </button>
    </div>
  )

  const title =
    view === 'hub' ? 'Programme'
    : view === 'programmes' ? 'Mes programmes'
    : 'Mes séances'

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        {view !== 'hub' && (
          <button
            className="gt-iconbtn"
            onClick={() => setView('hub')}
            aria-label="Retour"
          >
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
        )}
        <h1 className="gt-topbar__title">{title}</h1>
      </div>

      <div className="gt-screen__scroll">

        {/* ── Hub : 3 boutons + templates ─────────────────────────────── */}
        {view === 'hub' && (
          <>
            <Row
              icon="list"
              label="Mes programmes"
              chevron
              onClick={() => setView('programmes')}
            />
            <Row
              icon="dumbbell"
              label="Mes séances"
              chevron
              onClick={() => setView('seances')}
            />
            <Row
              icon="target"
              label="Mes exercices"
              chevron
              onClick={() => nav.navigate('myExercises')}
            />

            {templates.length > 0 && (
              <>
                <p className="t-eyebrow" style={{ marginTop: 'var(--gap-section, 20px)' }}>
                  Templates disponibles
                </p>
                {templates.map((p) => renderProgramRow(p.id))}
              </>
            )}
          </>
        )}

        {/* ── Mes programmes ──────────────────────────────────────────── */}
        {view === 'programmes' && (
          <>
            <Card variant="accent" onClick={() => nav.navigate('programGenerator')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
                    Générer mon programme
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.8 }}>
                    8 questions — programme prêt en 1 min
                  </div>
                </div>
              </div>
            </Card>

            <button
              onClick={() => nav.navigate('programBuilder')}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '12px 16px',
                color: 'var(--fg)',
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              + Créer manuellement
            </button>

            {mine.length === 0 ? (
              <EmptyState message="Aucun programme pour l'instant" />
            ) : (
              <>
                <p className="t-eyebrow">Mes programmes</p>
                {mine.map((p) => renderProgramRow(p.id))}
              </>
            )}
          </>
        )}

        {/* ── Mes séances ─────────────────────────────────────────────── */}
        {view === 'seances' && (
          <>
            {/* Générer ma séance */}
            <Card variant="accent" onClick={() => nav.navigate('freeWorkout', { saveAsTemplate: 'true' })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🧠</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
                    Générer ma séance
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.8 }}>
                    Wizard IA — séance prête en 1 min
                  </div>
                </div>
              </div>
            </Card>

            {/* Créer manuellement */}
            <button
              onClick={() => nav.navigate('programBuilder')}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '12px 16px',
                color: 'var(--fg)',
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              + Créer manuellement
            </button>

            {/* Filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {WORKOUT_FILTER.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className="gt-chip"
                  onClick={() => setSeancesTypeFilter(key)}
                  style={{
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: seancesTypeFilter === key ? 'var(--accent)' : undefined,
                    color: seancesTypeFilter === key ? 'var(--accent-ink)' : undefined,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mes séances (perso) */}
            {filteredPersoWorkouts.length > 0 && (
              <>
                <p className="t-eyebrow">MES SÉANCES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
                  {filteredPersoWorkouts.map(renderSeanceRow)}
                </div>
              </>
            )}

            {/* Séances templates */}
            {filteredTemplateWorkouts.length > 0 && (
              <>
                <p className="t-eyebrow">SÉANCES TEMPLATES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
                  {filteredTemplateWorkouts.map(renderSeanceRow)}
                </div>
              </>
            )}

            {filteredPersoWorkouts.length === 0 && filteredTemplateWorkouts.length === 0 && (
              allWorkouts.length === 0
                ? <EmptyState message="Aucune séance pour l'instant" />
                : <p className="t-caption" style={{ padding: '16px 0', color: 'var(--muted)', textAlign: 'center' }}>Aucune séance dans cette catégorie</p>
            )}
          </>
        )}

      </div>

      {/* ── Action sheet ────────────────────────────────────────────────────── */}
      {selectedWt && (
        <>
          {/* Overlay */}
          <div
            onClick={closeSheet}
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--overlay-dim)',
              zIndex: 200,
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
            padding: '8px 0 env(safe-area-inset-bottom, 16px)',
            zIndex: 201,
            boxShadow: '0 -4px 24px rgba(0,0,0,.18)',
          }}>
            {/* Poignée */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'var(--border)',
              margin: '8px auto 16px',
            }} />

            {/* Titre de la séance */}
            <div style={{
              padding: '0 20px 12px',
              fontWeight: 700, fontSize: 'var(--fs-body)',
              borderBottom: '1px solid var(--border)',
              marginBottom: 8,
              color: 'var(--fg)',
            }}>
              {selectedWt.name}
            </div>

            {/* ── Menu principal ───────────────────────────────────────── */}
            {sheetMode === 'menu' && (
              <>
                <button
                  onClick={() => setSheetMode('rename')}
                  style={sheetBtnStyle}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>✏️</span>
                  Renommer
                </button>
                <button
                  onClick={() => setSheetMode('confirm-delete')}
                  style={{ ...sheetBtnStyle, color: 'var(--danger, #e53e3e)' }}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🗑</span>
                  Supprimer
                </button>
                <button onClick={closeSheet} style={{ ...sheetBtnStyle, color: 'var(--fg-muted)' }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>✕</span>
                  Annuler
                </button>
              </>
            )}

            {/* ── Renommer ────────────────────────────────────────────── */}
            {sheetMode === 'rename' && (
              <div style={{ padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
                  placeholder="Nom de la séance"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--surface2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    color: 'var(--fg)', fontSize: 'var(--fs-body)',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSheetMode('menu')}
                    style={{
                      flex: 1, padding: '11px 0',
                      background: 'var(--surface2)',
                      border: 'none', borderRadius: 'var(--radius-card)',
                      color: 'var(--fg-muted)', fontWeight: 600,
                      fontSize: 'var(--fs-body)', cursor: 'pointer',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleRename}
                    disabled={saving || !renameValue.trim()}
                    style={{
                      flex: 2, padding: '11px 0',
                      background: 'var(--accent)',
                      border: 'none', borderRadius: 'var(--radius-card)',
                      color: '#fff', fontWeight: 700,
                      fontSize: 'var(--fs-body)', cursor: 'pointer',
                      opacity: (saving || !renameValue.trim()) ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Enregistrement…' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Confirmation suppression ─────────────────────────────── */}
            {sheetMode === 'confirm-delete' && (
              <div style={{ padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--fg-muted)', margin: 0 }}>
                  Supprimer définitivement <strong style={{ color: 'var(--fg)' }}>{selectedWt.name}</strong> ?
                  Cette action est irréversible.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSheetMode('menu')}
                    style={{
                      flex: 1, padding: '11px 0',
                      background: 'var(--surface2)',
                      border: 'none', borderRadius: 'var(--radius-card)',
                      color: 'var(--fg-muted)', fontWeight: 600,
                      fontSize: 'var(--fs-body)', cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    style={{
                      flex: 2, padding: '11px 0',
                      background: 'var(--danger, #e53e3e)',
                      border: 'none', borderRadius: 'var(--radius-card)',
                      color: '#fff', fontWeight: 700,
                      fontSize: 'var(--fs-body)', cursor: 'pointer',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const sheetBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  width: '100%', background: 'none', border: 'none',
  padding: '14px 20px',
  fontSize: 'var(--fs-body)', fontWeight: 500,
  color: 'var(--fg)', cursor: 'pointer',
  textAlign: 'left',
}
