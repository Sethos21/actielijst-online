import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { isDue } from './dueDate'
import type { ActieItem } from './types'

interface KlantStats {
  open: number
  due: number
}

/** Telt open/due-acties per klant, voor de badges in het klantoverzicht. */
export function useActieStats() {
  const [statsPerKlant, setStatsPerKlant] = useState<Record<string, KlantStats>>({})

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'acties'), (snapshot) => {
      const stats: Record<string, KlantStats> = {}
      snapshot.docs.forEach((d) => {
        const actie = d.data() as ActieItem
        if (!stats[actie.klantId]) stats[actie.klantId] = { open: 0, due: 0 }
        if (actie.status === 'open') stats[actie.klantId].open += 1
        if (isDue(actie)) stats[actie.klantId].due += 1
      })
      setStatsPerKlant(stats)
    })
    return unsubscribe
  }, [])

  return statsPerKlant
}
