import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { GeimporteerdeActie } from './excelImport'

const COLLECTION = 'acties'
const MAX_PER_BATCH = 500

/**
 * Historische imports kennen geen "doorlooptijd" (dat bestaat pas sinds deze
 * app) — de due date komt sowieso uit dueDateOverride als die er is, dus de
 * gekozen standaardwaarde is verder niet van invloed op bestaande acties.
 */
const STANDAARD_DOORLOOPTIJD = '2w'

function chunk<T>(items: T[], grootte: number): T[][] {
  const resultaat: T[][] = []
  for (let i = 0; i < items.length; i += grootte) {
    resultaat.push(items.slice(i, i + grootte))
  }
  return resultaat
}

/**
 * Schrijft alle acties in batches (max. 500 writes per Firestore-batch) i.p.v.
 * losse addDoc-calls per actie. Voordeel t.o.v. losse writes: elke batch is
 * atomair (alles of niets, geen stille deelmislukkingen die als een hang
 * aanvoelen) en een mislukking geeft één duidelijke fout in plaats van een
 * Promise.all die op de eerste afwijzing stopt terwijl andere writes nog
 * onderweg zijn.
 */
export async function importeerActies(
  klantId: string,
  acties: GeimporteerdeActie[],
): Promise<number> {
  const batches = chunk(acties, MAX_PER_BATCH)

  for (const groep of batches) {
    const batch = writeBatch(db)
    for (const actie of groep) {
      const data: Record<string, unknown> = {
        ...actie,
        klantId,
        doorlooptijd: STANDAARD_DOORLOOPTIJD,
      }
      // Firestore accepteert geen expliciete `undefined`-waarden.
      if (data.dueDateOverride === undefined) delete data.dueDateOverride
      batch.set(doc(collection(db, COLLECTION)), data)
    }
    await batch.commit()
  }

  return acties.length
}
