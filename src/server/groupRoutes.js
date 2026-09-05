// Routes Mode Compétition — groupes, classement XP, saisons mensuelles.
// XP calculé à la volée depuis sync_records (sets + sessions).

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I

function randomCode() {
  let code = ''
  for (let i = 0; i < 6; i++)
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

async function generateUniqueCode(pool) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode()
    const { rows } = await pool.query('SELECT 1 FROM groups WHERE code = $1', [code])
    if (rows.length === 0) return code
  }
  throw new Error('Impossible de générer un code unique')
}

/**
 * Calcule l'XP d'un utilisateur sur une plage de temps [sinceMs, untilMs].
 *
 * Formule RPG :
 *   Série de travail complétée :
 *     - Avec poids : GREATEST(1, floor(kg × reps / 10))
 *       + bonus lourd si kg ≥ 80 : floor(kg × reps / 20)
 *     - Poids du corps (kg = 0) : reps × 3
 *     - Bonus PR : +150 XP
 *   Session terminée :
 *     - 100 XP plat
 *     - Bonus durée : +75 si > 45 min, +150 si > 60 min
 */
async function computeXp(pool, userId, sinceMs, untilMs) {
  const until = untilMs ?? Date.now()
  const [setsRes, sessRes] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(
         CASE
           WHEN (data->>'isWarmup')::boolean = true THEN 0
           WHEN data->>'completedAt' IS NULL          THEN 0
           ELSE
             CASE
               WHEN (data->>'weightKg')::float > 0 THEN
                 GREATEST(1, floor((data->>'weightKg')::float * (data->>'reps')::int / 10))
                 + CASE WHEN (data->>'weightKg')::float >= 80
                     THEN floor((data->>'weightKg')::float * (data->>'reps')::int / 20)
                     ELSE 0 END
               ELSE (data->>'reps')::int * 3
             END
             + CASE WHEN (data->>'isPersonalRecord')::boolean = true THEN 150 ELSE 0 END
         END
       ), 0)::int AS xp
       FROM sync_records
       WHERE user_id = $1
         AND store = 'sets'
         AND data->>'completedAt' IS NOT NULL
         AND (data->>'completedAt')::bigint BETWEEN $2 AND $3`,
      [userId, sinceMs, until],
    ),
    pool.query(
      `SELECT
         COALESCE(COUNT(*), 0)::int AS cnt,
         COALESCE(SUM(
           CASE
             WHEN (data->>'endedAt')::bigint - (data->>'startedAt')::bigint > 3600000 THEN 150
             WHEN (data->>'endedAt')::bigint - (data->>'startedAt')::bigint > 2700000 THEN 75
             ELSE 0
           END
         ), 0)::int AS duration_bonus
       FROM sync_records
       WHERE user_id = $1
         AND store = 'sessions'
         AND data->>'endedAt' IS NOT NULL
         AND (data->>'endedAt')::bigint BETWEEN $2 AND $3`,
      [userId, sinceMs, until],
    ),
  ])

  const setsXp  = setsRes.rows[0]?.xp ?? 0
  const sessXp  = (sessRes.rows[0]?.cnt ?? 0) * 100
  const durBonus = sessRes.rows[0]?.duration_bonus ?? 0
  return setsXp + sessXp + durBonus
}

/** Bornes UTC d'un mois donné au format 'YYYY-MM'. */
function monthBounds(period) {
  const [y, m] = period.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1)).getTime()
  const end   = new Date(Date.UTC(y, m, 1)).getTime() - 1
  return { start, end }
}

/** Liste des mois [YYYY-MM] entre deux timestamps. */
function monthsBetween(fromMs, toMs) {
  const months = []
  const d = new Date(fromMs)
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  const end = new Date(toMs)
  while (d <= end) {
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return months.reverse() // plus récent en premier
}

/** XP de la semaine glissante (7 derniers jours). */
async function computeWeekXp(pool, userId) {
  return computeXp(pool, userId, Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now())
}

export function registerGroupRoutes(app, pool, requireUser) {
  if (!pool) return

  // ── Mes groupes ───────────────────────────────────────────────────────────
  app.get('/api/groups/mine', requireUser, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT g.id, g.name, g.code, gm.display_name, g.created_at
           FROM groups g
           JOIN group_members gm ON gm.group_id = g.id
          WHERE gm.user_id = $1
          ORDER BY gm.joined_at`,
        [req.userId],
      )
      res.json({ groups: rows })
    } catch (err) {
      console.error('groups/mine:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Créer un groupe ───────────────────────────────────────────────────────
  app.post('/api/groups/create', requireUser, async (req, res) => {
    const { name, displayName } = req.body ?? {}
    if (!name?.trim() || !displayName?.trim())
      return res.status(400).json({ error: 'Nom du groupe et pseudo requis' })
    if (name.trim().length > 40)
      return res.status(400).json({ error: 'Nom trop long (max 40 car.)' })
    if (displayName.trim().length > 20)
      return res.status(400).json({ error: 'Pseudo trop long (max 20 car.)' })
    try {
      const code = await generateUniqueCode(pool)
      const { rows } = await pool.query(
        `INSERT INTO groups (code, name, created_by) VALUES ($1, $2, $3) RETURNING id, code, name`,
        [code, name.trim(), req.userId],
      )
      const group = rows[0]
      await pool.query(
        `INSERT INTO group_members (group_id, user_id, display_name) VALUES ($1, $2, $3)`,
        [group.id, req.userId, displayName.trim()],
      )
      res.json({ group, displayName: displayName.trim() })
    } catch (err) {
      console.error('groups/create:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Rejoindre un groupe ───────────────────────────────────────────────────
  app.post('/api/groups/join', requireUser, async (req, res) => {
    const { code, displayName } = req.body ?? {}
    if (!code?.trim() || !displayName?.trim())
      return res.status(400).json({ error: 'Code et pseudo requis' })
    if (displayName.trim().length > 20)
      return res.status(400).json({ error: 'Pseudo trop long (max 20 car.)' })
    try {
      const { rows } = await pool.query(
        `SELECT id, name, code FROM groups WHERE code = $1`,
        [code.trim().toUpperCase()],
      )
      if (!rows[0]) return res.status(404).json({ error: 'Groupe introuvable' })
      const group = rows[0]
      const { rows: existing } = await pool.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [group.id, req.userId],
      )
      if (existing[0]) return res.status(409).json({ error: 'Déjà membre de ce groupe' })
      await pool.query(
        `INSERT INTO group_members (group_id, user_id, display_name) VALUES ($1, $2, $3)`,
        [group.id, req.userId, displayName.trim()],
      )
      res.json({ group, displayName: displayName.trim() })
    } catch (err) {
      console.error('groups/join:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Quitter un groupe ─────────────────────────────────────────────────────
  app.delete('/api/groups/:groupId/leave', requireUser, async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10)
    if (isNaN(groupId)) return res.status(400).json({ error: 'ID invalide' })
    try {
      await pool.query(
        `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.userId],
      )
      const { rows } = await pool.query(
        `SELECT COUNT(*) AS cnt FROM group_members WHERE group_id = $1`,
        [groupId],
      )
      if (parseInt(rows[0].cnt, 10) === 0)
        await pool.query(`DELETE FROM groups WHERE id = $1`, [groupId])
      res.json({ ok: true })
    } catch (err) {
      console.error('groups/leave:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Saisons disponibles ───────────────────────────────────────────────────
  // GET /api/groups/:code/seasons
  // Retourne la liste des mois YYYY-MM disponibles (création du groupe → maintenant).
  app.get('/api/groups/:code/seasons', requireUser, async (req, res) => {
    const code = req.params.code.toUpperCase()
    try {
      const { rows: groupRows } = await pool.query(
        `SELECT id, created_at FROM groups WHERE code = $1`,
        [code],
      )
      if (!groupRows[0]) return res.status(404).json({ error: 'Groupe introuvable' })
      const group = groupRows[0]

      const { rows: memberCheck } = await pool.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [group.id, req.userId],
      )
      if (!memberCheck[0]) return res.status(403).json({ error: 'Non membre' })

      const months = monthsBetween(new Date(group.created_at).getTime(), Date.now())
      res.json({ seasons: months })
    } catch (err) {
      console.error('groups/seasons:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Classement ────────────────────────────────────────────────────────────
  // GET /api/groups/:code/leaderboard?period=YYYY-MM (optionnel, défaut = mois courant)
  // GET /api/groups/:code/leaderboard?period=week (semaine glissante)
  app.get('/api/groups/:code/leaderboard', requireUser, async (req, res) => {
    const code = req.params.code.toUpperCase()
    const period = typeof req.query.period === 'string' ? req.query.period : null

    try {
      const { rows: groupRows } = await pool.query(
        `SELECT id, name, code, created_by FROM groups WHERE code = $1`,
        [code],
      )
      if (!groupRows[0]) return res.status(404).json({ error: 'Groupe introuvable' })
      const group = groupRows[0]

      const { rows: memberCheck } = await pool.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [group.id, req.userId],
      )
      if (!memberCheck[0]) return res.status(403).json({ error: 'Non membre' })

      const { rows: members } = await pool.query(
        `SELECT user_id, display_name FROM group_members WHERE group_id = $1 ORDER BY joined_at`,
        [group.id],
      )

      // Plage de temps
      let sinceMs, untilMs
      if (period === 'week') {
        sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000
        untilMs = Date.now()
      } else {
        const now = new Date()
        const p = period ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
        const bounds = monthBounds(p)
        sinceMs = bounds.start
        untilMs = bounds.end
      }

      const entries = await Promise.all(
        members.map(async (m) => {
          const [periodXp, totalXp] = await Promise.all([
            computeXp(pool, m.user_id, sinceMs, untilMs),
            computeXp(pool, m.user_id, 0, Date.now()),
          ])
          return {
            userId: m.user_id,
            displayName: m.display_name,
            isMe: m.user_id === req.userId,
            periodXp,
            totalXp,
          }
        }),
      )

      entries.sort((a, b) => b.periodXp - a.periodXp || b.totalXp - a.totalXp)

      res.json({
        group:   { id: group.id, name: group.name, code: group.code },
        period:  period ?? null,
        members: entries,
      })
    } catch (err) {
      console.error('groups/leaderboard:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })
}
