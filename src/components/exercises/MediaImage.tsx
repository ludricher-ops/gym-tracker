import type { CSSProperties } from 'react'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { Icon } from '../ui'

interface MediaImageProps {
  blobId: string | null | undefined
  alt: string
  /** Hauteur fixe (px). Sinon le ratio remplit la largeur du conteneur. */
  height?: number
  aspectRatio?: number
  radius?: number
}

/**
 * Affiche un média d'exercice depuis le store `blobs`. Sur un autre appareil
 * où le blob n'a pas été synchronisé, affiche un repli neutre.
 */
export function MediaImage({ blobId, alt, height, aspectRatio, radius = 14 }: MediaImageProps) {
  const url = useObjectUrl(blobId)

  const box: CSSProperties = {
    width: '100%',
    height,
    aspectRatio: height ? undefined : aspectRatio ?? 4 / 3,
    borderRadius: radius,
    overflow: 'hidden',
    background: 'var(--surface2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  }

  if (!url) {
    return (
      <div style={box} aria-label={alt}>
        <span style={{ color: 'var(--dim)' }}>
          <Icon name="camera" size={26} />
        </span>
      </div>
    )
  }
  return (
    <div style={box}>
      <img
        src={url}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
