import { useState, type FormEvent } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
import { TEAMLEDEN } from '../team/teamleden'
import { berekenMjopSamenvatting, groepeerPerJaar } from './mjopLogica'
import type { MjopPost, MjopStatus } from './types'
import { useMjop } from './useMjop'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
}

function formatBedrag(bedrag: number): string {
  return `€ ${bedrag.toLocaleString('nl-NL')}`
}

export function MjopTab({ pandId, klantId, pandNaam }: Props) {
  const { posten, loading, addPost, updatePost, archiveer } = useMjop(pandId)
  const { addActie } = useActies(klantId)
  const [formulierOpen, setFormulierOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const huidigJaar = new Date().getFullYear()
  const [jaar, setJaar] = useState(String(huidigJaar))
  const [geschatBedrag, setGeschatBedrag] = useState('')
  const [toegevoegdDoor, setToegevoegdDoor] = useState<string>(TEAMLEDEN[0])

  const actievePosten = posten.filter((post) => !post.gearchiveerdOp)
  const samenvatting = berekenMjopSamenvatting(actievePosten, huidigJaar)
  const groepen = groepeerPerJaar(actievePosten)

  function handleArchiveren(post: MjopPost) {
    const gegevens = vraagArchiveerGegevens()
    if (gegevens) archiveer(post.id, gegevens.door, gegevens.reden)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!naam.trim()) return
    const gekozenJaar = parseInt(jaar, 10)
    await addPost({
      klantId,
      naam: naam.trim(),
      jaar: gekozenJaar,
      geschatBedrag: parseInt(geschatBedrag, 10) || 0,
      status: gekozenJaar === huidigJaar ? 'dit-jaar' : 'gepland',
      toegevoegdDoor,
      aangemaaktOp: Date.now(),
    })
    setNaam('')
    setJaar(String(huidigJaar))
    setGeschatBedrag('')
    setToegevoegdDoor(TEAMLEDEN[0])
    setFormulierOpen(false)
  }

  return (
    <div>
      <div className="stat-cards stat-cards-3">
        <div className="stat-card">
          <div className="stat-label">Totaal gepland (5 jaar)</div>
          <div className="stat-waarde">{formatBedrag(samenvatting.totaalGepland)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dit jaar ({huidigJaar})</div>
          <div className="stat-waarde">{formatBedrag(samenvatting.ditJaarBedrag)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aantal posten</div>
          <div className="stat-waarde">{samenvatting.aantalPosten}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-titel">Geplande posten</div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormulierOpen((open) => !open)}
        >
          + Post toevoegen
        </button>
      </div>

      {formulierOpen && (
        <form onSubmit={handleSubmit} className="mjop-nieuw-form">
          <label>
            Omschrijving
            <input
              aria-label="Omschrijving"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Bijv. Kozijnen vervangen"
            />
          </label>
          <label>
            Jaar
            <input
              type="number"
              aria-label="Jaar"
              value={jaar}
              onChange={(e) => setJaar(e.target.value)}
            />
          </label>
          <label>
            Geschat bedrag
            <input
              type="number"
              aria-label="Geschat bedrag"
              value={geschatBedrag}
              onChange={(e) => setGeschatBedrag(e.target.value)}
            />
          </label>
          <label>
            Toegevoegd door
            <select
              aria-label="Toegevoegd door"
              value={toegevoegdDoor}
              onChange={(e) => setToegevoegdDoor(e.target.value)}
            >
              {TEAMLEDEN.map((lid) => (
                <option key={lid} value={lid}>
                  {lid}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Toevoegen
          </button>
        </form>
      )}

      {loading ? (
        <p>MJOP laden...</p>
      ) : actievePosten.length === 0 ? (
        <div className="leeg-state">
          <div className="leeg-tekst">Nog geen MJOP-posten.</div>
        </div>
      ) : (
        groepen.map(([jaarGroep, postenInJaar]) => (
          <div key={jaarGroep} className="mjop-jaargroep">
            <div className="mjop-jaar-header">
              <span>{jaarGroep}</span>
              <span>
                {formatBedrag(
                  postenInJaar.reduce((som, post) => som + post.geschatBedrag, 0),
                )}
              </span>
            </div>
            {postenInJaar.map((post) => (
              <div className="mjop-post" key={post.id}>
                <div className="mjop-post-info">
                  <div className="mjop-post-naam">{post.naam}</div>
                  <div className="mjop-post-meta">
                    Toegevoegd door {post.toegevoegdDoor}
                  </div>
                </div>
                <span className="mjop-post-bedrag">
                  {formatBedrag(post.geschatBedrag)}
                </span>
                <select
                  aria-label={`Status voor ${post.naam}`}
                  className={`mjop-status mjop-status-${post.status}`}
                  value={post.status}
                  onChange={(e) =>
                    updatePost(post.id, { status: e.target.value as MjopStatus })
                  }
                >
                  <option value="gepland">Gepland</option>
                  <option value="dit-jaar">Dit jaar</option>
                  <option value="afgerond">Afgerond</option>
                </select>
                <button
                  type="button"
                  className="icoon-knop"
                  aria-label={`Archiveren: ${post.naam}`}
                  onClick={() => handleArchiveren(post)}
                >
                  📦
                </button>
                <button
                  type="button"
                  className="check-actie-btn"
                  onClick={() =>
                    addActie(
                      bouwActieVanuitBron({
                        type: 'mjop',
                        bronId: post.id,
                        label: post.naam,
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
            ))}
          </div>
        ))
      )}
    </div>
  )
}
