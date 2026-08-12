import { useMemo, useState } from 'react'
import { useToast } from '../../components/useToast'
import type { Klant } from '../klanten/types'
import { useKlanten } from '../klanten/useKlanten'
import { useAllePanden } from '../panden/usePanden'
import type { Pand } from '../panden/types'
import { initialen, teamlidKleurKlasse } from '../team/teamlidKleur'
import { TEAMLEDEN, type Teamlid } from '../team/teamleden'
import { ActieRij } from './ActieRij'
import {
  berekenSamenvattingPerTeamlid,
  filterActiesVoorTeamlid,
  groepeerPerKlant,
} from './mijnActiesLogica'
import type { ActieHerkomst } from './types'
import { useAlleActies } from './useAlleActies'

interface Props {
  voorgeselecteerdTeamlid?: Teamlid
  onSelectKlant: (klant: Klant) => void
  onNavigeerNaarBron: (klant: Klant, pand: Pand, herkomst: ActieHerkomst) => void
}

export function MijnActiesPage({
  voorgeselecteerdTeamlid,
  onSelectKlant,
  onNavigeerNaarBron,
}: Props) {
  const { acties, loading } = useAlleActies()
  const { klanten } = useKlanten()
  const { panden } = useAllePanden()
  const toon = useToast()
  const [gekozenTeamlid, setGekozenTeamlid] = useState<Teamlid | null>(
    voorgeselecteerdTeamlid ?? null,
  )

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

  function vindKlant(klantId: string): Klant | undefined {
    return klanten.find((k) => k.id === klantId)
  }

  function klantNaam(klantId: string): string {
    return vindKlant(klantId)?.naam ?? klantId
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
                    <button
                      type="button"
                      className="mijn-acties-klantgroep-titel"
                      onClick={() => {
                        const klant = vindKlant(klantId)
                        if (klant) onSelectKlant(klant)
                      }}
                    >
                      {klantNaam(klantId)} →
                    </button>
                    <table className="actielijst">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Invoerdatum</th>
                          <th>Onderwerp</th>
                          <th>Bedrijf</th>
                          <th>Vestiging</th>
                          <th>Actiepunt</th>
                          <th>Verantw.</th>
                          <th>Doorlooptijd</th>
                          <th>Due</th>
                          <th>Status</th>
                          <th>Opmerking</th>
                          <th>Uitstellen</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {klantActies.map((actie) => (
                          <ActieRij
                            key={actie.id}
                            actie={actie}
                            klantNaam={klantNaam(klantId)}
                            panden={panden}
                            onNavigeerNaarBron={(pand, herkomst) => {
                              const klant = vindKlant(klantId)
                              if (klant) onNavigeerNaarBron(klant, pand, herkomst)
                            }}
                            onUitgesteld={(label) => toon(`Uitgesteld met ${label}`)}
                          />
                        ))}
                      </tbody>
                    </table>
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
