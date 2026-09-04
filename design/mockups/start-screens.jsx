// start-screens.jsx — Gym Track choose-program-and-start-session flow (4 screens)

const {
  ScreenShell: SShell, TabBar: STabBar, Pill: SPill, Card: SCard,
  FONT: SFONT, MONO: SMONO, btnSq: sBtnSq,
  IconChevR: SChev, IconPlus: SPlus, IconCheck: SCheck, IconClose: SClose,
  IconArrow: SArrow, IconBolt: SBolt, IconDumb: SDumb, IconClock: SClock,
  IconChart: SChart, IconFlame: SFlame,
} = window;

const sIc = (paths) => ({ size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const IconCalendar = sIc(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>);
const IconPlay     = sIc(<><polygon points="7 5 19 12 7 19" fill="currentColor" /></>);
const IconWater    = sIc(<><path d="M12 3s-7 7-7 12a7 7 0 1 0 14 0c0-5-7-12-7-12z" /></>);
const IconShare    = sIc(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8L16 7.5M8.2 13.2L16 16.5" /></>);
const IconStar     = sIc(<><polygon points="12 3 14.5 9 21 9.5 16 14 17.5 21 12 17.5 6.5 21 8 14 3 9.5 9.5 9 12 3" /></>);
const IconUsers    = sIc(<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c.5-3 3-5 6-5s5.5 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M15 15c2 0 5 1.5 6 4" /></>);

// ─────────────────────────────────────────────────────────────
// SCREEN S1 — PROGRAM DETAIL
// ─────────────────────────────────────────────────────────────
function ProgramDetailScreen({ theme }) {
  const days = ['L','M','M','J','V','S','D'];
  const schedule = [
    { type: 'PUSH', tone: 'a' }, { type: 'PULL', tone: 'b' }, { type: 'LEGS', tone: 'c' },
    null, { type: 'PUSH', tone: 'a' }, { type: 'PULL', tone: 'b' }, { type: 'LEGS', tone: 'c' },
  ];
  const toneBg = { a: theme.accent, b: theme.surface2, c: theme.text };
  const toneFg = { a: theme.accentInk, b: theme.text, c: theme.bg };

  return (
    <SShell theme={theme} pad={false}>
      {/* Hero with top bar overlaid */}
      <div style={{
        background: theme.accent, color: theme.accentInk,
        padding: '60px 20px 24px',
        position: 'relative',
      }}>
        {/* top bar */}
        <div style={{
          position: 'absolute', top: 14, left: 20, right: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.accentInk, color: theme.accent,
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: theme.accentInk, color: theme.accent,
              display: 'grid', placeItems: 'center',
            }}><IconStar size={16} stroke={theme.accent} /></div>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: theme.accentInk, color: theme.accent,
              display: 'grid', placeItems: 'center',
            }}><IconShare size={16} stroke={theme.accent} /></div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.7 }}>PROGRAMME · HYPERTROPHIE</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, letterSpacing: -0.8, lineHeight: 1.05 }}>
          Push Pull<br/>Legs 6×
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 16, fontFamily: SMONO, fontSize: 12, fontWeight: 500 }}>
          <div><span style={{ opacity: 0.55 }}>SEM</span> <b>12</b></div>
          <div><span style={{ opacity: 0.55 }}>JRS/SEM</span> <b>6</b></div>
          <div><span style={{ opacity: 0.55 }}>EXOS</span> <b>33</b></div>
          <div><span style={{ opacity: 0.55 }}>NIVEAU</span> <b>Inter.</b></div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 0' }}>
        {/* Social proof */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 999,
                background: theme.surface2, border: `2px solid ${theme.surface}`,
                marginLeft: i ? -10 : 0,
                display: 'grid', placeItems: 'center',
                fontSize: 10, fontWeight: 700, color: theme.muted,
              }}>{['JM','SK','LM'][i]}</div>
            ))}
          </div>
          <div style={{ flex: 1, fontSize: 12, color: theme.muted }}>
            <b style={{ color: theme.text }}>2 184 utilisateurs</b> sur ce programme
          </div>
          <div style={{ fontFamily: SMONO, fontSize: 12, fontWeight: 700, color: theme.accent }}>★ 4.8</div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 14, lineHeight: 1.55, color: theme.text, marginBottom: 6 }}>
          Routine 6 jours classique pour gain de masse : 2 push, 2 pull, 2 legs avec variation entre force et volume.
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
          Volume modéré · 16-22 séries / muscle / sem · RPE 7-9
        </div>

        {/* Weekly schedule */}
        <div style={{
          padding: 16, borderRadius: 18,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, marginBottom: 12 }}>RYTHME HEBDO</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, fontFamily: SMONO, marginBottom: 4 }}>{d}</div>
                {schedule[i] ? (
                  <div style={{
                    height: 40, borderRadius: 8,
                    background: toneBg[schedule[i].tone],
                    color: toneFg[schedule[i].tone],
                    display: 'grid', placeItems: 'center',
                    fontFamily: SMONO, fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  }}>{schedule[i].type}</div>
                ) : (
                  <div style={{
                    height: 40, borderRadius: 8,
                    background: theme.surface2,
                    display: 'grid', placeItems: 'center',
                    color: theme.muted, fontSize: 11, fontFamily: SMONO,
                  }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '8px 4px 10px' }}>SÉANCES (6)</div>
        {[
          { d: 'LUN', tag: 'PUSH', name: 'Push · Pec & Triceps', ex: 6, est: '58 min', exos: 'DC barre · DC incl. halt. · Dips · Élév. lat. · Triceps poulie · Écarté' },
          { d: 'MAR', tag: 'PULL', name: 'Pull · Dos & Biceps', ex: 6, est: '54 min', exos: 'Tractions · Rowing barre · Tirage poitrine · Curl barre · Curl marteau' },
          { d: 'MER', tag: 'LEGS', name: 'Legs · Quadriceps', ex: 6, est: '1h08', exos: 'Squat · Presse · Fentes · Leg extension · Mollets debout' },
          { d: 'VEN', tag: 'PUSH', name: 'Push · Épaules & Triceps', ex: 5, est: '48 min', exos: 'OHP · Élévations · Skull crushers · Dips · Pompes' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '12px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.border}`,
            marginBottom: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, textAlign: 'center', borderRadius: 8,
                padding: '6px 0', background: theme.surface2,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1, fontFamily: SMONO }}>{s.d}</div>
              </div>
              <div style={{
                padding: '3px 6px', borderRadius: 5,
                background: theme.text, color: theme.bg,
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: SMONO,
              }}>{s.tag}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: theme.muted, fontFamily: SMONO, marginTop: 2 }}>{s.ex} exos · ~{s.est}</div>
              </div>
              <SChev size={14} stroke={theme.dim} />
            </div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 8, lineHeight: 1.4, paddingLeft: 48 }}>
              {s.exos}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: '6px 0 4px' }}>
          + 2 séances · voir tout
        </div>

        {/* Sticky CTA */}
        <div style={{ height: 14 }} />
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '12px 0',
          background: `linear-gradient(to top, ${theme.bg} 60%, transparent)`,
          display: 'flex', gap: 8,
        }}>
          <div style={{
            padding: '14px 18px', borderRadius: 16,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600,
          }}>Personnaliser</div>
          <div style={{
            flex: 1, padding: '14px 20px', borderRadius: 16,
            background: theme.text, color: theme.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 15, fontWeight: 700,
          }}>
            Utiliser ce programme <SArrow size={18} stroke={theme.bg} />
          </div>
        </div>
      </div>
    </SShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN S2 — ACTIVATE PROGRAM (bottom sheet style)
