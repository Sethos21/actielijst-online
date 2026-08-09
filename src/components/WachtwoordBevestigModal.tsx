import { useState, type FormEvent } from 'react'
import { bevestigMetWachtwoord } from '../features/auth/useReauthenticatie'
import { Modal } from './Modal'

interface Props {
  itemNaam: string
  onBevestigd: () => void
  onAnnuleren: () => void
}

export function WachtwoordBevestigModal({ itemNaam, onBevestigd, onAnnuleren }: Props) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      await bevestigMetWachtwoord(wachtwoord)
      onBevestigd()
    } catch {
      setFout('Wachtwoord onjuist.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <Modal titel="Definitief verwijderen?" onSluiten={onAnnuleren}>
      <form onSubmit={handleSubmit} className="wachtwoord-bevestig-form">
        <p>&quot;{itemNaam}&quot; wordt permanent verwijderd. Dit kan niet ongedaan worden gemaakt.</p>
        <label>
          Bevestig met je inlogwachtwoord
          <input
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            required
            autoFocus
          />
        </label>
        {fout && <p role="alert">{fout}</p>}
        <div className="modal-footer">
          <button type="button" onClick={onAnnuleren}>
            Annuleren
          </button>
          <button type="submit" className="btn-danger" disabled={bezig}>
            {bezig ? 'Bezig...' : 'Definitief verwijderen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
