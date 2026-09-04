// program-screens.jsx — Gym Track program creation flow (7 screens)
// Reuses primitives from screens.jsx & profile-screens.jsx via window.*

const {
  ScreenShell, TabBar, Pill, Card, FONT: PFONT, MONO: PMONO, btnSq: pBtnSq,
  IconChevR: PChevR, IconPlus: PPlus, IconCheck: PCheck, IconClose: PClose,
  IconArrow: PArrow, IconBolt: PBolt, IconDumb: PDumb, IconClock: PClock,
  IconChart: PChart,
} = window;

// Local icons for program flow
const prIc = (paths) => ({ size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const IconSearch  = prIc(<><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>);
const IconFilter  = prIc(<><path d="M3 5h18M6 12h12M10 19h4" /></>);
const IconGrip    = prIc(<><circle cx="9" cy="6" r="1.3" fill="currentColor" /><circle cx="15" cy="6" r="1.3" fill="currentColor" /><circle cx="9" cy="12" r="1.3" fill="currentColor" /><circle cx="15" cy="12" r="1.3" fill="currentColor" /><circle cx="9" cy="18" r="1.3" fill="currentColor" /><circle cx="15" cy="18" r="1.3" fill="currentColor" /></>);
const IconCopy    = prIc(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>);
const IconTrash   = prIc(<><polyline points="4 7 20 7" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 7V4h4v3" /></>);
const IconLink    = prIc(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7L11 7" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7L13 17" /></>);
const IconEdit    = prIc(<><path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="M14 6l4 4" /></>);

// ─────────────────────────────────────────────────────────────
// shared header for program flow
// ─────────────────────────────────────────────────────────────
function ProgHeader({ theme, title, eyebrow, step, totalSteps, action = null, back = true }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 14 }}>
        {back && (
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, letterSpacing: 1.2 }}>{eyebrow}</div>}
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: eyebrow ? 1 : 0 }}>{title}</div>
        </div>
        {action}
      </div>
      {step && (
        <div style={{ display: 'flex', gap: 4, paddingBottom: 16 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: i < step ? theme.accent : theme.surface2,
            }} />
          ))}
        </div>
      )}
    </>
  );
}

function PrimaryBar({ theme, label, sub, onClick }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, marginTop: 'auto',
      padding: '12px 0',
      background: `linear-gradient(to top, ${theme.bg} 60%, transparent)`,
    }}>
      <div style={{
        padding: '14px 20px', borderRadius: 18,
        background: theme.accent, color: theme.accentInk,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 15, fontWeight: 700, letterSpacing: 0.2,
      }}>
        <div>
          {label}
          {sub && <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.65, marginTop: 2 }}>{sub}</div>}
        </div>
        <PArrow size={20} stroke={theme.accentInk} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G1 — PROGRAM LIBRARY (entry point)
