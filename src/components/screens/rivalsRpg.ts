// Système RPG partagé entre GroupScreen, GroupDetailScreen, RivalsStatsScreen.

// ── Niveaux ──────────────────────────────────────────────────────────────────

/** XP total requis pour atteindre le niveau n. */
export function xpForLevel(n: number): number {
  return Math.round(100 * n * (n - 1) / 2)
}

/** Niveau correspondant à un total d'XP. */
export function levelFromXp(totalXp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + 8 * totalXp / 100)) / 2))
}

/** Progression vers le niveau suivant. */
export function xpToNextLevel(totalXp: number): {
  level: number; current: number; needed: number; pct: number
} {
  const level   = levelFromXp(totalXp)
  const floorXp = xpForLevel(level)
  const ceilXp  = xpForLevel(level + 1)
  const current = totalXp - floorXp
  const needed  = ceilXp - floorXp
  return { level, current, needed, pct: Math.round((current / needed) * 100) }
}

// ── Rangs ─────────────────────────────────────────────────────────────────────

export interface Rank { label: string; color: string; emoji: string; minLevel: number }

export const RANKS: Rank[] = [
  { minLevel:  1, emoji: '🩶', color: '#94a3b8', label: 'Recrue'       },
  { minLevel:  6, emoji: '🥉', color: '#cd7f32', label: 'Combattant'   },
  { minLevel: 11, emoji: '⚔️', color: '#71717a', label: 'Guerrier'     },
  { minLevel: 16, emoji: '🥈', color: '#c0c0c0', label: 'Vétéran'      },
  { minLevel: 21, emoji: '🏆', color: '#f59e0b', label: 'Champion'     },
  { minLevel: 26, emoji: '🌟', color: '#f97316', label: 'Élite'        },
  { minLevel: 31, emoji: '💎', color: '#06b6d4', label: 'Maître'       },
  { minLevel: 36, emoji: '🔮', color: '#a855f7', label: 'Grand Maître' },
  { minLevel: 41, emoji: '🔥', color: '#ef4444', label: 'Légende'      },
  { minLevel: 46, emoji: '⭐', color: '#fbbf24', label: 'Icône'        },
  { minLevel: 50, emoji: '👑', color: '#f59e0b', label: 'Transcendant' },
]

export function rankForLevel(level: number): Rank {
  let rank = RANKS[0]!
  for (const r of RANKS) { if (level >= r.minLevel) rank = r }
  return rank
}

// ── Badges ───────────────────────────────────────────────────────────────────

export interface Badge {
  id: string
  emoji: string
  label: string
  desc: string
  unlocked: boolean
}

export function computeBadges(params: {
  sessionCount: number
  prCount: number
  streak: number
  maxWeightKg: number
  totalXp: number
}): Badge[] {
  const { sessionCount, prCount, streak, maxWeightKg, totalXp } = params
  const level = levelFromXp(totalXp)

  return [
    // Séances
    { id: 's1',  emoji: '🏋️', label: 'Première séance',   desc: '1 séance terminée',              unlocked: sessionCount >= 1   },
    { id: 's2',  emoji: '💪', label: 'Régulier',           desc: '10 séances terminées',            unlocked: sessionCount >= 10  },
    { id: 's3',  emoji: '⚡', label: 'Assidu',             desc: '50 séances terminées',            unlocked: sessionCount >= 50  },
    { id: 's4',  emoji: '💎', label: 'Centurion',          desc: '100 séances terminées',           unlocked: sessionCount >= 100 },
    { id: 's5',  emoji: '🌌', label: 'Légende de la salle',desc: '365 séances terminées',           unlocked: sessionCount >= 365 },
    // Records
    { id: 'p1',  emoji: '📈', label: 'Premier record',     desc: 'Premier PR battu',                unlocked: prCount >= 1   },
    { id: 'p2',  emoji: '🏅', label: 'Recordman',          desc: '25 records personnels',           unlocked: prCount >= 25  },
    { id: 'p3',  emoji: '🎯', label: 'Briseur de records', desc: '100 records personnels',          unlocked: prCount >= 100 },
    // Streak
    { id: 'k1',  emoji: '🔥', label: 'En feu',             desc: '7 jours d\'entraînement d\'affilée', unlocked: streak >= 7  },
    { id: 'k2',  emoji: '🌊', label: 'Inferno',            desc: '14 jours d\'affilée',            unlocked: streak >= 14  },
    { id: 'k3',  emoji: '🤖', label: 'Machine',            desc: '30 jours d\'affilée',            unlocked: streak >= 30  },
    // Poids
    { id: 'w1',  emoji: '🥉', label: 'Club 50 kg',         desc: 'Série à 50 kg ou plus',          unlocked: maxWeightKg >= 50  },
    { id: 'w2',  emoji: '🥈', label: 'Club 100 kg',        desc: 'Série à 100 kg ou plus',         unlocked: maxWeightKg >= 100 },
    { id: 'w3',  emoji: '🥇', label: 'Club 150 kg',        desc: 'Série à 150 kg ou plus',         unlocked: maxWeightKg >= 150 },
    // Niveaux RPG
    { id: 'r1',  emoji: '⚔️', label: 'Guerrier',           desc: 'Atteindre le niveau 10',         unlocked: level >= 10 },
    { id: 'r2',  emoji: '🏆', label: 'Champion',           desc: 'Atteindre le niveau 20',         unlocked: level >= 20 },
    { id: 'r3',  emoji: '👑', label: 'Transcendant',       desc: 'Atteindre le niveau 50',         unlocked: level >= 50 },
  ]
}
