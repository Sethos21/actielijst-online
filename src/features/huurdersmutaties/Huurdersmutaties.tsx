import { useMemo, useState } from 'react'
import { useToast } from '../../components/useToast'
import { exporteerNaarExcel } from './mutatieExcelExport'
import {
  berekenStats,
  filterMutaties,
  groepeerPerMaand,
  isToekomstigJaar,
  vulJaarAan,
  type MaandGroep,
} from './mutatieLogica'
import { MutatieForm, type MutatieVelden } from './MutatieForm'
import { MutatieKaart } from './MutatieKaart'
import { MAANDNAMEN, type Mutatie, type Richting } from './types'
import { useMutaties } from './useMutaties'
import { useMutatiesJaren } from './useMutatiesJaren'

interface Props {
  onTerug: () => void
}

interface NieuweRijContext {
  jaar: number
  maand: number
  richting: Richting
}

export function Huurdersmutaties({ onTerug }: Props) {
  const { mutaties, loading, addMutatie, updateMutatie, deleteMutatie } = useMutaties()
  const { jaren, voegJaarToe } = useMutatiesJaren()
  const toon = useToast()
  const [jaarFilter, setJaarFilter] = useState<number | 'alle'>(new Date().getFullYear())
  const [zoekterm, setZoekterm] = useState('')
  const [nieuweRij, setNieuweRij] = useState<NieuweRijContext | null>(null)
  const [bewerkId, setBewerkId] = useState<string | null>(null)

  const gefilterd = useMemo(
    () => filterMutaties(mutaties, jaarFilter, zoekterm),
    [mutaties, jaarFilter, zoekterm],
  )
  const stats = useMemo(() => berekenStats(gefilterd), [gefilterd])
  const groepen = useMemo(() => {
    const basis = groepeerPerMaand(gefilterd)
    // Alleen aanvullen met lege maanden buiten het zoeken om — anders lijkt
    // het alsof een zoekterm ook in lege maanden matcht. Met een specifiek
    // jaar geselecteerd zijn zo altijd alle 12 maanden bereikbaar om de
    // eerste mutatie van die maand aan te maken.
    if (jaarFilter !== 'alle' && !zoekterm.trim()) return vulJaarAan(basis, jaarFilter)
    return basis
  }, [gefilterd, jaarFilter, zoekterm])

  const jaarLabel = jaarFilter === 'alle' ? 'Alle jaren' : String(jaarFilter)

  async function handleJaarToevoegen() {
    const nieuw = await voegJaarToe()
    toon(nieuw ? `Jaar ${nieuw} toegevoegd` : 'Dit jaar staat er al in')
  }

  function handlePrinten() {
    window.print()
  }

  function handleExporteren() {
    exporteerNaarExcel(gefilterd, jaarLabel)
    toon('Excel-bestand gedownload')
  }

  async function handleOpslaanNieuw(context: NieuweRijContext, velden: MutatieVelden) {
    // Formulier meteen sluiten i.p.v. te wachten op de schrijfbevestiging —
    // anders staat het even naast de net verschenen kaart (race tussen de
    // Firestore-write en het sluiten van het formulier).
    setNieuweRij(null)
    await addMutatie({ ...velden, jaar: context.jaar, maand: context.maand, richting: context.richting })
    toon('Mutatie toegevoegd')
  }

  async function handleOpslaanBewerken(mutatie: Mutatie, velden: MutatieVelden) {
    setBewerkId(null)
    await updateMutatie(mutatie.id, velden)
    toon('Mutatie bijgewerkt')
  }

  function handleVerwijderen(mutatie: Mutatie) {
    if (
      !window.confirm(
        `Mutatie van "${mutatie.naam}" verwijderen? Dit kan niet ongedaan worden gemaakt.`,
      )
    ) {
      return
    }
    deleteMutatie(mutatie.id)
    setBewerkId(null)
    toon('Mutatie verwijderd')
  }

  function renderCel(mutatie: Mutatie | undefined) {
    if (mutatie && bewerkId === mutatie.id) {
      return (
        <MutatieForm
          richting={mutatie.richting}
          alleMutaties={mutaties}
          initieel={mutatie}
          onOpslaan={(velden) => handleOpslaanBewerken(mutatie, velden)}
          onAnnuleren={() => setBewerkId(null)}
          onVerwijderen={() => handleVerwijderen(mutatie)}
        />
      )
    }
    if (mutatie) {
      return <MutatieKaart mutatie={mutatie} onBewerken={() => setBewerkId(mutatie.id)} />
    }
    return <div className="hm-card empty" />
  }

  function renderMaandBlok(groep: MaandGroep) {
    const maxRijen = Math.max(groep.in.length, groep.uit.length)
    const toontNieuweRijHier =
      nieuweRij && nieuweRij.jaar === groep.jaar && nieuweRij.maand === groep.maand
    const toekomstig = isToekomstigJaar(groep.jaar)

    return (
      <div
        className={`hm-maand ${toekomstig ? 'hm-maand-toekomstig' : ''}`}
        key={`${groep.jaar}-${groep.maand}`}
      >
        <div className="hm-maand-header">
          <span className="hm-maand-label">
            {MAANDNAMEN[groep.maand - 1]} {groep.jaar}
          </span>
          {toekomstig && <span className="hm-maand-badge-toekomstig">Toekomstig</span>}
          <span className="hm-maand-line" />
          <span className="hm-maand-count">
            {groep.in.length} in · {groep.uit.length} uit
          </span>
        </div>

        {Array.from({ length: maxRijen }, (_, i) => (
          <div className="hm-row" key={i}>
            {renderCel(groep.in[i])}
            {renderCel(groep.uit[i])}
          </div>
        ))}

        {toontNieuweRijHier && (
          <div className="hm-row no-print">
            {nieuweRij.richting === 'in' ? (
              <MutatieForm
                richting="in"
                alleMutaties={mutaties}
                onOpslaan={(velden) => handleOpslaanNieuw(nieuweRij, velden)}
                onAnnuleren={() => setNieuweRij(null)}
              />
            ) : (
              <div className="hm-card empty" />
            )}
            {nieuweRij.richting === 'uit' ? (
              <MutatieForm
                richting="uit"
                alleMutaties={mutaties}
                onOpslaan={(velden) => handleOpslaanNieuw(nieuweRij, velden)}
                onAnnuleren={() => setNieuweRij(null)}
              />
            ) : (
              <div className="hm-card empty" />
            )}
          </div>
        )}

        <div className="hm-row no-print">
          <button
            type="button"
            className="hm-newcard"
            onClick={() => setNieuweRij({ jaar: groep.jaar, maand: groep.maand, richting: 'in' })}
          >
            + Ingaand toevoegen
          </button>
          <button
            type="button"
            className="hm-newcard out"
            onClick={() => setNieuweRij({ jaar: groep.jaar, maand: groep.maand, richting: 'uit' })}
          >
            + Vertrekkend toevoegen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="huurdersscherm">
      <div className="print-header">
        <span className="print-header-merk">BVC</span>
        <span>Huurdersmutaties — {jaarLabel}</span>
        <span>{new Date().toLocaleDateString('nl-NL')}</span>
      </div>

      <div className="hm-topbar">
        <div>
          <button type="button" className="hm-terug no-print" onClick={onTerug}>
            ← Terug naar start
          </button>
          <h1>Huurdersmutaties</h1>
        </div>
        <div className="hm-topbar-acties no-print">
          <input
            type="search"
            aria-label="Zoek huurder of locatie"
            placeholder="Zoek huurder of locatie..."
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
          />
          <select
            aria-label="Filter op jaar"
            value={jaarFilter}
            onChange={(e) =>
              setJaarFilter(e.target.value === 'alle' ? 'alle' : Number(e.target.value))
            }
          >
            <option value="alle">Alle jaren</option>
            {jaren.map((jaar) => (
              <option key={jaar} value={jaar}>
                {jaar}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleJaarToevoegen}>
            + Jaar
          </button>
          <button type="button" onClick={handlePrinten}>
            Print
          </button>
          <button type="button" onClick={handleExporteren}>
            Excel
          </button>
        </div>
      </div>

      <div className="hm-stats">
        <div className="hm-stat">
          <span className="hm-stat-label">Ingaand</span>
          <span className="hm-stat-val hm-stat-groen">{stats.in}</span>
        </div>
        <div className="hm-stat">
          <span className="hm-stat-label">Vertrekkend</span>
          <span className="hm-stat-val hm-stat-rood">{stats.uit}</span>
        </div>
        <div className="hm-stat">
          <span className="hm-stat-label">Netto</span>
          <span className="hm-stat-val">{stats.netto >= 0 ? `+${stats.netto}` : stats.netto}</span>
        </div>
        <div className="hm-stat">
          <span className="hm-stat-label">Totaal</span>
          <span className="hm-stat-val">{stats.totaal}</span>
        </div>
      </div>

      <div className="hm-kolhead">
        <span className="hm-kolhead-in">↓ Ingaand</span>
        <span className="hm-kolhead-out">↑ Vertrekkend</span>
      </div>

      {loading ? (
        <p>Mutaties laden...</p>
      ) : groepen.length === 0 ? (
        <p>Geen mutaties gevonden.</p>
      ) : (
        groepen.map(renderMaandBlok)
      )}
    </div>
  )
}