// ─────────────────────────────────────────────────────────────
function ProgramsLibraryScreen({ theme }) {
  return (
    <ScreenShell theme={theme}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, letterSpacing: 0.3 }}>BIBLIOTHÈQUE</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 2, letterSpacing: -0.6 }}>Programmes</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'grid', placeItems: 'center',
        }}>
          <IconSearch size={18} stroke={theme.text} />
        </div>
      </div>

      {/* Create CTA */}
      <div style={{
        padding: 18, borderRadius: 22,
        background: theme.accent, color: theme.accentInk,
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: theme.accentInk, color: theme.accent,
          display: 'grid', placeItems: 'center',
        }}><PPlus size={22} stroke={theme.accent} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Créer mon programme</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Sur-mesure · de zéro ou depuis un template</div>
        </div>
        <PArrow size={20} stroke={theme.accentInk} />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, marginLeft: -20, paddingLeft: 20 }}>
        {[
          { l: 'Tous', on: true },
          { l: 'Force' }, { l: 'Hypertrophie' }, { l: 'Débutant' }, { l: 'Full body' },
        ].map((f, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 999,
            background: f.on ? theme.text : theme.surface,
            color: f.on ? theme.bg : theme.text,
            border: f.on ? 'none' : `1px solid ${theme.border}`,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{f.l}</div>
        ))}
      </div>

      {/* Mes programmes */}
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '4px 4px 10px' }}>MES PROGRAMMES</div>
      {[
        { name: 'Push Pull Legs 6×', tag: 'Hypertrophie · 6/sem', wks: 12, prog: 25, active: true },
        { name: 'Mon Full Body',     tag: 'Personnalisé · 3/sem', wks: 8, prog: 0 },
      ].map((p, i) => (
        <div key={i} style={{
          padding: '14px 16px', borderRadius: 18,
          background: theme.surface, border: `1px solid ${p.active ? theme.accent : theme.border}`,
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: theme.surface2, display: 'grid', placeItems: 'center',
            }}><PDumb size={20} stroke={theme.text} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                {p.active && <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: theme.accent, color: theme.accentInk, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</div>}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>
                {p.tag} · {p.wks} sem
              </div>
            </div>
            <PChevR size={14} stroke={theme.muted} />
          </div>
          {p.active && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, borderRadius: 999, background: theme.surface2, overflow: 'hidden' }}>
                <div style={{ width: `${p.prog}%`, height: '100%', background: theme.accent }} />
              </div>
              <div style={{ fontSize: 10, color: theme.muted, fontFamily: PMONO, marginTop: 6 }}>Semaine 3 / 12</div>
            </div>
          )}
        </div>
      ))}

      {/* Templates */}
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '18px 4px 10px' }}>TEMPLATES</div>
      {[
        { name: 'Full Body 3×',  tag: 'Débutant · 3/sem',     wks: 8,  ex: 18 },
        { name: 'Upper / Lower', tag: 'Intermédiaire · 4/sem', wks: 10, ex: 24 },
        { name: '5/3/1 BBB',     tag: 'Force · 4/sem',          wks: 12, ex: 20 },
        { name: 'StrongLifts 5×5', tag: 'Débutant · 3/sem',     wks: 12, ex: 5  },
      ].map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: theme.surface2, display: 'grid', placeItems: 'center',
            fontFamily: PMONO, fontWeight: 700, fontSize: 13, color: theme.muted,
          }}>T</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>
              {p.tag} · {p.wks} sem · {p.ex} exos
            </div>
          </div>
          <PChevR size={14} stroke={theme.muted} />
        </div>
      ))}

      <div style={{ height: 18 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G2 — NEW PROGRAM · META
// ─────────────────────────────────────────────────────────────
function ProgramMetaScreen({ theme }) {
  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="ÉTAPE 1 / 4" title="Infos du programme" step={1} totalSteps={4} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Name */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `2px solid ${theme.accent}`,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>NOM DU PROGRAMME</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, letterSpacing: -0.3 }}>
            Mon Push Pull Legs<span style={{ display: 'inline-block', width: 2, height: 18, background: theme.accent, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s infinite' }} />
          </div>
        </div>

        {/* Objectif */}
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2, padding: '10px 4px 8px' }}>OBJECTIF</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Hypertrophie', sel: true },
            { l: 'Force' },
            { l: 'Endurance' },
            { l: 'Perte de gras' },
          ].map(o => (
            <div key={o.l} style={{
              padding: '14px 14px', borderRadius: 14,
              background: o.sel ? theme.accent : theme.surface,
              color: o.sel ? theme.accentInk : theme.text,
              border: o.sel ? 'none' : `1px solid ${theme.border}`,
              fontSize: 13, fontWeight: 600,
            }}>
              {o.sel && <PCheck size={14} stroke={theme.accentInk} />} {o.l}
            </div>
          ))}
        </div>

        {/* Niveau */}
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2, padding: '10px 4px 8px' }}>NIVEAU</div>
        <div style={{
          display: 'flex', padding: 4, borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          {['Débutant', 'Intermédiaire', 'Avancé'].map((l, i) => (
            <div key={l} style={{
              flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 10,
              background: i === 1 ? theme.text : 'transparent',
              color: i === 1 ? theme.bg : theme.text,
              fontSize: 12, fontWeight: 600,
            }}>{l}</div>
          ))}
        </div>

        {/* Durée */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>DURÉE</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>12 semaines</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={pBtnSq(theme)}><span style={{ fontFamily: PMONO, fontWeight: 700, fontSize: 14 }}>−</span></div>
            <div style={{ fontFamily: PMONO, fontWeight: 700, fontSize: 18, minWidth: 28, textAlign: 'center' }}>12</div>
            <div style={pBtnSq(theme)}><span style={{ fontFamily: PMONO, fontWeight: 700, fontSize: 14 }}>+</span></div>
          </div>
        </div>

        {/* Fréquence */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>SÉANCES / SEMAINE</div>
            <div style={{ fontFamily: PMONO, fontWeight: 700, fontSize: 14 }}>6</div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n} style={{
                flex: 1, height: 38, borderRadius: 10,
                display: 'grid', placeItems: 'center',
                background: n <= 6 ? theme.accent : theme.surface2,
                color: n <= 6 ? theme.accentInk : theme.muted,
                fontFamily: PMONO, fontWeight: 700, fontSize: 13,
              }}>{n}</div>
            ))}
          </div>
        </div>

        {/* Couleur */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Couleur du programme</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[theme.accent, '#ff7a3a', '#3a7dff', '#a855f7', '#10b981'].map((c, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: 999,
                background: c,
                border: i === 0 ? `2px solid ${theme.text}` : 'none',
                boxShadow: i === 0 ? `0 0 0 2px ${theme.bg}` : 'none',
              }} />
            ))}
          </div>
        </div>

        <div style={{ height: 14 }} />
        <PrimaryBar theme={theme} label="Continuer" sub="Étape suivante : structurer la semaine" />
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G3 — WEEK STRUCTURE
// ─────────────────────────────────────────────────────────────
function WeekStructureScreen({ theme }) {
  const days = [
    { d: 'LUN', s: { type: 'PUSH', name: 'Push · Pec & Triceps', ex: 6 }, tone: 'a' },
    { d: 'MAR', s: { type: 'PULL', name: 'Pull · Dos & Biceps', ex: 6 }, tone: 'b' },
    { d: 'MER', s: { type: 'LEGS', name: 'Legs · Quadriceps', ex: 6 }, tone: 'c' },
    { d: 'JEU', s: null },
    { d: 'VEN', s: { type: 'PUSH', name: 'Push · Épaules & Triceps', ex: 5 }, tone: 'a' },
    { d: 'SAM', s: { type: 'PULL', name: 'Pull · Dos épaisseur', ex: 5 }, tone: 'b' },
    { d: 'DIM', s: { type: 'LEGS', name: 'Legs · Postérieur', ex: 5 }, tone: 'c' },
  ];
  const toneBg = { a: theme.accent, b: theme.surface2, c: theme.text };
  const toneFg = { a: theme.accentInk, b: theme.text, c: theme.bg };

  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="ÉTAPE 2 / 4" title="Structure semaine" step={2} totalSteps={4} action={
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, padding: '8px 0' }}>Suivant</div>
        } />
        <div style={{ display: 'flex', gap: 12, fontFamily: PMONO, fontSize: 11, color: theme.muted, paddingBottom: 12 }}>
          <span><b style={{ color: theme.text, fontFamily: PFONT }}>6</b> séances</span>
          <span>·</span>
          <span><b style={{ color: theme.text, fontFamily: PFONT }}>1</b> repos</span>
          <span>·</span>
          <span>~5h40 / sem</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {days.map((day, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 44, padding: '12px 0', textAlign: 'center',
              borderRadius: 12, background: theme.surface, border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{day.d}</div>
              <div style={{ fontFamily: PMONO, fontSize: 14, fontWeight: 700, marginTop: 2 }}>{i + 1}</div>
            </div>
            {day.s ? (
              <div style={{
                flex: 1, padding: '12px 14px', borderRadius: 14,
                background: theme.surface, border: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  padding: '4px 8px', borderRadius: 6,
                  background: toneBg[day.tone],
                  color: toneFg[day.tone],
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: PMONO,
                }}>{day.s.type}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {day.s.name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>{day.s.ex} exercices</div>
                </div>
                <IconGrip size={18} stroke={theme.dim} />
              </div>
            ) : (
              <div style={{
                flex: 1, padding: '12px 14px', borderRadius: 14,
                background: 'transparent', border: `1px dashed ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
                color: theme.muted, fontSize: 13, fontWeight: 500,
              }}>
                <PPlus size={16} stroke={theme.muted} />
                Repos — tap pour ajouter une séance
              </div>
            )}
          </div>
        ))}

        {/* Tip */}
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 14,
          background: theme.surface2,
          fontSize: 11, color: theme.muted, lineHeight: 1.5,
        }}>
          <b style={{ color: theme.text }}>Astuce</b> · maintiens une séance pour la dupliquer ou réordonner. Les séances avec le même type partagent automatiquement leurs progressions.
        </div>

        <div style={{ height: 14 }} />
        <PrimaryBar theme={theme} label="Configurer les séances" sub="6 séances à compléter" />
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G4 — SESSION EDITOR
// ─────────────────────────────────────────────────────────────
function SessionEditorScreen({ theme }) {
  const exercises = [
    { name: 'Développé couché', tag: 'PECS', sets: '4 × 6-8', rpe: 'RPE 8', rest: '2:00' },
    { name: 'Développé incliné haltères', tag: 'PECS H.', sets: '4 × 8-10', rpe: 'RPE 8', rest: '1:30' },
    { name: 'Écarté poulie vis-à-vis', tag: 'PECS', sets: '3 × 12-15', rpe: 'RPE 9', rest: '1:00', superset: 'A' },
    { name: 'Dips lestés', tag: 'TRICEPS', sets: '3 × 8-10', rpe: 'RPE 8', rest: '1:00', superset: 'A' },
    { name: 'Élévations latérales', tag: 'ÉPAULES', sets: '4 × 12-15', rpe: 'RPE 9', rest: '0:45' },
    { name: 'Triceps à la poulie', tag: 'TRICEPS', sets: '3 × 12', rpe: 'RPE 9', rest: '0:45' },
  ];

  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="ÉDITER SÉANCE · 1/6" title="Push · Pec & Triceps"
          action={
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: theme.surface, border: `1px solid ${theme.border}`,
              display: 'grid', placeItems: 'center',
            }}><IconEdit size={16} stroke={theme.text} /></div>
          } />
        <div style={{ display: 'flex', gap: 6, paddingBottom: 12 }}>
          <Pill theme={theme} tone="surface2">PUSH</Pill>
          <Pill theme={theme} tone="surface">PECS</Pill>
          <Pill theme={theme} tone="surface">TRICEPS</Pill>
          <Pill theme={theme} tone="surface">ÉPAULES</Pill>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '4px 4px 10px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>EXERCICES</div>
          <div style={{ fontFamily: PMONO, fontSize: 11, color: theme.muted }}>6 · 22 séries · ~58 min</div>
        </div>

        {exercises.map((ex, i) => {
          const isSuper = !!ex.superset;
          return (
            <div key={i} style={{ position: 'relative' }}>
              {isSuper && exercises[i - 1]?.superset === ex.superset && (
                <div style={{
                  position: 'absolute', left: 20, top: -8, width: 2, height: 8,
                  background: theme.accent,
                }} />
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 14,
                background: theme.surface,
                border: `1px solid ${isSuper ? theme.accent : theme.border}`,
                marginBottom: 6,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: isSuper ? theme.accent : theme.surface2,
                  color: isSuper ? theme.accentInk : theme.text,
                  display: 'grid', placeItems: 'center',
                  fontFamily: PMONO, fontWeight: 700, fontSize: 12,
                }}>{isSuper ? ex.superset : i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>
                    {ex.sets} · {ex.rpe} · {ex.rest}
                  </div>
                </div>
                <IconGrip size={18} stroke={theme.dim} />
              </div>
              {isSuper && exercises[i + 1]?.superset === ex.superset && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 6px 26px' }}>
                  <IconLink size={12} stroke={theme.accent} />
                  <span style={{ fontSize: 10, fontFamily: PMONO, fontWeight: 700, color: theme.accent, letterSpacing: 1 }}>SUPERSET A</span>
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 14px', borderRadius: 14,
          background: 'transparent', border: `1px dashed ${theme.border}`,
          color: theme.muted, fontSize: 13, fontWeight: 600,
          marginTop: 8,
        }}>
          <PPlus size={16} stroke={theme.muted} /> Ajouter un exercice
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 600,
          }}><IconCopy size={16} stroke={theme.text} /> Dupliquer</div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: theme.danger,
          }}><IconTrash size={16} stroke={theme.danger} /> Supprimer</div>
        </div>

        <div style={{ height: 14 }} />
        <PrimaryBar theme={theme} label="Sauvegarder la séance" sub="Et passer à Pull · Dos" />
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G5 — EXERCISE PICKER
// ─────────────────────────────────────────────────────────────
function ExercisePickerScreen({ theme }) {
  const muscles = [
    { l: 'Tous', on: true }, { l: 'Pecs' }, { l: 'Dos' }, { l: 'Épaules' },
    { l: 'Bras' }, { l: 'Jambes' }, { l: 'Core' },
  ];
  const exercises = [
    { name: 'Développé couché barre', muscle: 'Pecs', eq: 'Barre', pop: '★★★', sel: true },
    { name: 'Développé couché haltères', muscle: 'Pecs', eq: 'Haltères', pop: '★★' },
    { name: 'Développé incliné barre', muscle: 'Pecs', eq: 'Barre', pop: '★★★' },
    { name: 'Développé incliné haltères', muscle: 'Pecs H.', eq: 'Haltères', pop: '★★★', sel: true },
    { name: 'Développé décliné', muscle: 'Pecs B.', eq: 'Barre', pop: '★' },
    { name: 'Écarté poulie vis-à-vis', muscle: 'Pecs', eq: 'Poulie', pop: '★★', sel: true },
    { name: 'Écarté couché haltères', muscle: 'Pecs', eq: 'Haltères', pop: '★★' },
    { name: 'Pompes', muscle: 'Pecs', eq: 'Poids du corps', pop: '★★' },
    { name: 'Dips poids du corps', muscle: 'Pecs B. / Triceps', eq: 'Barres parallèles', pop: '★★★' },
  ];
  const selectedCount = exercises.filter(e => e.sel).length;

  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="AJOUTER À LA SÉANCE" title="Bibliothèque" action={
          <div style={{ padding: '8px 12px', borderRadius: 10, background: theme.text, color: theme.bg, fontSize: 12, fontWeight: 700 }}>
            <PClose size={14} stroke={theme.bg} />
          </div>
        } />

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <IconSearch size={16} stroke={theme.muted} />
          <input
            readOnly
            value="dévelop"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: theme.text, fontFamily: PFONT, fontSize: 14, fontWeight: 500, padding: 0,
            }}
          />
          <div style={{
            padding: '4px 8px', borderRadius: 8, background: theme.surface2,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: theme.muted,
          }}>
            <IconFilter size={12} stroke={theme.muted} /> 2
          </div>
        </div>

        {/* Muscle chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginLeft: -20, paddingLeft: 20, marginBottom: 12 }}>
          {muscles.map((m, i) => (
            <div key={i} style={{
              padding: '6px 12px', borderRadius: 999,
              background: m.on ? theme.text : theme.surface,
              color: m.on ? theme.bg : theme.text,
              border: m.on ? 'none' : `1px solid ${theme.border}`,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{m.l}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '4px 4px 10px' }}>
          {exercises.length} RÉSULTATS
        </div>
        {exercises.map((ex, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${ex.sel ? theme.accent : theme.border}`,
            marginBottom: 6,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: theme.surface2, display: 'grid', placeItems: 'center',
            }}><PDumb size={20} stroke={theme.text} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>
                {ex.muscle} · {ex.eq} · <span style={{ color: theme.accent }}>{ex.pop}</span>
              </div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: ex.sel ? theme.accent : 'transparent',
              border: ex.sel ? 'none' : `1.5px solid ${theme.dim}`,
              display: 'grid', placeItems: 'center',
            }}>
              {ex.sel ? <PCheck size={14} stroke={theme.accentInk} /> : <PPlus size={14} stroke={theme.dim} />}
            </div>
          </div>
        ))}

        <div style={{ height: 14 }} />
        <PrimaryBar theme={theme} label={`Ajouter ${selectedCount} exercice${selectedCount > 1 ? 's' : ''}`} sub="Configurer ensuite séries & repos" />
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G6 — EXERCISE CONFIG
// ─────────────────────────────────────────────────────────────
function ExerciseConfigScreen({ theme }) {
  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="EXERCICE 1 / 6" title="Développé couché" action={
          <div style={{ padding: '8px 14px', borderRadius: 10, background: theme.accent, color: theme.accentInk, fontSize: 12, fontWeight: 700 }}>OK</div>
        } />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Visual / muscle tags */}
        <div style={{
          padding: 16, borderRadius: 18,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{
            height: 100, borderRadius: 12, background: theme.surface2,
            display: 'grid', placeItems: 'center',
            color: theme.muted, fontSize: 11, fontFamily: PMONO,
          }}>illustration musculaire</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <Pill theme={theme} tone="accent">PECS</Pill>
            <Pill theme={theme} tone="surface2">TRICEPS</Pill>
            <Pill theme={theme} tone="surface2">ÉPAULE ANT.</Pill>
          </div>
        </div>

        {/* Sets × reps */}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '0 4px 10px' }}>SÉRIES × RÉPS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2, textAlign: 'center' }}>SÉRIES</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={pBtnSq(theme)}>−</div>
              <div style={{ fontFamily: PMONO, fontSize: 28, fontWeight: 700 }}>4</div>
              <div style={pBtnSq(theme)}>+</div>
            </div>
          </div>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2, textAlign: 'center' }}>REPS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={pBtnSq(theme)}>−</div>
              <div style={{ fontFamily: PMONO, fontSize: 22, fontWeight: 700 }}>6-8</div>
              <div style={pBtnSq(theme)}>+</div>
            </div>
          </div>
        </div>

        {/* Reps mode */}
        <div style={{
          display: 'flex', padding: 4, borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          {['Fixe', 'Plage', 'AMRAP'].map((l, i) => (
            <div key={l} style={{
              flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              background: i === 1 ? theme.text : 'transparent',
              color: i === 1 ? theme.bg : theme.muted,
              fontSize: 11, fontWeight: 600,
            }}>{l}</div>
          ))}
        </div>

        {/* RPE */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>INTENSITÉ CIBLE</div>
            <div style={{ fontFamily: PMONO, fontWeight: 700, fontSize: 14, color: theme.accent }}>RPE 8</div>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
              <div key={v} style={{
                flex: 1, height: 28, borderRadius: 6,
                background: v <= 8 ? theme.accent : theme.surface2,
                opacity: v === 8 ? 1 : (v < 8 ? 0.4 : 1),
                border: v === 8 ? `2px solid ${theme.text}` : 'none',
                display: 'grid', placeItems: 'center',
                fontFamily: PMONO, fontSize: 9, fontWeight: 700,
                color: v <= 8 ? theme.accentInk : theme.muted,
              }}>{v}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>2 reps en réserve · proche de l'échec</div>
        </div>

        {/* Repos */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>REPOS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6, fontFamily: PMONO }}>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>2:00</span>
                <span style={{ fontSize: 11, color: theme.muted }}>entre séries</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1:00', '1:30', '2:00', '3:00'].map(t => (
                <div key={t} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: t === '2:00' ? theme.text : theme.surface2,
                  color: t === '2:00' ? theme.bg : theme.text,
                  fontFamily: PMONO, fontSize: 11, fontWeight: 700,
                }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Progression */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Progression auto</div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>+2,5 kg quand reps en haut de plage</div>
          </div>
          <div style={{
            width: 46, height: 28, borderRadius: 999,
            background: theme.accent,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: 20,
              width: 24, height: 24, borderRadius: 999,
              background: theme.accentInk,
            }} />
          </div>
        </div>

        {/* Notes */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>NOTES</div>
          <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
            Toucher la poitrine, scapulas rétractées, prise médiane.
          </div>
        </div>

        <div style={{ height: 14 }} />
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN G7 — REVIEW & ACTIVATE
// ─────────────────────────────────────────────────────────────
function ProgramReviewScreen({ theme }) {
  const days = ['L','M','M','J','V','S','D'];
  const schedule = [1,1,1,0,1,1,1]; // 6 days

  return (
    <ScreenShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <ProgHeader theme={theme} eyebrow="ÉTAPE 4 / 4" title="Récapitulatif" step={4} totalSteps={4} action={
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}><IconEdit size={16} stroke={theme.text} /></div>
        } />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Hero */}
        <Card theme={theme} tone="accent" style={{ padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.7 }}>NOUVEAU PROGRAMME</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: -0.5, lineHeight: 1.1 }}>
            Mon Push<br/>Pull Legs
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, fontFamily: PMONO, fontSize: 12, fontWeight: 500 }}>
            <div><span style={{ opacity: 0.55 }}>SEM</span> <b>12</b></div>
            <div><span style={{ opacity: 0.55 }}>JRS/SEM</span> <b>6</b></div>
            <div><span style={{ opacity: 0.55 }}>EXOS</span> <b>33</b></div>
            <div><span style={{ opacity: 0.55 }}>RPE</span> <b>8</b></div>
          </div>
        </Card>

        {/* Week pattern */}
        <div style={{
          padding: '16px', borderRadius: 18,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, marginBottom: 12 }}>RYTHME HEBDO</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, fontFamily: PMONO, marginBottom: 4 }}>{d}</div>
                <div style={{
                  height: 36, borderRadius: 8,
                  background: schedule[i] ? theme.accent : theme.surface2,
                  display: 'grid', placeItems: 'center',
                }}>
                  {schedule[i] ? <PCheck size={14} stroke={theme.accentInk} /> : <span style={{ fontSize: 10, color: theme.muted, fontFamily: PMONO }}>—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '8px 4px 10px' }}>SÉANCES (6)</div>
        {[
          { d: 'LUN', tag: 'PUSH', name: 'Push · Pec & Triceps', ex: 6, est: '58 min' },
          { d: 'MAR', tag: 'PULL', name: 'Pull · Dos & Biceps', ex: 6, est: '54 min' },
          { d: 'MER', tag: 'LEGS', name: 'Legs · Quadriceps', ex: 6, est: '1h08' },
          { d: 'VEN', tag: 'PUSH', name: 'Push · Épaules & Triceps', ex: 5, est: '48 min' },
          { d: 'SAM', tag: 'PULL', name: 'Pull · Dos épaisseur', ex: 5, est: '50 min' },
          { d: 'DIM', tag: 'LEGS', name: 'Legs · Postérieur', ex: 5, est: '52 min' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            marginBottom: 6,
          }}>
            <div style={{
              width: 38, textAlign: 'center', borderRadius: 8,
              padding: '6px 0', background: theme.surface2,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1, fontFamily: PMONO }}>{s.d}</div>
            </div>
            <div style={{
              padding: '3px 6px', borderRadius: 5,
              background: theme.text, color: theme.bg,
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: PMONO,
            }}>{s.tag}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: theme.muted, fontFamily: PMONO, marginTop: 2 }}>{s.ex} exos · ~{s.est}</div>
            </div>
            <PChevR size={14} stroke={theme.dim} />
          </div>
        ))}

        {/* Start options */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginTop: 14, marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Démarrer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, fontSize: 12, color: theme.muted }}>Lundi 18 mai 2026</div>
            <div style={{
              padding: '6px 12px', borderRadius: 8,
              background: theme.surface2,
              fontSize: 11, fontWeight: 600, color: theme.text,
            }}>Modifier</div>
          </div>
        </div>

        <div style={{ height: 14 }} />
        <PrimaryBar theme={theme} label="Activer le programme" sub="Remplace Push Pull Legs 6× actuel" />
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  ProgramsLibraryScreen, ProgramMetaScreen, WeekStructureScreen,
  SessionEditorScreen, ExercisePickerScreen, ExerciseConfigScreen,
  ProgramReviewScreen,
});
