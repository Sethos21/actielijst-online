import type * as XLSXType from 'xlsx'
import type { ArchiefItem } from './types'

function rijenVoorExport(items: ArchiefItem[]) {
  return items.map((item) => ({
    Type: item.type,
    Naam: item.naam,
    Klant: item.klantNaam,
    Pand: item.pandNaam ?? '',
    'Gearchiveerd op': new Date(item.gearchiveerdOp).toLocaleDateString('nl-NL'),
    'Gearchiveerd door': item.gearchiveerdDoor ?? '',
    Reden: item.gearchiveerdReden ?? '',
  }))
}

export function bouwArchiefWerkboek(
  items: ArchiefItem[],
  XLSX: typeof XLSXType,
): XLSXType.WorkBook {
  const werkblad = XLSX.utils.json_to_sheet(rijenVoorExport(items))
  const werkboek = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(werkboek, werkblad, 'Archief')
  return werkboek
}

/** Laadt xlsx pas bij daadwerkelijk exporteren, zodat de library niet in de
 * hoofdbundel zit — zie src/features/acties/excelExport.ts voor hetzelfde patroon.
 * Neemt de huidige gefilterde/gezochte lijst aan — "exporteer wat ik nu zie". */
export async function exporteerArchiefNaarExcel(items: ArchiefItem[]) {
  const XLSX = await import('xlsx')
  const werkboek = bouwArchiefWerkboek(items, XLSX)
  XLSX.writeFile(werkboek, `Archief_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exporteerArchiefNaarJson(items: ArchiefItem[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Archief_export_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
