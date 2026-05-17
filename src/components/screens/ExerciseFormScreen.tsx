import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type {
  Equipment, ExerciseCategory, ExerciseMedia, MuscleGroup, TrackingType,
} from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { putBlob, deleteBlob } from '../../db/idb'
import { uuid } from '../../utils/uuid'
import { processMediaFile, processMediaUrl } from '../../utils/media'
import {
  CATEGORY_LABEL, EQUIPMENT_LABEL, MUSCLE_LABEL, TRACKING_LABEL,
} from '../../utils/labels'
import {
  Button, Icon, PrimaryBar, Row, Segmented,
} from '../ui'
import { MusclePicker } from '../exercises/MusclePicker'
import { MediaImage } from '../exercises/MediaImage'

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
  const [media, setMedia] = useState<ExerciseMedia | null>(editing?.media ?? null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const canSave = name.trim().length > 0 && primary != null

  // Libère le blob local de l'ancien média s'il en avait un.
  const releaseOldBlob = async () => {
    if (media?.blobId) await deleteBlob(media.blobId)
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMediaError(null)
    setMediaBusy(true)
    try {
      const processed = await processMediaFile(file)
      const blobId = uuid()
      await putBlob(blobId, processed.blob)
      await releaseOldBlob()
      setMedia({
        type: processed.type,
        blobId,
        mime: processed.mime,
        sizeBytes: processed.sizeBytes,
        aspectRatio: processed.aspectRatio,
        importedAt: Date.now(),
      })
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Échec de l’import.')
    } finally {
      setMediaBusy(false)
    }
  }

  const onUrl = async () => {
    if (!mediaUrl.trim()) return
    setMediaError(null)
    setMediaBusy(true)
    try {
      const processed = await processMediaUrl(mediaUrl)
      await releaseOldBlob()
      setMedia({
        type: processed.type,
        url: processed.url,
        mime: '',
        sizeBytes: 0,
        aspectRatio: processed.aspectRatio,
        importedAt: Date.now(),
      })
      setMediaUrl('')
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Lien invalide.')
    } finally {
      setMediaBusy(false)
    }
  }

  const removeMedia = async () => {
    await releaseOldBlob()
    setMedia(null)
  }

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
      media: media ?? undefined,
      // On préserve le statut d'origine : éditer un exercice par défaut ne le
      // transforme pas en exercice perso.
      isCustom: editing ? editing.isCustom : true,
      popularity: editing?.popularity,
      usageCount: editing?.usageCount ?? 0,
      createdAt: editing?.createdAt ?? Date.now(),
    })
    nav.back()
  }

  const del = async () => {
    if (!editing) return
    const used =
      store.workoutExerciseTemplates.some((w) => w.exerciseId === editing.id) ||
      store.sessionExercises.some((se) => se.exerciseId === editing.id)
    const warn = used
      ? ' Il est utilisé dans des programmes ou des séances passées.'
      : ''
    if (!confirm(`Supprimer « ${editing.name} » ?${warn}`)) return
    await releaseOldBlob()
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
          <span className="gt-field__label">Démo visuelle</span>
          {media ? (
            <>
              <MediaImage
                blobId={media.blobId}
                url={media.url}
                alt="Démo de l'exercice"
                aspectRatio={media.aspectRatio}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  variant="secondary"
                  icon="camera"
                  onClick={() => fileRef.current?.click()}
                >
                  Remplacer
                </Button>
                <Button variant="ghost" icon="trash" onClick={removeMedia}>
                  Retirer
                </Button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                border: '2px dashed var(--accent)',
                borderRadius: 'var(--radius-card)',
                background: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: 'var(--accent)' }}>
                <Icon name="plus" size={28} />
              </span>
              <span style={{ fontWeight: 600 }}>Importer une photo ou un GIF</span>
              <span className="t-caption">Visible pendant tes séances</span>
            </button>
          )}
          {!media && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="gt-input"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="…ou colle un lien d'image / GIF"
                aria-label="URL d'une image ou d'un GIF"
                inputMode="url"
              />
              <Button variant="secondary" onClick={onUrl} disabled={!mediaUrl.trim()}>
                Lier
              </Button>
            </div>
          )}
          {mediaBusy && <p className="t-caption">Traitement du média…</p>}
          {mediaError && (
            <p className="t-caption" style={{ color: 'var(--danger)' }}>
              {mediaError}
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFile}
          />
        </div>

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
