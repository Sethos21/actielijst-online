import { isDue } from '../acties/dueDate'
import type { ActieItem } from '../acties/types'

export interface Telling {
  open: number
  due: number
  done: number
}

/** Totalen over alle klanten heen — "open" telt alle openstaande acties, due-acties inbegrepen. */
export function berekenTotaalStats(acties: ActieItem[]): Telling {
  return {
    open: acties.filter((a) => a.status === 'open').length,
    due: acties.filter((a) => isDue(a)).length,
    done: acties.filter((a) => a.status === 'done').length,
  }
}

export function berekenStatsPerKlant(acties: ActieItem[]): Record<string, Telling> {
  const stats: Record<string, Telling> = {}
  for (const actie of acties) {
    if (!stats[actie.klantId]) stats[actie.klantId] = { open: 0, due: 0, done: 0 }
    if (actie.status === 'open') stats[actie.klantId].open += 1
    if (isDue(actie)) stats[actie.klantId].due += 1
    if (actie.status === 'done') stats[actie.klantId].done += 1
  }
  return stats
}

export interface TeamlidTelling {
  open: number
  due: number
}

/** "open" per teamlid telt alle openstaande acties waar diegene verantwoordelijk voor is, due inbegrepen. */
export function berekenStatsPerTeamlid(
  acties: ActieItem[],
  teamleden: readonly string[],
): Record<string, TeamlidTelling> {
  const stats: Record<string, TeamlidTelling> = {}
  for (const naam of teamleden) stats[naam] = { open: 0, due: 0 }
  for (const actie of acties) {
    if (actie.status !== 'open') continue
    for (const naam of actie.verantw) {
      if (!stats[naam]) continue
      stats[naam].open += 1
      if (isDue(actie)) stats[naam].due += 1
    }
  }
  return stats
}
