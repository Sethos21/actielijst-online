import { useMemo, useState, type FormEvent } from 'react'
import type { Klant } from './types'
import { useKlanten } from './useKlanten'

interface Props {
  onSelectKlant: (klant: Klant) => void
}

export function KlantoverzichtPage({ onSelectKlant }: Props) {
  const { klanten, loading, addKlant } = useKlanten()
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

      <form onSubmit={handleSubmit}>
        <label htmlFor="nieuwe-klant">Nieuwe klant</label>
        <input
          id="nieuwe-klant"
          value={nieuweKlant}
          onChange={(e) => setNieuweKlant(e.target.value)}
          placeholder="Klantnaam"
        />
        <button type="submit">Toevoegen</button>
      </form>

      {loading ? (
        <p>Klanten laden...</p>
      ) : zichtbareKlanten.length === 0 ? (
        <p>Geen klanten gevonden.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  onClick={() =>
                    setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
                  }
                >
                  Naam {sortRichting === 'asc' ? '▲' : '▼'}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {zichtbareKlanten.map((klant) => (
              <tr key={klant.id}>
                <td>
                  <button type="button" onClick={() => onSelectKlant(klant)}>
                    {klant.naam}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
