import * as XLSX from 'xlsx'
import { MAANDNAMEN, type Mutatie, type Richting } from './types'

const RICHTING_LABEL: Record<Richting, string> = {
  in: 'Ingaand',
  uit: 'Vertrekkend',
}

const KOLOMMEN = [
  'Richting',
  'Jaar',
  'Maand',
  'Datum',
  'Naam huurder',
  'Locatie',
  'Administratie',
  'Opmerking',
]

const KOLOMBREEDTES = [12, 8, 12, 12, 24, 20, 24, 30]

function maandLabel(maand: number): string {
  const naam = MAANDNAMEN[maand - 1]
  return naam.charAt(0).toUpperCase() + naam.slice(1)
}

/** Chronologisch (oud naar nieuw) — leesbaarder in een geëxporteerd bestand dan de schermvolgorde. */
function sorteerChronologisch(mutaties: Mutatie[]): Mutatie[] {
  return [...mutaties].sort((a, b) => {
    if (a.jaar !== b.jaar) return a.jaar - b.jaar
    if (a.maand !== b.maand) return a.maand - b.maand
    return (a.datum ?? '').localeCompare(b.datum ?? '')
  })
}

export function bouwMutatiesWerkboek(mutaties: Mutatie[]): XLSX.WorkBook {
  const rijen = [
    KOLOMMEN,
    ...sorteerChronologisch(mutaties).map((mutatie) => [
      RICHTING_LABEL[mutatie.richting],
      mutatie.jaar,
      maandLabel(mutatie.maand),
      mutatie.datum ?? '',
      mutatie.naam,
      mutatie.locatie,
      mutatie.administratie,
      mutatie.opmerking,
    ]),
  ]
  const werkblad = XLSX.utils.aoa_to_sheet(rijen)
  werkblad['!cols'] = KOLOMBREEDTES.map((wch) => ({ wch }))

  const werkboek = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(werkboek, werkblad, 'Huurdersmutaties')
  return werkboek
}

export function bestandsnaamVoor(jaarLabel: string): string {
  const veilig = jaarLabel
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const datum = new Date().toISOString().slice(0, 10)
  return `Huurdersmutaties_${veilig}_${datum}.xlsx`
}

export function exporteerNaarExcel(mutaties: Mutatie[], jaarLabel: string) {
  const werkboek = bouwMutatiesWerkboek(mutaties)
  XLSX.writeFile(werkboek, bestandsnaamVoor(jaarLabel))
}
