// exercise-create-screens.jsx — Gym Track custom exercise creation (5 screens)

const {
  ScreenShell: EShell, Pill: EPill, Card: ECard,
  FONT: EFONT, MONO: EMONO, btnSq: eBtnSq,
  IconChevR: EChev, IconPlus: EPlus, IconCheck: ECheck, IconClose: EClose,
  IconArrow: EArrow, IconBolt: EBolt, IconDumb: EDumb, IconList: EList,
} = window;

const eIc = (paths) => ({ size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const IconImage   = eIc(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><polyline points="21 16 16 11 6 19" /></>);
const IconGif     = eIc(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10v4M7 10h2M10 14v-4M14 14v-4M14 10h3M14 12h2" /></>);
const IconCamera  = eIc(<><path d="M5 8h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><circle cx="12" cy="13" r="3.5" /></>);
const IconVideo   = eIc(<><rect x="3" y="6" width="13" height="12" rx="2" /><polygon points="16 9 22 5 22 19 16 15" fill="currentColor" /></>);
const IconCheckS  = eIc(<><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><polyline points="7.5 12 11 15.5 16.5 9.5" stroke="white" strokeWidth="2" /></>);
const IconSearch  = eIc(<><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>);
const IconFolder  = eIc(<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></>);
const IconCrop    = eIc(<><path d="M6 2v16a2 2 0 0 0 2 2h14" /><path d="M2 6h16a2 2 0 0 1 2 2v14" /></>);

// ─────────────────────────────────────────────────────────────
// SCREEN E1 — MY EXERCISES LIBRARY
// ─────────────────────────────────────────────────────────────
function MyExercisesScreen({ theme }) {
  return (
    <EShell theme={theme}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>BIBLIOTHÈQUE</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Mes exercices</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: theme.surface, border: `1px solid ${theme.border}`,
          display: 'grid', placeItems: 'center',
        }}><IconSearch size={16} stroke={theme.text} /></div>
      </div>

      {/* Create CTA */}
      <div style={{
        padding: 16, borderRadius: 18,
        background: theme.accent, color: theme.accentInk,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: theme.accentInk, color: theme.accent,
          display: 'grid', placeItems: 'center',
        }}><EPlus size={22} stroke={theme.accent} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Créer un exercice</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Avec photo, GIF ou vidéo perso</div>
        </div>
        <EArrow size={20} stroke={theme.accentInk} />
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { v: '8', l: 'persos' },
          { v: '142', l: 'biblio' },
          { v: '12', l: 'favoris' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: '10px 12px', borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
          }}>
            <div style={{ fontFamily: EMONO, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: theme.muted, fontFamily: EMONO, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginLeft: -20, paddingLeft: 20, marginBottom: 12 }}>
        {[
          { l: 'Tous', on: true }, { l: 'Pecs' }, { l: 'Dos' }, { l: 'Jambes' }, { l: 'Avec média' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '6px 12px', borderRadius: 999,
            background: c.on ? theme.text : theme.surface,
            color: c.on ? theme.bg : theme.text,
            border: c.on ? 'none' : `1px solid ${theme.border}`,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{c.l}</div>
        ))}
      </div>

      {/* Exercises list */}
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, padding: '4px 4px 10px' }}>
        MES CRÉATIONS · 8
      </div>
      {[
        { n: 'Curl Bayesian poulie', m: 'Biceps', eq: 'Poulie', media: 'gif', count: 14 },
        { n: 'JM Press', m: 'Triceps', eq: 'Barre', media: 'photo', count: 8 },
        { n: 'Tirage Yates', m: 'Dos', eq: 'Barre', media: 'gif', count: 22 },
        { n: 'Squat Hatfield', m: 'Quadriceps', eq: 'Machine', media: null, count: 3 },
        { n: 'Hip thrust unilatéral', m: 'Fessiers', eq: 'Banc', media: 'photo', count: 18 },
      ].map((ex, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 6,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            background: ex.media ? `linear-gradient(135deg, ${theme.surface2}, ${theme.dim}40)` : theme.surface2,
            display: 'grid', placeItems: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {ex.media === 'gif' ? (
              <>
                <IconGif size={22} stroke={theme.muted} />
                <div style={{
                  position: 'absolute', bottom: 3, right: 3,
                  padding: '1px 4px', borderRadius: 3,
                  background: theme.accent, color: theme.accentInk,
                  fontSize: 7, fontWeight: 700, fontFamily: EMONO, letterSpacing: 0.3,
                }}>GIF</div>
              </>
            ) : ex.media === 'photo' ? (
              <IconImage size={22} stroke={theme.muted} />
            ) : (
              <EDumb size={22} stroke={theme.dim} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.n}</div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: EMONO, marginTop: 2 }}>
              {ex.m} · {ex.eq} · {ex.count}× utilisé
            </div>
          </div>
          <EChev size={14} stroke={theme.muted} />
        </div>
      ))}

      <div style={{ height: 14 }} />
    </EShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN E2 — CREATE EXERCISE FORM
