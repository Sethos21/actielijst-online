import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { ActieItem } from '../acties/types'
import { naarSnapshot } from './snapshot'
import type { Versie } from './types'

function collectieVoor(klantId: string) {
  return collection(db, 'klanten', klantId, 'versies')
}

export function useVersies(klantId: string) {
  const [versies, setVersies] = useState<Versie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collectieVoor(klantId), orderBy('datum', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVersies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Versie))
      setLoading(false)
    })
    return unsubscribe
  }, [klantId])

  async function sluitVergaderingAf(nieuw: {
    naam: string
    datum: string
    aanwezigen: string[]
    aangemaaktDoor: string
    acties: ActieItem[]
  }) {
    await addDoc(collectieVoor(klantId), {
      naam: nieuw.naam,
      datum: nieuw.datum,
      aanwezigen: nieuw.aanwezigen,
      aangemaaktDoor: nieuw.aangemaaktDoor,
      snapshot: naarSnapshot(nieuw.acties),
    })
  }

  return { versies, loading, sluitVergaderingAf }
}
