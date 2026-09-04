// app.jsx — Gym Track mobile · main mount

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "oklch(0.74 0.19 48)"
}/*EDITMODE-END*/;

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const theme = makeTheme(t.dark, t.accent);

  // Bg of the canvas page follows dark/light so the artboards sit on a tonal bg
  useEffect(() => {
    document.body.style.background = t.dark ? '#1b1916' : '#f0eee9';
  }, [t.dark]);

  const W = 402, H = 874;

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="screens"
          title="Gym Track · mobile"
          subtitle="Direction sombre · accent lime · Space Grotesk + JetBrains Mono"
        >
          <DCArtboard id="dashboard" label="01 · Dashboard" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <DashboardScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="session" label="02 · Session active (interactive)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <SessionScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="history" label="03 · Historique" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <HistoryScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="stats" label="04 · Stats / Progression" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <StatsScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Apparence">
          <TweakToggle
            label="Thème sombre"
            value={t.dark}
            onChange={v => setT('dark', v)}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setT('accent', v)}
            options={[
              'oklch(0.88 0.20 130)', // lime
              'oklch(0.74 0.19 48)',  // orange
              'oklch(0.74 0.17 245)', // blue
              'oklch(0.74 0.20 8)',   // pink
              'oklch(0.78 0.16 75)',  // amber
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
