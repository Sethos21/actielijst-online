import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Mutatie } from './types'

const COLLECTION = 'mutaties'

export function useMutaties() {
  const [mutaties, setMutaties] = useState<Mutatie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        setMutaties(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Mutatie),
        )
        setLoading(false)
      },
      // Zonder dit blijft de pagina oneindig "laden" tonen bij een fout
      // (bijv. rules die nog niet zijn gedeployed op een PR-preview).
      () => setLoading(false),
    )
    return unsubscribe
  }, [])

  async function addMutatie(nieuw: Omit<Mutatie, 'id'>) {
    await addDoc(collection(db, COLLECTION), nieuw)
  }

  async function updateMutatie(mutatieId: string, patch: Partial<Mutatie>) {
    await updateDoc(doc(db, COLLECTION, mutatieId), patch)
  }

  async function deleteMutatie(mutatieId: string) {
    await deleteDoc(doc(db, COLLECTION, mutatieId))
  }

  return { mutaties, loading, addMutatie, updateMutatie, deleteMutatie }
}
