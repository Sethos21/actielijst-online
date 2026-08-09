import { useState } from 'react'
import { TEAMLEDEN } from '../team/teamleden'
import { useMjop } from './useMjop'
import { useMjopStandaardlijst } from './useMjopStandaardlijst'

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
  const { types } = useMjopStandaardlijst()
  const { addPost } = useMjop(pandId)
  const huidigJaar = new Date().getFullYear()
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [jaren, setJaren] = useState<Record<string, string>>({})
  const [bedragen, setBedragen] = useState<Record<string, string>>({})
  const [toegevoegdDoor, setToegevoegdDoor] = useState<string>(TEAMLEDEN[0])
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
        const gekozenJaar = parseInt(jaren[typeId] ?? String(huidigJaar), 10)
        await addPost({
          klantId,
          naam: type.naam,
          categorie: type.categorie,
          jaar: gekozenJaar,
          geschatBedrag: parseInt(bedragen[typeId] ?? '0', 10) || 0,
          status: gekozenJaar === huidigJaar ? 'dit-jaar' : 'gepland',
          toegevoegdDoor,
          aangemaaktOp: Date.now(),
        })
      }
      onGesloten()
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="standaardlijst-toevoegen-paneel">
      <h3>MJOP-post toevoegen</h3>
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
              {algekoppeld ? 'al gekoppeld aan dit pand' : type.categorie}
            </span>
          </label>
        )
      })}

      {Array.from(geselecteerd).map((typeId) => {
        const type = types.find((t) => t.id === typeId)
        if (!type) return null
        return (
          <div key={typeId} className="mjop-standaardlijst-detailvelden">
            <label className="standaardlijst-leverancier-label">
              Jaar voor &quot;{type.naam}&quot;
              <input
                aria-label={`Jaar voor ${type.naam}`}
                type="number"
                value={jaren[typeId] ?? String(huidigJaar)}
                onChange={(e) => setJaren((huidig) => ({ ...huidig, [typeId]: e.target.value }))}
              />
            </label>
            <label className="standaardlijst-leverancier-label">
              Geschat bedrag voor &quot;{type.naam}&quot;
              <input
                aria-label={`Geschat bedrag voor ${type.naam}`}
                type="number"
                placeholder="0"
                value={bedragen[typeId] ?? ''}
                onChange={(e) =>
                  setBedragen((huidig) => ({ ...huidig, [typeId]: e.target.value }))
                }
              />
            </label>
          </div>
        )
      })}

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
