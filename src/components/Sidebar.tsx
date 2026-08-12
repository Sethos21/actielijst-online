import type { Klant } from '../features/klanten/types'
import { useActieStats } from '../features/acties/useActieStats'
import { useKlanten } from '../features/klanten/useKlanten'

type Weergave = 'klantoverzicht' | 'mijn-acties' | 'dashboard' | 'rapportage' | 'archief'

interface Props {
  geselecteerdeKlantId: string | null
  weergave: Weergave
  onSelectKlant: (klant: Klant) => void
  onKlantoverzicht: () => void
  onPandenOverzicht: () => void
  onMijnActies: () => void
  onDashboard: () => void
  onRapportage: () => void
  onArchief: () => void
  gebruikerEmail: string
  onUitloggen: () => void
}

export function Sidebar({
  geselecteerdeKlantId,
  weergave,
  onSelectKlant,
  onKlantoverzicht,
  onPandenOverzicht,
  onMijnActies,
  onDashboard,
  onRapportage,
  onArchief,
  gebruikerEmail,
  onUitloggen,
}: Props) {
  const { klanten } = useKlanten()
  const stats = useActieStats()

  return (
    <aside className="sidebar">
      <button type="button" className="sidebar-merk" onClick={onKlantoverzicht}>
        <span className="sidebar-logo">BVC</span>
        <span className="sidebar-submerk">ACTIELIJSTEN</span>
      </button>

      <nav className="sidebar-menu">
        <button
          type="button"
          className={`sidebar-menu-item ${
            geselecteerdeKlantId || weergave === 'klantoverzicht' ? 'actief' : ''
          }`}
          onClick={onKlantoverzicht}
        >
          Actielijst
        </button>
        <button
          type="button"
          className="sidebar-menu-item"
          onClick={onPandenOverzicht}
        >
          Panden
        </button>
        <button
          type="button"
          className={`sidebar-menu-item ${
            !geselecteerdeKlantId && weergave === 'mijn-acties' ? 'actief' : ''
          }`}
          onClick={onMijnActies}
        >
          Mijn acties
        </button>
        <button
          type="button"
          className={`sidebar-menu-item ${
            !geselecteerdeKlantId && weergave === 'dashboard' ? 'actief' : ''
          }`}
          onClick={onDashboard}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`sidebar-menu-item ${
            !geselecteerdeKlantId && weergave === 'rapportage' ? 'actief' : ''
          }`}
          onClick={onRapportage}
        >
          Rapportage
        </button>
      </nav>

      <div className="sidebar-klanten">
        <span className="sidebar-sectie-titel">Klanten</span>
        <ul>
          {klanten.map((klant) => {
            const klantStats = stats[klant.id]
            const aantalOpen = klantStats?.open ?? 0
            return (
              <li key={klant.id}>
                <button
                  type="button"
                  className={`sidebar-klant-item ${
                    klant.id === geselecteerdeKlantId ? 'actief' : ''
                  }`}
                  onClick={() => onSelectKlant(klant)}
                >
                  <span
                    className={`sidebar-klant-stip ${
                      aantalOpen > 0 ? 'heeft-open' : ''
                    }`}
                  />
                  <span className="sidebar-klant-naam">{klant.naam}</span>
                  <span className="sidebar-klant-teller">{aantalOpen}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <button
        type="button"
        className="sidebar-nieuwe-klant"
        onClick={onKlantoverzicht}
      >
        + Nieuwe actielijst
      </button>

      <button
        type="button"
        className={`sidebar-menu-item ${
          !geselecteerdeKlantId && weergave === 'archief' ? 'actief' : ''
        }`}
        onClick={onArchief}
      >
        Archief
      </button>

      <div className="sidebar-footer">
        <span>{gebruikerEmail}</span>
        <button type="button" onClick={onUitloggen}>
          Uitloggen
        </button>
      </div>
    </aside>
  )
}
