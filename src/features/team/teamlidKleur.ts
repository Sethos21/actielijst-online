// Consistente kleur per teamlid (avatar-chips), via CSS-classes uit
// index.css (.avatar-kleur-0 t/m -5) — geen inline styles, zie
// BVC_UI_UX_DESIGN.md §8. Nieuwe namen krijgen automatisch de
// eerstvolgende kleur uit de set — zie §2.
const AANTAL_KLEUREN = 6

export function teamlidKleurKlasse(naam: string, alleNamen: readonly string[]): string {
  const index = alleNamen.indexOf(naam)
  const gekozenIndex = index === -1 ? AANTAL_KLEUREN - 1 : index % AANTAL_KLEUREN
  return `avatar-kleur-${gekozenIndex}`
}

export function initialen(naam: string): string {
  return naam.slice(0, 2).toUpperCase()
}
