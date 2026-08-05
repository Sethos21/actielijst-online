import type { ActieItem } from '../acties/types'

/**
 * Firestore accepteert geen `undefined`-velden in geneste objecten (zoals
 * optionele ActieItem-velden binnen de snapshot-array) — het JSON-rondje
 * verwijdert die, net zoals JSON.stringify dat altijd al deed. Dit is ook
 * meteen een echte deep copy: latere wijzigingen aan de live acties raken
 * de snapshot niet, dat is bewust de hele functie van een versie.
 */
export function naarSnapshot(acties: ActieItem[]): ActieItem[] {
  return JSON.parse(JSON.stringify(acties))
}
