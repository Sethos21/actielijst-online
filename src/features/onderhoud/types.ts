export type OnderhoudHerhaling = 'jaarlijks'

export interface Onderhoud {
  id: string
  pandId: string
  klantId: string
  naam: string // bijv. "CV-ketel onderhoud"
  verantw: string // één teamlid, geen array — onderhoud is 1-op-1 toegewezen
  herhaling: OnderhoudHerhaling
  laatstUitgevoerdOp?: number
  volgendeDatum: number // bepaalt de due-status, zie dueDate.ts
  aangemaaktOp: number
}
