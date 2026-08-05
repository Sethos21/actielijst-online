import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { ActieItem } from './types'

/** Alle acties over alle klanten heen — voor Mijn acties en Dashboard. */
export function useAlleActies() {
  const [acties, setActies] = useState<ActieItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'acties'),
      (snapshot) => {
        setActies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActieItem))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [])

  return { acties, loading }
}
