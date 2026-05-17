import type { ReactNode } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { useSettings } from '../../hooks/useSettings'
import { ACCENTS } from '../../theme/accents'
import { Icon, Segmented, Stepper, ToggleRow, Switch } from '../ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <p className="t-eyebrow" style={{ marginTop: 6 }}>
        {title}
      </p>
      {children}
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gt-field">
      <span className="gt-field__label">{label}</span>
      {children}
    </div>
  )
}

export function PreferencesScreen() {
  const nav = useNavigation()
  const { preferences: p, updatePreferences } = useSettings()

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <span className="gt-topbar__title">Préférences</span>
      </div>

      <div className="gt-screen__scroll">
        <Section title="Unités">
          <Field label="Poids">
            <Segmented
              value={p.weightUnit}
              onChange={(weightUnit) => updatePreferences({ weightUnit })}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
            />
          </Field>
          <Field label="Distance">
            <Segmented
              value={p.distanceUnit}
              onChange={(distanceUnit) => updatePreferences({ distanceUnit })}
              options={[
                { value: 'km', label: 'km' },
                { value: 'mi', label: 'mi' },
              ]}
            />
          </Field>
          <Field label="Mensurations">
            <Segmented
              value={p.measurementUnit}
              onChange={(measurementUnit) => updatePreferences({ measurementUnit })}
              options={[
                { value: 'cm', label: 'cm' },
                { value: 'in', label: 'in' },
              ]}
            />
          </Field>
        </Section>

        <Section title="Entraînement">
          <Field label="Temps de repos par défaut">
            <Stepper
              value={p.defaultRestSec}
              onChange={(defaultRestSec) => updatePreferences({ defaultRestSec })}
              step={15}
              min={15}
              max={600}
              unit="s"
              ariaLabel="Repos par défaut"
            />
          </Field>
          <ToggleRow
            label="Son de fin de repos"
            control={
              <Switch
                checked={p.restSoundEnabled}
                onChange={(restSoundEnabled) => updatePreferences({ restSoundEnabled })}
                label="Son de fin de repos"
              />
            }
          />
          <ToggleRow
            label="Vibrations"
            control={
              <Switch
                checked={p.hapticsEnabled}
                onChange={(hapticsEnabled) => updatePreferences({ hapticsEnabled })}
                label="Vibrations"
              />
            }
          />
          <ToggleRow
            label="Poids de barre automatique"
            sub="Pré-remplit 20 kg pour les exercices à la barre"
            control={
              <Switch
                checked={p.autoBarbellWeight}
                onChange={(autoBarbellWeight) => updatePreferences({ autoBarbellWeight })}
                label="Poids de barre automatique"
              />
            }
          />
        </Section>

        <Section title="Apparence">
          <Field label="Thème">
            <Segmented
              value={p.theme}
              onChange={(theme) => updatePreferences({ theme })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
              ]}
            />
          </Field>
          <Field label="Couleur d'accent">
            <div className="gt-chips">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  aria-label={a.label}
                  onClick={() => updatePreferences({ accentColor: a.accent })}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: a.accent,
                    border:
                      p.accentColor === a.accent
                        ? '3px solid var(--text)'
                        : '3px solid transparent',
                  }}
                />
              ))}
            </div>
          </Field>
          <Field label="Début de semaine">
            <Segmented
              value={p.weekStart}
              onChange={(weekStart) => updatePreferences({ weekStart })}
              options={[
                { value: 'monday', label: 'Lundi' },
                { value: 'sunday', label: 'Dimanche' },
              ]}
            />
          </Field>
        </Section>

        <Section title="Avancé">
          <Field label="Échelle RPE">
            <Segmented
              value={p.rpeScale}
              onChange={(rpeScale) => updatePreferences({ rpeScale })}
              options={[
                { value: '6-10', label: '6 → 10' },
                { value: '1-10', label: '1 → 10' },
              ]}
            />
          </Field>
          <Field label="Formule 1RM">
            <Segmented
              value={p.oneRMFormula}
              onChange={(oneRMFormula) => updatePreferences({ oneRMFormula })}
              options={[
                { value: 'epley', label: 'Epley' },
                { value: 'brzycki', label: 'Brzycki' },
                { value: 'lombardi', label: 'Lombardi' },
              ]}
            />
          </Field>
          <ToggleRow
            label="Aperçu de la séance du jour"
            control={
              <Switch
                checked={!p.skipDayPreview}
                onChange={(show) => updatePreferences({ skipDayPreview: !show })}
                label="Aperçu de la séance du jour"
              />
            }
          />
          <ToggleRow
            label="Briefing pré-séance"
            control={
              <Switch
                checked={!p.skipBriefing}
                onChange={(show) => updatePreferences({ skipBriefing: !show })}
                label="Briefing pré-séance"
              />
            }
          />
        </Section>
      </div>
    </div>
  )
}
