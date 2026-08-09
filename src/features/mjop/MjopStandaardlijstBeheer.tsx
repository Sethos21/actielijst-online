import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import {
  MJOP_CATEGORIE_LABELS,
  useMjopStandaardlijst,
  type MjopStandaardType,
} from './useMjopStandaardlijst'
import type { MjopCategorie } from './types'

interface Props {
  onSluiten: () => void
}

export function MjopStandaardlijstBeheer({ onSluiten }: Props) {
  const { types, loading, voegTypeToe, verwijderType } = useMjopStandaardlijst()
  const [naam, setNaam] = useState('')
  const [categorie, setCategorie] = useState<MjopCategorie>('onderhoud')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await voegTypeToe(naam, categorie, '🏗️')
    setNaam('')
    setCategorie('onderhoud')
  }

  return (
    <Modal titel="MJOP-standaardlijst beheren" onSluiten={onSluiten}>
      {loading ? (
        <p>Laden...</p>
      ) : types.length === 0 ? (
        <p>Nog geen standaardtypen.</p>
      ) : (
        <ul className="standaardlijst-lijst">
          {types.map((type: MjopStandaardType) => (
            <li key={type.id} className="standaardlijst-item">
              <span className="standaardlijst-icoon">{type.icoon}</span>
              <span className="standaardlijst-naam">{type.naam}</span>
              <span className="mjop-categorie-label">
                {MJOP_CATEGORIE_LABELS[type.categorie]}
              </span>
              <button
                type="button"
                className="icoon-knop"
                aria-label={`Verwijderen: ${type.naam}`}
                onClick={() => verwijderType(type.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="standaardlijst-toevoegen-form">
        <input
          aria-label="Nieuw standaardtype"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Nieuw type toevoegen, bijv. 'Kozijnen vervangen'..."
        />
        <select
          aria-label="Categorie"
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as MjopCategorie)}
        >
          {Object.entries(MJOP_CATEGORIE_LABELS).map(([waarde, label]) => (
            <option key={waarde} value={waarde}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          + Toevoegen
        </button>
      </form>
    </Modal>
  )
}
