import { berekenDueDate, isDue } from '../acties/dueDate'
import type { ActieItem } from '../acties/types'
import { MAANDNAMEN } from '../huurdersmutaties/types'
import type { Mutatie } from '../huurdersmutaties/types'
import type { Onderhoud } from '../onderhoud/types'
import type { Kwartaal, KwartaalRapport } from './types'

export function bepaalKwartaalGrenzen(
  jaar: number,
  kwartaal: 1 | 2 | 3 | 4,
): { start: string; eind: string } {
  const startMaand = (kwartaal - 1) * 3
  const start = new Date(jaar, startMaand, 1).toISOString().slice(0, 10)
  const eind = new Date(jaar, startMaand + 3, 1).toISOString().slice(0, 10)
  return { start, eind }
}

/** Onbetrouwbaar bij afwijkende spelling tussen mutatie.locatie en pand/klantnaam —
 *  geaccepteerd risico, zie VOORSTEL-document sectie 5. Geen structuurwijziging aan
 *  Mutatie zelf, dat blijft een losstaande tak zonder klantId. */
export function mutatieHoortBijKlant(
  mutatie: Mutatie,
  klantNaam: string,
  pandNamen: string[],
): boolean {
  const zoekterm = mutatie.locatie.toLowerCase()
  if (zoekterm.includes(klantNaam.toLowerCase())) return true
  return pandNamen.some((naam) => zoekterm.includes(naam.toLowerCase()))
}

export function bouwKwartaalRapport(
  klantId: string,
  klantNaam: string,
  pandNamen: string[],
  acties: ActieItem[],
  mutaties: Mutatie[],
  periodeStart: string,
  periodeEind: string,
): KwartaalRapport {
  const klantActies = acties.filter((a) => a.klantId === klantId)

  const afgerondInPeriode = klantActies.filter(
    (a) => a.afgerondOp != null && a.afgerondOp >= periodeStart && a.afgerondOp < periodeEind,
  )
  const opTijd = afgerondInPeriode.filter((a) => a.afgerondOp! <= berekenDueDate(a))
  const teLaat = afgerondInPeriode.length - opTijd.length

  const DAG_MS = 24 * 60 * 60 * 1000
  const doorlooptijden = afgerondInPeriode.map(
    (a) => (new Date(a.afgerondOp!).getTime() - new Date(a.aangemaaktOp).getTime()) / DAG_MS,
  )
  const gemiddeldeDoorlooptijdDagen =
    doorlooptijden.length > 0
      ? Math.round(doorlooptijden.reduce((s, d) => s + d, 0) / doorlooptijden.length)
      : null

  const nogOpenstaand = klantActies.filter((a) => a.status === 'open').length
  const nogOpenstaandDue = klantActies.filter((a) => isDue(a)).length

  const klantMutaties = mutaties.filter(
    (m) =>
      mutatieHoortBijKlant(m, klantNaam, pandNamen) &&
      m.datum != null &&
      m.datum >= periodeStart &&
      m.datum < periodeEind,
  )

  return {
    klantId,
    klantNaam,
    periodeStart,
    periodeEind,
    actiesAfgerond: afgerondInPeriode.length,
    actiesAfgerondOpTijd: opTijd.length,
    actiesAfgerondTeLaat: teLaat,
    gemiddeldeDoorlooptijdDagen,
    nogOpenstaand,
    nogOpenstaandDue,
    mutatiesIn: klantMutaties.filter((m) => m.richting === 'in').length,
    mutatiesUit: klantMutaties.filter((m) => m.richting === 'uit').length,
  }
}

/** Aantal onderhoudsitems dat in de gekozen periode is uitgevoerd — losstaand
 * van KwartaalRapport omdat de Onderhoud-sectie op de mockup optioneel is en
 * alleen getoond wordt als de klant panden/onderhoud gebruikt. */
export function berekenOnderhoudUitgevoerdInPeriode(
  onderhoud: Onderhoud[],
  periodeStart: string,
  periodeEind: string,
): number {
  const startMs = new Date(periodeStart + 'T00:00:00').getTime()
  const eindMs = new Date(periodeEind + 'T00:00:00').getTime()
  return onderhoud.filter(
    (item) =>
      item.laatstUitgevoerdOp != null &&
      item.laatstUitgevoerdOp >= startMs &&
      item.laatstUitgevoerdOp < eindMs,
  ).length
}

export function bepaalHuidigKwartaal(vandaag: Date = new Date()): Kwartaal {
  return {
    jaar: vandaag.getFullYear(),
    kwartaal: (Math.floor(vandaag.getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
  }
}

/** Kwartaaloptie-lijst voor de select: huidig jaar en het jaar ervoor, meest
 * recente kwartaal eerst. */
export function genereerKwartaalOpties(huidigJaar: number): Kwartaal[] {
  const opties: Kwartaal[] = []
  for (const jaar of [huidigJaar, huidigJaar - 1]) {
    for (const kwartaal of [4, 3, 2, 1] as const) {
      opties.push({ jaar, kwartaal })
    }
  }
  return opties
}

export function formatKwartaalLabel(kwartaal: Kwartaal): string {
  return `Q${kwartaal.kwartaal} ${kwartaal.jaar}`
}

function formatDatumNl(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MAANDNAMEN[d.getMonth()]} ${d.getFullYear()}`
}

/** Leesbare periode-omschrijving, bijv. "1 april 2026 — 30 juni 2026". De
 * einddatum van het rapport is exclusief, dus voor weergave één dag terug. */
export function formatPeriodeLabel(periodeStart: string, periodeEind: string): string {
  const laatsteDag = new Date(periodeEind + 'T00:00:00')
  laatsteDag.setDate(laatsteDag.getDate() - 1)
  return `${formatDatumNl(periodeStart)} — ${formatDatumNl(laatsteDag.toISOString().slice(0, 10))}`
}
