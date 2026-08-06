import { useState, type FormEvent } from 'react'
import { usePanden } from './usePanden'
import type { Pand } from './types'

interface Props {
  klantId: string
  klantNaam: string
  onSluiten: () => void
  onSelectPand: (pand: Pand) => void
}

/** Uitschuifpaneel vanaf rechts, zelfde interactiepatroon als VersieBeheerPaneel — eigen
 * (navy-header) opmaak conform de goedgekeurde mockup, los van de bestaande .paneel-classes
 * zodat Versiebeheer niet meeverandert. */
export function PandenPaneel({ klantId, klantNaam, onSluiten, onSelectPand }: Props) {
  const { panden, loading, addPand } = usePanden(klantId)
  const [nieuwPand, setNieuwPand] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addPand(nieuwPand)
    setNieuwPand('')
  }

  return (
    <div className="panden-overlay" onClick={onSluiten}>
      <div
        className="panden-paneel"
        role="dialog"
        aria-label="Panden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panden-paneel-header">
          <div className="panden-paneel-titel">Panden — {klantNaam}</div>
          <button
            type="button"
            className="panden-paneel-close"
            onClick={onSluiten}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="panden-paneel-body">
          {loading ? (
            <p>Panden laden...</p>
          ) : panden.length === 0 ? (
            <p>Nog geen panden. Voeg er hieronder eentje toe.</p>
          ) : (
            panden.map((pand) => (
              <button
                type="button"
                key={pand.id}
                className="pand-item"
                onClick={() => onSelectPand(pand)}
              >
                <span className="pand-icoon">🏠</span>
                <span className="pand-naam">{pand.naam}</span>
                <span className="pand-pijl">→</span>
              </button>
            ))
          )}
        </div>

        <div className="panden-paneel-footer">
          <form onSubmit={handleSubmit} className="nieuw-pand-form">
            <input
              className="nieuw-pand-input"
              aria-label="Naam nieuw pand"
              value={nieuwPand}
              onChange={(e) => setNieuwPand(e.target.value)}
              placeholder="Naam nieuw pand..."
            />
            <button type="submit" className="nieuw-pand-btn">
              + Toevoegen
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
