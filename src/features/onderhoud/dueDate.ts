import type { Onderhoud, OnderhoudHerhaling, OnderhoudStatus } from './types'

const DRIE_WEKEN_MS = 21 * 24 * 60 * 60 * 1000
const EEN_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type OnderhoudIndicatie = 'due' | 'gepland' | 'ok'

/** Automatische indicatie op basis van volgendeDatum — puur een voorstel.
 * De daadwerkelijke, door het team gezette status staat in item.status. */
export function bepaalOnderhoudStatus(volgendeDatum: number): OnderhoudIndicatie {
  const nu = Date.now()
  if (volgendeDatum < nu) return 'due'
  if (volgendeDatum - nu < DRIE_WEKEN_MS) return 'gepland'
  return 'ok'
}

export function formatOnderhoudStatusLabel(volgendeDatum: number): string {
  const status = bepaalOnderhoudStatus(volgendeDatum)
  if (status === 'due') return 'Due'
  if (status === 'ok') return 'Op schema'
  const weken = Math.max(1, Math.ceil((volgendeDatum - Date.now()) / EEN_WEEK_MS))
  return `Over ${weken} ${weken === 1 ? 'week' : 'weken'}`
}

const KORTE_MAANDEN = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sept', 'okt', 'nov', 'dec',
]

export function formatKorteDatum(timestamp: number): string {
  const datum = new Date(timestamp)
  return `${datum.getDate()} ${KORTE_MAANDEN[datum.getMonth()]} ${datum.getFullYear()}`
}

/** Kalendergrens per herhalingstype — bepaalt vanaf wanneer een voltooid item
 * weer als 'open' voor de huidige periode moet gelden. */
export const HERHALING_RESET_GRENS: Record<OnderhoudHerhaling, (nu: Date) => Date> = {
  maandelijks: (nu) => new Date(nu.getFullYear(), nu.getMonth(), 1),
  kwartaal: (nu) => new Date(nu.getFullYear(), Math.floor(nu.getMonth() / 3) * 3, 1),
  halfjaarlijks: (nu) => new Date(nu.getFullYear(), nu.getMonth() < 6 ? 0 : 6, 1),
  jaarlijks: (nu) => new Date(nu.getFullYear(), 0, 1),
  '2-jaarlijks': (nu) => new Date(nu.getFullYear() - (nu.getFullYear() % 2), 0, 1),
  '3-jaarlijks': (nu) => new Date(nu.getFullYear() - (nu.getFullYear() % 3), 0, 1),
  '5-jaarlijks': (nu) => new Date(nu.getFullYear() - (nu.getFullYear() % 5), 0, 1),
}

/** Bepaalt of een item automatisch weer als 'open' moet gelden, op basis van
 * of laatstUitgevoerdOp vóór de meest recente kalendergrens van zijn eigen
 * herhalingstype ligt. Bewust géén achtergrondproces — dit wordt bij elke
 * render herberekend, er verandert dus niets vanzelf op de achtergrond. */
export function moetAutomatischResetten(
  item: Pick<Onderhoud, 'laatstUitgevoerdOp' | 'herhaling'>,
): boolean {
  if (!item.laatstUitgevoerdOp) return false
  const grens = HERHALING_RESET_GRENS[item.herhaling](new Date())
  return new Date(item.laatstUitgevoerdOp) < grens
}

/** De daadwerkelijk te tonen status: een 'voltooid' item waarvan de
 * herhalingsperiode inmiddels verstreken is, telt weer als 'open' — zonder
 * dat dit wordt weggeschreven naar Firestore. */
export function bepaalEffectieveStatus(
  item: Pick<Onderhoud, 'status' | 'laatstUitgevoerdOp' | 'herhaling'>,
): OnderhoudStatus {
  if (item.status === 'voltooid' && moetAutomatischResetten(item)) return 'open'
  return item.status
}
