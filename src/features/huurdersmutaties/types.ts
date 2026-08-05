export type Richting = 'in' | 'uit'

export interface Mutatie {
  id: string
  richting: Richting
  jaar: number
  maand: number // 1-12
  datum: string | null // ISO-datum (YYYY-MM-DD), optioneel
  naam: string
  locatie: string
  administratie: string
  opmerking: string
}

export const MAANDNAMEN = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
] as const

export const STANDAARD_JAREN = [2024, 2025, 2026]
