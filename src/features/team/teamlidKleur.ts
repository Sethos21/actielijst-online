// Consistente kleur per teamlid (avatar-chips). Nieuwe namen krijgen
// automatisch de eerstvolgende kleur uit de set — zie BVC_UI_UX_DESIGN.md §2.
const PALET = [
  '#7c5cbf', // paars — Ton
  '#1d7a45', // groen — Seth
  '#1a5c8a', // blauw — Gertjan
  '#b06800', // amber — Marjan
  '#c0392b', // rood — Eigenaar
  '#5a6070', // grijs — extra namen daarna
]

export function teamlidKleur(naam: string, alleNamen: readonly string[]): string {
  const index = alleNamen.indexOf(naam)
  if (index === -1) return PALET[PALET.length - 1]
  return PALET[index % PALET.length]
}

export function initialen(naam: string): string {
  return naam.slice(0, 2).toUpperCase()
}
