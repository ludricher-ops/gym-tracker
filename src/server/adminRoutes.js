// Routes admin — réservées à l'utilisateur id=1.

/** Middleware : bloque tout utilisateur qui n'est pas l'admin (id = 1). */
function requireAdmin(req, res, next) {
  if (req.userId !== 1) return res.status(403).json({ error: 'Accès réservé à l\'admin' })
  next()
}

export function registerAdminRoutes(app, pool, requireUser) {
  if (!pool) return

  // ── Vue d'ensemble des utilisateurs ──────────────────────────────────────────
  // GET /api/admin/users
  app.get('/api/admin/users', requireUser, requireAdmin, async (_req, res) => {
    try {
      const { rows: users } = await pool.query(`
        SELECT
          u.id,
          u.email,
          u.created_at,

          -- Séances terminées
          COALESCE((
            SELECT COUNT(*)::int FROM sync_records
            WHERE user_id = u.id AND store = 'sessions'
              AND data->>'endedAt' IS NOT NULL
              AND (data->>'deleted')::boolean IS NOT TRUE
          ), 0) AS sessions,

          -- Séries de travail validées
          COALESCE((
            SELECT COUNT(*)::int FROM sync_records
            WHERE user_id = u.id AND store = 'sets'
              AND (data->>'isWarmup')::boolean IS NOT TRUE
              AND data->>'completedAt' IS NOT NULL
              AND (data->>'deleted')::boolean IS NOT TRUE
          ), 0) AS sets,

          -- Records personnels actifs
          COALESCE((
            SELECT COUNT(*)::int FROM sync_records
            WHERE user_id = u.id AND store = 'personalRecords'
              AND (data->>'deleted')::boolean IS NOT TRUE
          ), 0) AS prs,

          -- Exercices utilisés (ayant au moins une série)
          COALESCE((
            SELECT COUNT(DISTINCT se.data->>'exerciseId')::int
            FROM sync_records s
            JOIN sync_records se
              ON se.user_id = u.id
              AND se.store = 'sessionExercises'
              AND se.id = s.data->>'sessionExerciseId'
            WHERE s.user_id = u.id AND s.store = 'sets'
              AND s.data->>'completedAt' IS NOT NULL
              AND (s.data->>'deleted')::boolean IS NOT TRUE
          ), 0) AS exercises_used,

          -- Dernière synchro (ms epoch)
          COALESCE((
            SELECT MAX(updated_at) FROM sync_records WHERE user_id = u.id
          ), 0) AS last_sync_ms,

          -- Groupes rejoints
          COALESCE((
            SELECT json_agg(json_build_object(
              'name', g.name, 'code', g.code, 'display_name', gm.display_name
            ))
            FROM group_members gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.user_id = u.id
          ), '[]'::json) AS groups

        FROM users u
        ORDER BY u.id
      `)

      res.json({ users })
    } catch (err) {
      console.error('admin/users:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  // ── Migration one-time exposée également ici ──────────────────────────────────
  // POST /api/admin/fix-first-pr (déjà dans groupRoutes, conservé ici pour la page admin)
  app.get('/api/admin/stats', requireUser, requireAdmin, async (_req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM users) AS total_users,
          (SELECT COUNT(*)::int FROM sync_records WHERE store = 'sessions'
            AND data->>'endedAt' IS NOT NULL AND (data->>'deleted')::boolean IS NOT TRUE) AS total_sessions,
          (SELECT COUNT(*)::int FROM sync_records WHERE store = 'sets'
            AND (data->>'isWarmup')::boolean IS NOT TRUE
            AND data->>'completedAt' IS NOT NULL
            AND (data->>'deleted')::boolean IS NOT TRUE) AS total_sets,
          (SELECT COUNT(*)::int FROM sync_records WHERE store = 'personalRecords'
            AND (data->>'deleted')::boolean IS NOT TRUE) AS total_prs,
          (SELECT COUNT(*)::int FROM groups) AS total_groups,
          (SELECT COUNT(*)::int FROM group_members) AS total_members
      `)
      res.json(rows[0])
    } catch (err) {
      console.error('admin/stats:', err.message)
      res.status(500).json({ error: err.message })
    }
  })
}
