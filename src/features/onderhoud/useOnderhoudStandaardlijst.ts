import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

const COLLECTION = 'onderhoudStandaardlijst'

export interface StandaardType {
  id: string
  naam: string
  icoon: string
  herhaling: 'jaarlijks'
  aangemaaktOp: number
}

/** Systeembrede, door het hele team beheerbare lijst van onderhoudstypen —
 * los van een specifiek pand (zie VOORSTEL rapportage/onderhoud/mjop §3). */
export function useOnderhoudStandaardlijst() {
  const [types, setTypes] = useState<StandaardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('naam'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTypes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as StandaardType))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function voegTypeToe(naam: string, icoon: string) {
    if (!naam.trim()) return
    await addDoc(collection(db, COLLECTION), {
      naam: naam.trim(),
      icoon: icoon || '🔧',
      herhaling: 'jaarlijks',
      aangemaaktOp: Date.now(),
    })
  }

  async function verwijderType(typeId: string) {
    await deleteDoc(doc(db, COLLECTION, typeId))
  }

  return { types, loading, voegTypeToe, verwijderType }
}
