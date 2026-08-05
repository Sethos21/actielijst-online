import { useMemo, useState, type FormEvent } from 'react'
import { AvatarChip } from '../../components/AvatarChip'
import { Badge } from '../../components/Badge'
import { useToast } from '../../components/useToast'
import { TEAMLEDEN } from '../team/teamleden'
import { VergaderingAfsluitenModal } from '../versies/VergaderingAfsluitenModal'
import { VersieBeheerPaneel } from '../versies/VersieBeheerPaneel'
import { berekenDueDate, isDue } from './dueDate'
import {
  DOORLOOPTIJD_OPTIES,
  type ActieItem,
  type ActieStatus,
  type Doorlooptijd,
} from './types'
import { useActies } from './useActies'

interface Props {
  klantId: string
  klantNaam: string
  onTerug: () => void
}

type SortVeld = 'onderwerp' | 'vestiging' | 'aangemaaktOp' | 'due' | 'status'
type FilterPil = 'open' | 'done' | 'hold' | 'due'

const UITSTEL_OPTIES: { label: string; eenheid: 'w' | 'm'; aantal: number }[] = [
  { label: '1 week', eenheid: 'w', aantal: 1 },
  { label: '2 weken', eenheid: 'w', aantal: 2 },
  { label: '3 weken', eenheid: 'w', aantal: 3 },
  { label: '4 weken', eenheid: 'w', aantal: 4 },
  { label: '1 maand', eenheid: 'm', aantal: 1 },
  { label: '2 maanden', eenheid: 'm', aantal: 2 },
  { label: '3 maanden', eenheid: 'm', aantal: 3 },
  { label: '4 maanden', eenheid: 'm', aantal: 4 },
  { label: '5 maanden', eenheid: 'm', aantal: 5 },
  { label: '6 maanden', eenheid: 'm', aantal: 6 },
]

