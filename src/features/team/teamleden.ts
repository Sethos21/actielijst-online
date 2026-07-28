export const TEAMLEDEN = ['Ton', 'Seth', 'Gertjan', 'Marjan', 'Eigenaar'] as const

export type Teamlid = (typeof TEAMLEDEN)[number]
