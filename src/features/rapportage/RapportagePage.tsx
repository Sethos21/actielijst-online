import { useEffect, useMemo, useState } from 'react'
import { useAlleActies } from '../acties/useAlleActies'
import { useMutaties } from '../huurdersmutaties/useMutaties'
import { actieveKlanten, useKlanten } from '../klanten/useKlanten'
import { useOnderhoudVoorKlant } from '../onderhoud/useOnderhoud'
import { usePanden } from '../panden/usePanden'
import {
  bepaalHuidigKwartaal,
  bepaalPeriodeGrenzen,
  berekenOnderhoudUitgevoerdInPeriode,
  bouwKwartaalRapport,
  formatKwartaalLabel,
  formatKwartaalRangeLabel,
  formatPeriodeLabel,
  genereerKwartaalOpties,
  kwartaalNaKwartaal,
} from './kwartaalLogica'
import { exporteerRapportageNaarExcel } from './rapportageExcelExport'
import type { Kwartaal } from './types'

function kwartaalSleutel(kwartaal: Kwartaal): string {
  return `${kwartaal.jaar}-${kwartaal.kwartaal}`
}

export function RapportagePage() {
  const { klanten: alleKlanten, loading: klantenLaden } = useKlanten()
  const klanten = actieveKlanten(alleKlanten)
  const [klantId, setKlantId] = useState('')
  const [vanKwartaal, setVanKwartaal] = useState<Kwartaal>(() => bepaalHuidigKwartaal())
  const [totKwartaal, setTotKwartaal] = useState<Kwartaal>(() => bepaalHuidigKwartaal())

  const geselecteerdeKlant = klanten.find((k) => k.id === klantId) ?? null
  const { acties, loading: actiesLaden } = useAlleActies()
  const { mutaties, loading: mutatiesLaden } = useMutaties()
  const { panden } = usePanden(klantId)
  const { onderhoud } = useOnderhoudVoorKlant(klantId)

  useEffect(() => {
    if (!klantId && klanten.length > 0) setKlantId(klanten[0].id)
  }, [klanten, klantId])

  const kwartaalOpties = useMemo(
    () => genereerKwartaalOpties(bepaalHuidigKwartaal().jaar),
    [],
  )

  function kiesVanKwartaal(gekozen: Kwartaal) {
    setVanKwartaal(gekozen)
    if (kwartaalNaKwartaal(gekozen, totKwartaal)) setTotKwartaal(gekozen)
  }

  function kiesTotKwartaal(gekozen: Kwartaal) {
    setTotKwartaal(gekozen)
    if (kwartaalNaKwartaal(vanKwartaal, gekozen)) setVanKwartaal(gekozen)
  }

  const grenzen = bepaalPeriodeGrenzen(
    vanKwartaal.jaar,
    vanKwartaal.kwartaal,
    totKwartaal.jaar,
    totKwartaal.kwartaal,
  )

  const rapport = useMemo(() => {
    if (!geselecteerdeKlant) return null
    return bouwKwartaalRapport(
      geselecteerdeKlant.id,
      geselecteerdeKlant.naam,
      panden.map((p) => p.naam),
      acties,
      mutaties,
      grenzen.start,
      grenzen.eind,
    )
  }, [geselecteerdeKlant, panden, acties, mutaties, grenzen.start, grenzen.eind])

  const onderhoudUitgevoerd = useMemo(
    () => berekenOnderhoudUitgevoerdInPeriode(onderhoud, grenzen.start, grenzen.eind),
    [onderhoud, grenzen.start, grenzen.eind],
  )
  const toonOnderhoudSectie = onderhoud.length > 0

  const loading = klantenLaden || actiesLaden || mutatiesLaden

  async function handleExporteren() {
    if (!rapport) return
    await exporteerRapportageNaarExcel(rapport, vanKwartaal, totKwartaal)
  }

  function handlePrinten() {
    window.print()
  }

  return (
    <div>
      <div className="print-header">
        <span className="print-header-merk">BVC</span>
        <span>Rapportage — {rapport?.klantNaam ?? ''}</span>
        <span>{new Date().toLocaleDateString('nl-NL')}</span>
      </div>

      <div className="rapportage-header">
        <div className="rapportage-titel">
          <span className="rapportage-icoon">📊</span>
          <h1>Rapportage</h1>
        </div>
        <div className="rapportage-header-acties no-print">
          <select
            aria-label="Kies klant"
            value={klantId}
            onChange={(e) => setKlantId(e.target.value)}
          >
            {klanten.map((klant) => (
              <option key={klant.id} value={klant.id}>
                {klant.naam}
              </option>
            ))}
          </select>
          <label className="rapportage-kwartaal-label">
            Van
            <select
              aria-label="Van kwartaal"
              value={kwartaalSleutel(vanKwartaal)}
              onChange={(e) => {
                const gekozen = kwartaalOpties.find(
                  (optie) => kwartaalSleutel(optie) === e.target.value,
                )
                if (gekozen) kiesVanKwartaal(gekozen)
              }}
            >
              {kwartaalOpties.map((optie) => (
                <option key={kwartaalSleutel(optie)} value={kwartaalSleutel(optie)}>
                  {formatKwartaalLabel(optie)}
                </option>
              ))}
            </select>
          </label>
          <label className="rapportage-kwartaal-label">
            Tot en met
            <select
              aria-label="Tot en met kwartaal"
              value={kwartaalSleutel(totKwartaal)}
              onChange={(e) => {
                const gekozen = kwartaalOpties.find(
                  (optie) => kwartaalSleutel(optie) === e.target.value,
                )
                if (gekozen) kiesTotKwartaal(gekozen)
              }}
            >
              {kwartaalOpties.map((optie) => (
                <option key={kwartaalSleutel(optie)} value={kwartaalSleutel(optie)}>
                  {formatKwartaalLabel(optie)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handlePrinten} disabled={!rapport}>
            Print
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExporteren}
            disabled={!rapport}
          >
            Excel
          </button>
        </div>
      </div>

      <div className="rapportage-info">
        Dit is een samenvatting over een periode — anders dan de bestaande Excel-export
        van de actielijst (die exporteert de ruwe rijen van dit moment). Hier zie je wat
        er in het gekozen kwartaal is gebeurd: afgerond, nog open, mutaties.
      </div>

      {loading ? (
        <p>Laden...</p>
      ) : klanten.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen klanten.</div>
        </div>
      ) : (
        rapport && (
          <>
            <p className="rapportage-periode">
              {formatKwartaalRangeLabel(vanKwartaal, totKwartaal)} — Periode:{' '}
              <strong>{formatPeriodeLabel(rapport.periodeStart, rapport.periodeEind)}</strong>{' '}
              · {rapport.klantNaam}
            </p>

            <div className="stat-cards">
              <div className="stat-card">
                <span className="stat-label">Acties afgerond</span>
                <span className="stat-waarde">{rapport.actiesAfgerond}</span>
                <span className="rapportage-stat-sub">
                  {rapport.actiesAfgerondOpTijd} op tijd · {rapport.actiesAfgerondTeLaat} te
                  laat
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Gem. doorlooptijd</span>
                <span className="stat-waarde">
                  {rapport.gemiddeldeDoorlooptijdDagen ?? '—'}
                  {rapport.gemiddeldeDoorlooptijdDagen != null && ' dagen'}
                </span>
                <span className="rapportage-stat-sub">
                  gebaseerd op {rapport.actiesAfgerond} afgeronde acties
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Nog openstaand</span>
                <span className="stat-waarde stat-waarde-due">{rapport.nogOpenstaand}</span>
                <span className="rapportage-stat-sub">
                  waarvan {rapport.nogOpenstaandDue} due
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Huurdersmutaties</span>
                <span className="stat-waarde">{rapport.mutatiesIn + rapport.mutatiesUit}</span>
                <span className="rapportage-stat-sub">
                  {rapport.mutatiesIn} ingaand · {rapport.mutatiesUit} vertrokken
                </span>
              </div>
            </div>

            <h2 className="rapportage-sectie-titel">Acties in detail</h2>
            <div className="rapportage-detail-lijst">
              <div className="rapportage-detail-rij">
                <span>Afgerond op tijd</span>
                <span className="rapportage-detail-waarde rapportage-detail-groen">
                  {rapport.actiesAfgerondOpTijd}
                </span>
              </div>
              <div className="rapportage-detail-rij">
                <span>Afgerond te laat</span>
                <span className="rapportage-detail-waarde rapportage-detail-rood">
                  {rapport.actiesAfgerondTeLaat}
                </span>
              </div>
              <div className="rapportage-detail-rij">
                <span>Nog openstaand (niet due)</span>
                <span className="rapportage-detail-waarde">
                  {rapport.nogOpenstaand - rapport.nogOpenstaandDue}
                </span>
              </div>
              <div className="rapportage-detail-rij">
                <span>Nog openstaand (due)</span>
                <span className="rapportage-detail-waarde rapportage-detail-rood">
                  {rapport.nogOpenstaandDue}
                </span>
              </div>
            </div>

            <h2 className="rapportage-sectie-titel">Huurdersmutaties</h2>
            <div className="rapportage-detail-lijst">
              <div className="rapportage-detail-rij">
                <span>Ingaand vs. vertrekkend</span>
                <span className="rapportage-detail-waarde">
                  {rapport.mutatiesIn} in · {rapport.mutatiesUit} uit
                </span>
              </div>
            </div>

            {toonOnderhoudSectie && (
              <>
                <h2 className="rapportage-sectie-titel">
                  Onderhoud{' '}
                  <span className="rapportage-sectie-optioneel">
                    (optioneel, alleen zichtbaar als panden/onderhoud gebruikt worden bij
                    deze klant)
                  </span>
                </h2>
                {onderhoudUitgevoerd === 0 ? (
                  <div className="leeg-state">
                    <div className="leeg-tekst">
                      Nog geen onderhoudsdata voor deze klant in deze periode.
                    </div>
                  </div>
                ) : (
                  <div className="rapportage-detail-lijst">
                    <div className="rapportage-detail-rij">
                      <span>Uitgevoerd in deze periode</span>
                      <span className="rapportage-detail-waarde">{onderhoudUitgevoerd}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )
      )}
    </div>
  )
}
