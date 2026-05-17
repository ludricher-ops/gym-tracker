// Traitement des fichiers médias importés pour un exercice. Les photos sont
// redimensionnées + compressées en JPEG via Canvas ; les GIF sont conservés
// tels quels (animation préservée). Aucune dépendance externe.

export interface ProcessedMedia {
  blob: Blob
  type: 'photo' | 'gif'
  mime: string
  sizeBytes: number
  aspectRatio: number
}

const MAX_DIM = 720
const MAX_BYTES = 6 * 1024 * 1024

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Fichier image illisible.'))
    img.src = src
  })
}

/** Traite un fichier image/GIF en média prêt à stocker. Lève en cas d'erreur. */
export async function processMediaFile(file: File): Promise<ProcessedMedia> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Format non pris en charge — choisis une image ou un GIF.')
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const aspectRatio = img.naturalWidth / img.naturalHeight || 1

    // GIF : conservé tel quel pour garder l'animation.
    if (file.type === 'image/gif') {
      if (file.size > MAX_BYTES) {
        throw new Error('GIF trop lourd (max 6 Mo).')
      }
      return {
        blob: file,
        type: 'gif',
        mime: 'image/gif',
        sizeBytes: file.size,
        aspectRatio,
      }
    }

    // Photo : redimensionnement + compression JPEG.
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible.')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', 0.82),
    )
    if (!blob) throw new Error('Échec de la compression de l’image.')
    if (blob.size > MAX_BYTES) {
      throw new Error('Image trop lourde même après compression.')
    }
    return {
      blob,
      type: 'photo',
      mime: 'image/jpeg',
      sizeBytes: blob.size,
      aspectRatio,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
