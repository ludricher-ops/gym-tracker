// Barre par série — remplie (accent) si validée, vide sinon.
// Usage : <MiniBars total={3} done={2} />
// Usage étendu (barre de progression) : <MiniBars total={12} done={5} grow />

interface MiniBarProps {
  total: number
  done: number
  /** Si true, les barres s'étendent pour occuper toute la largeur du conteneur. */
  grow?: boolean
}

export function MiniBars({ total, done, grow = false }: MiniBarProps) {
  if (total <= 0) return null
  return (
    <div
      className={`gt-minibars${grow ? ' gt-minibars--grow' : ''}`}
      aria-label={`${done}/${total} séries`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`gt-minibar${i < done ? ' gt-minibar--done' : ''}`}
        />
      ))}
    </div>
  )
}
