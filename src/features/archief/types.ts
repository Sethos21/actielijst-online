export type ArchiefType = 'pand' | 'onderhoud' | 'document' | 'mjop'

export interface ArchiefItem {
  id: string
  type: ArchiefType
  naam: string
  klantId: string
  klantNaam: string // lookup, ingevuld in ArchiefPage.tsx
  pandId?: string
  pandNaam?: string // lookup, ingevuld in ArchiefPage.tsx — alleen voor onderhoud/document/mjop
  storagePath?: string // alleen voor type 'document' — nodig om het Storage-bestand definitief te kunnen verwijderen
  gearchiveerdOp: number
  gearchiveerdDoor?: string
  gearchiveerdReden?: string
}
