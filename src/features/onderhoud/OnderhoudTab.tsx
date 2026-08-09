import { useState, type FormEvent } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
import { TEAMLEDEN } from '../team/teamleden'
import {
  bepaalOnderhoudStatus,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
} from './dueDate'
import { OnderhoudStandaardlijstBeheer } from './OnderhoudStandaardlijstBeheer'
import { ToevoegenVanuitStandaardlijst } from './ToevoegenVanuitStandaardlijst'
import type { Onderhoud } from './types'
import { useOnderhoud } from './useOnderhoud'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
}

export function OnderhoudTab({ pandId, klantId, pandNaam }: Props) {
  const { onderhoud, loading, vinkAf, updateOnderhoud, archiveer } = useOnderhoud(pandId)
  const { addActie } = useActies(klantId)
  const [toevoegenOpen, setToevoegenOpen] = useState(false)
  const [beherenOpen, setBeherenOpen] = useState(false)
  const [bewerkItemId, setBewerkItemId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkLeverancier, setBewerkLeverancier] = useState('')
  const [bewerkVerantw, setBewerkVerantw] = useState<string>(TEAMLEDEN[0])

  const actieveItems = onderhoud.filter((item) => !item.gearchiveerdOp)
  const alGekoppeldeNamen = new Set(actieveItems.map((item) => item.naam))

  function startBewerken(item: Onderhoud) {
    setBewerkItemId(item.id)
    setBewerkNaam(item.naam)
    setBewerkLeverancier(item.leverancier ?? '')
    setBewerkVerantw(item.verantw)
  }

  async function handleBewerkOpslaan(event: FormEvent) {
    event.preventDefault()
    if (bewerkItemId && bewerkNaam.trim()) {
      await updateOnderhoud(bewerkItemId, {
        naam: bewerkNaam.trim(),
        verantw: bewerkVerantw,
        ...(bewerkLeverancier.trim() ? { leverancier: bewerkLeverancier.trim() } : {}),
      })
    }
    setBewerkItemId(null)
  }

  function handleArchiveren(item: Onderhoud) {
    const gegevens = vraagArchiveerGegevens()
    if (gegevens) archiveer(item.id, gegevens.door, gegevens.reden)
  }

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
      ) : actieveItems.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen onderhoudsitems.</div>
        </div>
      ) : (
        <div className="checklist">
          {actieveItems.map((item) =>
            bewerkItemId === item.id ? (
              <form
                key={item.id}
                onSubmit={handleBewerkOpslaan}
                className="check-bewerk-form"
              >
                <input
                  aria-label={`Naam bewerken voor ${item.naam}`}
                  value={bewerkNaam}
                  onChange={(e) => setBewerkNaam(e.target.value)}
                  autoFocus
                />
                <input
                  aria-label={`Leverancier bewerken voor ${item.naam}`}
                  value={bewerkLeverancier}
                  onChange={(e) => setBewerkLeverancier(e.target.value)}
                  placeholder="Leverancier"
                />
                <select
                  aria-label={`Verantwoordelijke bewerken voor ${item.naam}`}
                  value={bewerkVerantw}
                  onChange={(e) => setBewerkVerantw(e.target.value)}
                >
                  {TEAMLEDEN.map((lid) => (
                    <option key={lid} value={lid}>
                      {lid}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-primary">
                  Opslaan
                </button>
                <button type="button" onClick={() => setBewerkItemId(null)}>
                  Annuleren
                </button>
              </form>
            ) : (
              (() => {
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
                      className="icoon-knop"
                      aria-label={`Bewerken: ${item.naam}`}
                      onClick={() => startBewerken(item)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icoon-knop"
                      aria-label={`Archiveren: ${item.naam}`}
                      onClick={() => handleArchiveren(item)}
                    >
                      📦
                    </button>
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
              })()
            ),
          )}
        </div>
      )}
    </div>
  )
}
