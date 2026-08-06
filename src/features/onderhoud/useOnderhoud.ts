import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { bepaalOnderhoudStatus, berekenVolgendeOnderhoudsdatum } from './dueDate'
import type { Onderhoud } from './types'

const COLLECTION = 'onderhoud'

export function useOnderhoud(pandId: string) {
  const [onderhoud, setOnderhoud] = useState<Onderhoud[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('pandId', '==', pandId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnderhoud(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Onderhoud),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [pandId])

  async function addOnderhoud(nieuw: {
    naam: string
    verantw: string
    klantId: string
  }) {
    if (!nieuw.naam.trim()) return
    const nu = Date.now()
    await addDoc(collection(db, COLLECTION), {
      pandId,
      klantId: nieuw.klantId,
      naam: nieuw.naam.trim(),
      verantw: nieuw.verantw,
      herhaling: 'jaarlijks',
      volgendeDatum: nu,
      aangemaaktOp: nu,
    })
  }

  async function vinkAf(onderhoudId: string) {
    const nu = Date.now()
    await updateDoc(doc(db, COLLECTION, onderhoudId), {
      laatstUitgevoerdOp: nu,
      volgendeDatum: berekenVolgendeOnderhoudsdatum(nu),
    })
  }

  /** Telt items die Due of bijna Due (gepland) zijn — zelfde patroon als het
   * open-acties-badge op het dashboard. */
  const onderhoudDueCount = onderhoud.filter((item) => {
    const status = bepaalOnderhoudStatus(item.volgendeDatum)
    return status === 'due' || status === 'gepland'
  }).length

  return { onderhoud, loading, addOnderhoud, vinkAf, onderhoudDueCount }
}
