import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Klant } from './types'

const COLLECTION = 'klanten'

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

  async function addKlant(naam: string) {
    if (!naam.trim()) return
    await addDoc(collection(db, COLLECTION), {
      naam: naam.trim(),
      aangemaaktOp: Date.now(),
    })
  }

  return { klanten, loading, addKlant }
}
