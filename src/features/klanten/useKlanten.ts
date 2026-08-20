import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Klant } from './types'

const COLLECTION = 'klanten'

/** Klanten die niet gearchiveerd zijn — de standaard weergave overal behalve
 * in het archiefscherm zelf. */
export function actieveKlanten(klanten: Klant[]): Klant[] {
  return klanten.filter((klant) => !klant.gearchiveerdOp)
}

export async function archiveerKlant(
  klantId: string,
  gearchiveerdDoor?: string,
  reden?: string,
) {
  await updateDoc(doc(db, COLLECTION, klantId), {
    gearchiveerdOp: Date.now(),
    ...(gearchiveerdDoor?.trim() ? { gearchiveerdDoor: gearchiveerdDoor.trim() } : {}),
    ...(reden?.trim() ? { gearchiveerdReden: reden.trim() } : {}),
  })
}

export async function herstelKlant(klantId: string) {
  await updateDoc(doc(db, COLLECTION, klantId), {
    gearchiveerdOp: null,
    gearchiveerdDoor: null,
    gearchiveerdReden: null,
  })
}

/** Definitief verwijderen mag alleen als er geen acties/panden meer aan deze
 * klant gekoppeld zijn — dat voorkomt weeslozen data (acties/panden met een
 * klantId die nergens meer naar verwijst). Eerst die apart opruimen. */
export async function verwijderKlantDefinitief(klantId: string) {
  const [actiesSnapshot, pandenSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'acties'), where('klantId', '==', klantId))),
    getDocs(query(collection(db, 'panden'), where('klantId', '==', klantId))),
  ])
  const gekoppeld: string[] = []
  if (!actiesSnapshot.empty) gekoppeld.push(`${actiesSnapshot.size} acties`)
  if (!pandenSnapshot.empty) gekoppeld.push(`${pandenSnapshot.size} panden`)
  if (gekoppeld.length > 0) {
    throw new Error(
      `Kan niet verwijderen: er zijn nog ${gekoppeld.join(' en ')} gekoppeld aan deze klant.`,
    )
  }
  await deleteDoc(doc(db, COLLECTION, klantId))
}

export function useKlanten() {
  const [klanten, setKlanten] = useState<Klant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('naam'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKlanten(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Klant))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function addKlant(naam: string): Promise<string | undefined> {
    if (!naam.trim()) return undefined
    const ref = await addDoc(collection(db, COLLECTION), {
      naam: naam.trim(),
      aangemaaktOp: Date.now(),
    })
    return ref.id
  }

  return {
    klanten,
    loading,
    addKlant,
    archiveer: archiveerKlant,
    herstel: herstelKlant,
    verwijderDefinitief: verwijderKlantDefinitief,
  }
}
