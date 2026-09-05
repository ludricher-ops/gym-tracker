// Routes Mode Compétition — groupes et classement XP.
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
 * XP depuis sync_records pour un user, à partir de `sinceMs` (0 = all-time).
 * Formule :
 *   - set de travail complété : floor(weightKg × reps / 10) ou reps×2 si BW
 *   - bonus PR : +100 XP par set
 *   - session terminée : +50 XP
 */
async function computeXp(pool, userId, sinceMs) {
  const [setsRes, sessRes] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(
         CASE
           WHEN (data->>'isWarmup')::boolean = true THEN 0
           WHEN data->>'completedAt' IS NULL        THEN 0
           ELSE
             CASE WHEN (data->>'weightKg')::float > 0
               THEN floor((data->>'weightKg')::float * (data->>'reps')::int / 10)
               ELSE (data->>'reps')::int * 2
             END
             + CASE WHEN (data->>'isPersonalRecord')::boolean = true THEN 100 ELSE 0 END
         END
       ), 0)::int AS xp
       FROM sync_records
       WHERE user_id = $1
         AND store = 'sets'
         AND data->>'completedAt' IS NOT NULL
         AND (data->>'completedAt')::bigint > $2`,
      [userId, sinceMs],
    ),
    pool.query(
      `SELECT COALESCE(COUNT(*), 0)::int AS cnt
       FROM sync_records
       WHERE user_id = $1
         AND store = 'sessions'
         AND data->>'endedAt' IS NOT NULL
         AND (data->>'endedAt')::bigint > $2`,
      [userId, sinceMs],
    ),
  ])
  return (setsRes.rows[0]?.xp ?? 0) + (sessRes.rows[0]?.cnt ?? 0) * 50
}

export function registerGroupRoutes(app, pool, requireUser) {
  if (!pool) return // pas de DB → routes désactivées silencieusement

  // ── Récupérer mes groupes ─────────────────────────────────────────────────
  app.get('/api/groups/mine', requireUser, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT g.id, g.name, g.code, gm.display_name
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
      return res.status(400).json({ error: 'Nom du groupe trop long (max 40 car.)' })
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
      // déjà membre ?
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
      // Supprimer le groupe si plus personne dedans
      const { rows } = await pool.query(
        `SELECT COUNT(*) AS cnt FROM group_members WHERE group_id = $1`,
        [groupId],
      )
      if (parseInt(rows[0].cnt, 10) === 0) {
        await pool.query(`DELETE FROM groups WHERE id = $1`, [groupId])
      }
      res.json({ ok: true })
    } catch (err) {
      console.error('groups/leave:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })

  // ── Classement d'un groupe ────────────────────────────────────────────────
  app.get('/api/groups/:code/leaderboard', requireUser, async (req, res) => {
    const code = req.params.code.toUpperCase()
    try {
      const { rows: groupRows } = await pool.query(
        `SELECT id, name, code, created_by FROM groups WHERE code = $1`,
        [code],
      )
      if (!groupRows[0]) return res.status(404).json({ error: 'Groupe introuvable' })
      const group = groupRows[0]

      // Vérifier que l'appelant est membre
      const { rows: memberCheck } = await pool.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [group.id, req.userId],
      )
      if (!memberCheck[0]) return res.status(403).json({ error: 'Non membre de ce groupe' })

      const { rows: members } = await pool.query(
        `SELECT user_id, display_name FROM group_members WHERE group_id = $1 ORDER BY joined_at`,
        [group.id],
      )

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const entries = await Promise.all(
        members.map(async (m) => {
          const [weekXp, totalXp] = await Promise.all([
            computeXp(pool, m.user_id, weekAgo),
            computeXp(pool, m.user_id, 0),
          ])
          return {
            userId: m.user_id,
            displayName: m.display_name,
            isMe: m.user_id === req.userId,
            weekXp,
            totalXp,
          }
        }),
      )

      // Classement hebdo (tri principal)
      entries.sort((a, b) => b.weekXp - a.weekXp || b.totalXp - a.totalXp)

      res.json({
        group: { id: group.id, name: group.name, code: group.code },
        members: entries,
      })
    } catch (err) {
      console.error('groups/leaderboard:', err.message)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })
}
