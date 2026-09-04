// Barre par série — remplie (accent) si validée, vide sinon.
// Usage : <MiniBars total={3} done={2} />

interface MiniBarProps {
  total: number
  done: number
}

export function MiniBars({ total, done }: MiniBarProps) {
  if (total <= 0) return null
  return (
    <div className="gt-minibars" aria-label={`${done}/${total} séries`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`gt-minibar${i < done ? ' gt-minibar--done' : ''}`}
        />
      ))}
    </div>
  )
}
