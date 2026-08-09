import { TEAMLEDEN } from '../team/teamleden'

/** Lichtgewicht archiveer-bevestiging via window.prompt — consistent met het
 * bestaande window.confirm()-patroon voor niet-triviale acties, geen nieuw
 * modal-component nodig. Geeft null terug als de gebruiker de eerste prompt
 * annuleert (dan wordt er niet gearchiveerd). */
export function vraagArchiveerGegevens(): { door?: string; reden?: string } | null {
  const door = window.prompt(`Wie archiveert dit? (${TEAMLEDEN.join(', ')})`, TEAMLEDEN[0])
  if (door === null) return null
  const reden = window.prompt('Reden voor archiveren? (optioneel, mag leeg)') ?? undefined
  return { door: door || undefined, reden }
}
