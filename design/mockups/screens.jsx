// screens.jsx — Gym Track mobile screens
// Each screen renders inside an IOSDevice (402x874). Theme is derived from
// tweaks (dark + accent). All numeric labels use a mono face for the
// "coach's notebook" feel.

const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
// Ink color = dark text on the accent. All accents are L≥0.74 so dark ink
// reads cleanly across them.
function inkFor(accent) {
  // Try to pull the hue out of the oklch string to slightly tint the ink.
  const m = /oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/.exec(accent || '');
  if (!m) return '#0e110b';
  const hue = parseFloat(m[3]);
  return `oklch(0.18 0.02 ${hue.toFixed(0)})`;
}

function makeTheme(dark, accent) {
  const accentColor = accent || 'oklch(0.88 0.20 130)';
  const accentInk = inkFor(accentColor);
  if (dark) {
    return {
      dark: true,
      bg:        'oklch(0.16 0.008 75)',
      surface:   'oklch(0.22 0.008 75)',
      surface2:  'oklch(0.27 0.008 75)',
      border:    'oklch(0.33 0.010 75)',
      text:      'oklch(0.97 0.003 80)',
      muted:     'oklch(0.62 0.008 75)',
      dim:       'oklch(0.45 0.008 75)',
      accent:    accentColor,
      accentInk: accentInk,
      danger:    'oklch(0.70 0.18 25)',
    };
  }
  return {
    dark: false,
    bg:        'oklch(0.985 0.004 80)',
    surface:   '#ffffff',
    surface2:  'oklch(0.965 0.005 80)',
    border:    'oklch(0.90 0.006 80)',
    text:      'oklch(0.18 0.010 75)',
    muted:     'oklch(0.50 0.010 75)',
    dim:       'oklch(0.70 0.008 75)',
    accent:    accentColor,
    accentInk: accentInk,
    danger:    'oklch(0.55 0.20 25)',
  };
}

const FONT = `'Space Grotesk', -apple-system, system-ui, sans-serif`;
const MONO = `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`;

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────
function ScreenShell({ theme, children, pad = true, tabBar = null, hasTopBar = false }) {
  return (
    <div style={{
      background: theme.bg, color: theme.text,
      minHeight: '100%', height: '100%',
      fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
      paddingTop: hasTopBar ? 0 : 54, // status bar
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: pad ? '0 20px' : 0 }}>
        {children}
      </div>
      {tabBar}
    </div>
  );
}

function TabBar({ theme, active = 'home' }) {
  const items = [
    { id: 'home',    label: 'Aujourd\u2019hui', icon: IconFlame },
    { id: 'history', label: 'Historique',       icon: IconList  },
    { id: 'stats',   label: 'Stats',            icon: IconChart },
    { id: 'profile', label: 'Profil',           icon: IconUser  },
  ];
  return (
    <div style={{
      flex: '0 0 auto',
      borderTop: `1px solid ${theme.border}`,
      background: theme.bg,
      padding: '10px 12px 30px',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
    }}>
      {items.map(it => {
        const on = it.id === active;
        const Icon = it.icon;
        return (
          <div key={it.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '6px 0',
            color: on ? theme.text : theme.muted,
          }}>
            <Icon size={22} stroke={on ? theme.text : theme.muted} fill={on ? theme.accent : 'none'} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ theme, children, tone = 'surface', style = {} }) {
  const bg = tone === 'accent' ? theme.accent : tone === 'surface2' ? theme.surface2 : theme.surface;
  const fg = tone === 'accent' ? theme.accentInk : theme.text;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 11px', borderRadius: 999,
      background: bg, color: fg,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
      border: tone === 'surface' ? `1px solid ${theme.border}` : 'none',
      ...style,
    }}>{children}</div>
  );
}

