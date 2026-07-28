import { useState, type ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/useToast'
import { useKlanten } from '../klanten/useKlanten'
import { TEAMLEDEN } from '../team/teamleden'
import { importeerActies } from './bulkImporteren'
import { parseerActies, type GeimporteerdeActie } from './excelImport'

interface Props {
  onSluiten: () => void
}

const VOORVERTONING_LIMIET = 20

export function ImportActiesModal({ onSluiten }: Props) {
  const { klanten, addKlant } = useKlanten()
  const toon = useToast()
  const [gekozenKlantId, setGekozenKlantId] = useState('')
  const [nieuweKlantNaam, setNieuweKlantNaam] = useState('')
  const [geparsed, setGeparsed] = useState<GeimporteerdeActie[] | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function handleBestand(event: ChangeEvent<HTMLInputElement>) {
    const bestand = event.target.files?.[0]
    if (!bestand) return
    setFout(null)
    setGeparsed(null)
    try {
      const data = await bestand.arrayBuffer()
      const werkboek = XLSX.read(data, { cellDates: true })
      const blad = werkboek.Sheets[werkboek.SheetNames[0]]
      const rijen = XLSX.utils.sheet_to_json<unknown[]>(blad, {
        header: 1,
        defval: '',
      })
      const acties = parseerActies(rijen, TEAMLEDEN)
      if (acties.length === 0) {
        setFout('Geen acties gevonden — controleer of dit het juiste bestand is.')
        return
      }
      setGeparsed(acties)
    } catch {
      setFout('Kon het bestand niet lezen. Is het een geldig Excel-bestand?')
    }
  }

  async function handleBevestigen() {
    if (!geparsed) return
    if (!gekozenKlantId && !nieuweKlantNaam.trim()) {
      setFout('Kies een bestaande klant of vul een nieuwe klantnaam in.')
      return
    }

    setBezig(true)
    setFout(null)
    try {
      const klantId = gekozenKlantId || (await addKlant(nieuweKlantNaam))
      if (!klantId) {
        setFout('Klant aanmaken is niet gelukt. Probeer het opnieuw.')
        return
      }
      const aantal = await importeerActies(klantId, geparsed)
      toon(`${aantal} acties geïmporteerd`)
      onSluiten()
    } catch {
      setFout('Importeren is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <Modal
      titel="Excel importeren"
      onSluiten={onSluiten}
      footer={
        <>
          <button type="button" onClick={onSluiten}>
            Annuleren
          </button>
          <button
            type="button"
            className="primary"
            disabled={!geparsed || bezig}
            onClick={handleBevestigen}
          >
            {bezig ? 'Bezig...' : 'Bevestigen'}
          </button>
        </>
      }
    >
      <label>
        Klant
        <select
          value={gekozenKlantId}
          onChange={(e) => setGekozenKlantId(e.target.value)}
        >
          <option value="">— Nieuwe klant —</option>
          {klanten.map((klant) => (
            <option key={klant.id} value={klant.id}>
              {klant.naam}
            </option>
          ))}
        </select>
      </label>

      {!gekozenKlantId && (
        <label>
          Nieuwe klantnaam
          <input
            value={nieuweKlantNaam}
            onChange={(e) => setNieuweKlantNaam(e.target.value)}
          />
        </label>
      )}

      <label>
        Excel-bestand (.xls of .xlsx)
        <input type="file" accept=".xls,.xlsx" onChange={handleBestand} />
      </label>

      {fout && <p role="alert">{fout}</p>}

      {geparsed && (
        <>
          <p>
            {geparsed.length} acties gevonden. Controleer de voorvertoning
            voordat je bevestigt.
          </p>
          <table className="actielijst">
            <thead>
              <tr>
                <th>Onderwerp</th>
                <th>Bedrijf</th>
                <th>Vestiging</th>
                <th>Actiepunt</th>
                <th>Verantw.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {geparsed.slice(0, VOORVERTONING_LIMIET).map((actie, index) => (
                <tr key={index}>
                  <td>{actie.onderwerp}</td>
                  <td>{actie.bedrijf}</td>
                  <td>{actie.vestiging}</td>
                  <td>{actie.actie}</td>
                  <td>{actie.verantw.join(', ')}</td>
                  <td>{actie.status === 'done' ? 'Gereed' : 'Open'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {geparsed.length > VOORVERTONING_LIMIET && (
            <p>+ nog {geparsed.length - VOORVERTONING_LIMIET} meer...</p>
          )}
        </>
      )}
    </Modal>
  )
}