export function ActielijstPage({ klantId, klantNaam, onTerug }: Props) {
  const { acties, loading, addActie, updateActie, deleteActie, uitstellen } =
    useActies(klantId)
  const toon = useToast()
  const [sortVeld, setSortVeld] = useState<SortVeld>('due')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')
  const [actieveFilters, setActieveFilters] = useState<Set<FilterPil>>(new Set())
  const [nieuw, setNieuw] = useState({ onderwerp: '', bedrijf: '', vestiging: '', actie: '' })
  const [vergaderingModalOpen, setVergaderingModalOpen] = useState(false)
  const [versiesPaneelOpen, setVersiesPaneelOpen] = useState(false)

  function toggleFilter(pil: FilterPil) {
    const nieuweSet = new Set(actieveFilters)
    if (nieuweSet.has(pil)) nieuweSet.delete(pil)
    else nieuweSet.add(pil)
    setActieveFilters(nieuweSet)
  }

  function sorteerOp(veld: SortVeld) {
    if (veld === sortVeld) {
      setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
    } else {
      setSortVeld(veld)
      setSortRichting('asc')
    }
  }

  const gefilterdeActies = useMemo(() => {
    if (actieveFilters.size === 0) return acties
    return acties.filter((actie) => {
      const matches: boolean[] = []
      if (actieveFilters.has('open')) matches.push(actie.status === 'open')
      if (actieveFilters.has('done')) matches.push(actie.status === 'done')
      if (actieveFilters.has('hold')) matches.push(actie.status === 'hold')
      if (actieveFilters.has('due')) matches.push(isDue(actie))
      return matches.some(Boolean)
    })
  }, [acties, actieveFilters])

  const gesorteerdeActies = useMemo(() => {
    const waarde = (actie: ActieItem) => {
      if (sortVeld === 'due') return berekenDueDate(actie)
      return actie[sortVeld]
    }
    const gesorteerd = [...gefilterdeActies].sort((a, b) =>
      waarde(a).localeCompare(waarde(b)),
    )
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [gefilterdeActies, sortVeld, sortRichting])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!nieuw.actie.trim()) return
    await addActie({
      ref: '',
      onderwerp: nieuw.onderwerp,
      bedrijf: nieuw.bedrijf,
      vestiging: nieuw.vestiging,
      actie: nieuw.actie,
      verantw: [],
      aangemaaktOp: new Date().toISOString().slice(0, 10),
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })
    setNieuw({ onderwerp: '', bedrijf: '', vestiging: '', actie: '' })
    toon('Actie toegevoegd')
  }

  function toggleVerantw(actie: ActieItem, naam: string) {
    const nieuweVerantw = actie.verantw.includes(naam)
      ? actie.verantw.filter((v) => v !== naam)
      : [...actie.verantw, naam]
    updateActie(actie.id, { verantw: nieuweVerantw })
  }

  async function handleUitstellen(
    actieId: string,
    eenheid: 'w' | 'm',
    aantal: number,
    label: string,
  ) {
    await uitstellen(actieId, eenheid, aantal)
    toon(`Uitgesteld met ${label}`)
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
      <button type="button" onClick={onTerug}>
        ← Terug naar klantoverzicht
      </button>
      <div className="actielijst-titelbalk">
        <h1>Actielijst — {klantNaam}</h1>
        <div className="actielijst-titelbalk-acties">
          <button type="button" onClick={() => setVersiesPaneelOpen(true)}>
            Versies
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => setVergaderingModalOpen(true)}
          >
            Vergadering afsluiten
          </button>
        </div>
      </div>

      <div>
        {(['open', 'done', 'hold', 'due'] as FilterPil[]).map((pil) => (
          <button
            key={pil}
            type="button"
            className={`filter-pill ${actieveFilters.has(pil) ? 'actief' : ''}`}
            onClick={() => toggleFilter(pil)}
          >
            {pil === 'open' && 'Open'}
            {pil === 'done' && 'Gereed'}
            {pil === 'hold' && 'On hold'}
            {pil === 'due' && 'Due'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Onderwerp
          <input
            value={nieuw.onderwerp}
            onChange={(e) => setNieuw({ ...nieuw, onderwerp: e.target.value })}
          />
        </label>
        <label>
          Bedrijf
          <input
            value={nieuw.bedrijf}
            onChange={(e) => setNieuw({ ...nieuw, bedrijf: e.target.value })}
          />
        </label>
        <label>
          Vestiging
          <input
            value={nieuw.vestiging}
            onChange={(e) => setNieuw({ ...nieuw, vestiging: e.target.value })}
          />
        </label>
        <label>
          Actiepunt
          <input
            value={nieuw.actie}
            onChange={(e) => setNieuw({ ...nieuw, actie: e.target.value })}
          />
        </label>
        <button type="submit" className="primary">
          Actie toevoegen
        </button>
      </form>

      {loading ? (
        <p>Acties laden...</p>
      ) : gesorteerdeActies.length === 0 ? (
        <p>Nog geen acties voor deze klant. Voeg er hierboven eentje toe.</p>
      ) : (
        <table className="actielijst">
          <thead>
            <tr>
              {kolomkop('Onderwerp', 'onderwerp')}
              <th>Bedrijf</th>
              {kolomkop('Vestiging', 'vestiging')}
              <th>Actiepunt</th>
              <th>Verantw.</th>
              {kolomkop('Aangemaakt', 'aangemaaktOp')}
              {kolomkop('Due', 'due')}
              {kolomkop('Status', 'status')}
              <th>Opmerking</th>
              <th>Uitstellen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gesorteerdeActies.map((actie) => {
              const due = berekenDueDate(actie)
              const due_ = isDue(actie)
              return (
                <tr key={actie.id}>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label={`Onderwerp voor ${actie.actie}`}
                        value={actie.onderwerp}
                        onChange={(e) =>
                          updateActie(actie.id, { onderwerp: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label={`Bedrijf voor ${actie.actie}`}
                        value={actie.bedrijf}
                        onChange={(e) =>
                          updateActie(actie.id, { bedrijf: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label={`Vestiging voor ${actie.actie}`}
                        value={actie.vestiging}
                        onChange={(e) =>
                          updateActie(actie.id, { vestiging: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label="Actiepunt"
                        value={actie.actie}
                        onChange={(e) =>
                          updateActie(actie.id, { actie: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll verantw-cel">
                      {TEAMLEDEN.map((naam) => (
                        <AvatarChip
                          key={naam}
                          naam={naam}
                          alleNamen={TEAMLEDEN}
                          actief={actie.verantw.includes(naam)}
                          onToggle={() => toggleVerantw(actie, naam)}
                        />
                      ))}
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label={`Aangemaakt op voor ${actie.actie}`}
                        type="date"
                        value={actie.aangemaaktOp}
                        onChange={(e) =>
                          updateActie(actie.id, { aangemaaktOp: e.target.value })
                        }
                      />
                      <select
                        aria-label={`Doorlooptijd voor ${actie.actie}`}
                        value={actie.doorlooptijd}
                        onChange={(e) =>
                          updateActie(actie.id, {
                            doorlooptijd: e.target.value as Doorlooptijd,
                          })
                        }
                      >
                        {DOORLOOPTIJD_OPTIES.map((optie) => (
                          <option key={optie} value={optie}>
                            {optie}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td>
                    {due} {due_ && <Badge variant="due">Due</Badge>}
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <select
                        aria-label={`Status voor ${actie.actie}`}
                        value={actie.status}
                        onChange={(e) =>
                          updateActie(actie.id, {
                            status: e.target.value as ActieStatus,
                          })
                        }
                      >
                        <option value="open">Open</option>
                        <option value="done">Gereed</option>
                        <option value="hold">On hold</option>
                      </select>
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <input
                        aria-label={`Opmerking voor ${actie.actie}`}
                        value={actie.opmerking}
                        onChange={(e) =>
                          updateActie(actie.id, { opmerking: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <select
                        aria-label={`Uitstellen voor ${actie.actie}`}
                        value=""
                        onChange={(e) => {
                          const keuze = UITSTEL_OPTIES.find(
                            (o) => o.label === e.target.value,
                          )
                          if (keuze) {
                            handleUitstellen(
                              actie.id,
                              keuze.eenheid,
                              keuze.aantal,
                              keuze.label,
                            )
                          }
                        }}
                      >
                        <option value="" disabled>
                          Uitstellen...
                        </option>
                        {UITSTEL_OPTIES.map((optie) => (
                          <option key={optie.label} value={optie.label}>
                            {optie.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => deleteActie(actie.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {vergaderingModalOpen && (
        <VergaderingAfsluitenModal
          klantId={klantId}
          klantNaam={klantNaam}
          acties={acties}
          onSluiten={() => setVergaderingModalOpen(false)}
        />
      )}

      {versiesPaneelOpen && (
        <VersieBeheerPaneel
          klantId={klantId}
          onSluiten={() => setVersiesPaneelOpen(false)}
        />
      )}
    </div>
  )
}
