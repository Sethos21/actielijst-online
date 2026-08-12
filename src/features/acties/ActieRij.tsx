import { deleteField, type UpdateData } from 'firebase/firestore'
import { InvoerdatumVeld } from '../../components/InvoerdatumVeld'
import { UitstelKnop, type UitstelOptie } from '../../components/UitstelKnop'
import { VerantwoordelijkeSelect } from '../../components/VerantwoordelijkeSelect'
import type { Pand } from '../panden/types'
import { TEAMLEDEN } from '../team/teamleden'
import { berekenDueDate, isDue } from './dueDate'
import { deleteActie, uitstellen, updateActie } from './useActies'
import { VestigingCel } from './VestigingCel'
import {
  DOORLOOPTIJD_OPTIES,
  type ActieHerkomst,
  type ActieItem,
  type ActieStatus,
  type Doorlooptijd,
} from './types'

const UITSTEL_OPTIES: UitstelOptie[] = [
  { label: '1 week', eenheid: 'w', aantal: 1 },
  { label: '2 weken', eenheid: 'w', aantal: 2 },
  { label: '3 weken', eenheid: 'w', aantal: 3 },
  { label: '4 weken', eenheid: 'w', aantal: 4 },
  { label: '1 maand', eenheid: 'm', aantal: 1 },
  { label: '2 maanden', eenheid: 'm', aantal: 2 },
  { label: '3 maanden', eenheid: 'm', aantal: 3 },
  { label: '4 maanden', eenheid: 'm', aantal: 4 },
  { label: '5 maanden', eenheid: 'm', aantal: 5 },
  { label: '6 maanden', eenheid: 'm', aantal: 6 },
]

interface Props {
  actie: ActieItem
  klantNaam: string
  panden: Pand[]
  onNavigeerNaarBron: (pand: Pand, herkomst: ActieHerkomst) => void
  onUitgesteld: (label: string) => void
}

/** Eén rij van de actielijst-tabel — gedeeld tussen ActielijstPage (per klant)
 * en MijnActiesPage (over alle klanten heen), zodat beide weergaven altijd
 * exact hetzelfde gedrag en dezelfde kolommen hebben. */
