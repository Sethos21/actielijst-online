export type OnderhoudHerhaling =
  | 'maandelijks'
  | 'kwartaal'
  | 'halfjaarlijks'
  | 'jaarlijks'
  | '2-jaarlijks'
  | '3-jaarlijks'
  | '5-jaarlijks'

export const ONDERHOUD_HERHALING_OPTIES: OnderhoudHerhaling[] = [
  'maandelijks',
  'kwartaal',
  'halfjaarlijks',
  'jaarlijks',
  '2-jaarlijks',
  '3-jaarlijks',
  '5-jaarlijks',
]

export type OnderhoudStatus = 'open' | 'due' | 'voltooid'

export interface Onderhoud {
  id: string
  pandId: string
  klantId: string
  naam: string // bijv. "CV-ketel onderhoud"
  verantw: string // één teamlid, geen array — onderhoud is 1-op-1 toegewezen
  leverancier?: string // vrij tekstveld, per pand — kan verschillen ook bij hetzelfde onderhoudstype
  herhaling: OnderhoudHerhaling
  status: OnderhoudStatus // handmatig instelbaar, niet langer uitsluitend afgeleid uit een datum
  laatstUitgevoerdOp?: string // ISO-datum (yyyy-mm-dd), handmatig invulbaar
  jaar?: number // welk jaar dit item betreft
  volgendeDatum: number // voedt de automatische indicatie in dueDate.ts, geen harde waarheid meer
  aangemaaktOp: number
  gearchiveerdOp?: number
  gearchiveerdDoor?: string
  gearchiveerdReden?: string
}
