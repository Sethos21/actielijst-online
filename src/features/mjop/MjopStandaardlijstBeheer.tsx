import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { TEAMLEDEN } from '../team/teamleden'
import type { MjopCategorie } from './types'
import { useMjop } from './useMjop'
import {
  MJOP_CATEGORIE_LABELS,
  useMjopStandaardlijst,
  type MjopStandaardType,
} from './useMjopStandaardlijst'

interface Props {
  pandId: string
  klantId: string
  onSluiten: () => void
}

export function MjopStandaardlijstBeheer({ pandId, klantId, onSluiten }: Props) {
  const { types, loading, voegTypeToe, verwijderType } = useMjopStandaardlijst()
  const { posten, addPost, archiveer } = useMjop(pandId)
  const [naam, setNaam] = useState('')
  const [categorie, setCategorie] = useState<MjopCategorie>('onderhoud')
  const [toegevoegdDoor, setToegevoegdDoor] = useState<string>(TEAMLEDEN[0])
  const huidigJaar = new Date().getFullYear()
  const [jaren, setJaren] = useState<Record<string, string>>({})
  const [bedragen, setBedragen] = useState<Record<string, string>>({})

  const alGekoppeld = new Map(
    posten.filter((p) => !p.gearchiveerdOp).map((p) => [p.naam, p.id]),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await voegTypeToe(naam, categorie, '🏗️')
    setNaam('')
    setCategorie('onderhoud')
  }

  async function toggleGekoppeld(type: MjopStandaardType) {
    const bestaandId = alGekoppeld.get(type.naam)
    if (bestaandId) {
      // checkbox uit: archiveren, niet definitief verwijderen — terugvindbaar
      // en herstelbaar via het archiefscherm.
      await archiveer(bestaandId)
    } else {
      const gekozenJaar = parseInt(jaren[type.id] ?? String(huidigJaar), 10)
      await addPost({
        klantId,
        naam: type.naam,
        categorie: type.categorie,
        jaar: gekozenJaar,
        geschatBedrag: parseInt(bedragen[type.id] ?? '0', 10) || 0,
        status: gekozenJaar === huidigJaar ? 'dit-jaar' : 'gepland',
        toegevoegdDoor,
        aangemaaktOp: Date.now(),
      })
    }
  }

  return (
    <Modal titel="MJOP-standaardlijst beheren" onSluiten={onSluiten}>
      <label className="standaardlijst-leverancier-label">
        Toegevoegd door
        <select
          aria-label="Toegevoegd door"
          value={toegevoegdDoor}
          onChange={(e) => setToegevoegdDoor(e.target.value)}
        >
          {TEAMLEDEN.map((lid) => (
            <option key={lid} value={lid}>
              {lid}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p>Laden...</p>
      ) : types.length === 0 ? (
        <p>Nog geen standaardtypen.</p>
      ) : (
        <ul className="standaardlijst-lijst">
          {types.map((type) => {
            const gekoppeld = alGekoppeld.has(type.naam)
            return (
              <li key={type.id} className="standaardlijst-item">
                <input
                  type="checkbox"
                  checked={gekoppeld}
                  onChange={() => toggleGekoppeld(type)}
                  aria-label={`${type.naam} toevoegen aan dit pand`}
                />
                <span className="standaardlijst-icoon">{type.icoon}</span>
                <span className="standaardlijst-naam">{type.naam}</span>
                <span className="mjop-categorie-label">
                  {MJOP_CATEGORIE_LABELS[type.categorie]}
                </span>
                {!gekoppeld && (
                  <div className="mjop-standaardlijst-detailvelden">
                    <label className="standaardlijst-leverancier-label">
                      Jaar voor &quot;{type.naam}&quot;
                      <input
                        aria-label={`Jaar voor ${type.naam}`}
                        type="number"
                        value={jaren[type.id] ?? String(huidigJaar)}
                        onChange={(e) =>
                          setJaren((huidig) => ({ ...huidig, [type.id]: e.target.value }))
                        }
                      />
                    </label>
                    <label className="standaardlijst-leverancier-label">
                      Geschat bedrag voor &quot;{type.naam}&quot;
                      <input
                        aria-label={`Geschat bedrag voor ${type.naam}`}
                        type="number"
                        placeholder="0"
                        value={bedragen[type.id] ?? ''}
                        onChange={(e) =>
                          setBedragen((huidig) => ({ ...huidig, [type.id]: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                )}
                <button
                  type="button"
                  className="icoon-knop"
                  aria-label={`Verwijderen: ${type.naam}`}
                  onClick={() => verwijderType(type.id)}
                >
                  ✕
                </button>
              </li>
            )
          })}
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
