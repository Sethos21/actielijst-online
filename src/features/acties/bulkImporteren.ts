import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { GeimporteerdeActie } from './excelImport'

const COLLECTION = 'acties'

/**
 * Historische imports kennen geen "doorlooptijd" (dat bestaat pas sinds deze
 * app) — de due date komt sowieso uit dueDateOverride als die er is, dus de
 * gekozen standaardwaarde is verder niet van invloed op bestaande acties.
 */
const STANDAARD_DOORLOOPTIJD = '2w'

export async function importeerActies(
  klantId: string,
  acties: GeimporteerdeActie[],
): Promise<number> {
  await Promise.all(
    acties.map((actie) => {
      const data: Record<string, unknown> = {
        ...actie,
        klantId,
        doorlooptijd: STANDAARD_DOORLOOPTIJD,
      }
      // Firestore accepteert geen expliciete `undefined`-waarden.
      if (data.dueDateOverride === undefined) delete data.dueDateOverride
      return addDoc(collection(db, COLLECTION), data)
    }),
  )
  return acties.length
}
