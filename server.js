import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { registerSyncRoutes } from './src/server/syncRoutes.js'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const IS_PROD = process.env.NODE_ENV === 'production'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-gymtracker-change-in-prod'
const COOKIE_NAME = 'gt_session'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  path: '/',
}

// ── Base de données ──────────────────────────────────────────────────────────

let pool = null
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PROD ? { rejectUnauthorized: false } : false,
  })

  // Table utilisateurs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Table sync (nouvelle installation : avec user_id d'emblée)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_records (
      user_id    INTEGER NOT NULL DEFAULT 1,
      store      TEXT    NOT NULL,
      id         TEXT    NOT NULL,
      data       JSONB   NOT NULL,
      updated_at BIGINT  NOT NULL,
      server_seq BIGSERIAL,
      PRIMARY KEY (user_id, store, id)
    )
  `)

  // Migration existante : ajoute user_id si la table existait sans cette colonne
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sync_records' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE sync_records ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE sync_records DROP CONSTRAINT sync_records_pkey;
        ALTER TABLE sync_records ADD CONSTRAINT sync_records_pkey
          PRIMARY KEY (user_id, store, id);
      END IF;
    END $$
  `)

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_sync_seq ON sync_records (user_id, server_seq)`,
  )

  // Crée le compte initial si INITIAL_USER_EMAIL + INITIAL_USER_PASSWORD sont définis
  // (Railway : à n'utiliser qu'au premier déploiement, puis supprimer les variables)
  const initEmail = process.env.INITIAL_USER_EMAIL
  const initPassword = process.env.INITIAL_USER_PASSWORD
  if (initEmail && initPassword) {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [initEmail])
    if (rows.length === 0) {
      const hash = await bcrypt.hash(initPassword, 10)
      await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [initEmail, hash],
      )
      console.log(`Compte initial créé : ${initEmail}`)
    }
  }
} else {
  console.warn('DATABASE_URL absente — synchronisation et auth désactivées.')
}

// ── App Express ──────────────────────────────────────────────────────────────

const app = express()
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use('/api/sync/push', express.json({ limit: '20mb' }))

// ── Middleware JWT ───────────────────────────────────────────────────────────

/** Lit le cookie JWT et attache req.userId (null si absent/invalide). */
function extractUser(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) { req.userId = null; return next() }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    req.userId = null
    next()
  }
}

/** Rejette les requêtes sans session valide. */
function requireUser(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Non authentifié' })
  next()
}

// ── Routes santé ─────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  if (!pool) return res.json({ ok: true, db: false })
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch (err) {
    console.error('health:', err.message)
    res.status(500).json({ ok: false, error: 'Database error' })
  }
})

// ── Routes auth ───────────────────────────────────────────────────────────────

app.get('/auth/me', extractUser, (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Non authentifié' })
  // On renvoie juste l'id — on ne stocke pas d'email en mémoire serveur
  pool.query('SELECT id, email FROM users WHERE id = $1', [req.userId])
    .then(({ rows }) => {
      if (!rows[0]) return res.status(401).json({ error: 'Utilisateur introuvable' })
      res.json({ id: rows[0].id, email: rows[0].email })
    })
    .catch((err) => {
      console.error('auth/me:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    })
})

app.post('/auth/login', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Base de données indisponible' })
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Email et mot de passe requis' })

  try {
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS)
    res.json({ id: user.id, email: email.toLowerCase().trim() })
  } catch (err) {
    console.error('auth/login:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.post('/auth/register', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Base de données indisponible' })
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Email et mot de passe requis' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })

  try {
    const emailClean = email.toLowerCase().trim()
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [emailClean, hash],
    )
    const userId = rows[0].id
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS)
    res.status(201).json({ id: userId, email: emailClean })

    // Seed best-effort : copie les exercices de l'admin vers le nouvel utilisateur
    // (updated_at=1 → remplaçable si l'utilisateur modifie sa propre copie).
    // Les blobs (images) ne sont PAS copiés ici — ils sont servis via le curseur
    // partagé (sinceShared) dans le pull, sans duplication per-user.
    // Non attendu — la réponse est déjà envoyée.
    const ADMIN_ID = 1
    if (pool && userId !== ADMIN_ID) {
      // On conserve le vrai updatedAt de l'admin pour que le LWW client
      // puisse écraser le seed local (updatedAt=1) dès le premier pull.
      pool.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         SELECT $1, store, id,
                data || '{"dirty":true}'::jsonb,
                updated_at
           FROM sync_records
          WHERE user_id = $2
            AND store = 'exercises'
            AND (data->>'deleted')::boolean IS NOT TRUE
         ON CONFLICT (user_id, store, id) DO NOTHING`,
        [userId, ADMIN_ID],
      ).then(r => {
        if (r.rowCount > 0)
          console.log(`[register] ${r.rowCount} exercice(s) seedé(s) → user ${userId}`)
      }).catch(err => console.error('[register] seed exercises:', err.message))
    }
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' })
    console.error('auth/register:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.post('/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

// ── Sync (protégé) ────────────────────────────────────────────────────────────

registerSyncRoutes(app, pool, extractUser, requireUser)

// ── Bundle React + SPA ────────────────────────────────────────────────────────

app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Gym Track server on port ${PORT}`))
