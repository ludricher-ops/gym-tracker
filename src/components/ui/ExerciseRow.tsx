// Ligne d'exercice dans la vue d'ensemble de session :
// poignée de glissement (≥ 44px) · nom · mini-barres · compteur.
// Usage : <ExerciseRow name="Tractions" setsTotal={3} setsDone={2} />

import type { HTMLAttributes } from 'react'
import { Icon } from './Icon'
import { MiniBars } from './MiniBars'

interface ExerciseRowProps {
  name: string
  setsTotal: number
  setsDone: number
  /** Props à spreader sur la poignée pour les libs de DnD (ex. dnd-kit) */
  dragHandleProps?: HTMLAttributes<HTMLDivElement>
}

export function ExerciseRow({
  name,
  setsTotal,
  setsDone,
  dragHandleProps,
}: ExerciseRowProps) {
  return (
    <div className="gt-exrow">
      <div className="gt-exrow__handle" {...dragHandleProps}>
        <Icon name="grip" size={18} />
      </div>
      <span className="gt-exrow__name">{name}</span>
      <MiniBars total={setsTotal} done={setsDone} />
      <span className="gt-exrow__count t-num">
        {setsDone}/{setsTotal}
      </span>
    </div>
  )
}
