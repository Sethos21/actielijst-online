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
import type { ActieItem } from './types'

const COLLECTION = 'actielijsten'

export function useActieItems(ownerId: string | undefined) {
  const [items, setItems] = useState<ActieItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ownerId) {
      setItems([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('aangemaakt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActieItem),
      )
      setLoading(false)
    })

    return unsubscribe
  }, [ownerId])

  async function addItem(tekst: string) {
    if (!ownerId || !tekst.trim()) return
    await addDoc(collection(db, COLLECTION), {
      ownerId,
      tekst: tekst.trim(),
      klaar: false,
      aangemaakt: Date.now(),
    })
  }

  async function toggleItem(item: ActieItem) {
    await updateDoc(doc(db, COLLECTION, item.id), { klaar: !item.klaar })
  }

  async function deleteItem(itemId: string) {
    await deleteDoc(doc(db, COLLECTION, itemId))
  }

  return { items, loading, addItem, toggleItem, deleteItem }
}
