export type DocumentTag =
  | 'energielabel'
  | 'keuring'
  | 'contract'
  | 'overig'
  | 'certificaat'
  | 'offerte'
  | 'factuur'
  | 'tekeningen'

export interface Document {
  id: string
  pandId: string
  klantId: string
  naam: string // bestandsnaam
  tag: DocumentTag
  storageUrl: string // Firebase Storage download-URL
  storagePath: string // Storage-pad, nodig om later te kunnen verwijderen
  geuploadDoor: string // teamlid, handmatig gekozen (gedeeld team-account, zie VergaderingAfsluitenModal)
  geuploadOp: number
  opmerking?: string
  gearchiveerdOp?: number
  gearchiveerdDoor?: string
  gearchiveerdReden?: string
}
