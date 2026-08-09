export interface Pand {
  id: string
  klantId: string
  naam: string // bijv. "Hoofdstraat 12, Vlijmen" — vrij tekstveld, geen adres-opsplitsing
  opmerking?: string
  aangemaaktOp: number
  gearchiveerdOp?: number
  gearchiveerdDoor?: string
  gearchiveerdReden?: string
}