export function ActieRij({ actie, klantNaam, panden, onNavigeerNaarBron, onUitgesteld }: Props) {
  const due = berekenDueDate(actie)
  const due_ = isDue(actie)

  function toggleVerantw(naam: string) {
    const nieuweVerantw = actie.verantw.includes(naam)
      ? actie.verantw.filter((v) => v !== naam)
      : [...actie.verantw, naam]
    updateActie(actie.id, { verantw: nieuweVerantw })
  }

  function handleVerwijderen() {
    const omschrijving = actie.actie.trim() || actie.onderwerp.trim() || 'deze actie'
    if (!window.confirm(`"${omschrijving}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return
    }
    deleteActie(actie.id)
  }

  async function handleUitstellen(eenheid: 'w' | 'm', aantal: number, label: string) {
    await uitstellen(actie.id, eenheid, aantal)
    onUitgesteld(label)
  }

  return (
    <tr
      data-actie-id={actie.id}
      className={actie.status === 'done' ? 'actielijst-rij-afgerond' : undefined}
    >
      <td>{actie.ref}</td>
      <td>
        <span className="cel-scroll">
          <InvoerdatumVeld
            actieOmschrijving={actie.actie}
            waarde={actie.aangemaaktOp}
            onWijzig={(iso) => updateActie(actie.id, { aangemaaktOp: iso })}
          />
        </span>
      </td>
      <td>
        <span className="cel-scroll">
          <input
            aria-label={`Onderwerp voor ${actie.actie}`}
            value={actie.onderwerp}
            onChange={(e) => updateActie(actie.id, { onderwerp: e.target.value })}
          />
          {actie.herkomst && (
            <button
              type="button"
              className="actie-herkomst"
              onClick={() => {
                const pand = panden.find((p) => p.id === actie.pandId)
                if (pand) onNavigeerNaarBron(pand, actie.herkomst!)
              }}
            >
              {actie.herkomst.type === 'onderhoud' && '🔧'}
              {actie.herkomst.type === 'mjop' && '📅'}
              {actie.herkomst.type === 'document' && '📄'} vanuit{' '}
              {actie.herkomst.type}: {actie.herkomst.label}
            </button>
          )}
        </span>
      </td>
      <td>
        <span className="cel-scroll">
          <input
            aria-label={`Bedrijf voor ${actie.actie}`}
            value={actie.bedrijf}
            onChange={(e) => updateActie(actie.id, { bedrijf: e.target.value })}
          />
        </span>
      </td>
      <td>
        <span className="cel-scroll">
          <VestigingCel
            klantId={actie.klantId}
            klantNaam={klantNaam}
            actieOmschrijving={actie.actie}
            pandId={actie.pandId}
            vestigingTekst={actie.vestiging}
            onKiesPand={(pand) =>
              updateActie(actie.id, {
                pandId: pand.id,
                vestiging: pand.naam,
              })
            }
            onVrijeTekst={(tekst) =>
              updateActie(actie.id, {
                pandId: deleteField(),
                vestiging: tekst,
              })
            }
          />
        </span>
      </td>
      <td>
        <span className="cel-scroll cel-scroll-tekst">
          <textarea
            aria-label="Actiepunt"
            value={actie.actie}
            onChange={(e) => updateActie(actie.id, { actie: e.target.value })}
          />
        </span>
      </td>
      <td>
        <span className="cel-scroll">
          <VerantwoordelijkeSelect
            actieOmschrijving={actie.actie}
            geselecteerd={actie.verantw}
            alleNamen={TEAMLEDEN}
            onToggle={toggleVerantw}
          />
        </span>
      </td>
      <td>
        <span className="cel-scroll">
          <select
            aria-label={`Doorlooptijd voor ${actie.actie}`}
            className="doorlooptijd-select"
            value={actie.doorlooptijd}
            onChange={(e) =>
              updateActie(actie.id, {
                doorlooptijd: e.target.value as Doorlooptijd,
              })
            }
          >
            {DOORLOOPTIJD_OPTIES.map((optie) => (
              <option key={optie} value={optie}>
                {optie}
              </option>
            ))}
          </select>
        </span>
      </td>
      <td>
        <span className="cel-scroll">{due}</span>
      </td>
      <td>
        <span className="cel-scroll">
          <select
            aria-label={`Status voor ${actie.actie}`}
            className={`status-select status-select-${due_ ? 'due' : actie.status}`}
            value={actie.status}
            onChange={(e) => {
              const nieuweStatus = e.target.value as ActieStatus
              const patch: UpdateData<ActieItem> = { status: nieuweStatus }
              if (nieuweStatus === 'done' && actie.status !== 'done') {
                patch.afgerondOp = new Date().toISOString().slice(0, 10)
              }
              if (nieuweStatus !== 'done' && actie.status === 'done') {
                // heropend — telt niet meer mee als "afgerond in periode X"
                patch.afgerondOp = deleteField()
              }
              updateActie(actie.id, patch)
            }}
          >
            <option value="open">{due_ ? 'Due' : 'Open'}</option>
            <option value="done">Gereed</option>
            <option value="hold">On hold</option>
          </select>
        </span>
      </td>
      <td>
        <span className="cel-scroll cel-scroll-tekst">
          <textarea
            aria-label={`Opmerking voor ${actie.actie}`}
            value={actie.opmerking}
            onChange={(e) => updateActie(actie.id, { opmerking: e.target.value })}
          />
        </span>
      </td>
      <td className="no-print">
        <UitstelKnop
          actieOmschrijving={actie.actie}
          opties={UITSTEL_OPTIES}
          onKies={(keuze) => handleUitstellen(keuze.eenheid, keuze.aantal, keuze.label)}
        />
      </td>
      <td className="no-print">
        <button
          type="button"
          className="icoon-knop"
          aria-label={`Verwijderen: ${actie.actie}`}
          onClick={handleVerwijderen}
        >
          🗑️
        </button>
      </td>
    </tr>
  )
}