// ─────────────────────────────────────────────────────────────
function ActivateProgramScreen({ theme }) {
  // simulate a sheet over a dimmed canvas of program detail
  return (
    <SShell theme={theme} pad={false}>
      {/* Dimmed background showing program detail */}
      <div style={{
        position: 'absolute', inset: 0,
        background: theme.bg,
        opacity: 0.4,
      }} />

      {/* Sheet */}
      <div style={{
        marginTop: 'auto',
        background: theme.surface,
        borderRadius: '24px 24px 0 0',
        padding: '12px 20px 28px',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        {/* drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: theme.dim, margin: '0 auto 16px',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>ACTIVER LE PROGRAMME</div>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: theme.surface2,
            display: 'grid', placeItems: 'center',
          }}><SClose size={14} stroke={theme.text} /></div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginTop: 6 }}>Push Pull Legs 6×</div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>12 semaines · 6 séances/sem</div>

        {/* Replace warning */}
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 14,
          background: theme.surface2,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 999,
            background: theme.danger, color: '#fff',
            display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>!</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Remplace ton programme actuel</div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, lineHeight: 1.5 }}>
              "Mon Full Body" sera archivé. Ton historique reste accessible.
            </div>
          </div>
        </div>

        {/* Start date */}
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: theme.surface2,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>DATE DE DÉMARRAGE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: theme.accent, color: theme.accentInk,
              display: 'grid', placeItems: 'center',
            }}><IconCalendar size={18} stroke={theme.accentInk} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Demain · Lun 18 mai</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>1re séance · Push · Pec & Triceps</div>
            </div>
            <div style={{
              padding: '6px 12px', borderRadius: 8,
              background: theme.surface,
              fontSize: 11, fontWeight: 600,
            }}>Modifier</div>
          </div>
        </div>

        {/* Quick options */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['Aujourd\'hui', 'Demain', 'Lun prochain'].map((opt, i) => (
            <div key={opt} style={{
              flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 10,
              background: i === 1 ? theme.text : theme.surface2,
              color: i === 1 ? theme.bg : theme.text,
              fontSize: 12, fontWeight: 600,
            }}>{opt}</div>
          ))}
        </div>

        {/* Toggles */}
        <div style={{
          marginTop: 16, borderRadius: 14,
          background: theme.surface2,
          padding: '4px 0',
        }}>
          {[
            { l: 'Notifications de rappel', sub: 'Lun-Mer-Ven-Sam-Dim · 18:30', on: true },
            { l: 'Reset des PR de référence', sub: 'Repartir des perfs actuelles', on: false },
          ].map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              borderBottom: i === 0 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.l}</div>
                <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>{t.sub}</div>
              </div>
              <div style={{
                width: 40, height: 24, borderRadius: 999,
                background: t.on ? theme.accent : theme.dim,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: t.on ? 18 : 2,
                  width: 20, height: 20, borderRadius: 999,
                  background: '#fff',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Confirm */}
        <div style={{
          marginTop: 18,
          padding: '16px 20px', borderRadius: 16,
          background: theme.accent, color: theme.accentInk,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 15, fontWeight: 700,
        }}>
          <SCheck size={18} stroke={theme.accentInk} />
          Activer maintenant
        </div>
        <div style={{
          marginTop: 8, padding: '12px 0', textAlign: 'center',
          fontSize: 13, fontWeight: 600, color: theme.muted,
        }}>Annuler</div>
      </div>
    </SShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN S3 — TODAY'S SESSION BRIEF
// ─────────────────────────────────────────────────────────────
function TodayBriefScreen({ theme }) {
  return (
    <SShell theme={theme} pad={false}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>LUN. 18 MAI · SEMAINE 3</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Aperçu séance</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Hero session */}
        <SCard theme={theme} tone="accent" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '3px 7px', borderRadius: 5,
              background: theme.accentInk, color: theme.accent,
              fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: SMONO,
            }}>PUSH</div>
            <div style={{ fontSize: 10, opacity: 0.7, fontFamily: SMONO, fontWeight: 600 }}>JOUR 1 · SÉANCE 7 / 56</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10, letterSpacing: -0.6, lineHeight: 1.05 }}>
            Push<br/>Pec & Triceps
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontFamily: SMONO, fontSize: 12, fontWeight: 500 }}>
            <div><span style={{ opacity: 0.55 }}>EX</span> <b>6</b></div>
            <div><span style={{ opacity: 0.55 }}>SETS</span> <b>22</b></div>
            <div><span style={{ opacity: 0.55 }}>VOL.</span> <b>~5.8k kg</b></div>
            <div><span style={{ opacity: 0.55 }}>EST</span> <b>~58 min</b></div>
          </div>
        </SCard>

        {/* Vs last time */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>VS DERNIÈRE FOIS · IL Y A 4 JOURS</div>
            <div style={{ fontFamily: SMONO, fontSize: 11, color: theme.accent, fontWeight: 700 }}>↗ +2,5 kg</div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: SMONO }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: theme.muted }}>DC BARRE</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                <span style={{ color: theme.muted }}>80</span> → <span style={{ color: theme.accent }}>82,5</span> kg
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: theme.muted }}>DC INCL.</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                <span style={{ color: theme.muted }}>32</span> → <span style={{ color: theme.accent }}>34</span> kg
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: theme.muted }}>DIPS</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                <span style={{ color: theme.muted }}>+12,5</span> → <span style={{ color: theme.accent }}>+15</span> kg
              </div>
            </div>
          </div>
        </div>

        {/* Exercises preview */}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '4px 4px 10px' }}>AU PROGRAMME</div>
        {[
          { n: 'Développé couché', tag: 'PECS', sets: '4 × 6-8', w: '82,5 kg', rpe: '8' },
          { n: 'Développé incliné haltères', tag: 'PECS H.', sets: '4 × 8-10', w: '34 kg', rpe: '8' },
          { n: 'Écarté poulie vis-à-vis', tag: 'PECS', sets: '3 × 12-15', w: '14 kg', rpe: '9', sup: 'A' },
          { n: 'Dips lestés', tag: 'TRICEPS', sets: '3 × 8-10', w: '+15 kg', rpe: '8', sup: 'A' },
          { n: 'Élévations latérales', tag: 'ÉPAULES', sets: '4 × 12-15', w: '12 kg', rpe: '9' },
          { n: 'Triceps à la poulie', tag: 'TRICEPS', sets: '3 × 12', rpe: '9', w: '27,5 kg' },
        ].map((ex, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', borderRadius: 12,
            background: theme.surface, border: `1px solid ${ex.sup ? theme.accent : theme.border}`,
            marginBottom: 5,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: ex.sup ? theme.accent : theme.surface2,
              color: ex.sup ? theme.accentInk : theme.text,
              display: 'grid', placeItems: 'center',
              fontFamily: SMONO, fontWeight: 700, fontSize: 11,
            }}>{ex.sup || (i + 1)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.n}</div>
              <div style={{ fontSize: 10, color: theme.muted, fontFamily: SMONO, marginTop: 2 }}>
                {ex.sets} · <span style={{ color: theme.text }}>{ex.w}</span> · RPE {ex.rpe}
              </div>
            </div>
          </div>
        ))}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}>
            <SChart size={16} stroke={theme.text} /> Personnaliser
          </div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}>
            <IconCalendar size={16} stroke={theme.text} /> Reporter
          </div>
        </div>

        {/* CTA */}
        <div style={{ height: 14 }} />
        <div style={{
          position: 'sticky', bottom: 0, marginTop: 'auto',
          padding: '12px 0',
          background: `linear-gradient(to top, ${theme.bg} 60%, transparent)`,
        }}>
          <div style={{
            padding: '16px 22px', borderRadius: 18,
            background: theme.accent, color: theme.accentInk,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 16, fontWeight: 700,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: theme.accentInk, color: theme.accent,
                display: 'grid', placeItems: 'center',
              }}><IconPlay size={12} stroke={theme.accent} fill={theme.accent} /></div>
              Commencer
            </div>
            <div style={{ fontFamily: SMONO, fontSize: 12, fontWeight: 500, opacity: 0.7 }}>~58 min</div>
          </div>
        </div>
      </div>
    </SShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN S4 — PRE-SESSION BRIEFING (warmup + first exercise focus)
