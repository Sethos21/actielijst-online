export interface KwartaalRapport {
  klantId: string
  klantNaam: string
  periodeStart: string // ISO-datum, inclusief
  periodeEind: string // ISO-datum, exclusief (eerste dag van het volgende kwartaal)
  actiesAfgerond: number
  actiesAfgerondOpTijd: number
  actiesAfgerondTeLaat: number
  gemiddeldeDoorlooptijdDagen: number | null
  nogOpenstaand: number
  nogOpenstaandDue: number
  mutatiesIn: number
  mutatiesUit: number
}

export interface Kwartaal {
  jaar: number
  kwartaal: 1 | 2 | 3 | 4
}
