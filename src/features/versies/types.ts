import type { ActieItem } from '../acties/types'

export interface Versie {
  id: string
  naam: string
  datum: string // ISO-datum (YYYY-MM-DD)
  aanwezigen: string[]
  snapshot: ActieItem[]
  aangemaaktDoor: string
}
