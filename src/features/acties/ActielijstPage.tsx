import { useMemo, useState, type FormEvent } from 'react'
import { UitstelKnop } from '../../components/UitstelKnop'
import { VerantwoordelijkeSelect } from '../../components/VerantwoordelijkeSelect'
import { useToast } from '../../components/useToast'
import { TEAMLEDEN, type Teamlid } from '../team/teamleden'
import { VergaderingAfsluitenModal } from '../versies/VergaderingAfsluitenModal'
import { VersieBeheerPaneel } from '../versies/VersieBeheerPaneel'
import { formatteerDatumKort } from '../../lib/datum'
import { berekenDueDate, isDue } from './dueDate'
import { exporteerNaarExcel } from './excelExport'
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

type SortVeld =
  | 'ref'
  | 'onderwerp'
  | 'bedrijf'
  | 'vestiging'
  | 'aangemaaktOp'
  | 'verantw'
  | 'doorlooptijd'
  | 'due'
  | 'status'
type StatusFilterPil = 'open' | 'done' | 'hold' | 'due'
type FilterPil = StatusFilterPil | Teamlid

const STATUS_FILTER_PILLEN: { pil: StatusFilterPil; label: string }[] = [
  { pil: 'open', label: 'Open' },
  { pil: 'done', label: 'Gereed' },
  { pil: 'hold', label: 'On hold' },
  { pil: 'due', label: 'Due' },
]

