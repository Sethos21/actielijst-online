interface Props {
  onTerug: () => void
}

/**
 * Tijdelijk scherm zodat de Huurdersmutaties-tegel op het Startscherm al
 * ergens naartoe navigeert. Wordt vervangen zodra de echte module
 * (Huurdersmutaties.tsx + MutatieInvoer.tsx, zie BVC_UI_UX_DESIGN.md §5b)
 * gebouwd is.
 */
export function HuurdersmutatiesPlaceholder({ onTerug }: Props) {
  return (
    <div className="app-inhoud">
      <button type="button" onClick={onTerug}>
        ← Terug naar start
      </button>
      <h1>Huurdersmutaties</h1>
      <p>Deze module wordt binnenkort gebouwd.</p>
    </div>
  )
}
