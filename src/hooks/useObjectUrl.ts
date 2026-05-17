import { useEffect, useState } from 'react'
import { getBlob } from '../db/idb'

/**
 * Charge un blob depuis IndexedDB et renvoie sa data URL utilisable dans
 * un <img>. Gère l'ancien format Blob et le nouveau format base64.
 */
export function useObjectUrl(blobId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blobId) {
      setUrl(null)
      return
    }
    let cancelled = false
    getBlob(blobId)
      .then((dataUrl) => { if (!cancelled) setUrl(dataUrl ?? null) })
      .catch(() => setUrl(null))
    return () => { cancelled = true }
  }, [blobId])

  return url
}
