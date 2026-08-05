import { useMemo } from 'react'
import { Badge } from '../../components/Badge'
import { useAlleActies } from '../acties/useAlleActies'
import type { Klant } from '../klanten/types'
import { useKlanten } from '../klanten/useKlanten'
import { TEAMLEDEN } from '../team/teamleden'
import { initialen, teamlidKleurKlasse } from '../team/teamlidKleur'
import {
  berekenStatsPerKlant,
  berekenStatsPerTeamlid,
  berekenTotaalStats,
} from './dashboardLogica'

interface Props {
  onSelectKlant: (klant: Klant) => void
}

export function DashboardPage({ onSelectKlant }: Props) {
  const { acties, loading: actiesLaden } = useAlleActies()
  const { klanten, loading: klantenLaden } = useKlanten()

  const totaal = useMemo(() => berekenTotaalStats(acties), [acties])
  const statsPerKlant = useMemo(() => berekenStatsPerKlant(acties), [acties])
  const statsPerTeamlid = useMemo(
    () => berekenStatsPerTeamlid(acties, TEAMLEDEN),
    [acties],
  )

  const loading = actiesLaden || klantenLaden

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Totaal open (alle klanten)</span>
          <span className="stat-waarde stat-waarde-open">{totaal.open}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Totaal due</span>
          <span className="stat-waarde stat-waarde-due">{totaal.due}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Totaal afgerond</span>
          <span className="stat-waarde stat-waarde-done">{totaal.done}</span>
        </div>
      </div>

      {loading ? (
        <p>Laden...</p>
      ) : (
        <>
          <section className="dashboard-sectie">
            <h2>Open acties per klant</h2>
            {klanten.length === 0 ? (
              <p>Nog geen klanten.</p>
            ) : (
              <ul className="dashboard-klantenlijst">
                {klanten.map((klant) => {
                  const stats = statsPerKlant[klant.id] ?? { open: 0, due: 0, done: 0 }
                  return (
                    <li key={klant.id}>
                      <button
                        type="button"
                        className="dashboard-klant-rij"
                        onClick={() => onSelectKlant(klant)}
                      >
                        <span className="dashboard-klant-naam">{klant.naam}</span>
                        <Badge variant="open">{stats.open} open</Badge>
                        {stats.due > 0 && <Badge variant="due">{stats.due} due</Badge>}
                        <Badge variant="done">{stats.done} done</Badge>
                        <span className="dashboard-klant-pijl">→</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="dashboard-sectie">
            <h2>Open acties per teamlid</h2>
            <div className="dashboard-teamleden">
              {TEAMLEDEN.map((naam) => {
                const stats = statsPerTeamlid[naam] ?? { open: 0, due: 0 }
                return (
                  <div className="dashboard-teamlid-kaart" key={naam}>
                    <span className={`avatar-chip ${teamlidKleurKlasse(naam, TEAMLEDEN)}`}>
                      {initialen(naam)}
                    </span>
                    <span className="dashboard-teamlid-naam">{naam}</span>
                    <div className="dashboard-teamlid-tellingen">
                      <Badge variant="open">{stats.open}</Badge>
                      {stats.due > 0 && <Badge variant="due">{stats.due} due</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
