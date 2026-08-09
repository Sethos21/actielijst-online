import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type UpdateData,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { voegPeriodeToe } from './dueDate'
import type { ActieItem } from './types'

const COLLECTION = 'acties'

export function useActies(klantId: string) {
  const [acties, setActies] = useState<ActieItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('klantId', '==', klantId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActies(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActieItem),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [klantId])

  async function addActie(nieuw: Omit<ActieItem, 'id' | 'klantId'>) {
    const ref = await addDoc(collection(db, COLLECTION), { ...nieuw, klantId })
    return ref.id
  }

  async function updateActie(actieId: string, patch: UpdateData<ActieItem>) {
    await updateDoc(doc(db, COLLECTION, actieId), patch)
  }

  async function deleteActie(actieId: string) {
    await deleteDoc(doc(db, COLLECTION, actieId))
  }

  /** Uitstellen telt vanaf vandaag, niet vanaf de (mogelijk al verlopen) due date. */
  async function uitstellen(actieId: string, eenheid: 'w' | 'm', aantal: number) {
    const vandaag = new Date().toISOString().slice(0, 10)
    await updateActie(actieId, {
      postponedTot: voegPeriodeToe(vandaag, eenheid, aantal),
    })
  }

  return { acties, loading, addActie, updateActie, deleteActie, uitstellen }
}
