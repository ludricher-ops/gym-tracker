// Génère les icônes PWA (PNG) à partir d'un SVG haltère centré.
// Usage : node scripts/gen-icons.mjs

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// Fond plein (compatible icône « maskable »), haltère lime dans la zone sûre.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1b1916"/>
  <g transform="translate(116,116) scale(11.67)" fill="none" stroke="#c8f000"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6.5 8v8M9 6.5v11M15 6.5v11M17.5 8v8M9 12h6M3 10v4M21 10v4"/>
  </g>
</svg>`

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

const buffer = Buffer.from(svg)
for (const { file, size } of targets) {
  await sharp(buffer).resize(size, size).png().toFile(join(publicDir, file))
  console.log(`généré : public/${file} (${size}×${size})`)
}
