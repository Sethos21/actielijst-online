import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Pand } from './types'

const COLLECTION = 'panden'

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

  return { panden, loading, addPand }
}
