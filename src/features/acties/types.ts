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

export type ActieHerkomstType = 'onderhoud' | 'mjop' | 'document'

export interface ActieHerkomst {
  type: ActieHerkomstType
  bronId: string // id van het Onderhoud/MjopPost/Document-item
  label: string // bijv. "CV-ketel onderhoud" — voor weergave, zonder extra lookup nodig
}

export interface ActieItem {
  id: string
  klantId: string
  ref: string
  onderwerp: string
  bedrijf: string // eigenaar-entiteit van het pand (bv. "Bowog Beheer B.V."), los van de klant-relatie
  vestiging: string
  pandId?: string // als gezet, wint dit over vestiging (vrije tekst) voor weergave
  actie: string
  verantw: string[]
  aangemaaktOp: string // ISO-datum (YYYY-MM-DD), handmatig wijzigbaar
  doorlooptijd: Doorlooptijd
  dueDateOverride?: string // ISO-datum, overschrijft de berekening
  postponedTot?: string // ISO-datum, via uitstel-knop gezet — wint van dueDateOverride
  status: ActieStatus
  afgerondOp?: string // ISO-datum, gezet zodra status naar 'done' gaat, gewist bij heropenen
  opmerking: string
  vergadering_id?: string
  herkomst?: ActieHerkomst
}
