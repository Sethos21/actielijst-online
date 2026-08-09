import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { useOnderhoudStandaardlijst } from './useOnderhoudStandaardlijst'

interface Props {
  onSluiten: () => void
}

export function OnderhoudStandaardlijstBeheer({ onSluiten }: Props) {
  const { types, loading, voegTypeToe, verwijderType, vulMetVoorbeelden } =
    useOnderhoudStandaardlijst()
  const [naam, setNaam] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await voegTypeToe(naam, '🔧')
    setNaam('')
  }

  return (
    <Modal titel="Onderhoud-standaardlijst beheren" onSluiten={onSluiten}>
      {loading ? (
        <p>Laden...</p>
      ) : types.length === 0 ? (
        <div className="standaardlijst-leeg">
          <p>Nog geen standaardtypen.</p>
          <button type="button" className="btn-secundair-klein" onClick={vulMetVoorbeelden}>
            Vul met veelgebruikte types
          </button>
        </div>
      ) : (
        <ul className="standaardlijst-lijst">
          {types.map((type) => (
            <li key={type.id} className="standaardlijst-item">
              <span className="standaardlijst-icoon">{type.icoon}</span>
              <span className="standaardlijst-naam">{type.naam}</span>
              <span className="check-herhaling">⟳ {type.herhaling}</span>
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
          placeholder="Nieuw type toevoegen, bijv. 'Gevelreiniging'..."
        />
        <button type="submit" className="btn-primary">
          + Toevoegen
        </button>
      </form>
    </Modal>
  )
}
