import { collectionGroup, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { Versie } from './types'

/**
 * Meest recente versiedatum per klant, voor het Klantoverzicht (sorteren op
 * "laatste versie" — een expliciete eis, zie BVC_UI_UX_DESIGN.md §5b).
 * Gebruikt een collection-group query over alle klanten/*\/versies-subcollecties
 * heen, want er is geen los, plat overzicht van versies per klant.
 */
export function useLaatsteVersieDatums(): Record<string, string> {
  const [datumsPerKlant, setDatumsPerKlant] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsubscribe = onSnapshot(collectionGroup(db, 'versies'), (snapshot) => {
      const datums: Record<string, string> = {}
      snapshot.docs.forEach((d) => {
        const klantId = d.ref.parent.parent?.id
        if (!klantId) return
        const versie = d.data() as Versie
        if (!datums[klantId] || versie.datum > datums[klantId]) {
          datums[klantId] = versie.datum
        }
      })
      setDatumsPerKlant(datums)
    })
    return unsubscribe
  }, [])

  return datumsPerKlant
}
