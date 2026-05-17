import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'
import { registerSyncRoutes } from './src/server/syncRoutes.js'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const IS_PROD = process.env.NODE_ENV === 'production'

// La base est optionnelle : en local le serveur tourne sans DATABASE_URL et
// la synchro est simplement désactivée (l'app reste local-first sur IndexedDB).
let pool = null
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PROD ? { rejectUnauthorized: false } : false,
  })

  // DDL — table générique de synchro (cf. syncRoutes.js).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_records (
      store      TEXT   NOT NULL,
      id         TEXT   NOT NULL,
      data       JSONB  NOT NULL,
      updated_at BIGINT NOT NULL,
      server_seq BIGSERIAL,
      PRIMARY KEY (store, id)
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_sync_seq ON sync_records (server_seq)`,
  )
} else {
  console.warn('DATABASE_URL absente — synchronisation désactivée.')
}

const app = express()
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', async (_req, res) => {
  if (!pool) return res.json({ ok: true, db: false })
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

registerSyncRoutes(app, pool)

// Bundle React statique + repli SPA.
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Gym Track server on port ${PORT}`))
