export type MjopStatus = 'gepland' | 'dit-jaar' | 'afgerond'

export type MjopCategorie = 'onderhoud' | 'verbouwing-renovatie' | 'vervanging'

export interface MjopPost {
  id: string
  pandId: string
  klantId: string
  naam: string // bijv. "Dakbedekking vervangen"
  categorie: MjopCategorie
  jaar: number // bijv. 2028
  geschatBedrag: number // in hele euro's
  status: MjopStatus // handmatig ingesteld, geen automatische datumberekening
  toegevoegdDoor: string
  aangemaaktOp: number
  gearchiveerdOp?: number
  gearchiveerdDoor?: string
  gearchiveerdReden?: string
}
