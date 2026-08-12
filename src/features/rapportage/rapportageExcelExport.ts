import type * as XLSXType from 'xlsx'
import { formatKwartaalRangeLabel, formatPeriodeLabel } from './kwartaalLogica'
import type { Kwartaal, KwartaalRapport } from './types'

export function bouwRapportageWerkboek(
  rapport: KwartaalRapport,
  vanKwartaal: Kwartaal,
  totKwartaal: Kwartaal,
  XLSX: typeof XLSXType,
): XLSXType.WorkBook {
  const rijen = [
    ['Kwartaalrapportage', rapport.klantNaam],
    ['Kwartaal', formatKwartaalRangeLabel(vanKwartaal, totKwartaal)],
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

export function bestandsnaamVoor(
  klantNaam: string,
  vanKwartaal: Kwartaal,
  totKwartaal: Kwartaal,
): string {
  const veilig = klantNaam
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const kwartaalDeel =
    vanKwartaal.jaar === totKwartaal.jaar && vanKwartaal.kwartaal === totKwartaal.kwartaal
      ? `Q${vanKwartaal.kwartaal}_${vanKwartaal.jaar}`
      : `Q${vanKwartaal.kwartaal}_${vanKwartaal.jaar}_tm_Q${totKwartaal.kwartaal}_${totKwartaal.jaar}`
  return `Rapportage_${veilig}_${kwartaalDeel}.xlsx`
}

/** Laadt xlsx pas bij daadwerkelijk exporteren, zodat de library niet in de
 * hoofdbundel zit — zie src/features/acties/excelExport.ts voor hetzelfde patroon. */
export async function exporteerRapportageNaarExcel(
  rapport: KwartaalRapport,
  vanKwartaal: Kwartaal,
  totKwartaal: Kwartaal,
) {
  const XLSX = await import('xlsx')
  const werkboek = bouwRapportageWerkboek(rapport, vanKwartaal, totKwartaal, XLSX)
  XLSX.writeFile(werkboek, bestandsnaamVoor(rapport.klantNaam, vanKwartaal, totKwartaal))
}
