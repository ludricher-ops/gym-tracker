import type { CSSProperties } from 'react'
import { useState, useEffect } from 'react'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { Icon } from '../ui'

interface MediaImageProps {
  /** Média importé localement (store `blobs`). */
  blobId?: string | null
  /** Média référencé par URL distante. */
  url?: string | null
  alt: string
  /** Hauteur fixe (px). Sinon le ratio remplit la largeur du conteneur. */
  height?: number
  aspectRatio?: number
  radius?: number
}

/**
 * Affiche un média d'exercice — soit un blob local, soit une URL distante.
 * Repli neutre si le média est absent (ex. blob non synchronisé).
 */
export function MediaImage({
  blobId, url, alt, height, aspectRatio, radius = 14,
}: MediaImageProps) {
  const objectUrl = useObjectUrl(blobId)
  const src = url || objectUrl
  const [errored, setErrored] = useState(false)
  useEffect(() => { setErrored(false) }, [src])

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

  if (!src || errored) {
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
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setErrored(true)}
      />
    </div>
  )
}
