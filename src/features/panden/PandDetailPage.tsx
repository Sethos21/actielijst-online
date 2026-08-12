import { useState } from 'react'
import { DocumentenTab } from '../documenten/DocumentenTab'
import { MjopTab } from '../mjop/MjopTab'
import { OnderhoudTab } from '../onderhoud/OnderhoudTab'
import { useOnderhoud } from '../onderhoud/useOnderhoud'
import { PandOverzichtTab } from './PandOverzichtTab'
import type { Pand } from './types'
import { updatePand } from './usePanden'

type Tab = 'overzicht' | 'documenten' | 'onderhoud' | 'mjop'

interface Props {
  pand: Pand
  klantNaam: string
  onTerug: () => void
  initieelTab?: Tab
  onNavigeerNaarActie: (actieId: string) => void
}

export function PandDetailPage({
  pand,
  klantNaam,
  onTerug,
  initieelTab = 'overzicht',
  onNavigeerNaarActie,
}: Props) {
  const [tab, setTab] = useState<Tab>(initieelTab)
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
        <PandOverzichtTab pand={pand} onOpgeslagen={(patch) => updatePand(pand.id, patch)} />
      )}
      {tab === 'documenten' && (
        <DocumentenTab
          pandId={pand.id}
          klantId={pand.klantId}
          pandNaam={pand.naam}
          onNavigeerNaarActie={onNavigeerNaarActie}
        />
      )}
      {tab === 'onderhoud' && (
        <OnderhoudTab
          pandId={pand.id}
          klantId={pand.klantId}
          pandNaam={pand.naam}
          onNavigeerNaarActie={onNavigeerNaarActie}
        />
      )}
      {tab === 'mjop' && (
        <MjopTab
          pandId={pand.id}
          klantId={pand.klantId}
          pandNaam={pand.naam}
          onNavigeerNaarActie={onNavigeerNaarActie}
        />
      )}
    </div>
  )
}
