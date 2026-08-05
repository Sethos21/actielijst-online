import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/useToast'
import { foutmelding, metTimeout } from '../../lib/metTimeout'
import { TEAMLEDEN } from '../team/teamleden'
import type { ActieItem } from '../acties/types'
import { useVersies } from './useVersies'

interface Props {
  klantId: string
  klantNaam: string
  acties: ActieItem[]
  onSluiten: () => void
}

const TIMEOUT_MS = 30_000

function vandaag(): string {
  return new Date().toISOString().slice(0, 10)
}

export function VergaderingAfsluitenModal({
  klantId,
  klantNaam,
  acties,
  onSluiten,
}: Props) {
  const { sluitVergaderingAf } = useVersies(klantId)
  const toon = useToast()
  const [naam, setNaam] = useState(`Vergadering ${klantNaam}`)
  const [datum, setDatum] = useState(vandaag())
  const [aanwezigen, setAanwezigen] = useState<string[]>([])
  const [afgeslotenDoor, setAfgeslotenDoor] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  function toggleAanwezige(naamTeamlid: string) {
    setAanwezigen((huidig) =>
      huidig.includes(naamTeamlid)
        ? huidig.filter((n) => n !== naamTeamlid)
        : [...huidig, naamTeamlid],
    )
  }

  async function handleBevestigen() {
    if (!naam.trim()) {
      setFout('Vul een naam voor deze vergadering in.')
      return
    }
    if (!afgeslotenDoor) {
      setFout('Kies wie deze vergadering afsluit.')
      return
    }

    setBezig(true)
    setFout(null)
    try {
      await metTimeout(
        sluitVergaderingAf({
          naam: naam.trim(),
          datum,
          aanwezigen,
          aangemaaktDoor: afgeslotenDoor,
          acties,
        }),
        TIMEOUT_MS,
      )
      toon(`Vergadering "${naam.trim()}" afgesloten — versie opgeslagen`)
      onSluiten()
    } catch (err) {
      setFout(foutmelding(err, 'Afsluiten'))
    } finally {
      setBezig(false)
    }
  }

  return (
    <Modal
      titel="Vergadering afsluiten"
      onSluiten={onSluiten}
      footer={
        <>
          <button type="button" onClick={onSluiten}>
            Annuleren
          </button>
          <button
            type="button"
            className="primary"
            disabled={bezig}
            onClick={handleBevestigen}
          >
            {bezig ? 'Bezig...' : 'Afsluiten'}
          </button>
        </>
      }
    >
      <p>
        Dit bewaart een read-only momentopname van de huidige actielijst. De
        actielijst zelf blijft gewoon bewerkbaar — dit is geen reset.
      </p>

      <label>
        Naam
        <input value={naam} onChange={(e) => setNaam(e.target.value)} />
      </label>

      <label>
        Datum
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
        />
      </label>

      <label>
        Afgesloten door
        <select
          value={afgeslotenDoor}
          onChange={(e) => setAfgeslotenDoor(e.target.value)}
        >
          <option value="">— Kies teamlid —</option>
          {TEAMLEDEN.map((naamTeamlid) => (
            <option key={naamTeamlid} value={naamTeamlid}>
              {naamTeamlid}
            </option>
          ))}
        </select>
      </label>

      <label>
        Aanwezigen
        <div>
          {TEAMLEDEN.map((naamTeamlid) => (
            <label key={naamTeamlid}>
              <input
                type="checkbox"
                checked={aanwezigen.includes(naamTeamlid)}
                onChange={() => toggleAanwezige(naamTeamlid)}
              />
              {naamTeamlid}
            </label>
          ))}
        </div>
      </label>

      {fout && <p role="alert">{fout}</p>}
    </Modal>
  )
}
