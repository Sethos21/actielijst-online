import { useState } from 'react'
import { OnderhoudTab } from '../onderhoud/OnderhoudTab'
import { useOnderhoud } from '../onderhoud/useOnderhoud'
import type { Pand } from './types'

type Tab = 'overzicht' | 'documenten' | 'onderhoud' | 'mjop'

interface Props {
  pand: Pand
  klantNaam: string
  onTerug: () => void
}

export function PandDetailPage({ pand, klantNaam, onTerug }: Props) {
  const [tab, setTab] = useState<Tab>('overzicht')
  const { onderhoudDueCount } = useOnderhoud(pand.id)

  return (
    <div>
      <button type="button" className="terug" onClick={onTerug}>
        ← Terug naar panden
      </button>
      <p className="kruimel">
        <strong>{klantNaam}</strong> / {pand.naam}
      </p>
      <h1 className="titel">🏠 {pand.naam}</h1>

      <div className="tabs">
        <button
          type="button"
          className={tab === 'overzicht' ? 'tab actief' : 'tab'}
          onClick={() => setTab('overzicht')}
        >
          Overzicht
        </button>
        <button
          type="button"
          className={tab === 'documenten' ? 'tab actief' : 'tab'}
          onClick={() => setTab('documenten')}
        >
          Documenten
        </button>
        <button
          type="button"
          className={tab === 'onderhoud' ? 'tab actief' : 'tab'}
          onClick={() => setTab('onderhoud')}
        >
          Jaarlijks onderhoud
          {onderhoudDueCount > 0 && (
            <span className="badge-klein">{onderhoudDueCount}</span>
          )}
        </button>
        <button
          type="button"
          className={tab === 'mjop' ? 'tab actief' : 'tab'}
          onClick={() => setTab('mjop')}
        >
          MJOP
        </button>
      </div>

      {tab === 'overzicht' && (
        <div className="leeg-state">
          <div className="leeg-icoon">🏠</div>
          <div className="leeg-tekst">Dit is het startpunt van de pand-pagina</div>
          <div className="leeg-sub">
            Documenten, onderhoud en MJOP komen in de volgende stappen — dit tabblad
            "Overzicht" is nu nog leeg/toekomstig
          </div>
        </div>
      )}
      {tab === 'documenten' && (
        <div className="leeg-state">
          <div className="leeg-tekst">Documenten — nog niet gebouwd, volgende stap.</div>
        </div>
      )}
      {tab === 'onderhoud' && (
        <OnderhoudTab pandId={pand.id} klantId={pand.klantId} />
      )}
      {tab === 'mjop' && (
        <div className="leeg-state">
          <div className="leeg-tekst">MJOP — nog niet gebouwd, aparte vervolgstap.</div>
        </div>
      )}
    </div>
  )
}
