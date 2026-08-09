import { useState, type FormEvent } from 'react'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
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
  const { panden, loading, addPand, updatePand, archiveer } = usePanden(klantId)
  const [nieuwPand, setNieuwPand] = useState('')
  const [bewerkPandId, setBewerkPandId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addPand(nieuwPand)
    setNieuwPand('')
  }

  async function handleBewerkOpslaan(event: FormEvent) {
    event.preventDefault()
    if (bewerkPandId && bewerkNaam.trim()) {
      await updatePand(bewerkPandId, { naam: bewerkNaam.trim() })
    }
    setBewerkPandId(null)
  }

  function handleArchiveren(pand: Pand) {
    const gegevens = vraagArchiveerGegevens()
    if (gegevens) archiveer(pand.id, gegevens.door, gegevens.reden)
  }

  const actievePanden = panden.filter((pand) => !pand.gearchiveerdOp)

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
          ) : actievePanden.length === 0 ? (
            <p>Nog geen panden. Voeg er hieronder eentje toe.</p>
          ) : (
            actievePanden.map((pand) =>
              bewerkPandId === pand.id ? (
                <form
                  key={pand.id}
                  onSubmit={handleBewerkOpslaan}
                  className="pand-bewerk-form"
                >
                  <input
                    aria-label={`Naam bewerken voor ${pand.naam}`}
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary">
                    Opslaan
                  </button>
                  <button type="button" onClick={() => setBewerkPandId(null)}>
                    Annuleren
                  </button>
                </form>
              ) : (
                <div className="pand-item-rij" key={pand.id}>
                  <button
                    type="button"
                    className="pand-item"
                    onClick={() => onSelectPand(pand)}
                  >
                    <span className="pand-icoon">🏠</span>
                    <span className="pand-naam">{pand.naam}</span>
                    <span className="pand-pijl">→</span>
                  </button>
                  <button
                    type="button"
                    className="icoon-knop"
                    aria-label={`Bewerken: ${pand.naam}`}
                    onClick={() => {
                      setBewerkPandId(pand.id)
                      setBewerkNaam(pand.naam)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icoon-knop"
                    aria-label={`Archiveren: ${pand.naam}`}
                    onClick={() => handleArchiveren(pand)}
                  >
                    📦
                  </button>
                </div>
              ),
            )
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