// ─────────────────────────────────────────────────────────────
function CreateExerciseFormScreen({ theme }) {
  return (
    <EShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <EClose size={16} stroke={theme.text} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>NOUVEAU</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Exercice perso</div>
          </div>
          <div style={{
            padding: '8px 14px', borderRadius: 10,
            background: theme.dim, color: theme.bg,
            fontSize: 12, fontWeight: 700, opacity: 0.5,
          }}>Sauver</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Media upload slot */}
        <div style={{
          padding: 0, borderRadius: 18,
          border: `2px dashed ${theme.accent}`,
          background: `${theme.accent}0d`,
          marginBottom: 14,
          aspectRatio: '4/3',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10,
          position: 'relative',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: theme.accent, color: theme.accentInk,
            display: 'grid', placeItems: 'center',
          }}><EPlus size={32} stroke={theme.accentInk} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Ajouter une démo visuelle</div>
          <div style={{ fontSize: 11, color: theme.muted, fontWeight: 500, padding: '0 24px', textAlign: 'center', lineHeight: 1.4 }}>
            Photo, GIF ou vidéo depuis ton téléphone — visible pendant tes séances
          </div>
          {/* preview chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[IconImage, IconGif, IconVideo, IconCamera].map((Ic, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: 8,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                display: 'grid', placeItems: 'center',
              }}>
                <Ic size={14} stroke={theme.muted} />
              </div>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `2px solid ${theme.accent}`,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>NOM DE L'EXERCICE *</div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6, letterSpacing: -0.2 }}>
            Curl Bayesian poulie<span style={{ display: 'inline-block', width: 2, height: 17, background: theme.accent, marginLeft: 2, verticalAlign: 'middle' }} />
          </div>
        </div>

        {/* Primary muscle */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>GROUPE PRINCIPAL *</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                padding: '4px 10px', borderRadius: 6,
                background: theme.accent, color: theme.accentInk,
                fontSize: 11, fontWeight: 700, fontFamily: EMONO,
              }}>BICEPS</div>
            </div>
            <EChev size={14} stroke={theme.muted} />
          </div>
        </div>

        {/* Secondary muscles */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>GROUPES SECONDAIRES</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <EPill theme={theme} tone="surface2" style={{ fontSize: 10, padding: '4px 8px' }}>AVANT-BRAS</EPill>
            <div style={{
              padding: '4px 8px', borderRadius: 999,
              border: `1px dashed ${theme.border}`,
              fontSize: 10, fontWeight: 600, color: theme.muted,
              display: 'flex', alignItems: 'center', gap: 4,
            }}><EPlus size={10} stroke={theme.muted} /> Ajouter</div>
          </div>
        </div>

        {/* Equipment + type row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div style={{
            padding: '14px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>ÉQUIPEMENT</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Poulie</div>
              <EChev size={14} stroke={theme.muted} />
            </div>
          </div>
          <div style={{
            padding: '14px 14px', borderRadius: 14,
            background: theme.surface, border: `1px solid ${theme.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>CATÉGORIE</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Isolation</div>
              <EChev size={14} stroke={theme.muted} />
            </div>
          </div>
        </div>

        {/* Tracking type */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>MESURE</div>
          <div style={{ display: 'flex', padding: 3, borderRadius: 10, background: theme.surface2, marginTop: 8 }}>
            {['Poids × Reps', 'Reps seules', 'Temps'].map((t, i) => (
              <div key={t} style={{
                flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
                background: i === 0 ? theme.surface : 'transparent',
                color: i === 0 ? theme.text : theme.muted,
                fontSize: 12, fontWeight: 600,
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>INSTRUCTIONS</div>
          <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
            Décris la position de départ, la trajectoire et les points clés…
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>
    </EShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN E3 — SOURCE PICKER (bottom sheet)
// ─────────────────────────────────────────────────────────────
function MediaSourceSheetScreen({ theme }) {
  return (
    <EShell theme={theme} pad={false}>
      {/* Dimmed background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: 0.55,
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
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: theme.dim, margin: '0 auto 14px',
        }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>AJOUTER UN MÉDIA</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 4 }}>Choisir une source</div>

        {/* Options */}
        <div style={{ marginTop: 18 }}>
          {[
            { icon: IconImage,  l: 'Photothèque',    sub: 'Photos & vidéos de ton téléphone', recommended: true },
            { icon: IconGif,    l: 'GIFs',           sub: 'Importer un GIF animé (.gif)' },
            { icon: IconVideo,  l: 'Vidéos',         sub: 'Vidéos · max 30 s, converties en GIF' },
            { icon: IconCamera, l: 'Prendre maintenant', sub: 'Caméra · photo ou vidéo' },
            { icon: IconFolder, l: 'Fichiers',       sub: 'Parcourir le stockage interne' },
          ].map((opt, i) => {
            const Ic = opt.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 14px', borderRadius: 14,
                background: opt.recommended ? `${theme.accent}1a` : theme.surface2,
                border: opt.recommended ? `1px solid ${theme.accent}` : `1px solid transparent`,
                marginBottom: 8,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: opt.recommended ? theme.accent : theme.surface,
                  color: opt.recommended ? theme.accentInk : theme.text,
                  display: 'grid', placeItems: 'center',
                }}>
                  <Ic size={20} stroke={opt.recommended ? theme.accentInk : theme.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.l}</div>
                    {opt.recommended && (
                      <div style={{
                        padding: '1px 6px', borderRadius: 4,
                        background: theme.accent, color: theme.accentInk,
                        fontSize: 8, fontWeight: 700, letterSpacing: 0.5, fontFamily: EMONO,
                      }}>RECO</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{opt.sub}</div>
                </div>
                <EChev size={14} stroke={theme.dim} />
              </div>
            );
          })}
        </div>

        {/* Permission note */}
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 12,
          background: theme.surface2,
          fontSize: 11, color: theme.muted, lineHeight: 1.5,
        }}>
          🔒 Les médias restent <b style={{ color: theme.text }}>sur ton téléphone</b>. Aucun upload, aucune synchronisation cloud par défaut.
        </div>

        <div style={{
          marginTop: 12, padding: '14px 0', textAlign: 'center',
          fontSize: 14, fontWeight: 600, color: theme.muted,
        }}>Annuler</div>
      </div>
    </EShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN E4 — GALLERY GRID
// ─────────────────────────────────────────────────────────────
function GalleryPickerScreen({ theme }) {
  // generate a varied grid: types of placeholders (gif badges, video badges)
  const items = [
    { type: 'gif', tone: 1, dur: '1.2 s', sel: true },
    { type: 'photo', tone: 2 },
    { type: 'video', tone: 3, dur: '0:14' },
    { type: 'photo', tone: 1 },
    { type: 'gif', tone: 2, dur: '0.8 s' },
    { type: 'photo', tone: 3 },
    { type: 'video', tone: 2, dur: '0:08' },
    { type: 'photo', tone: 1 },
    { type: 'gif', tone: 3, dur: '2.1 s' },
    { type: 'photo', tone: 2 },
    { type: 'photo', tone: 3 },
    { type: 'video', tone: 1, dur: '0:22' },
    { type: 'gif', tone: 2, dur: '0.5 s' },
    { type: 'photo', tone: 1 },
    { type: 'photo', tone: 2 },
  ];
  const grad = (i) => {
    const cs = [
      [theme.surface2, theme.dim],
      [theme.dim, theme.muted],
      [theme.surface, theme.surface2],
    ][i - 1];
    return `linear-gradient(135deg, ${cs[0]}, ${cs[1]})`;
  };

  return (
    <EShell theme={theme} pad={false}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
            display: 'grid', placeItems: 'center',
          }}>
            <EClose size={16} stroke={theme.text} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>1 SÉLECTIONNÉ</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Photothèque</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600 }}>
            Toutes <EChev size={14} stroke={theme.muted} />
          </div>
        </div>

        {/* Type filter */}
        <div style={{
          display: 'flex', padding: 3, borderRadius: 10,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          {[
            { l: 'Tout', on: false, n: '247' },
            { l: 'Photos', on: false, n: '189' },
            { l: 'GIFs', on: true, n: '34' },
            { l: 'Vidéos', on: false, n: '24' },
          ].map((t, i) => (
            <div key={t.l} style={{
              flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              background: t.on ? theme.text : 'transparent',
              color: t.on ? theme.bg : theme.muted,
              fontSize: 12, fontWeight: 600,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span>{t.l}</span>
              <span style={{ fontSize: 9, fontFamily: EMONO, opacity: 0.6 }}>{t.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, fontFamily: EMONO, padding: '4px 4px 8px' }}>
          AUJOURD'HUI · 14:32
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {items.map((it, i) => (
            <div key={i} style={{
              aspectRatio: '1/1',
              borderRadius: 8,
              background: grad(it.tone),
              position: 'relative', overflow: 'hidden',
              border: it.sel ? `2px solid ${theme.accent}` : 'none',
            }}>
              {/* type badge */}
              {it.type === 'gif' && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  padding: '2px 5px', borderRadius: 4,
                  background: 'rgba(0,0,0,0.7)', color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: EMONO,
                }}>GIF</div>
              )}
              {it.type === 'video' && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 5px', borderRadius: 4,
                  background: 'rgba(0,0,0,0.7)', color: '#fff',
                  fontSize: 9, fontWeight: 700, fontFamily: EMONO,
                }}>
                  <span>▶</span> {it.dur}
                </div>
              )}
              {it.type === 'gif' && it.dur && (
                <div style={{
                  position: 'absolute', bottom: 6, left: 6,
                  fontSize: 9, fontFamily: EMONO, color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}>{it.dur}</div>
              )}
              {/* select badge */}
              {it.sel ? (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 22, height: 22, borderRadius: 999,
                  background: theme.accent, color: theme.accentInk,
                  display: 'grid', placeItems: 'center',
                  border: `2px solid #fff`,
                }}>
                  <ECheck size={12} stroke={theme.accentInk} />
                </div>
              ) : (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 22, height: 22, borderRadius: 999,
                  border: `1.5px solid rgba(255,255,255,0.8)`,
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, fontFamily: EMONO, padding: '4px 4px 8px' }}>
          HIER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {[1,2,3,1,2,3].map((tone, i) => (
            <div key={i} style={{
              aspectRatio: '1/1',
              borderRadius: 8,
              background: grad(tone),
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 22, height: 22, borderRadius: 999,
                border: `1.5px solid rgba(255,255,255,0.8)`,
              }} />
            </div>
          ))}
        </div>

        <div style={{ height: 14 }} />
        {/* CTA */}
        <div style={{
          position: 'sticky', bottom: 0, marginTop: 'auto',
          padding: '12px 0',
          background: `linear-gradient(to top, ${theme.bg} 60%, transparent)`,
        }}>
          <div style={{
            padding: '14px 20px', borderRadius: 16,
            background: theme.accent, color: theme.accentInk,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 15, fontWeight: 700,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: theme.accentInk, color: theme.accent,
                display: 'grid', placeItems: 'center',
                fontFamily: EMONO, fontSize: 12, fontWeight: 700,
              }}>1</div>
              Suivant
            </div>
            <EArrow size={20} stroke={theme.accentInk} />
          </div>
        </div>
      </div>
    </EShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN E5 — MEDIA EDITOR (crop + trim for GIF/video)
// ─────────────────────────────────────────────────────────────
function MediaEditorScreen({ theme }) {
  return (
    <EShell theme={theme} pad={false}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.2 }}>ÉDITER LE MÉDIA</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>Cadrer & ajuster</div>
          </div>
          <div style={{
            padding: '8px 14px', borderRadius: 10,
            background: theme.accent, color: theme.accentInk,
            fontSize: 12, fontWeight: 700,
          }}>OK</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Preview with crop grid */}
        <div style={{
          aspectRatio: '4/3',
          borderRadius: 18,
          background: `linear-gradient(135deg, ${theme.surface2}, ${theme.dim})`,
          position: 'relative', overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* fake silhouette to suggest content */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 65%, ${theme.muted}88 0%, transparent 50%)`,
          }} />
          {/* GIF badge */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 8px', borderRadius: 6,
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            fontSize: 10, fontWeight: 700, fontFamily: EMONO,
          }}>GIF · 1.2 s</div>
          {/* Crop frame */}
          <div style={{
            position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
            border: `2px solid #fff`,
            boxShadow: `0 0 0 2000px rgba(0,0,0,0.35)`,
          }}>
            {/* corners */}
            {[
              { top: -2, left: -2 }, { top: -2, right: -2 },
              { bottom: -2, left: -2 }, { bottom: -2, right: -2 },
            ].map((p, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 18, height: 18,
                background: theme.accent,
                ...p,
              }} />
            ))}
            {/* rule-of-thirds */}
            <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* Aspect ratio */}
        <div style={{
          padding: '12px 14px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCrop size={14} stroke={theme.muted} /> CADRAGE
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {[
              { l: '1:1', icon: <div style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid currentColor` }} /> },
              { l: '4:3', icon: <div style={{ width: 22, height: 16, borderRadius: 3, border: `1.5px solid currentColor` }} />, on: true },
              { l: '16:9', icon: <div style={{ width: 24, height: 13, borderRadius: 3, border: `1.5px solid currentColor` }} /> },
              { l: '9:16', icon: <div style={{ width: 12, height: 22, borderRadius: 3, border: `1.5px solid currentColor` }} /> },
              { l: 'Libre', icon: <span style={{ fontSize: 10, fontFamily: EMONO, fontWeight: 700 }}>—</span> },
            ].map(r => (
              <div key={r.l} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: r.on ? theme.accent : theme.surface2,
                color: r.on ? theme.accentInk : theme.text,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, fontFamily: EMONO,
              }}>
                {r.icon}
                {r.l}
              </div>
            ))}
          </div>
        </div>

        {/* Trim (for GIF/video) */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 1.4 }}>DÉCOUPER</div>
            <div style={{ fontFamily: EMONO, fontSize: 11, color: theme.accent, fontWeight: 700 }}>0.3 — 1.5 s</div>
          </div>
          {/* Timeline */}
          <div style={{ marginTop: 10, position: 'relative', height: 44, borderRadius: 8, background: theme.surface2, overflow: 'hidden' }}>
            {/* fake frames */}
            <div style={{ display: 'flex', height: '100%', gap: 1, opacity: 0.45 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '100%',
                  background: i % 2 ? theme.dim : theme.muted,
                }} />
              ))}
            </div>
            {/* trim handles */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: '12%', right: '18%',
              border: `2px solid ${theme.accent}`,
              borderRadius: 6,
              background: 'transparent',
            }}>
              <div style={{
                position: 'absolute', top: -2, bottom: -2, left: -6,
                width: 6, background: theme.accent, borderRadius: '4px 0 0 4px',
              }} />
              <div style={{
                position: 'absolute', top: -2, bottom: -2, right: -6,
                width: 6, background: theme.accent, borderRadius: '0 4px 4px 0',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 10, color: theme.muted, fontFamily: EMONO }}>0 s</div>
            <div style={{ fontSize: 10, color: theme.muted, fontFamily: EMONO }}>2.4 s</div>
          </div>
        </div>

        {/* Options */}
        <div style={{
          padding: '4px 0', borderRadius: 14,
          background: theme.surface, border: `1px solid ${theme.border}`,
          marginBottom: 14, overflow: 'hidden',
        }}>
          {[
            { l: 'Boucle infinie', sub: 'Le GIF rejoue en boucle', on: true },
            { l: 'Compresser pour stockage', sub: '~480p · 1.4 MB après réduction', on: true },
            { l: 'Miroir horizontal', sub: 'Inverser gauche/droite', on: false },
          ].map((opt, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.l}</div>
                <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>{opt.sub}</div>
              </div>
              <div style={{
                width: 40, height: 24, borderRadius: 999,
                background: opt.on ? theme.accent : theme.dim,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: opt.on ? 18 : 2,
                  width: 20, height: 20, borderRadius: 999, background: '#fff',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* File info */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: theme.surface2,
          fontSize: 11, color: theme.muted, fontFamily: EMONO,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>IMG_2734.GIF · 4.2 MB</span>
          <span style={{ color: theme.accent }}>→ 1.4 MB</span>
        </div>

        <div style={{ height: 14 }} />
      </div>
    </EShell>
  );
}

Object.assign(window, {
  MyExercisesScreen, CreateExerciseFormScreen,
  MediaSourceSheetScreen, GalleryPickerScreen, MediaEditorScreen,
});
