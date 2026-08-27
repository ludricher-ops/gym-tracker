import { useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { useSettings } from '../../hooks/useSettings'
import { idbClearAll } from '../../db/idb'
import { Button, Icon, PrimaryBar } from '../ui'
import { useAuth } from '../../auth/AuthContext'

const GENDERS: { value: 'male' | 'female' | 'other'; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
]

export function AccountScreen() {
  const nav = useNavigation()
  const { settings, updateProfile } = useSettings()
  const { user, logout } = useAuth()

  const [firstName, setFirstName] = useState(settings.firstName)
  const [lastName, setLastName] = useState(settings.lastName)
  const [birthDate, setBirthDate] = useState(settings.birthDate ?? '')
  const [gender, setGender] = useState(settings.gender)
  const [heightCm, setHeightCm] = useState(settings.heightCm ?? 0)
  const [bio, setBio] = useState(settings.bio ?? '')

  const save = async () => {
    await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || undefined,
      gender,
      heightCm: heightCm > 0 ? heightCm : undefined,
      bio: bio.trim() || undefined,
    })
    nav.back()
  }

  const wipe = async () => {
    if (!confirm("Effacer TOUTES les données de l’app ? Action irréversible.")) return
    if (!confirm("Confirmer : toutes les séances, programmes et exercices perso seront perdus."))
      return
    await idbClearAll()
    location.reload()
  }

  const handleLogout = async () => {
    if (!confirm("Se déconnecter ?")) return
    await logout()
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Compte personnel</h1>
      </div>

      <div className="gt-screen__scroll">
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="gt-field">
            <label className="gt-field__label" htmlFor="ac-fn">
              Prénom
            </label>
            <input
              id="ac-fn"
              className="gt-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="gt-field">
            <label className="gt-field__label" htmlFor="ac-ln">
              Nom
            </label>
            <input
              id="ac-ln"
              className="gt-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="ac-bd">
            Date de naissance
          </label>
          <input
            id="ac-bd"
            type="date"
            className="gt-input"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Sexe</span>
          <div className="gt-chips">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={`gt-chip ${gender === g.value ? 'gt-chip--active' : ''}`}
                onClick={() => setGender(gender === g.value ? undefined : g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="ac-h">
            Taille (cm)
          </label>
          <input
            id="ac-h"
            type="number"
            className="gt-input"
            value={heightCm || ''}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            placeholder="ex. 178"
          />
        </div>

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="ac-bio">
            Bio ({bio.length}/200)
          </label>
          <textarea
            id="ac-bio"
            className="gt-textarea"
            value={bio}
            maxLength={200}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {user && (
          <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 4 }}>
            Connecté en tant que <strong style={{ color: 'var(--fg)' }}>{user.email}</strong>
          </p>
        )}

        <Button variant="ghost" icon="trash" onClick={handleLogout}>
          Se déconnecter
        </Button>

        <Button variant="ghost" icon="trash" onClick={wipe}>
          Effacer toutes les données
        </Button>
      </div>

      <PrimaryBar>
        <Button icon="check" onClick={save}>
          Enregistrer
        </Button>
      </PrimaryBar>
    </div>
  )
}
