import { useState, type FormEvent } from 'react'
import { TEAMLEDEN } from '../team/teamleden'
import {
  bepaalOnderhoudStatus,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
} from './dueDate'
import { useOnderhoud } from './useOnderhoud'

interface Props {
  pandId: string
  klantId: string
}

export function OnderhoudTab({ pandId, klantId }: Props) {
  const { onderhoud, loading, addOnderhoud, vinkAf } = useOnderhoud(pandId)
  const [formulierOpen, setFormulierOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [verantw, setVerantw] = useState<string>(TEAMLEDEN[0])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addOnderhoud({ naam, verantw, klantId })
    setNaam('')
    setVerantw(TEAMLEDEN[0])
    setFormulierOpen(false)
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-titel">Onderhoudsitems</div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormulierOpen((open) => !open)}
        >
          + Item toevoegen
        </button>
      </div>

      {formulierOpen && (
        <form onSubmit={handleSubmit} className="onderhoud-nieuw-form">
          <input
            aria-label="Naam onderhoudsitem"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Naam onderhoudsitem..."
          />
          <select
            aria-label="Verantwoordelijke voor onderhoudsitem"
            value={verantw}
            onChange={(e) => setVerantw(e.target.value)}
          >
            {TEAMLEDEN.map((lid) => (
              <option key={lid} value={lid}>
                {lid}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            Toevoegen
          </button>
        </form>
      )}

      {loading ? (
        <p>Onderhoud laden...</p>
      ) : onderhoud.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen onderhoudsitems.</div>
        </div>
      ) : (
        <div className="checklist">
          {onderhoud.map((item) => {
            const status = bepaalOnderhoudStatus(item.volgendeDatum)
            const gedaan = status === 'ok'
            return (
              <div className="check-item" key={item.id}>
                <button
                  type="button"
                  className={gedaan ? 'check-vinkje gedaan' : 'check-vinkje'}
                  onClick={() => vinkAf(item.id)}
                  aria-label={`Afvinken: ${item.naam}`}
                >
                  {gedaan && '✓'}
                </button>
                <div className="check-info">
                  <div className={gedaan ? 'check-naam gedaan' : 'check-naam'}>
                    {item.naam}
                  </div>
                  <div className="check-meta">
                    {item.laatstUitgevoerdOp
                      ? `Laatst uitgevoerd: ${formatKorteDatum(item.laatstUitgevoerdOp)} · `
                      : ''}
                    Verantwoordelijke: {item.verantw}
                  </div>
                </div>
                <span className="check-herhaling">⟳ {item.herhaling}</span>
                <span className={`check-status ${status}`}>
                  {formatOnderhoudStatusLabel(item.volgendeDatum)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
