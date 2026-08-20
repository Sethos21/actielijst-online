import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { VerantwoordelijkeSelect } from '../../components/VerantwoordelijkeSelect'
import { useToast } from '../../components/useToast'
import { TEAMLEDEN, type Teamlid } from '../team/teamleden'
import { usePanden } from '../panden/usePanden'
import { VergaderingAfsluitenModal } from '../versies/VergaderingAfsluitenModal'
import { VersieBeheerPaneel } from '../versies/VersieBeheerPaneel'
import { ActieRij } from './ActieRij'
import { berekenDueDate, isDue } from './dueDate'
import { exporteerNaarExcel } from './excelExport'
import {
  DOORLOOPTIJD_OPTIES,
  type ActieHerkomst,
  type ActieItem,
  type Doorlooptijd,
} from './types'
import { useActies } from './useActies'
import type { Pand } from '../panden/types'

// Alleen nodig ná een klik op "Excel importeren" — niet in het hoofdbundel.
const ImportActiesModal = lazy(() =>
  import('./ImportActiesModal').then((m) => ({ default: m.ImportActiesModal })),
)

interface Props {
  klantId: string
  klantNaam: string
  onTerug: () => void
  onPandenOpen: () => void
  onNavigeerNaarBron: (pand: Pand, herkomst: ActieHerkomst) => void
  scrollNaarActieId?: string | null
  onGescroldNaarActie?: () => void
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

export function ActielijstPage({
  klantId,
  klantNaam,
  onTerug,
  onPandenOpen,
  onNavigeerNaarBron,
  scrollNaarActieId,
  onGescroldNaarActie,
}: Props) {
  const { acties, loading, addActie } = useActies(klantId)
  const { panden } = usePanden(klantId)
  const toon = useToast()
  const [sortVeld, setSortVeld] = useState<SortVeld>('ref')
  const [sortRichting, setSortRichting] = useState<'asc' | 'desc'>('asc')
  const [actieveFilters, setActieveFilters] = useState<Set<FilterPil>>(new Set())
  const [zoekterm, setZoekterm] = useState('')
  const [nieuw, setNieuw] = useState({
    onderwerp: '',
    bedrijf: '',
    vestiging: '',
    actie: '',
    verantw: [] as string[],
    doorlooptijd: '2w' as Doorlooptijd,
    opmerking: '',
  })
  const [vergaderingModalOpen, setVergaderingModalOpen] = useState(false)
  const [versiesPaneelOpen, setVersiesPaneelOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  // Snel-toegevoegde acties (via de knop onderaan) horen altijd onderin te
  // blijven staan, ook als er op een kolom gesorteerd is — anders verdwijnt
  // een net toegevoegde lege rij ergens middenin de lijst.
  const [nieuweRijIds, setNieuweRijIds] = useState<Set<string>>(new Set())

  // Firestore's onSnapshot-update na een lokale addDoc() kan eerder
  // binnenkomen dan de await addActie()-belofte in handleSubmit/
  // handleSnelToevoegen zelf resolvet — daardoor kwam setNieuweRijIds soms
  // te laat en sorteerde een net toegevoegde rij kort mee in plaats van
  // vast onderaan te blijven. Dit effect pint een nieuwe actie reactief
  // zodra 'ie in `acties` verschijnt, onafhankelijk van die volgorde.
  const vorigeActieIdsRef = useRef<Set<string>>(new Set(acties.map((a) => a.id)))
  const wachtOpNieuweRijenRef = useRef(0)
  useEffect(() => {
    const huidigeIds = new Set(acties.map((a) => a.id))
    if (wachtOpNieuweRijenRef.current > 0) {
      const nieuw = acties.filter((a) => !vorigeActieIdsRef.current.has(a.id))
      if (nieuw.length > 0) {
        setNieuweRijIds((huidig) => {
          const volgende = new Set(huidig)
          nieuw.forEach((a) => volgende.add(a.id))
          return volgende
        })
        wachtOpNieuweRijenRef.current = Math.max(
          0,
          wachtOpNieuweRijenRef.current - nieuw.length,
        )
      }
    }
    vorigeActieIdsRef.current = huidigeIds
  }, [acties])

  // Na "+ Actie aanmaken" vanuit Onderhoud/Documenten/MJOP: de nieuwe actie
  // blijft (net als snel-toegevoegde rijen) onderin gepind, en zodra de rij
  // in de DOM staat scrollen we ernaartoe.
  useEffect(() => {
    if (!scrollNaarActieId) return
    if (!nieuweRijIds.has(scrollNaarActieId)) {
      setNieuweRijIds((huidig) => new Set(huidig).add(scrollNaarActieId))
    }
    const rij = document.querySelector(`[data-actie-id="${scrollNaarActieId}"]`)
    if (rij) {
      rij.scrollIntoView({ behavior: 'smooth', block: 'center' })
      onGescroldNaarActie?.()
    }
  }, [scrollNaarActieId, acties, nieuweRijIds, onGescroldNaarActie])

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
    const nietVastgepind = gefilterdeActies.filter((a) => !nieuweRijIds.has(a.id))
    const vastgepind = gefilterdeActies.filter((a) => nieuweRijIds.has(a.id))
    const gesorteerd = nietVastgepind.sort((a, b) => waarde(a).localeCompare(waarde(b)))
    const metRichting = sortRichting === 'asc' ? gesorteerd : gesorteerd.reverse()
    // Vastgepinde rijen blijven onderin, ongeacht sorteerveld/-richting.
    return [...metRichting, ...vastgepind]
  }, [gefilterdeActies, sortVeld, sortRichting, nieuweRijIds])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!nieuw.actie.trim()) return
    wachtOpNieuweRijenRef.current += 1
    const id = await addActie({
      onderwerp: nieuw.onderwerp,
      bedrijf: nieuw.bedrijf,
      vestiging: nieuw.vestiging,
      actie: nieuw.actie,
      verantw: nieuw.verantw,
      aangemaaktOp: new Date().toISOString().slice(0, 10),
      doorlooptijd: nieuw.doorlooptijd,
      status: 'open',
      opmerking: nieuw.opmerking,
    })
    if (id) setNieuweRijIds((huidig) => new Set(huidig).add(id))
    setNieuw({
      onderwerp: '',
      bedrijf: '',
      vestiging: '',
      actie: '',
      verantw: [],
      doorlooptijd: '2w',
      opmerking: '',
    })
    toon('Actie toegevoegd')
  }

  function toggleNieuwVerantw(naam: string) {
    setNieuw((huidig) => ({
      ...huidig,
      verantw: huidig.verantw.includes(naam)
        ? huidig.verantw.filter((v) => v !== naam)
        : [...huidig.verantw, naam],
    }))
  }

  /** Snel een lege actie onderaan toevoegen — daarna verder invullen in de rij zelf. */
  async function handleSnelToevoegen() {
    wachtOpNieuweRijenRef.current += 1
    const id = await addActie({
      onderwerp: '',
      bedrijf: '',
      vestiging: '',
      actie: '',
      verantw: [],
      aangemaaktOp: new Date().toISOString().slice(0, 10),
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })
    if (id) setNieuweRijIds((huidig) => new Set(huidig).add(id))
    toon('Actie toegevoegd')
  }

  function handlePrinten() {
    window.print()
  }

  async function handleExporteren() {
    await exporteerNaarExcel(gesorteerdeActies, klantNaam)
    toon('Excel-bestand gedownload')
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
          <button type="button" onClick={onPandenOpen}>
            🏠 Panden {panden.length > 0 && <span className="count-badge">{panden.length}</span>}
          </button>
          <button type="button" onClick={() => setVersiesPaneelOpen(true)}>
            Versies
          </button>
          <button type="button" onClick={handlePrinten}>
            Print
          </button>
          <button type="button" onClick={handleExporteren}>
            Excel
          </button>
          <button type="button" onClick={() => setImportOpen(true)}>
            Excel importeren
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
        <label>
          Verantwoordelijke
          <VerantwoordelijkeSelect
            actieOmschrijving="nieuwe actie"
            geselecteerd={nieuw.verantw}
            alleNamen={TEAMLEDEN}
            onToggle={toggleNieuwVerantw}
          />
        </label>
        <label>
          Doorlooptijd
          <select
            value={nieuw.doorlooptijd}
            onChange={(e) =>
              setNieuw({ ...nieuw, doorlooptijd: e.target.value as Doorlooptijd })
            }
          >
            {DOORLOOPTIJD_OPTIES.map((optie) => (
              <option key={optie} value={optie}>
                {optie}
              </option>
            ))}
          </select>
        </label>
        <label>
          Opmerking
          <input
            value={nieuw.opmerking}
            onChange={(e) => setNieuw({ ...nieuw, opmerking: e.target.value })}
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
            {gesorteerdeActies.map((actie) => (
              <ActieRij
                key={actie.id}
                actie={actie}
                klantNaam={klantNaam}
                panden={panden}
                onNavigeerNaarBron={onNavigeerNaarBron}
                onUitgesteld={(label) => toon(`Uitgesteld met ${label}`)}
              />
            ))}
          </tbody>
        </table>
      )}

      <button
        type="button"
        className="no-print actielijst-nieuwe-rij"
        onClick={handleSnelToevoegen}
      >
        + Nieuwe actie toevoegen
      </button>

      {importOpen && (
        <Suspense fallback={null}>
          <ImportActiesModal
            standaardKlantId={klantId}
            onSluiten={() => setImportOpen(false)}
          />
        </Suspense>
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
