import type * as XLSXType from 'xlsx'
import { formatKwartaalLabel, formatPeriodeLabel } from './kwartaalLogica'
import type { Kwartaal, KwartaalRapport } from './types'

export function bouwRapportageWerkboek(
  rapport: KwartaalRapport,
  kwartaal: Kwartaal,
  XLSX: typeof XLSXType,
): XLSXType.WorkBook {
  const rijen = [
    ['Kwartaalrapportage', rapport.klantNaam],
    ['Kwartaal', formatKwartaalLabel(kwartaal)],
    ['Periode', formatPeriodeLabel(rapport.periodeStart, rapport.periodeEind)],
    [],
    ['Acties', ''],
    ['Afgerond op tijd', rapport.actiesAfgerondOpTijd],
    ['Afgerond te laat', rapport.actiesAfgerondTeLaat],
    ['Totaal afgerond', rapport.actiesAfgerond],
    [
      'Gemiddelde doorlooptijd (dagen)',
      rapport.gemiddeldeDoorlooptijdDagen ?? '',
    ],
    ['Nog openstaand (niet due)', rapport.nogOpenstaand - rapport.nogOpenstaandDue],
    ['Nog openstaand (due)', rapport.nogOpenstaandDue],
    [],
    ['Huurdersmutaties', ''],
    ['Ingaand', rapport.mutatiesIn],
    ['Vertrekkend', rapport.mutatiesUit],
  ]
  const werkblad = XLSX.utils.aoa_to_sheet(rijen)
  werkblad['!cols'] = [{ wch: 32 }, { wch: 20 }]

  const werkboek = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(werkboek, werkblad, 'Rapportage')
  return werkboek
}

export function bestandsnaamVoor(klantNaam: string, kwartaal: Kwartaal): string {
  const veilig = klantNaam
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `Rapportage_${veilig}_Q${kwartaal.kwartaal}_${kwartaal.jaar}.xlsx`
}

/** Laadt xlsx pas bij daadwerkelijk exporteren, zodat de library niet in de
 * hoofdbundel zit — zie src/features/acties/excelExport.ts voor hetzelfde patroon. */
export async function exporteerRapportageNaarExcel(
  rapport: KwartaalRapport,
  kwartaal: Kwartaal,
) {
  const XLSX = await import('xlsx')
  const werkboek = bouwRapportageWerkboek(rapport, kwartaal, XLSX)
  XLSX.writeFile(werkboek, bestandsnaamVoor(rapport.klantNaam, kwartaal))
}
