import { useMemo, useState } from 'react'
import type {
  Equipment, ExerciseCategory, MuscleGroup, TrackingType,
} from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { uuid } from '../../utils/uuid'
import {
  CATEGORY_LABEL, EQUIPMENT_LABEL, MUSCLE_LABEL, TRACKING_LABEL,
} from '../../utils/labels'
import {
  Button, Icon, PrimaryBar, Row, Segmented,
} from '../ui'
import { MusclePicker } from '../exercises/MusclePicker'

export function ExerciseFormScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const editId = params?.id as string | undefined
  const editing = useMemo(
    () => store.exercises.find((e) => e.id === editId),
    [store.exercises, editId],
  )

  const [name, setName] = useState(editing?.name ?? '')
  const [primary, setPrimary] = useState<MuscleGroup | null>(editing?.primaryMuscle ?? null)
  const [secondary, setSecondary] = useState<MuscleGroup[]>(editing?.secondaryMuscles ?? [])
  const [equipment, setEquipment] = useState<Equipment>(editing?.equipment ?? 'barbell')
  const [category, setCategory] = useState<ExerciseCategory>(editing?.category ?? 'compound')
  const [tracking, setTracking] = useState<TrackingType>(editing?.trackingType ?? 'weight_reps')
  const [instructions, setInstructions] = useState(editing?.instructions ?? '')
  const [picker, setPicker] = useState<'primary' | 'secondary' | null>(null)

  const canSave = name.trim().length > 0 && primary != null

  const save = async () => {
    if (!canSave || !primary) return
    await store.exercise.save({
      id: editing?.id ?? uuid(),
      name: name.trim(),
      primaryMuscle: primary,
      secondaryMuscles: secondary,
      equipment,
      category,
      trackingType: tracking,
      instructions: instructions.trim() || undefined,
      isCustom: true,
      popularity: editing?.popularity,
      usageCount: editing?.usageCount ?? 0,
      createdAt: editing?.createdAt ?? Date.now(),
    })
    nav.back()
  }

  const del = async () => {
    if (!editing) return
    if (!confirm(`Supprimer « ${editing.name} » ?`)) return
    await store.exercise.remove(editing.id)
    nav.back()
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Fermer">
          <Icon name="close" size={22} />
        </button>
        <span className="gt-topbar__title">
          {editing ? "Modifier l'exercice" : 'Exercice perso'}
        </span>
        <button
          className="gt-iconbtn"
          onClick={save}
          disabled={!canSave}
          aria-label="Enregistrer"
          style={{ color: canSave ? 'var(--accent)' : 'var(--dim)', fontWeight: 700 }}
        >
          <Icon name="check" size={24} />
        </button>
      </div>

      <div className="gt-screen__scroll">
        <div className="gt-field">
          <label className="gt-field__label" htmlFor="ex-name">
            Nom de l&apos;exercice
          </label>
          <input
            id="ex-name"
            className="gt-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Développé incliné prise serrée"
            autoFocus={!editing}
          />
        </div>

        <Row
          icon="target"
          label="Groupe musculaire principal"
          value={primary ? MUSCLE_LABEL[primary] : 'À choisir'}
          chevron
          onClick={() => setPicker('primary')}
        />
        <Row
          icon="grip"
          label="Groupes secondaires"
          value={
            secondary.length
              ? secondary.map((m) => MUSCLE_LABEL[m]).join(', ')
              : 'Aucun'
          }
          chevron
          onClick={() => setPicker('secondary')}
        />

        <div className="gt-field">
          <span className="gt-field__label">Équipement</span>
          <select
            className="gt-input"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment)}
          >
            {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABEL[eq]}
              </option>
            ))}
          </select>
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Catégorie</span>
          <Segmented
            value={category}
            onChange={setCategory}
            options={[
              { value: 'compound', label: CATEGORY_LABEL.compound },
              { value: 'isolation', label: CATEGORY_LABEL.isolation },
            ]}
          />
        </div>

        <div className="gt-field">
          <span className="gt-field__label">Type de mesure</span>
          <Segmented
            value={tracking}
            onChange={setTracking}
            options={[
              { value: 'weight_reps', label: TRACKING_LABEL.weight_reps },
              { value: 'reps_only', label: TRACKING_LABEL.reps_only },
              { value: 'time', label: TRACKING_LABEL.time },
            ]}
          />
        </div>

        <div className="gt-field">
          <label className="gt-field__label" htmlFor="ex-notes">
            Instructions (optionnel)
          </label>
          <textarea
            id="ex-notes"
            className="gt-textarea"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Conseils d'exécution, points d'attention…"
          />
        </div>

        {editing && (
          <Button variant="ghost" icon="trash" onClick={del}>
            Supprimer cet exercice
          </Button>
        )}
      </div>

      <PrimaryBar>
        <Button onClick={save} disabled={!canSave} icon="check">
          {editing ? 'Enregistrer' : "Créer l'exercice"}
        </Button>
      </PrimaryBar>

      {picker === 'primary' && (
        <MusclePicker
          mode="single"
          value={primary ? [primary] : []}
          onConfirm={(v) => setPrimary(v[0] ?? null)}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'secondary' && (
        <MusclePicker
          mode="multi"
          value={secondary}
          exclude={primary ? [primary] : []}
          onConfirm={setSecondary}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
