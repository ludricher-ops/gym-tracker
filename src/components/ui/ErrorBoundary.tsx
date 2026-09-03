import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

/**
 * Error Boundary global — attrape tout crash de rendu et affiche un message
 * lisible + le stack trace au lieu d'une page blanche.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Affiche dans la console pour que l'utilisateur puisse le copier-coller.
    console.error('[ErrorBoundary] Crash non catchée :', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset)
      return (
        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 18 }}>💥 Quelque chose a planté</p>
          <p style={{ fontSize: 13, color: 'var(--dim)' }}>
            Copie ce message et envoie-le pour aider à déboguer :
          </p>
          <pre
            style={{
              background: 'var(--surface2)',
              padding: 12,
              borderRadius: 8,
              fontSize: 11,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
