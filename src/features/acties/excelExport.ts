import * as XLSX from 'xlsx'
import { berekenDueDate } from './dueDate'
import type { ActieItem, ActieStatus } from './types'

const STATUS_LABEL: Record<ActieStatus, string> = {
  open: 'Open',
  done: 'Gereed',
  hold: 'On hold',
}

const KOLOMMEN = [
  'Onderwerp',
  'Bedrijf',
  'Vestiging',
  'Actiepunt',
  'Verantw.',
  'Aangemaakt',
  'Doorlooptijd',
  'Due',
  'Status',
  'Opmerking',
]

const KOLOMBREEDTES = [24, 20, 18, 36, 16, 12, 12, 12, 10, 30]

/**
 * Kolombreedtes worden wel correct weggeschreven naar het .xlsx-bestand,
 * maar een bevroren headerrij ("!views" met state: "frozen") niet — dat
 * schrijft de gratis/community-versie van SheetJS niet weg (alleen de
 * betaalde Pro-versie). Geverifieerd door het geschreven bestand terug in
 * te lezen: de kolombreedtes komen terug, de freeze-pane niet.
 */
export function bouwActielijstWerkboek(acties: ActieItem[]): XLSX.WorkBook {
  const rijen = [
    KOLOMMEN,
    ...acties.map((actie) => [
      actie.onderwerp,
      actie.bedrijf,
      actie.vestiging,
      actie.actie,
      actie.verantw.join(', '),
      actie.aangemaaktOp,
      actie.doorlooptijd,
      berekenDueDate(actie),
      STATUS_LABEL[actie.status],
      actie.opmerking,
    ]),
  ]
  const werkblad = XLSX.utils.aoa_to_sheet(rijen)
  werkblad['!cols'] = KOLOMBREEDTES.map((wch) => ({ wch }))

  const werkboek = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(werkboek, werkblad, 'Actielijst')
  return werkboek
}

export function bestandsnaamVoor(klantNaam: string): string {
  const veilig = klantNaam
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const datum = new Date().toISOString().slice(0, 10)
  return `Actielijst_${veilig}_${datum}.xlsx`
}

export function exporteerNaarExcel(acties: ActieItem[], klantNaam: string) {
  const werkboek = bouwActielijstWerkboek(acties)
  XLSX.writeFile(werkboek, bestandsnaamVoor(klantNaam))
}
