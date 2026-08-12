import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { TEAMLEDEN } from '../team/teamleden'
import { ONDERHOUD_HERHALING_OPTIES, type OnderhoudHerhaling } from './types'
import { useOnderhoud } from './useOnderhoud'
import { useOnderhoudStandaardlijst, type StandaardType } from './useOnderhoudStandaardlijst'

interface Props {
  pandId: string
  klantId: string
  onSluiten: () => void
}

export function OnderhoudStandaardlijstBeheer({ pandId, klantId, onSluiten }: Props) {
  const { types, loading, voegTypeToe, verwijderType, vulMetVoorbeelden } =
    useOnderhoudStandaardlijst()
  const { onderhoud, addOnderhoud, archiveer } = useOnderhoud(pandId)
  const [naam, setNaam] = useState('')
  const [herhaling, setHerhaling] = useState<OnderhoudHerhaling>('jaarlijks')
  const [verantw, setVerantw] = useState<string>(TEAMLEDEN[0])

  const alGekoppeld = new Map(
    onderhoud.filter((o) => !o.gearchiveerdOp).map((o) => [o.naam, o.id]),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await voegTypeToe(naam, herhaling, '🔧')
    setNaam('')
    setHerhaling('jaarlijks')
  }

  async function toggleGekoppeld(type: StandaardType) {
    const bestaandId = alGekoppeld.get(type.naam)
    if (bestaandId) {
      // checkbox uit: archiveren, niet definitief verwijderen — terugvindbaar
      // en herstelbaar via het archiefscherm, inclusief eerder ingevulde
      // leverancier/historie.
      await archiveer(bestaandId)
    } else {
      // checkbox aan: direct toevoegen aan dit pand. Leverancier vul je
      // achteraf in via het gewone onderhoud-overzicht.
      await addOnderhoud({ naam: type.naam, verantw, klantId, herhaling: type.herhaling })
    }
  }

  return (
    <Modal titel="Onderhoud-standaardlijst beheren" onSluiten={onSluiten}>
      <label className="standaardlijst-leverancier-label">
        Verantwoordelijke bij toevoegen
        <select
          aria-label="Verantwoordelijke bij toevoegen"
          value={verantw}
          onChange={(e) => setVerantw(e.target.value)}
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
              <input
                type="checkbox"
                checked={alGekoppeld.has(type.naam)}
                onChange={() => toggleGekoppeld(type)}
                aria-label={`${type.naam} toevoegen aan dit pand`}
              />
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
        <select
          aria-label="Herhaling voor nieuw standaardtype"
          value={herhaling}
          onChange={(e) => setHerhaling(e.target.value as OnderhoudHerhaling)}
        >
          {ONDERHOUD_HERHALING_OPTIES.map((optie) => (
            <option key={optie} value={optie}>
              {optie}
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
