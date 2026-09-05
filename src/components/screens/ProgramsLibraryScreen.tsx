import { useCallback, useMemo, useState } from 'react'
import type { ProgramGoal } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { GOAL_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { Card, EmptyState, Icon, Pill, Row } from '../ui'

export function ProgramsLibraryScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [query, setQuery] = useState('')
  const [goal, setGoal] = useState<ProgramGoal | 'all'>('all')

  const match = useCallback(
    (name: string, g: ProgramGoal) => {
      const q = query.trim().toLowerCase()
      if (q && !name.toLowerCase().includes(q)) return false
      if (goal !== 'all' && g !== goal) return false
      return true
    },
    [query, goal],
  )

  const mine = useMemo(
    () => store.programs.filter((p) => !p.isTemplate && match(p.name, p.goal)),
    [store.programs, match],
  )
  const templates = useMemo(
    () =>
      store.programs
        .filter((p) => p.isTemplate && match(p.name, p.goal))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [store.programs, match],
  )

  const renderRow = (id: string) => {
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

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Programmes</h1>
      </div>

      <div className="gt-screen__scroll">
        {/* Générer automatiquement */}
        <Card variant="accent" onClick={() => nav.navigate('programGenerator')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
                Générer mon programme
              </div>
              <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.8 }}>
                7 questions — programme prêt en 1 min
              </div>
            </div>
          </div>
        </Card>

        {/* Créer manuellement */}
        <button
          onClick={() => nav.navigate('programBuilder')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--fg)',
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <Icon name="plus" size={20} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>
              Créer manuellement
            </div>
            <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>
              Workflow guidé en 4 étapes
            </div>
          </div>
        </button>

        <input
          className="gt-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un programme…"
          aria-label="Rechercher"
        />

        <div className="gt-chips">
          <button
            type="button"
            className={`gt-chip ${goal === 'all' ? 'gt-chip--active' : ''}`}
            onClick={() => setGoal('all')}
          >
            Tous
          </button>
          {(Object.keys(GOAL_LABEL) as ProgramGoal[]).map((g) => (
            <button
              key={g}
              type="button"
              className={`gt-chip ${goal === g ? 'gt-chip--active' : ''}`}
              onClick={() => setGoal(g)}
            >
              {GOAL_LABEL[g]}
            </button>
          ))}
        </div>

        <p className="t-eyebrow">Mes programmes</p>
        {mine.length === 0 ? (
          <p className="t-caption">Aucun programme personnel pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mine.map((p) => renderRow(p.id))}
          </div>
        )}

        <p className="t-eyebrow" style={{ marginTop: 6 }}>
          Templates
        </p>
        {templates.length === 0 ? (
          <EmptyState icon="search" title="Aucun template" sub="Aucun résultat pour ce filtre." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((p) => renderRow(p.id))}
          </div>
        )}
      </div>
    </div>
  )
}
