import { useEffect, useState } from 'react'
import { getBlob } from '../db/idb'

/**
 * Charge un blob depuis IndexedDB et renvoie une object URL utilisable dans
 * un <img>. L'URL est révoquée au changement de blobId et au démontage.
 */
export function useObjectUrl(blobId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blobId) {
      setUrl(null)
      return
    }
    let revoked = false
    let created: string | null = null

    getBlob(blobId)
      .then((blob) => {
        if (revoked || !blob) return
        created = URL.createObjectURL(blob)
        setUrl(created)
      })
      .catch(() => setUrl(null))

    return () => {
      revoked = true
      if (created) URL.revokeObjectURL(created)
      setUrl(null)
    }
  }, [blobId])

  return url
}
