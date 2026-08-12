import { useMemo, useState } from 'react'
import type { Goal } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { currentGoalValue, goalProgressRatio, isGoalAchieved } from '../../utils/goalProgress'
import { Card, EmptyState, Icon, Pill, ProgressBar } from '../ui'
import { GoalFormSheet } from '../goals/GoalFormSheet'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function GoalsScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [creating, setCreating] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)

  const goals = useMemo(
    () => [...store.goals].sort((a, b) => b.createdAt - a.createdAt),
    [store.goals],
  )

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Objectifs</h1>
      </div>

      <div className="gt-screen__scroll">
        <Card variant="accent" onClick={() => setCreating(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="target" size={24} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Nouvel objectif</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                1RM, répétitions, séances/semaine, poids…
              </div>
            </div>
          </div>
        </Card>

        {goals.length === 0 ? (
          <EmptyState
            icon="target"
            title="Aucun objectif"
            sub="Fixe-toi une cible pour suivre ta progression dans la durée."
          />
        ) : (
          goals.map((goal) => {
            const current = currentGoalValue(goal, store)
            const ratio = goalProgressRatio(current, goal.targetValue)
            const achieved = isGoalAchieved(current, goal.targetValue)
            return (
              <Card key={goal.id} onClick={() => setEditGoal(goal)}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{goal.title}</span>
                  {achieved ? (
                    <Pill variant="accent">Atteint</Pill>
                  ) : (
                    <span className="t-num" style={{ fontSize: 14 }}>
                      {Math.round(ratio * 100)}%
                    </span>
                  )}
                </div>
                <div style={{ margin: '10px 0 6px' }}>
                  <ProgressBar value={ratio} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  <span>
                    {fmt(current)} / {fmt(goal.targetValue)} {goal.unit}
                  </span>
                  {goal.deadline && (
                    <span>
                      échéance {new Date(`${goal.deadline}T00:00:00`).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {creating && <GoalFormSheet onClose={() => setCreating(false)} />}
      {editGoal && (
        <GoalFormSheet goal={editGoal} onClose={() => setEditGoal(null)} />
      )}
    </div>
  )
}
