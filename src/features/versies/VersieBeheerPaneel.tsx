import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { formatteerDatum } from '../../lib/datum'
import { berekenDueDate } from '../acties/dueDate'
import type { ActieStatus } from '../acties/types'
import type { Versie } from './types'
import { useVersies } from './useVersies'

interface Props {
  klantId: string
  onSluiten: () => void
}

const STATUS_LABEL: Record<ActieStatus, string> = {
  open: 'Open',
  done: 'Gereed',
  hold: 'On hold',
}

export function VersieBeheerPaneel({ klantId, onSluiten }: Props) {
  const { versies, loading } = useVersies(klantId)
  const [gekozenVersie, setGekozenVersie] = useState<Versie | null>(null)

  return (
    <div className="paneel-overlay" onClick={onSluiten}>
      <div
        className="paneel"
        role="dialog"
        aria-label="Versiebeheer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paneel-header">
          <h2>Versies</h2>
          <button type="button" onClick={onSluiten} aria-label="Sluiten">
            ×
          </button>
        </div>

        {gekozenVersie ? (
          <>
            <div className="readonly-banner">
              <span>
                Je bekijkt de versie van {formatteerDatum(gekozenVersie.datum)} —
                read-only
              </span>
              <button type="button" onClick={() => setGekozenVersie(null)}>
                Terug naar actuele lijst
              </button>
            </div>
            <table className="actielijst actielijst-readonly">
              <thead>
                <tr>
                  <th>Onderwerp</th>
                  <th>Bedrijf</th>
                  <th>Vestiging</th>
                  <th>Actiepunt</th>
                  <th>Verantw.</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Opmerking</th>
                </tr>
              </thead>
              <tbody>
                {gekozenVersie.snapshot.map((actie) => (
                  <tr key={actie.id}>
                    <td>{actie.onderwerp}</td>
                    <td>{actie.bedrijf}</td>
                    <td>{actie.vestiging}</td>
                    <td>{actie.actie}</td>
                    <td>{actie.verantw.join(', ')}</td>
                    <td>{berekenDueDate(actie)}</td>
                    <td>
                      <Badge variant={actie.status}>
                        {STATUS_LABEL[actie.status]}
                      </Badge>
                    </td>
                    <td>{actie.opmerking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : loading ? (
          <p>Versies laden...</p>
        ) : versies.length === 0 ? (
          <p>Nog geen versies. Sluit een vergadering af om de eerste versie te maken.</p>
        ) : (
          <ul className="versie-lijst">
            {versies.map((versie) => (
              <li key={versie.id}>
                <button
                  type="button"
                  className="versie-kaart"
                  onClick={() => setGekozenVersie(versie)}
                >
                  <strong>{versie.naam}</strong>
                  <span>{formatteerDatum(versie.datum)}</span>
                  {versie.aanwezigen.length > 0 && (
                    <span>Aanwezig: {versie.aanwezigen.join(', ')}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
