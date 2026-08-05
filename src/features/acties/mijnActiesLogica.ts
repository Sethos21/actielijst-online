import { isDue } from './dueDate'
import type { ActieItem } from './types'

export interface TeamlidSamenvatting {
  open: number
  due: number
}

/** Open (niet-due) en due-telling per teamlid, over alle klanten heen. */
export function berekenSamenvattingPerTeamlid(
  acties: ActieItem[],
  teamleden: readonly string[],
): Record<string, TeamlidSamenvatting> {
  const samenvatting: Record<string, TeamlidSamenvatting> = {}
  for (const naam of teamleden) {
    const vanTeamlid = acties.filter((a) => a.verantw.includes(naam))
    samenvatting[naam] = {
      open: vanTeamlid.filter((a) => a.status === 'open' && !isDue(a)).length,
      due: vanTeamlid.filter((a) => isDue(a)).length,
    }
  }
  return samenvatting
}

/** Openstaande (niet-done) acties van één teamlid, over alle klanten heen. */
export function filterActiesVoorTeamlid(acties: ActieItem[], naam: string): ActieItem[] {
  return acties.filter((a) => a.verantw.includes(naam) && a.status !== 'done')
}

export interface KlantGroep {
  klantId: string
  acties: ActieItem[]
}

/** Groepeert acties per klant — volgorde: eerste keer dat een klant voorkomt. */
export function groepeerPerKlant(acties: ActieItem[]): KlantGroep[] {
  const groepen = new Map<string, ActieItem[]>()
  for (const actie of acties) {
    const lijst = groepen.get(actie.klantId)
    if (lijst) lijst.push(actie)
    else groepen.set(actie.klantId, [actie])
  }
  return Array.from(groepen.entries()).map(([klantId, acties]) => ({ klantId, acties }))
}
