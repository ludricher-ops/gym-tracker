// session-flow-screens.jsx — Gym Track session execution flow (4 screens)
// Covers in-session interactions and post-session recap

const {
  ScreenShell: TShell, TabBar: TTabBar, Pill: TPill, Card: TCard,
  FONT: TFONT, MONO: TMONO, btnSq: tBtnSq,
  IconChevR: TChev, IconPlus: TPlus, IconCheck: TCheck, IconClose: TClose,
  IconArrow: TArrow, IconBolt: TBolt, IconDumb: TDumb, IconClock: TClock,
  IconChart: TChart, IconFlame: TFlame, IconList: TList,
} = window;

const tIc = (paths) => ({ size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const IconSwap   = tIc(<><polyline points="17 3 21 7 17 11" /><path d="M3 7h18" /><polyline points="7 21 3 17 7 13" /><path d="M21 17H3" /></>);
const IconShare2 = tIc(<><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>);
const IconHeart2 = tIc(<><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></>);
const IconTrophy = tIc(<><path d="M8 4h8v3a4 4 0 0 1-8 0V4z" /><path d="M5 6h3M16 6h3M9 14h6v6H9z" /><path d="M9 14a3 3 0 0 1-3-3V7M15 14a3 3 0 0 0 3-3V7" /></>);
const IconNote2  = tIc(<><path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path d="M16 4v4h4M8 13h8M8 17h5" /></>);
const IconPlay2  = tIc(<><polygon points="7 5 19 12 7 19" fill="currentColor" /></>);
const IconStop   = tIc(<><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></>);

// ─────────────────────────────────────────────────────────────
// SCREEN T1 — IN-SESSION OVERVIEW (sheet over session)
// Shows all exercises with progress, lets user navigate / swap
// ─────────────────────────────────────────────────────────────
function InSessionOverviewScreen({ theme }) {
  const exercises = [
    { n: 'Développé couché',           tag: 'PECS',    sets: 3, done: 3, w: '82,5 kg', status: 'done', pr: true },
    { n: 'Développé incliné haltères', tag: 'PECS H.', sets: 4, done: 2, w: '34 kg',   status: 'active' },
    { n: 'Écarté poulie',              tag: 'PECS',    sets: 3, done: 0, w: '14 kg',   status: 'next', sup: 'A' },
    { n: 'Dips lestés',                tag: 'TRICEPS', sets: 3, done: 0, w: '+15 kg',  status: 'next', sup: 'A' },
    { n: 'Élévations latérales',       tag: 'ÉPAULES', sets: 4, done: 0, w: '12 kg',   status: 'next' },
    { n: 'Triceps poulie',             tag: 'TRICEPS', sets: 3, done: 0, w: '27,5 kg', status: 'next' },
  ];
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets  = exercises.reduce((a, e) => a + e.done, 0);

  return (
    <TShell theme={theme} pad={false}>
      {/* Dimmed background to show this is over the session */}
      <div style={{
        position: 'absolute', inset: 0,
        background: theme.bg,
        opacity: 0.5,
      }} />

      {/* Sheet */}
      <div style={{
        marginTop: 80, marginBottom: 0,
        flex: 1,
        background: theme.surface,
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px 0',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: theme.dim, margin: '0 auto 14px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>SÉANCE EN COURS</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>Push · Pec & Triceps</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: theme.surface2,
            display: 'grid', placeItems: 'center',
          }}><TClose size={16} stroke={theme.text} /></div>
        </div>

        {/* Progress strip */}
        <div style={{
          padding: '12px 14px', borderRadius: 14,
          background: theme.surface2,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: TMONO, fontSize: 11, color: theme.muted, fontWeight: 600 }}>
              <span style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>{doneSets}</span> / {totalSets} séries
            </div>
            <div style={{ fontFamily: TMONO, fontSize: 11, color: theme.muted }}>34:12 · 5 240 kg</div>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: theme.bg, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${(doneSets/totalSets)*100}%`, height: '100%', background: theme.accent }} />
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, overflow: 'auto', marginLeft: -20, marginRight: -20, padding: '0 20px' }}>
          {exercises.map((ex, i) => {
            const isDone   = ex.status === 'done';
            const isActive = ex.status === 'active';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: isActive ? theme.accent : theme.bg,
                color: isActive ? theme.accentInk : theme.text,
                border: `1px solid ${isActive ? 'transparent' : theme.border}`,
                marginBottom: 6,
                opacity: isDone ? 0.6 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: isActive ? theme.accentInk : (isDone ? theme.accent : theme.surface2),
                  color: isActive ? theme.accent : (isDone ? theme.accentInk : theme.text),
                  display: 'grid', placeItems: 'center',
                  fontFamily: TMONO, fontWeight: 700, fontSize: 12,
                }}>
                  {isDone ? <TCheck size={16} stroke={theme.accentInk} /> : (ex.sup || (i + 1))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.n}</div>
                    {ex.pr && (
                      <div style={{
                        padding: '1px 5px', borderRadius: 4,
                        background: '#fff', color: theme.accent,
                        fontSize: 8, fontWeight: 700, letterSpacing: 0.5, fontFamily: TMONO,
                      }}>PR</div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: TMONO, opacity: isActive ? 0.7 : 0.6, marginTop: 2 }}>
                    {ex.done}/{ex.sets} · {ex.w}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: ex.sets }).map((_, si) => (
                    <div key={si} style={{
                      width: 6, height: 22, borderRadius: 2,
                      background: si < ex.done
                        ? (isActive ? theme.accentInk : theme.accent)
                        : (isActive ? `${theme.accentInk}55` : theme.surface2),
                    }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add exercise */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 14,
            border: `1px dashed ${theme.border}`,
            color: theme.muted, fontSize: 13, fontWeight: 600,
            marginTop: 6, marginBottom: 14,
          }}>
            <TPlus size={16} stroke={theme.muted} /> Ajouter un exercice
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 0 16px' }}>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}><IconSwap size={16} stroke={theme.text} /> Réorganiser</div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}><IconNote2 size={16} stroke={theme.text} /> Notes</div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: theme.danger,
          }}><IconStop size={14} stroke={theme.danger} fill={theme.danger} /> Terminer</div>
        </div>
      </div>
    </TShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN T2 — PR CELEBRATION (in-session overlay)
// ─────────────────────────────────────────────────────────────
function PRCelebrationScreen({ theme }) {
  return (
    <TShell theme={theme} pad={false}>
      <div style={{
        position: 'absolute', inset: 0,
        background: theme.bg,
        opacity: 0.9,
      }} />

      {/* Confetti dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { x: 12, y: 18, c: theme.accent, r: 6 },
          { x: 82, y: 22, c: '#ff7a3a',     r: 4 },
          { x: 25, y: 32, c: '#3a7dff',     r: 5 },
          { x: 70, y: 38, c: theme.accent,  r: 3 },
          { x: 88, y: 50, c: '#a855f7',     r: 5 },
          { x: 10, y: 55, c: theme.accent,  r: 4 },
          { x: 90, y: 72, c: '#ff3a6e',     r: 6 },
          { x: 18, y: 78, c: theme.accent,  r: 3 },
          { x: 78, y: 85, c: '#10b981',     r: 5 },
          { x: 55, y: 14, c: theme.accent,  r: 4 },
          { x: 32, y: 65, c: '#3a7dff',     r: 3 },
          { x: 60, y: 90, c: '#ff7a3a',     r: 4 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${c.x}%`, top: `${c.y}%`,
            width: c.r * 2, height: c.r * 2, borderRadius: 999,
            background: c.c,
          }} />
        ))}
        {/* Streamers (rotated rects) */}
        {[
          { x: 8, y: 28, rot: 28, c: theme.accent },
          { x: 80, y: 60, rot: -20, c: '#ff7a3a' },
          { x: 30, y: 84, rot: 45, c: '#3a7dff' },
          { x: 65, y: 28, rot: -35, c: theme.accent },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: 4, height: 28, borderRadius: 2,
            background: s.c,
            transform: `rotate(${s.rot}deg)`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        flex: 1, padding: '0 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Trophy icon halo */}
        <div style={{
          width: 96, height: 96, borderRadius: 999,
          background: theme.accent,
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
          boxShadow: `0 0 0 16px ${theme.accent}33, 0 0 0 32px ${theme.accent}1a`,
        }}>
          <IconTrophy size={48} stroke={theme.accentInk} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '5px 10px', borderRadius: 6,
            background: theme.accent, color: theme.accentInk,
            fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: TMONO,
          }}>NOUVEAU RECORD</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 18, letterSpacing: -0.8, lineHeight: 1.1 }}>
            Développé<br/>couché
          </div>
        </div>

        {/* Big number */}
        <div style={{
          marginTop: 28,
          textAlign: 'center',
          fontFamily: TMONO,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 6,
            padding: '12px 24px', borderRadius: 20,
            background: theme.surface, border: `1px solid ${theme.border}`,
          }}>
            <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, color: theme.accent, lineHeight: 1 }}>82,5</span>
            <span style={{ fontSize: 22, color: theme.text }}>kg</span>
            <span style={{ fontSize: 24, color: theme.muted, margin: '0 4px' }}>×</span>
            <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, color: theme.accent, lineHeight: 1 }}>6</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 22,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.border}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>PRÉCÉDENT</div>
            <div style={{ fontFamily: TMONO, fontSize: 16, fontWeight: 600, color: theme.muted, marginTop: 4 }}>80 × 6</div>
          </div>
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.accent}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.accent, letterSpacing: 1.2 }}>1RM ESTIMÉ</div>
            <div style={{ fontFamily: TMONO, fontSize: 16, fontWeight: 700, color: theme.accent, marginTop: 4 }}>99 kg <span style={{ fontSize: 11 }}>(+3)</span></div>
          </div>
        </div>

        {/* Motivational */}
        <div style={{
          marginTop: 18, padding: '12px 16px', borderRadius: 14,
          background: theme.surface2,
          textAlign: 'center',
          fontSize: 13, fontWeight: 500, color: theme.text, lineHeight: 1.5,
        }}>
          12<sup>e</sup> PR de l'année · plus que <b style={{ color: theme.accent }}>17,5 kg</b> avant ton objectif 100 kg
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: '16px 22px', borderRadius: 18,
          background: theme.accent, color: theme.accentInk,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 16, fontWeight: 700,
          marginBottom: 8,
        }}>
          Continuer la séance <TArrow size={20} stroke={theme.accentInk} />
        </div>
        <div style={{
          padding: '12px 0', textAlign: 'center',
          fontSize: 13, fontWeight: 600, color: theme.muted,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}><IconShare2 size={16} stroke={theme.muted} /> Partager</div>
      </div>
    </TShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN T3 — SESSION COMPLETE (celebration)
// ─────────────────────────────────────────────────────────────
function SessionCompleteScreen({ theme }) {
  return (
    <TShell theme={theme} pad={false}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '60px 24px 0',
        background: `radial-gradient(ellipse at top, ${theme.accent}26, transparent 60%)`,
      }}>
        {/* Check icon */}
        <div style={{
          width: 84, height: 84, borderRadius: 999,
          background: theme.accent,
          display: 'grid', placeItems: 'center',
          margin: '20px auto 18px',
          boxShadow: `0 0 0 14px ${theme.accent}26`,
        }}>
          <TCheck size={42} stroke={theme.accentInk} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.5, fontFamily: TMONO }}>SÉANCE TERMINÉE</div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8, letterSpacing: -0.8, lineHeight: 1 }}>Beau boulot.</div>
          <div style={{ fontSize: 14, color: theme.muted, marginTop: 6 }}>Push · Pec & Triceps · semaine 3</div>
        </div>

        {/* Big stat: duration */}
        <div style={{
          marginTop: 28,
          padding: '24px 20px', borderRadius: 24,
          background: theme.surface, border: `1px solid ${theme.border}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }}>DURÉE TOTALE</div>
          <div style={{ fontFamily: TMONO, fontSize: 56, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1, marginTop: 6 }}>
            58:24
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
          {[
            { lbl: 'SÉRIES', val: '22', sub: 'toutes faites' },
            { lbl: 'VOLUME', val: '5,9k', sub: 'kg' },
            { lbl: 'PR',     val: '1',   sub: 'sur DC' },
          ].map(s => (
            <div key={s.lbl} style={{
              padding: '14px 10px', borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{s.lbl}</div>
              <div style={{ fontFamily: TMONO, fontSize: 22, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: theme.muted, fontFamily: TMONO, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* PR highlight banner */}
        <div style={{
          marginTop: 12,
          padding: '12px 14px', borderRadius: 14,
          background: theme.accent, color: theme.accentInk,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: theme.accentInk, color: theme.accent,
            display: 'grid', placeItems: 'center',
          }}><IconTrophy size={18} stroke={theme.accent} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>1 record battu</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1, fontFamily: TMONO }}>DC barre · 82,5 kg × 6</div>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          marginTop: 10, padding: '12px 14px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: theme.surface2, color: theme.accent,
            display: 'grid', placeItems: 'center',
          }}><TFlame size={20} stroke={theme.accent} fill={theme.accent} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>13 jours d'affilée</div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>Record perso : 28 jours</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ padding: '8px 0 0' }}>
          <div style={{
            padding: '16px 22px', borderRadius: 18,
            background: theme.text, color: theme.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 15, fontWeight: 700,
          }}>
            Voir le récap détaillé <TArrow size={18} stroke={theme.bg} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingBottom: 14 }}>
            <div style={{
              flex: 1, padding: '12px 0', borderRadius: 14,
              background: theme.surface, border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
            }}><IconShare2 size={16} stroke={theme.text} /> Partager</div>
            <div style={{
              flex: 1, padding: '12px 0', borderRadius: 14,
              background: theme.surface, border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
            }}>Accueil</div>
          </div>
        </div>
      </div>
    </TShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN T4 — SESSION RECAP (detailed)
// ─────────────────────────────────────────────────────────────
function SessionRecapScreen({ theme }) {
  // mini volume distribution donut
  const segs = [
    { lbl: 'PECS',    pct: 48, c: theme.accent },
    { lbl: 'TRICEPS', pct: 32, c: theme.text },
    { lbl: 'ÉPAULES', pct: 20, c: theme.dim },
  ];

  return (
    <TShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>LUN. 18 MAI · 18:32 → 19:30</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Récap séance</div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}><IconShare2 size={16} stroke={theme.text} /></div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Title card */}
        <TCard theme={theme} tone="accent" style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '3px 7px', borderRadius: 5,
              background: theme.accentInk, color: theme.accent,
              fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: TMONO,
            }}>PUSH</div>
            <div style={{ fontSize: 10, opacity: 0.7, fontFamily: TMONO, fontWeight: 600 }}>SEMAINE 3 · J1</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, letterSpacing: -0.4 }}>Push · Pec & Triceps</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontFamily: TMONO, fontSize: 12, fontWeight: 500 }}>
            <div><span style={{ opacity: 0.55 }}>DURÉE</span> <b>58:24</b></div>
            <div><span style={{ opacity: 0.55 }}>SÉRIES</span> <b>22/22</b></div>
            <div><span style={{ opacity: 0.55 }}>VOL.</span> <b>5,9k</b></div>
          </div>
        </TCard>

        {/* Vs last */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { lbl: 'VOLUME', val: '5,9k', delta: '+8%', pos: true },
            { lbl: 'DURÉE',  val: '58m',  delta: '−4m', pos: true },
            { lbl: 'RPE',    val: '8,2',  delta: '+0,3', pos: false },
          ].map(s => (
            <div key={s.lbl} style={{
              padding: '12px 10px', borderRadius: 14,
              background: theme.surface, border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{s.lbl}</div>
              <div style={{ fontFamily: TMONO, fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: -0.3 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: s.pos ? theme.accent : theme.muted, fontFamily: TMONO, marginTop: 2, fontWeight: 600 }}>
                {s.pos ? '↗' : '↗'} {s.delta} vs précédent
              </div>
            </div>
          ))}
        </div>

        {/* PR card */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface,
          border: `1px solid ${theme.accent}`,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: theme.accent, color: theme.accentInk,
              display: 'grid', placeItems: 'center',
            }}><IconTrophy size={18} stroke={theme.accentInk} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.accent, letterSpacing: 1.4 }}>1 RECORD BATTU</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Développé couché · 82,5 kg × 6</div>
            </div>
            <div style={{ fontFamily: TMONO, fontSize: 12, color: theme.accent, fontWeight: 700 }}>+2,5</div>
          </div>
        </div>

        {/* Volume distribution */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, marginBottom: 10 }}>VOLUME PAR GROUPE</div>
          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
            {segs.map(s => (
              <div key={s.lbl} style={{ width: `${s.pct}%`, background: s.c }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {segs.map(s => (
              <div key={s.lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                <div style={{ fontSize: 10, fontFamily: TMONO, fontWeight: 600 }}>{s.lbl}</div>
                <div style={{ fontSize: 10, fontFamily: TMONO, color: theme.muted }}>{s.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise breakdown */}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '4px 4px 10px' }}>DÉTAIL EXERCICES</div>
        {[
          { n: 'Développé couché', sets: [{w:'82,5', r:6, pr:true}, {w:'82,5', r:6}, {w:'80', r:7}], total: '1 470 kg' },
          { n: 'Développé incliné haltères', sets: [{w:'34', r:10}, {w:'34', r:9}, {w:'34', r:8}, {w:'32', r:9}], total: '1 200 kg' },
          { n: 'Écarté poulie', sets: [{w:'14', r:14}, {w:'14', r:13}, {w:'14', r:11}], total: '532 kg', sup: 'A' },
          { n: 'Dips lestés', sets: [{w:'+15', r:9}, {w:'+15', r:8}, {w:'+15', r:7}], total: '+360 kg', sup: 'A' },
          { n: 'Élévations latérales', sets: [{w:'12', r:14}, {w:'12', r:13}, {w:'12', r:12}, {w:'12', r:11}], total: '600 kg' },
          { n: 'Triceps poulie', sets: [{w:'27,5', r:13}, {w:'27,5', r:12}, {w:'25', r:13}], total: '1 027 kg' },
        ].map((ex, i) => (
          <div key={i} style={{
            padding: '12px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.border}`,
            marginBottom: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {ex.sup && (
                <div style={{
                  padding: '2px 5px', borderRadius: 4,
                  background: theme.accent, color: theme.accentInk,
                  fontSize: 9, fontWeight: 700, fontFamily: TMONO,
                }}>{ex.sup}</div>
              )}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{ex.n}</div>
              <div style={{ fontFamily: TMONO, fontSize: 11, color: theme.muted }}>{ex.total}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {ex.sets.map((s, si) => (
                <div key={si} style={{
                  padding: '4px 8px', borderRadius: 6,
                  background: s.pr ? theme.accent : theme.surface2,
                  color: s.pr ? theme.accentInk : theme.text,
                  fontFamily: TMONO, fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {s.pr && <IconTrophy size={10} stroke={theme.accentInk} />}
                  {s.w} × {s.r}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div style={{
          marginTop: 12, padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <IconNote2 size={14} stroke={theme.muted} />
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>NOTES</div>
          </div>
          <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, fontStyle: 'italic' }}>
            DC très solide aujourd'hui, encore en réserve. Élévations à passer en drop-set la prochaine fois.
          </div>
        </div>

        {/* Next session */}
        <div style={{
          marginTop: 12, padding: '14px 16px', borderRadius: 16,
          background: theme.accent, color: theme.accentInk,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: theme.accentInk, color: theme.accent,
            display: 'grid', placeItems: 'center',
          }}><IconPlay2 size={14} stroke={theme.accent} fill={theme.accent} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, letterSpacing: 1.2 }}>PROCHAINE SÉANCE · DEMAIN</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Pull · Dos & Biceps</div>
          </div>
          <TArrow size={18} stroke={theme.accentInk} />
        </div>

        <div style={{ height: 14 }} />
      </div>
    </TShell>
  );
}

Object.assign(window, {
  InSessionOverviewScreen, PRCelebrationScreen,
  SessionCompleteScreen, SessionRecapScreen,
});
