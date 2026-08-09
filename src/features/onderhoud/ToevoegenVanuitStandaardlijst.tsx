import { useState } from 'react'
import { TEAMLEDEN } from '../team/teamleden'
import { useOnderhoud } from './useOnderhoud'
import { useOnderhoudStandaardlijst } from './useOnderhoudStandaardlijst'

interface Props {
  pandId: string
  klantId: string
  alGekoppeldeNamen: Set<string>
  onGesloten: () => void
}

export function ToevoegenVanuitStandaardlijst({
  pandId,
  klantId,
  alGekoppeldeNamen,
  onGesloten,
}: Props) {
  const { types } = useOnderhoudStandaardlijst()
  const { addOnderhoud } = useOnderhoud(pandId)
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [leveranciers, setLeveranciers] = useState<Record<string, string>>({})
  const [verantw, setVerantw] = useState<string>(TEAMLEDEN[0])
  const [bezig, setBezig] = useState(false)

  function toggle(typeId: string) {
    setGeselecteerd((huidig) => {
      const nieuw = new Set(huidig)
      if (nieuw.has(typeId)) nieuw.delete(typeId)
      else nieuw.add(typeId)
      return nieuw
    })
  }

  async function handleToevoegen() {
    setBezig(true)
    try {
      for (const typeId of geselecteerd) {
        const type = types.find((t) => t.id === typeId)
        if (!type) continue
        await addOnderhoud({
          naam: type.naam,
          verantw,
          klantId,
          leverancier: leveranciers[typeId],
        })
      }
      onGesloten()
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="standaardlijst-toevoegen-paneel">
      <h3>Onderhoud toevoegen</h3>
      <p className="standaardlijst-toevoegen-uitleg">
        Kies uit de standaardlijst, of vink meerdere aan om in één keer toe te voegen
      </p>

      {types.map((type) => {
        const algekoppeld = alGekoppeldeNamen.has(type.naam)
        return (
          <label
            key={type.id}
            className={algekoppeld ? 'toevoegen-item algekoppeld' : 'toevoegen-item'}
          >
            <input
              type="checkbox"
              checked={geselecteerd.has(type.id)}
              disabled={algekoppeld}
              onChange={() => toggle(type.id)}
            />
            <span>
              {type.icoon} {type.naam}
            </span>
            <span className="toevoegen-item-status">
              {algekoppeld ? 'al gekoppeld aan dit pand' : type.herhaling}
            </span>
          </label>
        )
      })}

      {Array.from(geselecteerd).map((typeId) => {
        const type = types.find((t) => t.id === typeId)
        if (!type) return null
        return (
          <label key={typeId} className="standaardlijst-leverancier-label">
            Leverancier voor "{type.naam}"
            <input
              aria-label={`Leverancier voor ${type.naam}`}
              value={leveranciers[typeId] ?? ''}
              onChange={(e) =>
                setLeveranciers((huidig) => ({ ...huidig, [typeId]: e.target.value }))
              }
            />
          </label>
        )
      })}

      <label className="standaardlijst-leverancier-label">
        Verantwoordelijke
        <select
          aria-label="Verantwoordelijke voor onderhoudsitem"
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

      <div className="standaardlijst-toevoegen-acties">
        <button type="button" onClick={onGesloten}>
          Annuleren
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={geselecteerd.size === 0 || bezig}
          onClick={handleToevoegen}
        >
          {geselecteerd.size} item{geselecteerd.size === 1 ? '' : 's'} toevoegen aan dit
          pand
        </button>
      </div>
    </div>
  )
}
