import { useMemo, useState, type FormEvent } from 'react'
import { TEAMLEDEN } from '../team/teamleden'
import { berekenDueDate, isDue } from './dueDate'
import { DOORLOOPTIJD_OPTIES, type ActieItem, type ActieStatus, type Doorlooptijd } from './types'
import { useActies } from './useActies'

interface Props {
  klantId: string
  klantNaam: string
  onTerug: () => void
}

type SortVeld = 'onderwerp' | 'vestiging' | 'aangemaaktOp' | 'due' | 'status'

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
  const [sortVeld, setSortVeld] = useState<SortVeld>('due')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')
  const [nieuw, setNieuw] = useState({ onderwerp: '', vestiging: '', actie: '' })

  function sorteerOp(veld: SortVeld) {
    if (veld === sortVeld) {
      setSortRichting(sortRichting === 'asc' ? 'desc' : 'asc')
    } else {
      setSortVeld(veld)
      setSortRichting('asc')
    }
  }

  const gesorteerdeActies = useMemo(() => {
    const waarde = (actie: ActieItem) => {
      if (sortVeld === 'due') return berekenDueDate(actie)
      return actie[sortVeld]
    }
    const gesorteerd = [...acties].sort((a, b) =>
      waarde(a).localeCompare(waarde(b)),
    )
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [acties, sortVeld, sortRichting])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!nieuw.actie.trim()) return
    await addActie({
      ref: '',
      onderwerp: nieuw.onderwerp,
      vestiging: nieuw.vestiging,
      actie: nieuw.actie,
      verantw: [],
      aangemaaktOp: new Date().toISOString().slice(0, 10),
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })
    setNieuw({ onderwerp: '', vestiging: '', actie: '' })
  }

  function toggleVerantw(actie: ActieItem, naam: string) {
    const nieuweVerantw = actie.verantw.includes(naam)
      ? actie.verantw.filter((v) => v !== naam)
      : [...actie.verantw, naam]
    updateActie(actie.id, { verantw: nieuweVerantw })
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
      <h1>Actielijst — {klantNaam}</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="nieuw-onderwerp">Onderwerp</label>
        <input
          id="nieuw-onderwerp"
          value={nieuw.onderwerp}
          onChange={(e) => setNieuw({ ...nieuw, onderwerp: e.target.value })}
        />
        <label htmlFor="nieuw-vestiging">Vestiging</label>
        <input
          id="nieuw-vestiging"
          value={nieuw.vestiging}
          onChange={(e) => setNieuw({ ...nieuw, vestiging: e.target.value })}
        />
        <label htmlFor="nieuw-actie">Actiepunt</label>
        <input
          id="nieuw-actie"
          value={nieuw.actie}
          onChange={(e) => setNieuw({ ...nieuw, actie: e.target.value })}
        />
        <button type="submit">Actie toevoegen</button>
      </form>

      {loading ? (
        <p>Acties laden...</p>
      ) : gesorteerdeActies.length === 0 ? (
        <p>Nog geen acties voor deze klant.</p>
      ) : (
        <table>
          <thead>
            <tr>
              {kolomkop('Onderwerp', 'onderwerp')}
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
                    <input
                      aria-label={`Onderwerp voor ${actie.actie}`}
                      value={actie.onderwerp}
                      onChange={(e) =>
                        updateActie(actie.id, { onderwerp: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Vestiging voor ${actie.actie}`}
                      value={actie.vestiging}
                      onChange={(e) =>
                        updateActie(actie.id, { vestiging: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Actiepunt"
                      value={actie.actie}
                      onChange={(e) =>
                        updateActie(actie.id, { actie: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    {TEAMLEDEN.map((naam) => (
                      <label key={naam}>
                        <input
                          type="checkbox"
                          checked={actie.verantw.includes(naam)}
                          onChange={() => toggleVerantw(actie, naam)}
                        />
                        {naam}
                      </label>
                    ))}
                  </td>
                  <td>
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
                  </td>
                  <td>
                    {due} {due_ && <strong>Due</strong>}
                  </td>
                  <td>
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
                  </td>
                  <td>
                    <input
                      aria-label={`Opmerking voor ${actie.actie}`}
                      value={actie.opmerking}
                      onChange={(e) =>
                        updateActie(actie.id, { opmerking: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Uitstellen voor ${actie.actie}`}
                      value=""
                      onChange={(e) => {
                        const keuze = UITSTEL_OPTIES.find(
                          (o) => o.label === e.target.value,
                        )
                        if (keuze) uitstellen(actie.id, keuze.eenheid, keuze.aantal)
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
    </div>
  )
}
