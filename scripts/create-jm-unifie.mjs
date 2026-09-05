// Crée le programme "JM · Bien-être" fusionné (10 semaines) à partir des
// 4 programmes JM séparés. Utilise Phase 2 comme specs de base (Progression),
// marque les exercices absents de Phase 1 avec startPhase:'progression',
// et ajoute les exercices Phase-3-only avec startPhase:'intensification'.
//
// Usage : railway run node scripts/create-jm-unifie.mjs
// Dry-run (affiche sans insérer) : DRY=1 railway run node scripts/create-jm-unifie.mjs

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const DRY = process.env.DRY === '1'
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

// ── Helpers ──────────────────────────────────────────────────────────────────

function syncable(id) {
  return { id, updatedAt: NOW, deleted: false, dirty: false }
}

async function upsert(client, store, id, data) {
  if (DRY) { console.log(`  [DRY] upsert ${store} ${id}`); return }
  await client.query(
    `INSERT INTO sync_records (user_id, store, id, data, updated_at)
     VALUES (1, $1, $2, $3, $4)
     ON CONFLICT (user_id, store, id) DO UPDATE
       SET data = $3, updated_at = $4,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))`,
    [store, id, JSON.stringify({ ...syncable(id), ...data }), NOW],
  )
}

/** Normalise le nom d'une séance JM en type canonique (sans préfixe ni suffixe de phase). */
function sessionType(name) {
  return name
    .replace(/^JM-/, '')
    .replace(/ — (?:Adaptation|Progression|Intensification|Consolidation)$/, '')
    .replace(/ Intervalles$/, '')  // "Vélo Intervalles" → "Vélo"
    .trim()
}

// ── Connexion et requêtes ─────────────────────────────────────────────────────

const client = await pool.connect()

// 1. Les 3 programmes JM qu'on fusionne (Phase 4 = Consolidation, ignorée car
//    elle correspond à la Décharge auto du nouveau programme).
const { rows: progRows } = await client.query(`
  SELECT id, data->>'name' AS name
  FROM sync_records
  WHERE store='programs' AND user_id=1
    AND data->>'name' ~* 'JM-Phase [123]'
    AND (data->>'deleted')::boolean IS NOT TRUE
  ORDER BY data->>'name'
`)

if (progRows.length < 3) {
  console.error(`❌ Trouvé seulement ${progRows.length} programmes JM (besoin de 3 : Phase 1, 2, 3).`)
  progRows.forEach(p => console.error(`   • ${p.name}`))
  client.release(); await pool.end(); process.exit(1)
}

const [p1, p2, p3] = progRows
console.log(`\n✅ Programmes source :`)
console.log(`   P1 ${p1.id.slice(0,8)} — ${p1.name}`)
console.log(`   P2 ${p2.id.slice(0,8)} — ${p2.name}`)
console.log(`   P3 ${p3.id.slice(0,8)} — ${p3.name}`)

