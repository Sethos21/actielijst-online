export type Doorlooptijd =
  | '1w'
  | '2w'
  | '3w'
  | '4w'
  | '1m'
  | '2m'
  | '3m'
  | '4m'
  | '5m'
  | '6m'

export const DOORLOOPTIJD_OPTIES: Doorlooptijd[] = [
  '1w',
  '2w',
  '3w',
  '4w',
  '1m',
  '2m',
  '3m',
  '4m',
  '5m',
  '6m',
]

export type ActieStatus = 'open' | 'done' | 'hold'

export interface ActieItem {
  id: string
  klantId: string
  ref: string
  onderwerp: string
  vestiging: string
  actie: string
  verantw: string[]
  aangemaaktOp: string // ISO-datum (YYYY-MM-DD), handmatig wijzigbaar
  doorlooptijd: Doorlooptijd
  dueDateOverride?: string // ISO-datum, overschrijft de berekening
  postponedTot?: string // ISO-datum, via uitstel-knop gezet — wint van dueDateOverride
  status: ActieStatus
  opmerking: string
  vergadering_id?: string
}
