import { useState, type FormEvent } from 'react'
import { bouwActieVanuitBron } from '../acties/bouwActieVanuitBron'
import { useActies } from '../acties/useActies'
import { vraagArchiveerGegevens } from '../archief/archiveerPrompt'
import { TEAMLEDEN } from '../team/teamleden'
import { MjopStandaardlijstBeheer } from './MjopStandaardlijstBeheer'
import { berekenMjopSamenvatting, groepeerPerJaar } from './mjopLogica'
import type { MjopCategorie, MjopPost, MjopStatus } from './types'
import { MJOP_CATEGORIE_LABELS } from './useMjopStandaardlijst'
import { useMjop } from './useMjop'

interface Props {
  pandId: string
  klantId: string
  pandNaam: string
  onNavigeerNaarActie: (actieId: string) => void
}

function formatBedrag(bedrag: number): string {
  return `€ ${bedrag.toLocaleString('nl-NL')}`
}

export function MjopTab({ pandId, klantId, pandNaam, onNavigeerNaarActie }: Props) {
  const { posten, loading, foutmelding, addPost, updatePost, archiveer } = useMjop(pandId)
  const { addActie } = useActies(klantId)
  const [formulierOpen, setFormulierOpen] = useState(false)
  const [beherenOpen, setBeherenOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const huidigJaar = new Date().getFullYear()
  const [jaar, setJaar] = useState(String(huidigJaar))
  const [geschatBedrag, setGeschatBedrag] = useState('')
  const [categorie, setCategorie] = useState<MjopCategorie>('onderhoud')
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
      categorie,
      jaar: gekozenJaar,
      geschatBedrag: parseInt(geschatBedrag, 10) || 0,
      status: gekozenJaar === huidigJaar ? 'dit-jaar' : 'gepland',
      toegevoegdDoor,
      aangemaaktOp: Date.now(),
    })
    setNaam('')
    setJaar(String(huidigJaar))
    setGeschatBedrag('')
    setCategorie('onderhoud')
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
        <div className="toolbar-acties">
          <button type="button" onClick={() => setBeherenOpen(true)}>
            ⚙ Beheren
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setFormulierOpen((open) => !open)}
          >
            + Post toevoegen
          </button>
        </div>
      </div>

      {beherenOpen && (
        <MjopStandaardlijstBeheer
          pandId={pandId}
          klantId={klantId}
          onSluiten={() => setBeherenOpen(false)}
        />
      )}

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
            Categorie
            <select
              aria-label="Categorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as MjopCategorie)}
            >
              {Object.entries(MJOP_CATEGORIE_LABELS).map(([waarde, label]) => (
                <option key={waarde} value={waarde}>
                  {label}
                </option>
              ))}
            </select>
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

      {foutmelding ? (
        <p className="foutmelding">{foutmelding}</p>
      ) : loading ? (
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
                  onClick={async () => {
                    const id = await addActie(
                      bouwActieVanuitBron({
                        type: 'mjop',
                        bronId: post.id,
                        label: post.naam,
                        klantId,
                        pandId,
                        pandNaam,
                      }),
                    )
                    onNavigeerNaarActie(id)
                  }}
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
