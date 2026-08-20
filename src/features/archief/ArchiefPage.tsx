import { useState } from 'react'
import { WachtwoordBevestigModal } from '../../components/WachtwoordBevestigModal'
import { MAANDNAMEN } from '../huurdersmutaties/types'
import { herstelDocument, verwijderDocumentDefinitief } from '../documenten/useDocumenten'
import { herstelKlant, useKlanten, verwijderKlantDefinitief } from '../klanten/useKlanten'
import { herstelMjopPost, verwijderMjopPostDefinitief } from '../mjop/useMjop'
import { herstelOnderhoud, verwijderOnderhoudDefinitief } from '../onderhoud/useOnderhoud'
import { herstelPand, useAllePanden, verwijderPandDefinitief } from '../panden/usePanden'
import { exporteerArchiefNaarExcel, exporteerArchiefNaarJson } from './archiefExport'
import type { ArchiefItem, ArchiefType } from './types'
import { useArchief } from './useArchief'

const TYPE_ICOON: Record<ArchiefType, string> = {
  pand: '🏠',
  onderhoud: '🔧',
  document: '📄',
  mjop: '📅',
  klant: '👤',
}

const TYPE_LABEL: Record<ArchiefType, string> = {
  pand: 'Pand',
  onderhoud: 'Onderhoud',
  document: 'Document',
  mjop: 'MJOP',
  klant: 'Klant',
}

const FILTER_LABEL: Record<ArchiefType, string> = {
  pand: 'Panden',
  onderhoud: 'Onderhoud',
  document: 'Documenten',
  mjop: 'MJOP',
  klant: 'Klanten',
}

function formatDatumNl(timestamp: number): string {
  const datum = new Date(timestamp)
  return `${datum.getDate()} ${MAANDNAMEN[datum.getMonth()]} ${datum.getFullYear()}`
}

async function herstelItem(item: ArchiefItem) {
  if (item.type === 'pand') return herstelPand(item.id)
  if (item.type === 'onderhoud') return herstelOnderhoud(item.id)
  if (item.type === 'document') return herstelDocument(item.id)
  if (item.type === 'klant') return herstelKlant(item.id)
  return herstelMjopPost(item.id)
}

async function verwijderItemDefinitief(item: ArchiefItem) {
  if (item.type === 'pand') return verwijderPandDefinitief(item.id)
  if (item.type === 'onderhoud') return verwijderOnderhoudDefinitief(item.id)
  if (item.type === 'document') return verwijderDocumentDefinitief(item.id, item.storagePath ?? '')
  if (item.type === 'klant') return verwijderKlantDefinitief(item.id)
  return verwijderMjopPostDefinitief(item.id)
}

export function ArchiefPage() {
  const { items, alleItems, loading: archiefLaden } = useArchief()
  const { klanten, loading: klantenLaden } = useKlanten()
  const { panden, loading: pandenLaden } = useAllePanden()
  const [filter, setFilter] = useState<'alle' | ArchiefType>('alle')
  const [zoekterm, setZoekterm] = useState('')
  const [teVerwijderen, setTeVerwijderen] = useState<ArchiefItem | null>(null)

  const loading = archiefLaden || klantenLaden || pandenLaden

  const metNamen: ArchiefItem[] = alleItems.map((item) => ({
    ...item,
    klantNaam: klanten.find((k) => k.id === item.klantId)?.naam ?? 'Onbekende klant',
    pandNaam: item.pandId
      ? (panden.find((p) => p.id === item.pandId)?.naam ?? 'Onbekend pand')
      : undefined,
  }))

  const gefilterd = metNamen.filter((item) => {
    if (filter !== 'alle' && item.type !== filter) return false
    if (zoekterm.trim() && !item.naam.toLowerCase().includes(zoekterm.trim().toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-titel">📦 Archief</div>
      </div>

      <div className="archief-info-box">
        <b>Eén centraal scherm</b> voor alles wat gearchiveerd is — panden, onderhoudsitems,
        documenten, MJOP-posten, klanten — over alle klanten heen. Filterbaar per type. Elk
        item kan worden <b>hersteld</b> (terug naar actief) of <b>definitief verwijderd</b>{' '}
        (geen terugweg, met bevestiging — een klant met nog gekoppelde acties of panden kan
        pas definitief verwijderd worden nadat die eerst apart zijn opgeruimd). De export-knop
        exporteert de huidige (gefilterde) lijst als Excel of JSON, handig voordat je
        definitief opruimt.
      </div>

      <div className="archief-filter-tabs">
        <button
          type="button"
          className={`archief-filter-tab ${filter === 'alle' ? 'actief' : ''}`}
          onClick={() => setFilter('alle')}
        >
          Alle <span className="archief-filter-count">{alleItems.length}</span>
        </button>
        {(['pand', 'onderhoud', 'document', 'mjop', 'klant'] as ArchiefType[]).map((type) => (
          <button
            type="button"
            key={type}
            className={`archief-filter-tab ${filter === type ? 'actief' : ''}`}
            onClick={() => setFilter(type)}
          >
            {TYPE_ICOON[type]} {FILTER_LABEL[type]}{' '}
            <span className="archief-filter-count">{items[type].length}</span>
          </button>
        ))}
      </div>

      <div className="archief-zoek-export-rij">
        <input
          className="archief-zoek-input"
          aria-label="Zoek in archief"
          placeholder="Zoek in archief..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
        />
        <div className="archief-export-groep">
          <button
            type="button"
            className="btn-secundair-klein"
            onClick={() => exporteerArchiefNaarExcel(gefilterd)}
          >
            ⬇ Excel
          </button>
          <button
            type="button"
            className="btn-secundair-klein"
            onClick={() => exporteerArchiefNaarJson(gefilterd)}
          >
            ⬇ JSON
          </button>
        </div>
      </div>

      {loading ? (
        <p>Archief laden...</p>
      ) : gefilterd.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Niets gearchiveerd.</div>
        </div>
      ) : (
        <div className="archief-lijst">
          {gefilterd.map((item) => (
            <div className="archief-item" key={`${item.type}-${item.id}`}>
              <span className="archief-type-icoon">{TYPE_ICOON[item.type]}</span>
              <div className="archief-info">
                <div className="archief-naam">{item.naam}</div>
                <div className="archief-meta">
                  {item.type === 'pand' && `${item.klantNaam} · `}
                  {item.type !== 'pand' && item.type !== 'klant' && `${item.pandNaam} · `}
                  Gearchiveerd {formatDatumNl(item.gearchiveerdOp)}
                  {item.gearchiveerdDoor ? ` door ${item.gearchiveerdDoor}` : ''}
                  {item.gearchiveerdReden ? ` · ${item.gearchiveerdReden}` : ''}
                </div>
              </div>
              <span className="archief-type-label">{TYPE_LABEL[item.type]}</span>
              <div className="archief-knoppen">
                <button type="button" className="btn-herstel" onClick={() => herstelItem(item)}>
                  ↺ Herstellen
                </button>
                <button
                  type="button"
                  className="btn-verwijder-definitief"
                  onClick={() => setTeVerwijderen(item)}
                >
                  🗑 Definitief
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {teVerwijderen && (
        <WachtwoordBevestigModal
          itemNaam={teVerwijderen.naam}
          onAnnuleren={() => setTeVerwijderen(null)}
          onBevestigd={async () => {
            await verwijderItemDefinitief(teVerwijderen)
            setTeVerwijderen(null)
          }}
        />
      )}
    </div>
  )
}
