import { useState, type FormEvent } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import { formatKorteDatum } from '../onderhoud/dueDate'
import { TEAMLEDEN } from '../team/teamleden'
import type { DocumentTag } from './types'
import { useDocumenten } from './useDocumenten'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
}

const TAG_LABELS: Record<DocumentTag, string> = {
  energielabel: 'Energielabel',
  keuring: 'Keuring',
  contract: 'Contract',
  overig: 'Overig',
}

export function DocumentenTab({ pandId, klantId, pandNaam }: Props) {
  const { documenten, loading, uploadDocument, updateOpmerking } = useDocumenten(pandId)
  const { addActie } = useActies(klantId)
  const [formulierOpen, setFormulierOpen] = useState(false)
  const [bestand, setBestand] = useState<File | null>(null)
  const [tag, setTag] = useState<DocumentTag>('energielabel')
  const [geuploadDoor, setGeuploadDoor] = useState<string>(TEAMLEDEN[0])
  const [opmerking, setOpmerking] = useState('')
  const [bezigMetUploaden, setBezigMetUploaden] = useState(false)
  const [opmerkingBewerken, setOpmerkingBewerken] = useState<string | null>(null)
  const [nieuweOpmerking, setNieuweOpmerking] = useState('')

  async function handleUpload(event: FormEvent) {
    event.preventDefault()
    if (!bestand) return
    setBezigMetUploaden(true)
    try {
      await uploadDocument(klantId, bestand, tag, geuploadDoor, opmerking)
      setBestand(null)
      setTag('energielabel')
      setGeuploadDoor(TEAMLEDEN[0])
      setOpmerking('')
      setFormulierOpen(false)
    } finally {
      setBezigMetUploaden(false)
    }
  }

  async function handleOpmerkingOpslaan(documentId: string) {
    if (nieuweOpmerking.trim()) {
      await updateOpmerking(documentId, nieuweOpmerking.trim())
    }
    setOpmerkingBewerken(null)
    setNieuweOpmerking('')
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-titel">{documenten.length} documenten</div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormulierOpen((open) => !open)}
        >
          + Document uploaden
        </button>
      </div>

      {formulierOpen && (
        <form onSubmit={handleUpload} className="document-upload-form">
          <label>
            Bestand
            <input
              type="file"
              aria-label="Bestand"
              onChange={(e) => setBestand(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Type
            <select
              aria-label="Type document"
              value={tag}
              onChange={(e) => setTag(e.target.value as DocumentTag)}
            >
              <option value="energielabel">Energielabel</option>
              <option value="keuring">Keuring</option>
              <option value="contract">Contract</option>
              <option value="overig">Overig</option>
            </select>
          </label>
          <label>
            Geüpload door
            <select
              aria-label="Geüpload door"
              value={geuploadDoor}
              onChange={(e) => setGeuploadDoor(e.target.value)}
            >
              {TEAMLEDEN.map((lid) => (
                <option key={lid} value={lid}>
                  {lid}
                </option>
              ))}
            </select>
          </label>
          <label>
            Opmerking (optioneel)
            <textarea
              aria-label="Opmerking bij document"
              value={opmerking}
              onChange={(e) => setOpmerking(e.target.value)}
              placeholder="Bijv. geldigheidsdatum, bijzonderheden..."
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={!bestand || bezigMetUploaden}
          >
            {bezigMetUploaden ? 'Bezig met uploaden...' : 'Uploaden'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Documenten laden...</p>
      ) : documenten.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen documenten.</div>
        </div>
      ) : (
        <div className="documenten-lijst">
          {documenten.map((document) => (
            <div className="document-item" key={document.id}>
              <div className="document-rij">
                <span className="document-icoon">📄</span>
                <div className="document-info">
                  <div className="document-naam">{document.naam}</div>
                  <div className="document-meta">
                    Geüpload {formatKorteDatum(document.geuploadOp)} · {document.geuploadDoor}
                  </div>
                </div>
                <span className={`doc-tag doc-tag-${document.tag}`}>
                  {TAG_LABELS[document.tag]}
                </span>
                <a
                  className="document-download"
                  href={document.storageUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Downloaden: ${document.naam}`}
                >
                  ⬇
                </a>
                <button
                  type="button"
                  className="check-actie-btn"
                  onClick={() =>
                    addActie(
                      bouwActieVanuitBron({
                        type: 'document',
                        bronId: document.id,
                        label: document.naam,
                        klantId,
                        pandId,
                        pandNaam,
                      }),
                    )
                  }
                >
                  + Actie aanmaken
                </button>
              </div>
              {document.opmerking ? (
                <div className="document-opmerking">{document.opmerking}</div>
              ) : opmerkingBewerken === document.id ? (
                <div className="document-opmerking-form">
                  <input
                    aria-label={`Opmerking voor ${document.naam}`}
                    value={nieuweOpmerking}
                    onChange={(e) => setNieuweOpmerking(e.target.value)}
                    onBlur={() => handleOpmerkingOpslaan(document.id)}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="document-opmerking-toevoegen"
                  onClick={() => {
                    setOpmerkingBewerken(document.id)
                    setNieuweOpmerking('')
                  }}
                >
                  + opmerking toevoegen
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