// 2. WTs + WETs pour chaque phase, indexés par type canonique
async function fetchWTsByType(progId) {
  const { rows: wts } = await client.query(`
    SELECT id, data->>'name' AS name, data AS wt
    FROM sync_records
    WHERE store='workoutTemplates' AND user_id=1
      AND data->>'programId'=$1
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [progId])

  const result = {}
  for (const wt of wts) {
    const type = sessionType(wt.name)
    const { rows: wets } = await client.query(`
      SELECT data AS wet, data->>'exerciseId' AS exid
      FROM sync_records
      WHERE store='workoutExerciseTemplates' AND user_id=1
        AND data->>'workoutTemplateId'=$1
        AND (data->>'deleted')::boolean IS NOT TRUE
      ORDER BY (data->>'order')::int
    `, [wt.id])
    result[type] = { wtData: wt.wt, wets: wets.map(r => r.wet), exIds: new Set(wets.map(r => r.exid)) }
  }
  return result
}

const phase1 = await fetchWTsByType(p1.id)
const phase2 = await fetchWTsByType(p2.id)
const phase3 = await fetchWTsByType(p3.id)

const sessionTypes = Object.keys(phase2)
console.log(`\n📋 Types de séances détectés : ${sessionTypes.join(', ')}`)

// 3. Assignation des jours (lundi=1 à dimanche=7)
const DAY_MAP = {
  'Bas + Stabilité':  'monday',
  'Mobilité':         'tuesday',
  'Full Body':        'wednesday',
  'Core + Haut':      'thursday',
  'Haut + Core':      'friday',
  'Vélo':             'saturday',
  'Circuit Full Body':'sunday',
}

// 4. Noms propres des séances dans le nouveau programme
const SESSION_NAMES = {
  'Bas + Stabilité':   'Bas + Stabilité',
  'Mobilité':          'Mobilité & Récup',
  'Full Body':         'Full Body',
  'Core + Haut':       'Core + Haut',
  'Haut + Core':       'Haut + Core',
  'Vélo':              'Vélo',
  'Circuit Full Body': 'Circuit Full Body',
}

const TYPE_META = {
  'Bas + Stabilité':   { type: 'lower',    muscleGroups: ['glutes','hamstrings','quads','core'] },
  'Mobilité':          { type: 'mobility', muscleGroups: ['core','back','glutes'] },
  'Full Body':         { type: 'fullbody', muscleGroups: ['chest','back','core','glutes','quads'] },
  'Core + Haut':       { type: 'upper',    muscleGroups: ['core','chest','back'] },
  'Haut + Core':       { type: 'upper',    muscleGroups: ['chest','shoulders','back','core'] },
  'Vélo':              { type: 'cardio',   muscleGroups: ['cardio'] },
  'Circuit Full Body': { type: 'fullbody', muscleGroups: ['chest','glutes','quads','core','back'] },
}

// 5. Génération des IDs du nouveau programme
const mergedId = randomUUID()
const wtIds = Object.fromEntries(sessionTypes.map(t => [t, randomUUID()]))

// Vérification : tous les types ont un jour assigné
const missing = sessionTypes.filter(t => !DAY_MAP[t])
if (missing.length) {
  console.error(`❌ Types sans jour assigné : ${missing.join(', ')}`)
  client.release(); await pool.end(); process.exit(1)
}

// ── Affichage du diff par session ─────────────────────────────────────────────
console.log('\n─'.repeat(70))
console.log('DIFF DES EXERCICES PAR SÉANCE')
console.log('─'.repeat(70))

for (const type of sessionTypes) {
  const p1s = phase1[type]
  const p2s = phase2[type]
  const p3s = phase3[type]
  if (!p2s) { console.log(`⚠️  ${type} absent de Phase 2, ignoré.`); continue }

  console.log(`\n${type}`)
  for (const wet of p2s.wets) {
    const inP1 = p1s?.exIds.has(wet.exerciseId) ?? false
    const tag = inP1 ? '' : '  ← startPhase:progression'
    const warmup = wet.isWarmup ? ' [échauff]' : ''
    console.log(`  ${inP1 ? '✓' : '+'} ${wet.exerciseId.padEnd(35)} ${wet.targetSets}×${wet.targetRepsMin}${warmup}${tag}`)
  }
  // Exercices Phase 3 non présents dans Phase 2
  if (p3s) {
    for (const wet of p3s.wets) {
      if (p2s.exIds.has(wet.exerciseId)) continue
      console.log(`  ⚡ ${wet.exerciseId.padEnd(35)} ${wet.targetSets}×${wet.targetRepsMin}  ← startPhase:intensification`)
    }
  }
}

if (DRY) {
  console.log('\n⚠️  Mode DRY — aucune insertion. Relancer sans DRY=1 pour créer.')
  client.release(); await pool.end(); process.exit(0)
}

// ── Insertion ─────────────────────────────────────────────────────────────────

await client.query('BEGIN')

try {
  // 6. Programme
  const weekTemplate = Object.fromEntries(
    sessionTypes.map(t => [DAY_MAP[t], wtIds[t]])
  )

  await upsert(client, 'programs', mergedId, {
    name: 'JM · Bien-être',
    goal: 'endurance',
    level: 'beginner',
    durationWeeks: 10,
    sessionsPerWeek: 7,
    isTemplate: true,
    isActive: false,
    color: 2,
    icon: '🧘',
    weekTemplate,
    createdAt: NOW,
  })
  console.log(`\n✅ Programme créé : ${mergedId}`)

  // 7. Séances + exercices
  for (const type of sessionTypes) {
    const p2s = phase2[type]
    const p3s = phase3[type]
    const p1s = phase1[type]
    if (!p2s) continue

    const wtId = wtIds[type]
    const meta = TYPE_META[type] ?? { type: 'fullbody', muscleGroups: [] }

    await upsert(client, 'workoutTemplates', wtId, {
      programId: mergedId,
      name: SESSION_NAMES[type] ?? type,
      type: meta.type,
      muscleGroups: meta.muscleGroups,
    })

    let order = 0

    // WETs de Phase 2 (base)
    for (const wet of p2s.wets) {
      const inP1 = !wet.isWarmup && (p1s?.exIds.has(wet.exerciseId) ?? false)
      const wetId = randomUUID()
      const data = {
        workoutTemplateId: wtId,
        exerciseId: wet.exerciseId,
        order: order++,
        targetSets: wet.targetSets,
        repsMode: wet.repsMode ?? 'fixed',
        targetRepsMin: wet.targetRepsMin,
        restSec: wet.restSec ?? 0,
        autoProgress: false,
        progressStepKg: 0,
      }
      if (wet.targetRepsMax)     data.targetRepsMax     = wet.targetRepsMax
      if (wet.targetDurationSec) data.targetDurationSec = wet.targetDurationSec
      if (wet.isWarmup)          data.isWarmup          = true
      if (wet.isAb)              data.isAb              = true
      // Exercice absent de Phase 1 → débloqué en Progression
      if (!wet.isWarmup && !inP1) data.startPhase = 'progression'

      await upsert(client, 'workoutExerciseTemplates', wetId, data)
    }

    // Exercices présents en Phase 3 mais pas en Phase 2 → startPhase:'intensification'
    if (p3s) {
      for (const wet of p3s.wets) {
        if (p2s.exIds.has(wet.exerciseId)) continue
        if (wet.isWarmup) continue
        const wetId = randomUUID()
        const data = {
          workoutTemplateId: wtId,
          exerciseId: wet.exerciseId,
          order: order++,
          targetSets: wet.targetSets,
          repsMode: wet.repsMode ?? 'fixed',
          targetRepsMin: wet.targetRepsMin,
          restSec: wet.restSec ?? 0,
          autoProgress: false,
          progressStepKg: 0,
          startPhase: 'intensification',
        }
        if (wet.targetRepsMax)     data.targetRepsMax     = wet.targetRepsMax
        if (wet.targetDurationSec) data.targetDurationSec = wet.targetDurationSec
        if (wet.isAb)              data.isAb              = true

        await upsert(client, 'workoutExerciseTemplates', wetId, data)
      }
    }

    console.log(`  ✓ ${SESSION_NAMES[type] ?? type} — ${order} exercice(s)`)
  }

  await client.query('COMMIT')
  console.log('\n🎉 Programme JM · Bien-être créé avec succès !')
  console.log(`   → Visible après le prochain pull de synchro dans l'app.`)

} catch (err) {
  await client.query('ROLLBACK')
  console.error('❌ Erreur, rollback :', err.message)
  process.exit(1)
}

client.release()
await pool.end()
