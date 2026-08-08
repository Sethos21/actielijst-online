import { useState } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import {
  bepaalOnderhoudStatus,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
} from './dueDate'
import { OnderhoudStandaardlijstBeheer } from './OnderhoudStandaardlijstBeheer'
import { ToevoegenVanuitStandaardlijst } from './ToevoegenVanuitStandaardlijst'
import { useOnderhoud } from './useOnderhoud'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
}

export function OnderhoudTab({ pandId, klantId, pandNaam }: Props) {
  const { onderhoud, loading, vinkAf } = useOnderhoud(pandId)
  const { addActie } = useActies(klantId)
  const [toevoegenOpen, setToevoegenOpen] = useState(false)
  const [beherenOpen, setBeherenOpen] = useState(false)

  const alGekoppeldeNamen = new Set(onderhoud.map((item) => item.naam))

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-titel">Onderhoudsitems</div>
        <div className="toolbar-acties">
          <button type="button" onClick={() => setBeherenOpen(true)}>
            ⚙ Beheren
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setToevoegenOpen((open) => !open)}
          >
            + Item toevoegen
          </button>
        </div>
      </div>

      {toevoegenOpen && (
        <ToevoegenVanuitStandaardlijst
          pandId={pandId}
          klantId={klantId}
          alGekoppeldeNamen={alGekoppeldeNamen}
          onGesloten={() => setToevoegenOpen(false)}
        />
      )}

      {beherenOpen && (
        <OnderhoudStandaardlijstBeheer onSluiten={() => setBeherenOpen(false)} />
      )}

      {loading ? (
        <p>Onderhoud laden...</p>
      ) : onderhoud.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen onderhoudsitems.</div>
        </div>
      ) : (
        <div className="checklist">
          {onderhoud.map((item) => {
            const status = bepaalOnderhoudStatus(item.volgendeDatum)
            const gedaan = status === 'ok'
            return (
              <div className="check-item" key={item.id}>
                <button
                  type="button"
                  className={gedaan ? 'check-vinkje gedaan' : 'check-vinkje'}
                  onClick={() => vinkAf(item.id)}
                  aria-label={`Afvinken: ${item.naam}`}
                >
                  {gedaan && '✓'}
                </button>
                <div className="check-info">
                  <div className={gedaan ? 'check-naam gedaan' : 'check-naam'}>
                    {item.naam}
                  </div>
                  <div className="check-meta">
                    {item.leverancier ? `Leverancier: ${item.leverancier} · ` : ''}
                    {item.laatstUitgevoerdOp
                      ? `Laatst uitgevoerd: ${formatKorteDatum(item.laatstUitgevoerdOp)}`
                      : 'Nog niet uitgevoerd'}
                  </div>
                </div>
                <span className="check-herhaling">⟳ {item.herhaling}</span>
                <span className={`check-status ${status}`}>
                  {formatOnderhoudStatusLabel(item.volgendeDatum)}
                </span>
                <button
                  type="button"
                  className="check-actie-btn"
                  onClick={() =>
                    addActie(
                      bouwActieVanuitBron({
                        type: 'onderhoud',
                        bronId: item.id,
                        label: item.naam,
                        klantId,
                        pandId,
                        pandNaam,
                      }),
                    )
                  }
                >
                  + Actie aanmaken
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
