const EEN_JAAR_MS = 365 * 24 * 60 * 60 * 1000
const DRIE_WEKEN_MS = 21 * 24 * 60 * 60 * 1000
const EEN_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type OnderhoudStatus = 'due' | 'gepland' | 'ok'

export function bepaalOnderhoudStatus(volgendeDatum: number): OnderhoudStatus {
  const nu = Date.now()
  if (volgendeDatum < nu) return 'due'
  if (volgendeDatum - nu < DRIE_WEKEN_MS) return 'gepland'
  return 'ok'
}

/** Na afvinken: volgende datum = uitvoerdatum + 1 jaar (niet de oorspronkelijk
 * geplande datum — anders stapelt vertraging zich op). */
export function berekenVolgendeOnderhoudsdatum(uitgevoerdOp: number): number {
  return uitgevoerdOp + EEN_JAAR_MS
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
