import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { initialen, teamlidKleurKlasse } from '../team/teamlidKleur'
import { TEAMLEDEN, type Teamlid } from '../team/teamleden'
import { useKlanten } from '../klanten/useKlanten'
import { isDue } from './dueDate'
import {
  berekenSamenvattingPerTeamlid,
  filterActiesVoorTeamlid,
  groepeerPerKlant,
} from './mijnActiesLogica'
import { useAlleActies } from './useAlleActies'

export function MijnActiesPage() {
  const { acties, loading } = useAlleActies()
  const { klanten } = useKlanten()
  const [gekozenTeamlid, setGekozenTeamlid] = useState<Teamlid | null>(null)

  const samenvatting = useMemo(
    () => berekenSamenvattingPerTeamlid(acties, TEAMLEDEN),
    [acties],
  )

  const actiesVoorTeamlid = useMemo(
    () => (gekozenTeamlid ? filterActiesVoorTeamlid(acties, gekozenTeamlid) : []),
    [acties, gekozenTeamlid],
  )

  const perKlant = useMemo(
    () => groepeerPerKlant(actiesVoorTeamlid),
    [actiesVoorTeamlid],
  )

  function klantNaam(klantId: string): string {
    return klanten.find((k) => k.id === klantId)?.naam ?? klantId
  }

  return (
    <div>
      <h1>Mijn acties</h1>

      {loading ? (
        <p>Acties laden...</p>
      ) : (
        <>
          <p className="mijn-acties-uitleg">
            Selecteer een teamlid om alle openstaande acties te zien over alle klanten heen.
          </p>

          <div className="mijn-acties-teamleden">
            {TEAMLEDEN.map((naam) => {
              const { open, due } = samenvatting[naam] ?? { open: 0, due: 0 }
              return (
                <button
                  key={naam}
                  type="button"
                  className={`mijn-acties-teamlid-knop ${
                    gekozenTeamlid === naam ? 'actief' : ''
                  }`}
                  onClick={() => setGekozenTeamlid(naam)}
                >
                  <span className={`avatar-chip ${teamlidKleurKlasse(naam, TEAMLEDEN)}`}>
                    {initialen(naam)}
                  </span>
                  <span className="mijn-acties-teamlid-naam">{naam}</span>
                  <span className="mijn-acties-teamlid-telling">
                    {open} open{due > 0 ? ` · ${due} due` : ''}
                  </span>
                </button>
              )
            })}
          </div>

          {gekozenTeamlid && (
            <div className="mijn-acties-detail">
              <h2>Acties voor {gekozenTeamlid}</h2>
              {actiesVoorTeamlid.length === 0 ? (
                <p>Geen openstaande acties voor {gekozenTeamlid}.</p>
              ) : (
                perKlant.map(({ klantId, acties: klantActies }) => (
                  <div className="mijn-acties-klantgroep" key={klantId}>
                    <span className="mijn-acties-klantgroep-titel">{klantNaam(klantId)}</span>
                    {klantActies.map((actie) => (
                      <div className="mijn-acties-kaart" key={actie.id}>
                        <span className="mijn-acties-kaart-onderwerp">{actie.onderwerp}</span>
                        <span className="mijn-acties-kaart-actie">{actie.actie}</span>
                        <span className="mijn-acties-kaart-meta">
                          <Badge
                            variant={
                              isDue(actie) ? 'due' : actie.status === 'hold' ? 'hold' : 'open'
                            }
                          >
                            {isDue(actie) ? 'Due' : actie.status === 'hold' ? 'On hold' : 'Open'}
                          </Badge>
                          {actie.vestiging && (
                            <span className="mijn-acties-kaart-vestiging">{actie.vestiging}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
