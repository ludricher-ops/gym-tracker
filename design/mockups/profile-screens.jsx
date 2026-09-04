// profile-screens.jsx — Gym Track profile flow (6 screens)
// Reuses primitives from screens.jsx via window.*

const {
  ScreenShell, TabBar, Pill, Card, FONT, MONO, btnSq,
  IconChevR, IconUser, IconBolt, IconCheck, IconClose, IconArrow,
  IconPlus, IconMinus, IconClock, IconChart, IconFlame, IconList, IconDumb,
} = window;

// ─────────────────────────────────────────────────────────────
// Extra icons specific to profile flow
// ─────────────────────────────────────────────────────────────
const pIc = (paths) => ({ size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);
const IconHeart  = pIc(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />);
const IconTarget = pIc(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>);
const IconRuler  = pIc(<><rect x="3" y="9" width="18" height="6" rx="1.5" /><path d="M7 9v3M11 9v4M15 9v3M19 9v4" /></>);
const IconCog    = pIc(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5 0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.2 1.3L10 21h4l.4-2.4a7 7 0 0 0 2.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.3z" /></>);
const IconBell   = pIc(<><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2z" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
const IconDb     = pIc(<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>);
const IconInfo   = pIc(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>);
const IconLogout = pIc(<><path d="M9 4H5v16h4" /><path d="M16 8l4 4-4 4M20 12H10" /></>);
const IconCam    = pIc(<><path d="M5 8h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><circle cx="12" cy="13" r="3.5" /></>);
const IconScale  = pIc(<><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M8 11l1-2M16 11l-1-2M12 11l-.5-2" /></>);
const IconWorld  = pIc(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>);

// ─────────────────────────────────────────────────────────────
// Reusable: header used across all 6 screens
// ─────────────────────────────────────────────────────────────
function ProfileHeader({ theme, title, eyebrow, back = true, action = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 18 }}>
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
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: eyebrow ? 1 : 0 }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

// Section header with optional caption
function SectionLabel({ theme, children, hint = null, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '18px 4px 8px', ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>{children}</div>
      {hint && <div style={{ fontSize: 11, color: theme.muted, fontFamily: MONO }}>{hint}</div>}
    </div>
  );
}

// Row used in setting lists
function Row({ theme, icon: Icon, label, value, chevron = true, danger = false, last = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      {Icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: theme.surface2,
          display: 'grid', placeItems: 'center',
          color: danger ? theme.danger : theme.text,
        }}>
          <Icon size={16} stroke={danger ? theme.danger : theme.text} />
        </div>
      )}
      <div style={{
        flex: 1, fontSize: 14, fontWeight: 500,
        color: danger ? theme.danger : theme.text,
      }}>{label}</div>
      {value !== undefined && (
        <div style={{ fontSize: 13, color: theme.muted, fontFamily: MONO, fontWeight: 500 }}>{value}</div>
      )}
      {chevron && <IconChevR size={14} stroke={theme.dim} />}
    </div>
  );
}

// Container card for a list of rows
function ListCard({ theme, children, style = {} }) {
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 18, overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

// Segmented control
function Segmented({ theme, options, value, style = {} }) {
  return (
    <div style={{
      display: 'inline-flex',
      padding: 3, borderRadius: 10,
      background: theme.surface2,
      border: `1px solid ${theme.border}`,
      ...style,
    }}>
      {options.map(o => {
        const on = o === value;
        return (
          <div key={o} style={{
            padding: '6px 12px', borderRadius: 8,
            background: on ? theme.surface : 'transparent',
            color: on ? theme.text : theme.muted,
            fontSize: 12, fontWeight: 600,
            fontFamily: o.length <= 3 ? MONO : FONT,
            boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
          }}>{o}</div>
        );
      })}
    </div>
  );
}

// iOS-style switch
function Switch({ theme, on }) {
  return (
    <div style={{
      width: 46, height: 28, borderRadius: 999,
      background: on ? theme.accent : theme.surface2,
      border: on ? 'none' : `1px solid ${theme.border}`,
      position: 'relative',
      transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 24, height: 24, borderRadius: 999,
        background: on ? theme.accentInk : '#ffffff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        transition: 'left .2s',
      }} />
    </div>
  );
}

// Row variant with a switch / trailing custom node
function ToggleRow({ theme, icon: Icon, label, sub, trailing, last = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      {Icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: theme.surface2, display: 'grid', placeItems: 'center',
        }}>
          <Icon size={16} stroke={theme.text} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {trailing}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P1 — PROFILE HUB
// ─────────────────────────────────────────────────────────────
function ProfileScreen({ theme }) {
  return (
    <ScreenShell theme={theme} tabBar={<TabBar theme={theme} active="profile" />}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 18 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Profil</div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'grid', placeItems: 'center',
        }}>
          <IconCog size={18} stroke={theme.text} />
        </div>
      </div>

      {/* Identity card */}
      <div style={{
        padding: 20, borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.surface2})`,
          display: 'grid', placeItems: 'center',
          fontSize: 22, fontWeight: 700, color: theme.accentInk,
          border: `3px solid ${theme.surface}`,
          boxShadow: `0 0 0 1px ${theme.border}`,
        }}>LM</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Léo Mercier</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>leo.mercier@gmail.com</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Pill theme={theme} tone="surface2" style={{ padding: '4px 8px', fontSize: 10 }}>
              Membre depuis fév. 2024
            </Pill>
          </div>
        </div>
      </div>

      {/* Three stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
        {[
          { lbl: 'SÉANCES',   val: '142', sub: 'au total' },
          { lbl: 'STREAK',    val: '12',  sub: 'record 28' },
          { lbl: 'TONNAGE',   val: '892k', sub: 'kg soulevés' },
        ].map(s => (
          <div key={s.lbl} style={{
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: '12px 10px', textAlign: 'left',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{s.lbl}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Subscription banner */}
      <div style={{
        marginTop: 14,
        padding: '14px 16px', borderRadius: 18,
        background: theme.accent, color: theme.accentInk,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: theme.accentInk, color: theme.accent,
          display: 'grid', placeItems: 'center',
        }}><IconBolt size={18} stroke={theme.accent} fill={theme.accent} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Passer à Pro</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>Stats avancées · programmes illimités</div>
        </div>
        <IconArrow size={18} stroke={theme.accentInk} />
      </div>

      <SectionLabel theme={theme}>COMPTE</SectionLabel>
      <ListCard theme={theme}>
        <Row theme={theme} icon={IconUser}   label="Compte personnel" value="Léo M." />
        <Row theme={theme} icon={IconTarget} label="Objectifs & programmes" value="Push/Pull/Legs" />
        <Row theme={theme} icon={IconRuler}  label="Corps & mesures" value="78 kg" last />
      </ListCard>

      <SectionLabel theme={theme}>APPLICATION</SectionLabel>
      <ListCard theme={theme}>
        <Row theme={theme} icon={IconCog}  label="Préférences" value="kg · FR" />
        <Row theme={theme} icon={IconBell} label="Notifications" value="3 actives" />
        <Row theme={theme} icon={IconDb}   label="Données & export" last />
      </ListCard>

      <SectionLabel theme={theme}>À PROPOS</SectionLabel>
      <ListCard theme={theme}>
        <Row theme={theme} icon={IconInfo}   label="À propos & version" value="2.4.1" />
        <Row theme={theme} icon={IconLogout} label="Se déconnecter" chevron={false} danger last />
      </ListCard>

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P2 — EDIT ACCOUNT
// ─────────────────────────────────────────────────────────────
function ProfileEditScreen({ theme }) {
  const Field = ({ label, value, sub, last = false }) => (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
  return (
    <ScreenShell theme={theme}>
      <ProfileHeader theme={theme} title="Compte" eyebrow="PROFIL" action={
        <div style={{
          padding: '8px 14px', borderRadius: 10,
          background: theme.accent, color: theme.accentInk,
          fontSize: 12, fontWeight: 700,
        }}>Sauver</div>
      } />

      {/* Avatar block */}
      <div style={{
        padding: '20px 16px',
        borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.surface2})`,
            display: 'grid', placeItems: 'center',
            fontSize: 24, fontWeight: 700, color: theme.accentInk,
          }}>LM</div>
          <div style={{
            position: 'absolute', right: -2, bottom: -2,
            width: 26, height: 26, borderRadius: 999,
            background: theme.text, color: theme.bg,
            display: 'grid', placeItems: 'center',
            border: `3px solid ${theme.surface}`,
          }}>
            <IconCam size={12} stroke={theme.bg} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Léo Mercier</div>
          <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, marginTop: 4 }}>Changer la photo</div>
        </div>
      </div>

      <SectionLabel theme={theme}>IDENTITÉ</SectionLabel>
      <ListCard theme={theme}>
        <Field label="PRÉNOM" value="Léo" />
        <Field label="NOM"    value="Mercier" />
        <Field label="EMAIL"  value="leo.mercier@gmail.com" sub="Vérifié ✓" last />
      </ListCard>

      <SectionLabel theme={theme}>PHYSIQUE</SectionLabel>
      <ListCard theme={theme}>
        <Field label="DATE DE NAISSANCE" value="14 mars 1995" sub="31 ans" />
        <Field label="SEXE"   value="Homme" />
        <Field label="TAILLE" value="182 cm" last />
      </ListCard>

      <SectionLabel theme={theme}>BIO</SectionLabel>
      <div style={{
        padding: 14, borderRadius: 16,
        background: theme.surface, border: `1px solid ${theme.border}`,
      }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.text }}>
          PPL 6x/semaine. Objectif: 4 plates au DC d'ici fin d'année.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 6 }}>
          62 / 200
        </div>
      </div>

      <div style={{ height: 20 }} />
      <div style={{
        padding: '12px 0', textAlign: 'center',
        color: theme.danger, fontSize: 13, fontWeight: 600,
      }}>Supprimer le compte</div>

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P3 — BODY & MEASUREMENTS
// ─────────────────────────────────────────────────────────────
function BodyScreen({ theme }) {
  // weight history 8 points
  const ws = [82.4, 81.8, 81.2, 80.5, 80.0, 79.2, 78.6, 78.0];
  const w = 320, h = 110, pad = 14;
  const min = Math.min(...ws) - 1, max = Math.max(...ws) + 1;
  const xs = i => pad + (i / (ws.length - 1)) * (w - pad * 2);
  const ys = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const path = ws.map((v, i) => `${i ? 'L' : 'M'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${xs(ws.length - 1)} ${h - pad} L ${xs(0)} ${h - pad} Z`;

  return (
    <ScreenShell theme={theme}>
      <ProfileHeader theme={theme} title="Corps & mesures" eyebrow="PROFIL" action={
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: theme.text, color: theme.bg,
          display: 'grid', placeItems: 'center',
        }}><IconPlus size={18} stroke={theme.bg} /></div>
      } />

      {/* Current weight + goal */}
      <div style={{
        padding: '20px 18px', borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>POIDS ACTUEL</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6, fontFamily: MONO }}>
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>78,0</span>
              <span style={{ fontSize: 14, color: theme.muted }}>kg</span>
            </div>
            <div style={{ fontSize: 11, color: theme.accent, fontFamily: MONO, fontWeight: 600, marginTop: 4 }}>
              ↘ −4,4 kg sur 8 sem.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>OBJECTIF</div>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, marginTop: 6 }}>76,0 kg</div>
            <div style={{ fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 4 }}>−2,0 restants</div>
          </div>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ marginTop: 14, display: 'block' }}>
          <defs>
            <linearGradient id="grad-bodyw" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={pad} x2={w - pad} y1={ys(76)} y2={ys(76)} stroke={theme.muted} strokeDasharray="3 4" strokeOpacity="0.5" />
          <text x={w - pad} y={ys(76) - 4} textAnchor="end" fontSize="9" fontFamily={MONO} fill={theme.muted}>obj. 76</text>
          <path d={area} fill="url(#grad-bodyw)" />
          <path d={path} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={xs(ws.length - 1)} cy={ys(ws[ws.length - 1])} r="5" fill={theme.accent} stroke={theme.surface} strokeWidth="2.5" />
        </svg>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <Segmented theme={theme} options={['1M', '3M', '6M', '1A', 'TOUT']} value="3M" />
        </div>
      </div>

      {/* Body measurements */}
      <SectionLabel theme={theme}>MENSURATIONS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { lbl: 'POITRINE', val: '108', d: '+1,5' },
          { lbl: 'TAILLE',   val: '82',  d: '−2,0' },
          { lbl: 'HANCHES',  val: '98',  d: '−1,0' },
          { lbl: 'BRAS',     val: '38,5', d: '+0,5' },
          { lbl: 'CUISSE',   val: '60',  d: '+0,8' },
          { lbl: 'MOLLET',   val: '38',  d: '+0,3' },
        ].map(m => {
          const pos = m.d.startsWith('+');
          return (
            <div key={m.lbl} style={{
              padding: '12px 14px', borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{m.lbl}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 6, fontFamily: MONO }}>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{m.val}</span>
                <span style={{ fontSize: 11, color: theme.muted }}>cm</span>
              </div>
              <div style={{ fontSize: 10, color: pos ? theme.accent : theme.muted, fontFamily: MONO, marginTop: 2, fontWeight: 600 }}>
                {pos ? '↗' : '↘'} {m.d} cm
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress photos */}
      <SectionLabel theme={theme} hint="Mensuel">PHOTOS DE PROGRESSION</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {['MARS', 'AVR', 'MAI'].map((m, i) => (
          <div key={m} style={{
            aspectRatio: '3/4',
            borderRadius: 14,
            background: i === 2 ? theme.accent : theme.surface2,
            color: i === 2 ? theme.accentInk : theme.muted,
            border: i === 2 ? 'none' : `1px solid ${theme.border}`,
            position: 'relative',
            display: 'flex', alignItems: 'flex-end', padding: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: MONO,
          }}>
            <div style={{
              position: 'absolute', top: 10, left: 10,
              fontSize: 9, opacity: 0.6,
            }}>{i + 1}/3</div>
            {m}
            {i === 2 && (
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <IconCam size={14} stroke={theme.accentInk} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 12,
        padding: '14px 16px', borderRadius: 16,
        background: theme.surface, border: `1px dashed ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 13, color: theme.muted, fontWeight: 500,
      }}>
        <IconPlus size={16} stroke={theme.muted} /> Ajouter la photo de juin
      </div>

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P4 — GOALS & PROGRAMS
// ─────────────────────────────────────────────────────────────
function GoalsScreen({ theme }) {
  const Goal = ({ label, current, target, unit, pct, last }) => (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: theme.muted }}>
          <span style={{ color: theme.text, fontWeight: 700 }}>{current}</span> / {target} {unit}
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: theme.surface2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: theme.accent, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 10, fontFamily: MONO, color: theme.muted, marginTop: 6 }}>{pct}% complété</div>
    </div>
  );
  return (
    <ScreenShell theme={theme}>
      <ProfileHeader theme={theme} title="Objectifs & programmes" eyebrow="PROFIL" />

      {/* Current program */}
      <Card theme={theme} tone="accent" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '3px 7px', borderRadius: 6,
            background: theme.accentInk, color: theme.accent,
            fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: MONO,
          }}>EN COURS</div>
          <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, letterSpacing: 1, fontFamily: MONO }}>
            SEM 3 / 12
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: -0.4 }}>
          Push · Pull · Legs
        </div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
          6 séances / sem · hypertrophie
        </div>
        <div style={{ height: 6, borderRadius: 999, background: theme.accentInk, opacity: 0.25, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: '25%', height: '100%', background: theme.accentInk, opacity: 1, borderRadius: 999 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: MONO, fontSize: 11 }}>
          <span style={{ opacity: 0.7 }}>14 / 56 séances</span>
          <span style={{ fontWeight: 700 }}>Voir le programme →</span>
        </div>
      </Card>

      {/* Goals */}
      <SectionLabel theme={theme} hint="4 actifs">OBJECTIFS</SectionLabel>
      <ListCard theme={theme}>
        <Goal label="Développé couché 1RM" current="100" target="120" unit="kg" pct={83} />
        <Goal label="Tractions strictes"   current="12"  target="20"  unit="reps" pct={60} />
        <Goal label="Séances / semaine"     current="4"   target="5"   unit="" pct={80} />
        <Goal label="Poids corporel"        current="78"  target="76"  unit="kg" pct={55} last />
      </ListCard>

      <div style={{
        marginTop: 10,
        padding: '14px 16px', borderRadius: 16,
        background: theme.surface, border: `1px dashed ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 13, color: theme.muted, fontWeight: 500,
      }}>
        <IconPlus size={16} stroke={theme.muted} /> Nouvel objectif
      </div>

      {/* Programs library */}
      <SectionLabel theme={theme}>BIBLIOTHÈQUE</SectionLabel>
      {[
        { name: 'Full Body 3×',         tag: 'Débutant',       sessions: '3 / sem', wks: 8 },
        { name: 'Upper / Lower',        tag: 'Intermédiaire',  sessions: '4 / sem', wks: 10 },
        { name: '5/3/1 BBB',            tag: 'Force',          sessions: '4 / sem', wks: 12 },
        { name: 'Push Pull Legs 6×',    tag: 'Hypertrophie',   sessions: '6 / sem', wks: 12, active: true },
      ].map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 16,
          background: theme.surface,
          border: `1px solid ${p.active ? theme.accent : theme.border}`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: theme.surface2, color: theme.text,
            display: 'grid', placeItems: 'center',
          }}><IconDumb size={20} stroke={theme.text} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              {p.active && <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: theme.accent, color: theme.accentInk, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</div>}
            </div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>
              {p.tag} · {p.sessions} · {p.wks} sem
            </div>
          </div>
          <IconChevR size={14} stroke={theme.muted} />
        </div>
      ))}

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P5 — PREFERENCES
// ─────────────────────────────────────────────────────────────
function PreferencesScreen({ theme }) {
  return (
    <ScreenShell theme={theme}>
      <ProfileHeader theme={theme} title="Préférences" eyebrow="PROFIL" />

      <SectionLabel theme={theme}>UNITÉS</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconScale} label="Poids" sub="Kilogrammes" trailing={<Segmented theme={theme} options={['kg', 'lb']} value="kg" />} />
        <ToggleRow theme={theme} icon={IconRuler} label="Distance" sub="Kilomètres" trailing={<Segmented theme={theme} options={['km', 'mi']} value="km" />} />
        <ToggleRow theme={theme} icon={IconUser} label="Mensurations" sub="Centimètres" trailing={<Segmented theme={theme} options={['cm', 'in']} value="cm" />} last />
      </ListCard>

      <SectionLabel theme={theme}>ENTRAÎNEMENT</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconClock} label="Repos par défaut" sub="Modifiable par exercice" trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={btnSq(theme)}><IconMinus size={14} stroke={theme.text} /></div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: 'center' }}>1:30</div>
            <div style={btnSq(theme)}><IconPlus size={14} stroke={theme.text} /></div>
          </div>
        } />
        <ToggleRow theme={theme} icon={IconBolt} label="Son de fin de repos" sub="Gong doux" trailing={<Switch theme={theme} on={true} />} />
        <ToggleRow theme={theme} icon={IconBell} label="Vibrations" sub="Validation série + repos" trailing={<Switch theme={theme} on={true} />} />
        <ToggleRow theme={theme} icon={IconDumb} label="Poids de barre auto" sub="20 kg + olympic plates" trailing={<Switch theme={theme} on={false} />} last />
      </ListCard>

      <SectionLabel theme={theme}>APPARENCE</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconCog} label="Thème" trailing={<Segmented theme={theme} options={['Auto', 'Clair', 'Sombre']} value={theme.dark ? 'Sombre' : 'Clair'} />} />
        <ToggleRow theme={theme} icon={IconWorld} label="Langue" trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.muted }}>
            Français <IconChevR size={14} stroke={theme.muted} />
          </div>
        } />
        <ToggleRow theme={theme} icon={IconList} label="Début de semaine" trailing={<Segmented theme={theme} options={['Lun', 'Dim']} value="Lun" />} last />
      </ListCard>

      <SectionLabel theme={theme}>AVANCÉ</SectionLabel>
      <ListCard theme={theme}>
        <Row theme={theme} icon={IconHeart} label="Apple Health" value="Connecté" />
        <Row theme={theme} icon={IconChart} label="Échelle RPE" value="RPE 6-10" />
        <Row theme={theme} icon={IconBolt}  label="Calcul 1RM" value="Epley" last />
      </ListCard>

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN P6 — NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
function NotificationsScreen({ theme }) {
  return (
    <ScreenShell theme={theme}>
      <ProfileHeader theme={theme} title="Notifications" eyebrow="PROFIL" />

      {/* Master toggle */}
      <div style={{
        padding: '16px 18px', borderRadius: 18,
        background: theme.accent, color: theme.accentInk,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: theme.accentInk, color: theme.accent,
          display: 'grid', placeItems: 'center',
        }}><IconBell size={18} stroke={theme.accent} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Notifications activées</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>3 catégories actives sur 6</div>
        </div>
        <Switch theme={theme} on={true} />
      </div>

      <SectionLabel theme={theme}>ENTRAÎNEMENT</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconFlame} label="Rappel de séance"
          sub="Lun, Mar, Jeu, Ven, Sam · 18:30"
          trailing={<Switch theme={theme} on={true} />} />
        <ToggleRow theme={theme} icon={IconClock} label="Fin de repos"
          sub="Notification + son quand le timer expire"
          trailing={<Switch theme={theme} on={true} />} />
        <ToggleRow theme={theme} icon={IconList} label="Séance non terminée"
          sub="Rappel 2h après le début"
          trailing={<Switch theme={theme} on={false} />} last />
      </ListCard>

      <SectionLabel theme={theme}>PROGRÈS</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconBolt} label="Nouveaux records (PR)"
          sub="Quand tu bats un record sur un exercice"
          trailing={<Switch theme={theme} on={true} />} />
        <ToggleRow theme={theme} icon={IconChart} label="Résumé hebdomadaire"
          sub="Dimanche · 19:00"
          trailing={<Switch theme={theme} on={false} />} />
        <ToggleRow theme={theme} icon={IconHeart} label="Streak en danger"
          sub="Si pas d'activité dans la journée"
          trailing={<Switch theme={theme} on={false} />} last />
      </ListCard>

      <SectionLabel theme={theme}>HORAIRES SILENCIEUX</SectionLabel>
      <ListCard theme={theme}>
        <ToggleRow theme={theme} icon={IconClock} label="Ne pas déranger"
          sub="22:30 — 07:00"
          trailing={<Switch theme={theme} on={true} />} last />
      </ListCard>

      <div style={{
        marginTop: 14, padding: '12px 14px', borderRadius: 14,
        background: theme.surface2,
        fontSize: 11, color: theme.muted, lineHeight: 1.5,
      }}>
        Les notifications système peuvent être désactivées dans Réglages → Gym Track → Notifications.
      </div>

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

Object.assign(window, {
  ProfileScreen, ProfileEditScreen, BodyScreen,
  GoalsScreen, PreferencesScreen, NotificationsScreen,
});
