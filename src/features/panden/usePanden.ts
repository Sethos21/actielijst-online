import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Pand } from './types'

const COLLECTION = 'panden'

export async function updatePand(
  pandId: string,
  patch: Partial<Pick<Pand, 'naam' | 'opmerking'>>,
) {
  await updateDoc(doc(db, COLLECTION, pandId), patch)
}

export async function archiveerPand(pandId: string, gearchiveerdDoor?: string, reden?: string) {
  await updateDoc(doc(db, COLLECTION, pandId), {
    gearchiveerdOp: Date.now(),
    ...(gearchiveerdDoor?.trim() ? { gearchiveerdDoor: gearchiveerdDoor.trim() } : {}),
    ...(reden?.trim() ? { gearchiveerdReden: reden.trim() } : {}),
  })
}

export async function herstelPand(pandId: string) {
  await updateDoc(doc(db, COLLECTION, pandId), {
    gearchiveerdOp: null,
    gearchiveerdDoor: null,
    gearchiveerdReden: null,
  })
}

export async function verwijderPandDefinitief(pandId: string) {
  await deleteDoc(doc(db, COLLECTION, pandId))
}

/** Panden van één specifieke klant — gebruikt op de klant-detailpagina. */
export function usePanden(klantId: string) {
  const [panden, setPanden] = useState<Pand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, COLLECTION),
      where('klantId', '==', klantId),
      orderBy('naam'),
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPanden(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pand))
      setLoading(false)
    })
    return unsubscribe
  }, [klantId])

  async function addPand(naam: string): Promise<string | undefined> {
    if (!naam.trim()) return undefined
    const ref = await addDoc(collection(db, COLLECTION), {
      klantId,
      naam: naam.trim(),
      aangemaaktOp: Date.now(),
    })
    return ref.id
  }

  return {
    panden,
    loading,
    addPand,
    updatePand,
    archiveer: archiveerPand,
    herstel: herstelPand,
    verwijderDefinitief: verwijderPandDefinitief,
  }
}

/** Alle panden over alle klanten heen — gebruikt door het Archief, dat geen
 * klant-context heeft om panden-namen op te zoeken. */
export function useAllePanden() {
  const [panden, setPanden] = useState<Pand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION), (snapshot) => {
      setPanden(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pand))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { panden, loading }
}
