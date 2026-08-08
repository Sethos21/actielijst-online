import { useState } from 'react'
import { DocumentenTab } from '../documenten/DocumentenTab'
import { MjopTab } from '../mjop/MjopTab'
import { OnderhoudTab } from '../onderhoud/OnderhoudTab'
import { useOnderhoud } from '../onderhoud/useOnderhoud'
import type { Pand } from './types'

type Tab = 'overzicht' | 'documenten' | 'onderhoud' | 'mjop'

interface Props {
  pand: Pand
  klantNaam: string
  onTerug: () => void
  initieelTab?: Tab
}

export function PandDetailPage({
  pand,
  klantNaam,
  onTerug,
  initieelTab = 'overzicht',
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
        <DocumentenTab pandId={pand.id} klantId={pand.klantId} pandNaam={pand.naam} />
      )}
      {tab === 'onderhoud' && (
        <OnderhoudTab pandId={pand.id} klantId={pand.klantId} pandNaam={pand.naam} />
      )}
      {tab === 'mjop' && (
        <MjopTab pandId={pand.id} klantId={pand.klantId} pandNaam={pand.naam} />
      )}
    </div>
  )
}
