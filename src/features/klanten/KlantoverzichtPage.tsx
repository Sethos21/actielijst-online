import { useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { Badge } from '../../components/Badge'
import { formatteerDatum } from '../../lib/datum'
import { useActieStats } from '../acties/useActieStats'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
import { useLaatsteVersieDatums } from '../versies/useLaatsteVersieDatums'
import type { Klant } from './types'
import { actieveKlanten, useKlanten } from './useKlanten'

interface Props {
  onSelectKlant: (klant: Klant) => void
  onImporteren: () => void
  onTerugNaarStart: () => void
}

type SortVeld = 'naam' | 'laatsteVersie'

export function KlantoverzichtPage({
  onSelectKlant,
  onImporteren,
  onTerugNaarStart,
}: Props) {
  const { klanten: alleKlanten, loading, addKlant, archiveer } = useKlanten()
  const klanten = actieveKlanten(alleKlanten)
  const stats = useActieStats()
  const laatsteVersieDatums = useLaatsteVersieDatums()
  const [zoekterm, setZoekterm] = useState('')
  const [nieuweKlant, setNieuweKlant] = useState('')
  const [sortVeld, setSortVeld] = useState<SortVeld>('naam')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')

  function sorteerOp(veld: SortVeld) {
    if (veld === sortVeld) {
      setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
    } else {
      setSortVeld(veld)
      setSortRichting('asc')
    }
  }

  const zichtbareKlanten = useMemo(() => {
    const gefilterd = klanten.filter((k) =>
      k.naam.toLowerCase().includes(zoekterm.toLowerCase()),
    )
    const waarde = (klant: Klant) =>
      sortVeld === 'naam' ? klant.naam : (laatsteVersieDatums[klant.id] ?? '')
    const gesorteerd = [...gefilterd].sort((a, b) =>
      waarde(a).localeCompare(waarde(b)),
    )
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [klanten, zoekterm, sortVeld, sortRichting, laatsteVersieDatums])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addKlant(nieuweKlant)
    setNieuweKlant('')
  }

  function handleArchiveren(klant: Klant, event: MouseEvent) {
    event.stopPropagation()
    const gegevens = vraagArchiveerGegevens()
    if (gegevens) archiveer(klant.id, gegevens.door, gegevens.reden)
  }

  function kolomkop(label: string, veld: SortVeld) {
    return (
      <th>
        <button type="button" onClick={() => sorteerOp(veld)}>
          {label} {sortVeld === veld ? (sortRichting === 'asc' ? '▲' : '▼') : ''}
        </button>
      </th>
    )
  }

  return (
    <div>
      <button type="button" onClick={onTerugNaarStart}>
        ← Terug naar start
      </button>
      <h1>Klantoverzicht</h1>

      <input
        aria-label="Zoek klant"
        placeholder="Zoek op klantnaam..."
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
      />
      <button type="button" onClick={onImporteren}>
        Excel importeren
      </button>

      <form onSubmit={handleSubmit}>
        <label>
          Nieuwe klant
          <input
            value={nieuweKlant}
            onChange={(e) => setNieuweKlant(e.target.value)}
            placeholder="Klantnaam"
          />
        </label>
        <button type="submit" className="primary">
          Toevoegen
        </button>
      </form>

      {loading ? (
        <p>Klanten laden...</p>
      ) : zichtbareKlanten.length === 0 ? (
        <p>Geen klanten gevonden. Voeg er hierboven eentje toe.</p>
      ) : (
        <table className="klantoverzicht">
          <thead>
            <tr>
              {kolomkop('Klant', 'naam')}
              <th>Status</th>
              {kolomkop('Laatste versie', 'laatsteVersie')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zichtbareKlanten.map((klant) => {
              const klantStats = stats[klant.id]
              const laatsteVersie = laatsteVersieDatums[klant.id]
              return (
                <tr
                  key={klant.id}
                  className="klantoverzicht-rij"
                  onClick={() => onSelectKlant(klant)}
                >
                  <td>{klant.naam}</td>
                  <td>
                    {klantStats && (
                      <>
                        <Badge variant="open">{klantStats.open} open</Badge>
                        {klantStats.due > 0 && (
                          <Badge variant="due">{klantStats.due} due</Badge>
                        )}
                      </>
                    )}
                  </td>
                  <td>{laatsteVersie ? formatteerDatum(laatsteVersie) : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="icoon-knop"
                      aria-label={`Archiveren: ${klant.naam}`}
                      onClick={(event) => handleArchiveren(klant, event)}
                    >
                      📦
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