/** Velden waarop de zoekbalk tekstueel matcht, case-insensitief. */
function zoekTekst(actie: ActieItem): string {
  return `${actie.onderwerp} ${actie.actie} ${actie.vestiging} ${actie.bedrijf} ${actie.opmerking}`.toLowerCase()
}

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
  const [zoekterm, setZoekterm] = useState('')
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

  const stats = useMemo(() => {
    let open = 0
    let due = 0
    let done = 0
    let hold = 0
    for (const actie of acties) {
      if (actie.status === 'open') open += 1
      if (actie.status === 'done') done += 1
      if (actie.status === 'hold') hold += 1
      if (isDue(actie)) due += 1
    }
    return { open, due, done, hold }
  }, [acties])

  const gefilterdeActies = useMemo(() => {
    let resultaat = acties
    if (actieveFilters.size > 0) {
      // Twee groepen pillen (status, teamlid): binnen een groep is het OR
      // (Open + Due beide aan toont de vereniging), maar tussen de groepen is
      // het AND — "Open" + "Ton" moet open acties ván Ton tonen, niet de
      // vereniging van alle open acties en alle acties van Ton.
      resultaat = resultaat.filter((actie) => {
        const statusMatches: boolean[] = []
        const teamlidMatches: boolean[] = []
        if (actieveFilters.has('open')) statusMatches.push(actie.status === 'open')
        if (actieveFilters.has('done')) statusMatches.push(actie.status === 'done')
        if (actieveFilters.has('hold')) statusMatches.push(actie.status === 'hold')
        if (actieveFilters.has('due')) statusMatches.push(isDue(actie))
        for (const naam of TEAMLEDEN) {
          if (actieveFilters.has(naam)) teamlidMatches.push(actie.verantw.includes(naam))
        }
        const statusOk = statusMatches.length === 0 || statusMatches.some(Boolean)
        const teamlidOk = teamlidMatches.length === 0 || teamlidMatches.some(Boolean)
        return statusOk && teamlidOk
      })
    }
    if (zoekterm.trim()) {
      const term = zoekterm.trim().toLowerCase()
      resultaat = resultaat.filter((actie) => zoekTekst(actie).includes(term))
    }
    return resultaat
  }, [acties, actieveFilters, zoekterm])

  const gesorteerdeActies = useMemo(() => {
    const waarde = (actie: ActieItem): string => {
      if (sortVeld === 'due') return berekenDueDate(actie)
      if (sortVeld === 'verantw') return actie.verantw.join(', ')
      if (sortVeld === 'doorlooptijd') {
        return String(DOORLOOPTIJD_OPTIES.indexOf(actie.doorlooptijd)).padStart(2, '0')
      }
      if (sortVeld === 'ref') {
        const nummer = Number(actie.ref)
        return Number.isNaN(nummer) ? actie.ref : String(nummer).padStart(10, '0')
      }
      return actie[sortVeld]
    }
    const gesorteerd = [...gefilterdeActies].sort((a, b) =>
      waarde(a).localeCompare(waarde(b)),
    )
    return sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
  }, [gefilterdeActies, sortVeld, sortRichting])

  function volgendeRef(): string {
    const hoogsteRef = acties.reduce((max, actie) => {
      const nummer = Number(actie.ref)
      return Number.isNaN(nummer) ? max : Math.max(max, nummer)
    }, 0)
    return String(hoogsteRef + 1)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!nieuw.actie.trim()) return
    await addActie({
      ref: volgendeRef(),
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

  function handlePrinten() {
    window.print()
  }

  function handleExporteren() {
    exporteerNaarExcel(gesorteerdeActies, klantNaam)
    toon('Excel-bestand gedownload')
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
    const actief = sortVeld === veld
    return (
      <th>
        <button type="button" className="th-sort" onClick={() => sorteerOp(veld)}>
          {label}
          <span className="th-sort-pijl">
            {actief ? (sortRichting === 'asc' ? '▲' : '▼') : '▾'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div>
      <div className="print-header">
        <span className="print-header-merk">BVC</span>
        <span>Actielijst — {klantNaam}</span>
        <span>{new Date().toLocaleDateString('nl-NL')}</span>
      </div>

      <button type="button" className="no-print" onClick={onTerug}>
        ← Terug naar klantoverzicht
      </button>
      <div className="actielijst-titelbalk">
        <h1>Actielijst — {klantNaam}</h1>
        <div className="actielijst-titelbalk-acties no-print">
          <button type="button" onClick={() => setVersiesPaneelOpen(true)}>
            Versies
          </button>
          <button type="button" onClick={handlePrinten}>
            Print
          </button>
          <button type="button" onClick={handleExporteren}>
            Excel
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

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Open</span>
          <span className="stat-waarde stat-waarde-open">{stats.open}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Due (verlopen)</span>
          <span className="stat-waarde stat-waarde-due">{stats.due}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Afgerond</span>
          <span className="stat-waarde stat-waarde-done">{stats.done}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">On hold</span>
          <span className="stat-waarde stat-waarde-hold">{stats.hold}</span>
        </div>
      </div>

      <div className="filter-balk no-print">
        <div className="filter-pillen">
          <button
            type="button"
            className={`filter-pill ${actieveFilters.size === 0 ? 'actief' : ''}`}
            onClick={() => setActieveFilters(new Set())}
          >
            Alle
          </button>
          {STATUS_FILTER_PILLEN.map(({ pil, label }) => (
            <button
              key={pil}
              type="button"
              className={`filter-pill ${actieveFilters.has(pil) ? 'actief' : ''}`}
              onClick={() => toggleFilter(pil)}
            >
              {label}
            </button>
          ))}
          {TEAMLEDEN.map((naam) => (
            <button
              key={naam}
              type="button"
              aria-label={`Filter op ${naam}`}
              className={`filter-pill ${actieveFilters.has(naam) ? 'actief' : ''}`}
              onClick={() => toggleFilter(naam)}
            >
              {naam}
            </button>
          ))}
        </div>
        <input
          type="search"
          aria-label="Zoeken in actielijst"
          placeholder="Zoeken..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
        />
      </div>

      <form className="no-print" onSubmit={handleSubmit}>
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
              {kolomkop('#', 'ref')}
              {kolomkop('Invoerdatum', 'aangemaaktOp')}
              {kolomkop('Onderwerp', 'onderwerp')}
              {kolomkop('Bedrijf', 'bedrijf')}
              {kolomkop('Vestiging', 'vestiging')}
              <th>Actiepunt</th>
              {kolomkop('Verantw.', 'verantw')}
              {kolomkop('Doorlooptijd', 'doorlooptijd')}
              {kolomkop('Due', 'due')}
              {kolomkop('Status', 'status')}
              <th>Opmerking</th>
              <th className="no-print">Uitstellen</th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {gesorteerdeActies.map((actie) => {
              const due = berekenDueDate(actie)
              const due_ = isDue(actie)
              return (
                <tr
                  key={actie.id}
                  className={actie.status === 'done' ? 'actielijst-rij-afgerond' : undefined}
                >
                  <td>{actie.ref}</td>
                  <td>
                    <span className="cel-scroll invoerdatum-cel">
                      <input
                        aria-label={`Invoerdatum voor ${actie.actie}`}
                        type="date"
                        className="invoerdatum-input"
                        value={actie.aangemaaktOp}
                        onChange={(e) =>
                          updateActie(actie.id, { aangemaaktOp: e.target.value })
                        }
                      />
                      <span className="invoerdatum-weergave" aria-hidden="true">
                        {formatteerDatumKort(actie.aangemaaktOp)}
                      </span>
                    </span>
                  </td>
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
                    <span className="cel-scroll cel-scroll-tekst">
                      <textarea
                        aria-label="Actiepunt"
                        value={actie.actie}
                        onChange={(e) =>
                          updateActie(actie.id, { actie: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <VerantwoordelijkeSelect
                        actieOmschrijving={actie.actie}
                        geselecteerd={actie.verantw}
                        alleNamen={TEAMLEDEN}
                        onToggle={(naam) => toggleVerantw(actie, naam)}
                      />
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <select
                        aria-label={`Doorlooptijd voor ${actie.actie}`}
                        className="doorlooptijd-select"
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
                    <span className="cel-scroll">{due}</span>
                  </td>
                  <td>
                    <span className="cel-scroll">
                      <select
                        aria-label={`Status voor ${actie.actie}`}
                        className={`status-select status-select-${
                          due_ ? 'due' : actie.status
                        }`}
                        value={actie.status}
                        onChange={(e) =>
                          updateActie(actie.id, {
                            status: e.target.value as ActieStatus,
                          })
                        }
                      >
                        <option value="open">{due_ ? 'Due' : 'Open'}</option>
                        <option value="done">Gereed</option>
                        <option value="hold">On hold</option>
                      </select>
                    </span>
                  </td>
                  <td>
                    <span className="cel-scroll cel-scroll-tekst">
                      <textarea
                        aria-label={`Opmerking voor ${actie.actie}`}
                        value={actie.opmerking}
                        onChange={(e) =>
                          updateActie(actie.id, { opmerking: e.target.value })
                        }
                      />
                    </span>
                  </td>
                  <td className="no-print">
                    <UitstelKnop
                      actieOmschrijving={actie.actie}
                      opties={UITSTEL_OPTIES}
                      onKies={(keuze) =>
                        handleUitstellen(actie.id, keuze.eenheid, keuze.aantal, keuze.label)
                      }
                    />
                  </td>
                  <td className="no-print">
                    <button
                      type="button"
                      className="icoon-knop"
                      aria-label={`Verwijderen: ${actie.actie}`}
                      onClick={() => deleteActie(actie.id)}
                    >
                      🗑️
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
