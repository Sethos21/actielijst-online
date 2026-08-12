import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import type { Klant } from '../klanten/types'
import { useKlanten } from '../klanten/useKlanten'
import { bepaalEffectieveStatus } from '../onderhoud/dueDate'
import { useAlleOnderhoud } from '../onderhoud/useOnderhoud'
import type { Pand } from './types'
import { useAllePanden } from './usePanden'

interface Props {
  onTerug: () => void
  onSelectPand: (pand: Pand, klant: Klant) => void
}

type SortVeld = 'pand' | 'klant'

export function PandenOverzichtPage({ onTerug, onSelectPand }: Props) {
  const { panden, loading: pandenLoading } = useAllePanden()
  const { klanten, loading: klantenLoading } = useKlanten()
  const { onderhoud } = useAlleOnderhoud()
  const [zoekterm, setZoekterm] = useState('')
  const [sortVeld, setSortVeld] = useState<SortVeld>('pand')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')

  function sorteerOp(veld: SortVeld) {
    if (veld === sortVeld) {
      setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
    } else {
      setSortVeld(veld)
      setSortRichting('asc')
    }
  }

  const rijen = useMemo(() => {
    const term = zoekterm.toLowerCase().trim()
    const klantenPerId = new Map(klanten.map((k) => [k.id, k]))
    const gefilterd = panden
      .filter((pand) => !pand.gearchiveerdOp)
      .map((pand) => ({ pand, klant: klantenPerId.get(pand.klantId) }))
      .filter((rij): rij is { pand: Pand; klant: Klant } => rij.klant != null)
      .filter(
        ({ pand, klant }) =>
          term === '' ||
          pand.naam.toLowerCase().includes(term) ||
          klant.naam.toLowerCase().includes(term),
      )
      .map((rij) => ({
        ...rij,
        dueCount: onderhoud.filter(
          (item) =>
            item.pandId === rij.pand.id &&
            !item.gearchiveerdOp &&
            bepaalEffectieveStatus(item) === 'due',
        ).length,
      }))

    const waarde = (rij: (typeof gefilterd)[number]) =>
      sortVeld === 'pand' ? rij.pand.naam : rij.klant.naam
    const gesorteerd = gefilterd.sort((a, b) => waarde(a).localeCompare(waarde(b)))
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [panden, klanten, onderhoud, zoekterm, sortVeld, sortRichting])

  function kolomkop(label: string, veld: SortVeld) {
    return (
      <th>
        <button type="button" onClick={() => sorteerOp(veld)}>
          {label} {sortVeld === veld ? (sortRichting === 'asc' ? '▲' : '▼') : ''}
        </button>
      </th>
    )
  }

  const loading = pandenLoading || klantenLoading

  return (
    <div>
      <button type="button" onClick={onTerug}>
        ← Terug naar start
      </button>
      <h1>Panden — overzicht</h1>

      <input
        aria-label="Zoek pand of klant"
        placeholder="Zoek op pand of klantnaam..."
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
      />

      {loading ? (
        <p>Panden laden...</p>
      ) : rijen.length === 0 ? (
        <p>Geen panden gevonden.</p>
      ) : (
        <table className="panden-overzicht">
          <thead>
            <tr>
              {kolomkop('Pand', 'pand')}
              {kolomkop('Klant', 'klant')}
              <th>Onderhoud</th>
            </tr>
          </thead>
          <tbody>
            {rijen.map(({ pand, klant, dueCount }) => (
              <tr
                key={pand.id}
                className="panden-overzicht-rij"
                onClick={() => onSelectPand(pand, klant)}
              >
                <td>🏠 {pand.naam}</td>
                <td>{klant.naam}</td>
                <td>{dueCount > 0 && <Badge variant="due">{dueCount} due</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