function Card({ theme, children, style = {}, tone = 'surface' }) {
  return (
    <div style={{
      background: tone === 'accent' ? theme.accent : theme.surface,
      color: tone === 'accent' ? theme.accentInk : theme.text,
      borderRadius: 24,
      border: tone === 'accent' ? 'none' : `1px solid ${theme.border}`,
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// ICONS (stroke, 24)
// ─────────────────────────────────────────────────────────────
const ic = (paths, fill) => ({ size = 24, stroke = 'currentColor', fill: f = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || f} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);
const IconFlame   = ic(<path d="M12 3c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 3 0-3-1-5 1-9z" />);
const IconList    = ic(<><path d="M4 7h16M4 12h16M4 17h10" /></>);
const IconChart   = ic(<><polyline points="4 17 9 11 13 14 20 6" /><polyline points="14 6 20 6 20 12" /></>);
const IconUser    = ic(<><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 5-6 8-6s7 2 8 6" /></>);
const IconPlus    = ic(<><path d="M12 5v14M5 12h14" /></>);
const IconMinus   = ic(<><path d="M5 12h14" /></>);
const IconCheck   = ic(<><polyline points="4 12 10 18 20 6" /></>);
const IconClose   = ic(<><path d="M6 6l12 12M18 6L6 18" /></>);
const IconClock   = ic(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>);
const IconArrow   = ic(<><path d="M5 12h14M13 6l6 6-6 6" /></>);
const IconBolt    = ic(<><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></>);
const IconDumb    = ic(<><path d="M3 9v6M21 9v6M6 6v12M18 6v12M6 12h12" /></>);
const IconChevR   = ic(<><polyline points="9 6 15 12 9 18" /></>);
const IconPause   = ic(<><rect x="7" y="5" width="3" height="14" rx="0.5" /><rect x="14" y="5" width="3" height="14" rx="0.5" /></>);
const IconSkip    = ic(<><polygon points="5 5 14 12 5 19" /><line x1="18" y1="5" x2="18" y2="19" /></>);
const IconTrend   = ic(<><polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /></>);

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — DASHBOARD
// ─────────────────────────────────────────────────────────────
function DashboardScreen({ theme }) {
  return (
    <ScreenShell theme={theme} tabBar={<TabBar theme={theme} active="home" />}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, letterSpacing: 0.3 }}>DIM. 17 MAI</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 2, letterSpacing: -0.6 }}>Salut Léo.</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: theme.surface2,
          border: `1px solid ${theme.border}`,
          display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 14,
        }}>LM</div>
      </div>

      {/* Streak strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 16,
        background: theme.surface, border: `1px solid ${theme.border}`,
        marginBottom: 14,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: theme.accent, color: theme.accentInk, display: 'grid', placeItems: 'center' }}>
          <IconBolt size={16} stroke={theme.accentInk} fill={theme.accentInk} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>12 jours d'affilée</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 3 }}>
          {[1,1,1,1,1,0,0].map((v, i) => (
            <div key={i} style={{
              width: 14, height: 22, borderRadius: 4,
              background: v ? theme.accent : theme.surface2,
              opacity: v ? 1 : 0.7,
            }} />
          ))}
        </div>
      </div>

      {/* Today's workout — hero card */}
      <Card theme={theme} tone="accent" style={{ padding: 22, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.7 }}>AUJOURD'HUI · SEMAINE 3</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.05, marginTop: 6, letterSpacing: -0.8 }}>
          Push<br/>Pectoraux & Triceps
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 16, fontFamily: MONO, fontSize: 12, fontWeight: 500 }}>
          <div><span style={{ opacity: 0.55 }}>EX</span> <b>6</b></div>
          <div><span style={{ opacity: 0.55 }}>SETS</span> <b>22</b></div>
          <div><span style={{ opacity: 0.55 }}>EST</span> <b>~58 min</b></div>
        </div>
        <div style={{
          marginTop: 20, padding: '14px 18px', borderRadius: 16,
          background: theme.accentInk, color: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 16, fontWeight: 700, letterSpacing: 0.2,
        }}>
          Démarrer la séance
          <IconArrow size={20} stroke={theme.accent} />
        </div>
        {/* decorative bars */}
        <div aria-hidden style={{
          position: 'absolute', right: -30, top: -30, opacity: 0.16,
          display: 'flex', gap: 6,
        }}>
          {[60, 90, 70, 110, 80].map((h, i) => (
            <div key={i} style={{ width: 14, height: h, background: theme.accentInk, borderRadius: 4 }} />
          ))}
        </div>
      </Card>

      {/* Weekly stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { lbl: 'SÉANCES',     val: '4',     unit: '/5',     trend: '+1' },
          { lbl: 'VOLUME',      val: '18,4',  unit: 'k kg',   trend: '+8%' },
          { lbl: 'TEMPS',       val: '3h42',  unit: '',       trend: '+12m' },
        ].map(s => (
          <div key={s.lbl} style={{
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 18, padding: '14px 12px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>{s.lbl}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 6, fontFamily: MONO }}>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{s.val}</span>
              <span style={{ fontSize: 11, color: theme.muted }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, color: theme.accent, fontFamily: MONO, marginTop: 4, fontWeight: 600 }}>
              ↗ {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Récent</div>
        <div style={{ fontSize: 12, color: theme.muted, fontWeight: 500 }}>Tout voir</div>
      </div>
      {[
        { day: 'VEN', date: '15', name: 'Pull · Dos & Biceps',  dur: '52m', vol: '5,8k kg', tag: 'Pull' },
        { day: 'JEU', date: '14', name: 'Legs · Quadriceps',    dur: '1h08', vol: '12,1k kg', tag: 'Legs' },
        { day: 'MAR', date: '12', name: 'Push · Pec & Triceps', dur: '47m', vol: '4,9k kg', tag: 'Push' },
      ].map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0',
          borderBottom: i < 2 ? `1px solid ${theme.border}` : 'none',
        }}>
          <div style={{
            width: 46, textAlign: 'center', borderRadius: 12,
            padding: '8px 0', background: theme.surface2,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1 }}>{s.day}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, marginTop: 1 }}>{s.date}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>
              {s.dur} · {s.vol}
            </div>
          </div>
          <IconChevR size={16} stroke={theme.muted} />
        </div>
      ))}

      <div style={{ height: 12 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — ACTIVE SESSION (interactive)
// ─────────────────────────────────────────────────────────────
function SessionScreen({ theme }) {
  const [exercises, setExercises] = useState([
    { name: 'Développé couché',     muscle: 'PECS',     done: true,
      sets: [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }, { w: 80, r: 7, done: true }] },
    { name: 'Développé incliné haltères', muscle: 'PECS H.', done: false, active: true,
      sets: [{ w: 32, r: 10, done: true }, { w: 32, r: 9, done: true }, { w: 34, r: 8, done: false }, { w: 34, r: 8, done: false }] },
    { name: 'Dips lestés',          muscle: 'TRICEPS',  done: false,
      sets: [{ w: 15, r: 8, done: false }, { w: 15, r: 8, done: false }, { w: 15, r: 8, done: false }] },
    { name: 'Élévations latérales', muscle: 'ÉPAULES', done: false,
      sets: [{ w: 10, r: 12, done: false }, { w: 10, r: 12, done: false }, { w: 10, r: 12, done: false }] },
    { name: 'Triceps poulie',       muscle: 'TRICEPS',  done: false,
      sets: [{ w: 25, r: 12, done: false }, { w: 25, r: 12, done: false }, { w: 25, r: 12, done: false }] },
  ]);
  const currentExIdx = exercises.findIndex(e => e.active);
  const currentEx = exercises[currentExIdx];
  const currentSetIdx = currentEx ? currentEx.sets.findIndex(s => !s.done) : -1;

  // Rest timer
  const [rest, setRest] = useState({ active: false, remaining: 90, total: 90 });
  useEffect(() => {
    if (!rest.active) return;
    const id = setInterval(() => {
      setRest(r => r.remaining <= 1 ? { ...r, active: false, remaining: 0 } : { ...r, remaining: r.remaining - 1 });
    }, 1000);
    return () => clearInterval(id);
  }, [rest.active]);

  // Session elapsed
  const [elapsed, setElapsed] = useState(24 * 60 + 31);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const updateSet = (delta) => {
    if (currentSetIdx < 0) return;
    setExercises(prev => prev.map((ex, i) => i !== currentExIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, si) => si !== currentSetIdx ? s : {
        ...s,
        w: Math.max(0, s.w + (delta.w || 0)),
        r: Math.max(0, s.r + (delta.r || 0)),
      }),
    }));
  };
  const completeSet = () => {
    if (currentSetIdx < 0) return;
    setExercises(prev => prev.map((ex, i) => i !== currentExIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, si) => si !== currentSetIdx ? s : { ...s, done: true }),
    }));
    setRest({ active: true, remaining: 90, total: 90 });
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const fmtElapsed = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`;
  };

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);

  return (
    <ScreenShell theme={theme} pad={false} hasTopBar={true}>
      {/* Top bar */}
      <div style={{ paddingTop: 54, padding: '54px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <IconClose size={18} stroke={theme.text} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }}>EN COURS</div>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, marginTop: 1, letterSpacing: -0.5 }}>{fmtElapsed(elapsed)}</div>
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            fontSize: 12, fontWeight: 600, fontFamily: MONO,
          }}>{doneSets}/{totalSets}</div>
        </div>
        {/* progress bar */}
        <div style={{ height: 4, borderRadius: 999, background: theme.surface2, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${(doneSets/totalSets)*100}%`, height: '100%', background: theme.accent, transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ padding: '18px 20px 0', flex: 1, overflow: 'auto' }}>
        {/* Current exercise hero */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '3px 8px', borderRadius: 6, background: theme.accent, color: theme.accentInk,
              fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: MONO,
            }}>{currentEx.muscle}</div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: MONO, fontWeight: 600 }}>
              EX {currentExIdx + 1}/{exercises.length}
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: -0.5, lineHeight: 1.1 }}>{currentEx.name}</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, fontFamily: MONO }}>
            Précédent · 32 kg × 10 · PR 36 kg × 6
          </div>
        </div>

        {/* Rest timer OR set entry */}
        {rest.active ? (
          <RestTimer theme={theme} rest={rest} setRest={setRest} fmt={fmt} />
        ) : (
          <SetEntry
            theme={theme}
            ex={currentEx}
            currentSetIdx={currentSetIdx}
            onAdjust={updateSet}
            onComplete={completeSet}
          />
        )}

        {/* Sets log */}
        <div style={{ marginTop: 18 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 1fr 28px',
            gap: 8, alignItems: 'center',
            padding: '0 10px 8px',
            fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.5, fontFamily: MONO,
          }}>
            <div>SET</div><div>KG</div><div>REPS</div><div />
          </div>
          {currentEx.sets.map((s, i) => {
            const isCur = i === currentSetIdx;
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 1fr 28px',
                gap: 8, alignItems: 'center',
                background: isCur ? theme.surface : 'transparent',
                border: isCur ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: '12px 10px',
                marginBottom: 6,
                opacity: s.done ? 0.55 : 1,
              }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600 }}>{s.w}</div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600 }}>{s.r}</div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: s.done ? theme.accent : 'transparent',
                  border: s.done ? 'none' : `1.5px solid ${theme.dim}`,
                  display: 'grid', placeItems: 'center',
                }}>
                  {s.done && <IconCheck size={14} stroke={theme.accentInk} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next up */}
        <div style={{
          marginTop: 18, marginBottom: 12,
          padding: '14px 16px', borderRadius: 16,
          background: theme.surface2, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: theme.surface, display: 'grid', placeItems: 'center',
            fontFamily: MONO, fontWeight: 700, fontSize: 13,
          }}>{currentExIdx + 2}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, letterSpacing: 1.2 }}>SUIVANT</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{exercises[currentExIdx + 1]?.name}</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: theme.muted }}>3 × 8</div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </ScreenShell>
  );
}

function RestTimer({ theme, rest, setRest, fmt }) {
  const pct = (rest.remaining / rest.total) * 100;
  return (
    <div style={{
      padding: '22px 20px',
      borderRadius: 24,
      background: theme.surface,
      border: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }}>REPOS</div>
        <Pill theme={theme} tone="surface2" style={{ fontFamily: MONO }}>1:30 cible</Pill>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, padding: '6px 0 14px' }}>
        <span style={{ fontFamily: MONO, fontSize: 72, fontWeight: 700, letterSpacing: -3, color: theme.accent, lineHeight: 1 }}>
          {fmt(rest.remaining)}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: theme.surface2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: theme.accent, transition: 'width 1s linear' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={() => setRest(r => ({ ...r, active: false }))} style={{
          flex: 1, padding: '14px 0', borderRadius: 14,
          background: theme.surface2, color: theme.text, border: 'none',
          fontSize: 14, fontWeight: 600, fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconSkip size={16} stroke={theme.text} fill={theme.text} /> Passer
        </button>
        <button onClick={() => setRest(r => ({ ...r, remaining: r.remaining + 15 }))} style={{
          flex: 1, padding: '14px 0', borderRadius: 14,
          background: theme.text, color: theme.bg, border: 'none',
          fontSize: 14, fontWeight: 700, fontFamily: FONT,
        }}>+ 15 s</button>
      </div>
    </div>
  );
}

function SetEntry({ theme, ex, currentSetIdx, onAdjust, onComplete }) {
  if (currentSetIdx < 0) return null;
  const cur = ex.sets[currentSetIdx];
  const Stepper = ({ label, val, unit, step, dKey }) => (
    <div style={{
      flex: 1, background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 18, padding: '14px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.5, textAlign: 'center' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 8,
      }}>
        <button onClick={() => onAdjust({ [dKey]: -step })} style={btnSq(theme)}>
          <IconMinus size={18} stroke={theme.text} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{val}</span>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 4 }}>{unit}</div>
        </div>
        <button onClick={() => onAdjust({ [dKey]: step })} style={btnSq(theme)}>
          <IconPlus size={18} stroke={theme.text} />
        </button>
      </div>
    </div>
  );
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }}>
          SÉRIE {currentSetIdx + 1} / {ex.sets.length}
        </div>
        <div style={{ flex: 1, height: 1, background: theme.border }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Stepper label="KG"   val={cur.w} unit="kilos" step={2.5} dKey="w" />
        <Stepper label="REPS" val={cur.r} unit="répétitions" step={1} dKey="r" />
      </div>
      <button onClick={onComplete} style={{
        marginTop: 12, width: '100%',
        padding: '16px 0', borderRadius: 18,
        background: theme.accent, color: theme.accentInk, border: 'none',
        fontFamily: FONT, fontSize: 16, fontWeight: 700, letterSpacing: 0.2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer',
      }}>
        <IconCheck size={20} stroke={theme.accentInk} /> Valider la série
      </button>
    </>
  );
}

const btnSq = (theme) => ({
  width: 38, height: 38, borderRadius: 12,
  background: theme.surface2, color: theme.text, border: 'none',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
});

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — HISTORY
// ─────────────────────────────────────────────────────────────
function HistoryScreen({ theme }) {
  const weeks = [
    [0,0,1,0,1,0,0],
    [1,0,1,0,1,1,0],
    [1,0,1,1,1,0,1],
    [1,1,1,0,1,1,0], // current week
  ];
  const days = ['L','M','M','J','V','S','D'];

  // weekly volume bars (k kg)
  const vols = [12.4, 14.8, 16.1, 18.4];
  const maxVol = Math.max(...vols);

  return (
    <ScreenShell theme={theme} tabBar={<TabBar theme={theme} active="history" />}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, letterSpacing: 0.3 }}>MAI 2026</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 2, letterSpacing: -0.6 }}>Historique</div>
        </div>
        <div style={{
          padding: '8px 12px', borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          fontSize: 12, fontWeight: 600,
        }}>Mois ▾</div>
      </div>

      {/* Heatmap */}
      <div style={{
        padding: '16px 16px 18px', borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>RÉGULARITÉ</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: theme.muted }}>17 / 28 jours</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 18 }}>
            {days.map((d, i) => (
              <div key={i} style={{ height: 22, fontSize: 10, color: theme.muted, fontFamily: MONO, lineHeight: '22px' }}>{d}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {weeks.map((w, wi) => (
              <div key={wi}>
                <div style={{ textAlign: 'center', fontSize: 10, fontFamily: MONO, color: theme.muted, marginBottom: 4 }}>
                  S{18 + wi}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {w.map((d, di) => (
                    <div key={di} style={{
                      height: 22, borderRadius: 5,
                      background: d ? theme.accent : theme.surface2,
                      opacity: d ? (wi === 3 ? 1 : 0.55 + wi * 0.15) : 1,
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly volume mini-chart */}
      <div style={{
        padding: '16px', borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>VOLUME / SEMAINE</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: theme.accent, fontWeight: 600 }}>↗ +48%</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 96, marginTop: 6 }}>
          {vols.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '100%',
                  height: `${(v / maxVol) * 100}%`,
                  background: i === vols.length - 1 ? theme.accent : theme.surface2,
                  borderRadius: 6,
                }} />
              </div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: theme.muted }}>S{18+i}</div>
              <div style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600 }}>{v}k</div>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Séances</div>
      {[
        { day: 'VEN', date: '15', name: 'Pull · Dos & Biceps',  dur: '52m',  vol: '5,8k kg', tone: 'pull' },
        { day: 'JEU', date: '14', name: 'Legs · Quadriceps',    dur: '1h08', vol: '12,1k kg', tone: 'legs' },
        { day: 'MAR', date: '12', name: 'Push · Pec & Triceps', dur: '47m',  vol: '4,9k kg', tone: 'push' },
        { day: 'LUN', date: '11', name: 'Cardio · Intervalles', dur: '32m',  vol: '—',       tone: 'cardio' },
        { day: 'SAM', date: '09', name: 'Pull · Dos & Biceps',  dur: '49m',  vol: '5,5k kg', tone: 'pull' },
      ].map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 44, textAlign: 'center', borderRadius: 10,
            padding: '6px 0', background: theme.surface2,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: 1 }}>{s.day}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO }}>{s.date}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>
              {s.dur} · {s.vol}
            </div>
          </div>
          <IconChevR size={16} stroke={theme.muted} />
        </div>
      ))}
      <div style={{ height: 16 }} />
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4 — STATS / EXERCISE PROGRESSION
// ─────────────────────────────────────────────────────────────
function StatsScreen({ theme }) {
  // 12-week 1RM estimate data
  const data = [82, 84, 83, 86, 88, 87, 90, 92, 91, 95, 97, 100];
  const w = 320, h = 140, pad = 14;
  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const xs = i => pad + (i / (data.length - 1)) * (w - pad * 2);
  const ys = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${xs(data.length - 1).toFixed(1)} ${h - pad} L ${xs(0).toFixed(1)} ${h - pad} Z`;

  return (
    <ScreenShell theme={theme} tabBar={<TabBar theme={theme} active="stats" />}>
      <div style={{ paddingTop: 8, paddingBottom: 14 }}>
        <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, letterSpacing: 0.3 }}>PROGRESSION</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 2, letterSpacing: -0.6 }}>Stats</div>
      </div>

      {/* Exercise selector */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, marginLeft: -20, paddingLeft: 20 }}>
        {['Développé couché', 'Squat', 'Soulevé de terre', 'Tractions'].map((ex, i) => (
          <div key={ex} style={{
            padding: '8px 14px', borderRadius: 999,
            background: i === 0 ? theme.text : theme.surface,
            color: i === 0 ? theme.bg : theme.text,
            border: i === 0 ? 'none' : `1px solid ${theme.border}`,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{ex}</div>
        ))}
      </div>

      {/* PR card */}
      <Card theme={theme} tone="accent" style={{ padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 8,
            background: theme.accentInk, color: theme.accent,
            display: 'grid', placeItems: 'center',
          }}><IconBolt size={14} stroke={theme.accent} fill={theme.accent} /></div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>NOUVEAU RECORD · IL Y A 3 JOURS</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12, fontFamily: MONO }}>
          <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>100</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>kg × 5</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6, opacity: 0.7, fontFamily: MONO }}>
          1RM estimé · 116 kg <span style={{ marginLeft: 6 }}>(+4 kg)</span>
        </div>
      </Card>

      {/* Chart card */}
      <div style={{
        padding: '16px', borderRadius: 22,
        background: theme.surface, border: `1px solid ${theme.border}`,
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>1RM ESTIMÉ · 12 SEM.</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: theme.accent, fontWeight: 700 }}>+22%</div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ marginTop: 8, display: 'block' }}>
          <defs>
            <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* horizontal grid */}
          {[0, 0.5, 1].map((p, i) => (
            <line key={i} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)} stroke={theme.border} strokeDasharray="2 3" />
          ))}
          <path d={area} fill="url(#grad-area)" />
          <path d={path} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* last dot */}
          <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1])} r="5" fill={theme.accent} stroke={theme.surface} strokeWidth="2.5" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: MONO, color: theme.muted, marginTop: 4 }}>
          <span>FÉV</span><span>MAR</span><span>AVR</span><span>MAI</span>
        </div>
      </div>

      {/* Tonnage breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ padding: 14, borderRadius: 18, background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>TONNAGE TOTAL</div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, marginTop: 6 }}>248k kg</div>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>sur 12 semaines</div>
        </div>
        <div style={{ padding: 14, borderRadius: 18, background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>SÉRIES TOTALES</div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, marginTop: 6 }}>342</div>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: MONO, marginTop: 2 }}>≈ 28 / sem</div>
        </div>
      </div>

      {/* Recent sets at this exercise */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Dernières séries</div>
      {[
        { date: '14 mai', sets: '4 × 5', w: '100 kg', delta: '+5 kg' },
        { date: '07 mai', sets: '4 × 5', w: '95 kg',  delta: '+2,5' },
        { date: '01 mai', sets: '4 × 6', w: '92,5 kg', delta: '+2,5' },
      ].map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 6,
        }}>
          <div style={{ fontSize: 12, fontFamily: MONO, color: theme.muted, width: 60 }}>{s.date}</div>
          <div style={{ flex: 1, fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{s.sets} · {s.w}</div>
          <div style={{ fontSize: 11, color: theme.accent, fontFamily: MONO, fontWeight: 600 }}>↗ {s.delta}</div>
        </div>
      ))}

      <div style={{ height: 14 }} />
    </ScreenShell>
  );
}

// Expose to window so app.jsx can use them
Object.assign(window, {
  makeTheme, DashboardScreen, SessionScreen, HistoryScreen, StatsScreen,
  // primitives reused by profile-screens.jsx
  ScreenShell, TabBar, Pill, Card, FONT, MONO, btnSq,
  IconFlame, IconList, IconChart, IconUser, IconPlus, IconMinus, IconCheck,
  IconClose, IconClock, IconArrow, IconBolt, IconDumb, IconChevR, IconPause,
  IconSkip, IconTrend,
});