// ─────────────────────────────────────────────────────────────
function PreSessionScreen({ theme }) {
  return (
    <SShell theme={theme} pad={false} hasTopBar={true}>
      <div style={{ padding: '54px 20px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <SClose size={18} stroke={theme.text} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }}>PRÊT À COMMENCER</div>
          <div style={{ width: 38 }} />
        </div>

        {/* Title */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 8px', borderRadius: 5,
            background: theme.accent, color: theme.accentInk,
            fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: SMONO,
          }}>PUSH</div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10, letterSpacing: -0.7, lineHeight: 1.05 }}>
            Pec & Triceps
          </div>
        </div>

        {/* Equipment checklist */}
        <div style={{
          marginTop: 22, padding: '16px 18px', borderRadius: 18,
          background: theme.surface, border: `1px solid ${theme.border}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, marginBottom: 10 }}>MATÉRIEL REQUIS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Banc plat', 'Banc incliné', 'Barre olympique', 'Haltères 8-40 kg', 'Poulie haute', 'Barres parallèles', 'Ceinture de lest'].map(e => (
              <div key={e} style={{
                padding: '6px 10px', borderRadius: 8,
                background: theme.surface2,
                fontSize: 11, fontWeight: 500,
              }}>{e}</div>
            ))}
          </div>
        </div>

        {/* Warmup */}
        <div style={{
          marginTop: 12, padding: '16px 18px', borderRadius: 18,
          background: theme.surface, border: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>ÉCHAUFFEMENT SUGGÉRÉ</div>
            <div style={{ fontFamily: SMONO, fontSize: 11, color: theme.muted }}>~6 min</div>
          </div>
          {[
            { n: 'Cardio léger', d: '3 min · vélo ou rameur' },
            { n: 'Mobilité épaules', d: '8 cercles × 2 directions' },
            { n: 'Pompes', d: '2 × 10 reps' },
            { n: 'DC barre vide', d: '1 × 12 · 40 kg × 8 · 60 kg × 5' },
          ].map((w, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: `1.5px solid ${theme.dim}`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.n}</div>
                <div style={{ fontSize: 11, color: theme.muted, fontFamily: SMONO, marginTop: 1 }}>{w.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* First exercise focus */}
        <div style={{
          marginTop: 12,
          padding: '16px 18px', borderRadius: 18,
          background: theme.accentInk, color: theme.text,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: 1.4 }}>1RE SÉRIE · OBJECTIF</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10, fontFamily: SMONO }}>
            <span style={{ fontSize: 14, color: theme.muted }}>Développé couché</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6, fontFamily: SMONO }}>
            <span style={{ fontSize: 38, fontWeight: 700, color: theme.accent, letterSpacing: -1, lineHeight: 1 }}>82,5</span>
            <span style={{ fontSize: 16, color: theme.muted }}>kg</span>
            <span style={{ fontSize: 18, color: theme.muted, margin: '0 6px' }}>×</span>
            <span style={{ fontSize: 38, fontWeight: 700, color: theme.accent, letterSpacing: -1, lineHeight: 1 }}>6-8</span>
            <span style={{ fontSize: 16, color: theme.muted }}>reps</span>
          </div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
            "Toucher la poitrine, scapulas rétractées, prise médiane."
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Big CTA */}
        <div style={{ padding: '12px 0 8px' }}>
          <div style={{
            padding: '20px 24px', borderRadius: 22,
            background: theme.accent, color: theme.accentInk,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 18, fontWeight: 700, letterSpacing: -0.2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: theme.accentInk, color: theme.accent,
                display: 'grid', placeItems: 'center',
              }}><IconPlay size={16} stroke={theme.accent} fill={theme.accent} /></div>
              C'est parti
            </div>
            <SArrow size={22} stroke={theme.accentInk} />
          </div>
        </div>
        <div style={{
          padding: '10px 0', textAlign: 'center',
          fontSize: 13, fontWeight: 600, color: theme.muted,
        }}>Passer l'échauffement</div>
      </div>
    </SShell>
  );
}

Object.assign(window, {
  ProgramDetailScreen, ActivateProgramScreen, TodayBriefScreen, PreSessionScreen,
});
