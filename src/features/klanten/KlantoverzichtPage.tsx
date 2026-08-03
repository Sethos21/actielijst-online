import { useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../../components/Badge'
import { useActieStats } from '../acties/useActieStats'
import type { Klant } from './types'
import { useKlanten } from './useKlanten'

interface Props {
  onSelectKlant: (klant: Klant) => void
  onImporteren: () => void
}

export function KlantoverzichtPage({ onSelectKlant, onImporteren }: Props) {
  const { klanten, loading, addKlant } = useKlanten()
  const stats = useActieStats()
  const [zoekterm, setZoekterm] = useState('')
  const [nieuweKlant, setNieuweKlant] = useState('')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')

  const zichtbareKlanten = useMemo(() => {
    const gefilterd = klanten.filter((k) =>
      k.naam.toLowerCase().includes(zoekterm.toLowerCase()),
    )
    const gesorteerd = [...gefilterd].sort((a, b) =>
      a.naam.localeCompare(b.naam),
    )
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [klanten, zoekterm, sortRichting])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addKlant(nieuweKlant)
    setNieuweKlant('')
  }

  return (
    <div>
      <h1>Klantoverzicht</h1>

      <input
        aria-label="Zoek klant"
        placeholder="Zoek op klantnaam..."
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
        }
      >
        Naam {sortRichting === 'asc' ? '▲' : '▼'}
      </button>
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
        <div>
          {zichtbareKlanten.map((klant) => {
            const klantStats = stats[klant.id]
            return (
              <div key={klant.id} className="kaart">
                <button type="button" onClick={() => onSelectKlant(klant)}>
                  {klant.naam}
                </button>
                {klantStats && (
                  <>
                    <Badge variant="open">{klantStats.open} open</Badge>
                    {klantStats.due > 0 && (
                      <Badge variant="due">{klantStats.due} due</Badge>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
