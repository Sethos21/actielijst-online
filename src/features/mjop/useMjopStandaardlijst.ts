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
import type { MjopCategorie } from './types'

const COLLECTION = 'mjopStandaardlijst'

export interface MjopStandaardType {
  id: string
  naam: string
  categorie: MjopCategorie
  icoon: string
  aangemaaktOp: number
}

export const MJOP_CATEGORIE_LABELS: Record<MjopCategorie, string> = {
  onderhoud: 'Onderhoud',
  'verbouwing-renovatie': 'Verbouwing/renovatie',
  vervanging: 'Vervanging',
}

/** Systeembrede, door het hele team beheerbare lijst van MJOP-posttypen —
 * los van een specifiek pand. Exact analoog aan useOnderhoudStandaardlijst,
 * met categorie als extra, verplicht veld. */
export function useMjopStandaardlijst() {
  const [types, setTypes] = useState<MjopStandaardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('naam'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTypes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as MjopStandaardType))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function voegTypeToe(naam: string, categorie: MjopCategorie, icoon: string) {
    if (!naam.trim()) return
    await addDoc(collection(db, COLLECTION), {
      naam: naam.trim(),
      categorie,
      icoon: icoon || '🏗️',
      aangemaaktOp: Date.now(),
    })
  }

  async function verwijderType(typeId: string) {
    await deleteDoc(doc(db, COLLECTION, typeId))
  }

  return { types, loading, voegTypeToe, verwijderType }
}
