import { useState, type FormEvent } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
import { TEAMLEDEN } from '../team/teamleden'
import {
  bepaalEffectieveStatus,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
  moetAutomatischResetten,
} from './dueDate'
import { OnderhoudStandaardlijstBeheer } from './OnderhoudStandaardlijstBeheer'
import {
  ONDERHOUD_HERHALING_OPTIES,
  type Onderhoud,
  type OnderhoudHerhaling,
  type OnderhoudStatus,
} from './types'
import { useOnderhoud } from './useOnderhoud'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
  onNavigeerNaarActie: (actieId: string) => void
}

export function OnderhoudTab({ pandId, klantId, pandNaam, onNavigeerNaarActie }: Props) {
  const { onderhoud, loading, markeerUitgevoerd, updateOnderhoud, archiveer } =
    useOnderhoud(pandId)
  const { addActie } = useActies(klantId)
  const [beherenOpen, setBeherenOpen] = useState(false)
  const [bewerkItemId, setBewerkItemId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkLeverancier, setBewerkLeverancier] = useState('')
  const [bewerkVerantw, setBewerkVerantw] = useState<string>(TEAMLEDEN[0])
  const [bewerkHerhaling, setBewerkHerhaling] = useState<OnderhoudHerhaling>('jaarlijks')
  const [bewerkJaar, setBewerkJaar] = useState('')
  const [bewerkLaatstUitgevoerd, setBewerkLaatstUitgevoerd] = useState('')

  const actieveItems = onderhoud.filter((item) => !item.gearchiveerdOp)

  function startBewerken(item: Onderhoud) {
    setBewerkItemId(item.id)
    setBewerkNaam(item.naam)
    setBewerkLeverancier(item.leverancier ?? '')
    setBewerkVerantw(item.verantw)
    setBewerkHerhaling(item.herhaling)
    setBewerkJaar(item.jaar ? String(item.jaar) : '')
    setBewerkLaatstUitgevoerd(item.laatstUitgevoerdOp ?? '')
  }

  async function handleBewerkOpslaan(event: FormEvent) {
    event.preventDefault()
    if (bewerkItemId && bewerkNaam.trim()) {
      await updateOnderhoud(bewerkItemId, {
        naam: bewerkNaam.trim(),
        verantw: bewerkVerantw,
        herhaling: bewerkHerhaling,
        ...(bewerkLeverancier.trim() ? { leverancier: bewerkLeverancier.trim() } : {}),
        ...(bewerkJaar.trim() ? { jaar: parseInt(bewerkJaar, 10) } : {}),
        ...(bewerkLaatstUitgevoerd ? { laatstUitgevoerdOp: bewerkLaatstUitgevoerd } : {}),
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
        </div>
      </div>

      {beherenOpen && (
        <OnderhoudStandaardlijstBeheer
          pandId={pandId}
          klantId={klantId}
          onSluiten={() => setBeherenOpen(false)}
        />
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
                <select
                  aria-label={`Herhaling bewerken voor ${item.naam}`}
                  value={bewerkHerhaling}
                  onChange={(e) => setBewerkHerhaling(e.target.value as OnderhoudHerhaling)}
                >
                  {ONDERHOUD_HERHALING_OPTIES.map((optie) => (
                    <option key={optie} value={optie}>
                      {optie}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  aria-label={`Jaar bewerken voor ${item.naam}`}
                  value={bewerkJaar}
                  onChange={(e) => setBewerkJaar(e.target.value)}
                  placeholder="Jaar"
                />
                <input
                  type="date"
                  aria-label={`Laatst uitgevoerd bewerken voor ${item.naam}`}
                  value={bewerkLaatstUitgevoerd}
                  onChange={(e) => setBewerkLaatstUitgevoerd(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Opslaan
                </button>
                <button type="button" onClick={() => setBewerkItemId(null)}>
                  Annuleren
                </button>
              </form>
            ) : (
              (() => {
                const effectieveStatus = bepaalEffectieveStatus(item)
                const gedaan = effectieveStatus === 'voltooid'
                const automatischGereset =
                  item.status === 'voltooid' && moetAutomatischResetten(item)
                return (
                  <div className="check-item" key={item.id}>
                    <button
                      type="button"
                      className={gedaan ? 'check-vinkje gedaan' : 'check-vinkje'}
                      onClick={() =>
                        markeerUitgevoerd(item.id, new Date().toISOString().slice(0, 10))
                      }
                      aria-label={`Vandaag uitgevoerd: ${item.naam}`}
                      title="Markeer als vandaag uitgevoerd"
                    >
                      {gedaan && '✓'}
                    </button>
                    <div className="check-info">
                      <div className={gedaan ? 'check-naam gedaan' : 'check-naam'}>
                        {item.naam}
                        {item.jaar ? ` (${item.jaar})` : ''}
                      </div>
                      <div className="check-meta">
                        {item.leverancier ? `Leverancier: ${item.leverancier} · ` : ''}
                        {item.laatstUitgevoerdOp
                          ? `Laatst uitgevoerd: ${formatKorteDatum(
                              new Date(item.laatstUitgevoerdOp).getTime(),
                            )}`
                          : 'Nog niet uitgevoerd'}
                      </div>
                      {automatischGereset && (
                        <div className="check-auto-reset">🔄 automatisch gereset dit jaar</div>
                      )}
                    </div>
                    <span className="check-herhaling">⟳ {item.herhaling}</span>
                    <span className="check-voorstel">
                      voorstel: {formatOnderhoudStatusLabel(item.volgendeDatum)}
                    </span>
                    <select
                      aria-label={`Status voor ${item.naam}`}
                      className={`check-status check-status-${effectieveStatus}`}
                      value={effectieveStatus}
                      onChange={(e) =>
                        updateOnderhoud(item.id, {
                          status: e.target.value as OnderhoudStatus,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="due">Due</option>
                      <option value="voltooid">Voltooid</option>
                    </select>
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
                      onClick={async () => {
                        const id = await addActie(
                          bouwActieVanuitBron({
                            type: 'onderhoud',
                            bronId: item.id,
                            label: item.naam,
                            klantId,
                            pandId,
                            pandNaam,
                          }),
                        )
                        onNavigeerNaarActie(id)
                      }}
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
