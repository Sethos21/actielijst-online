import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { ArchiefItem, ArchiefType } from './types'

const COLLECTIES: { naam: string; type: ArchiefType }[] = [
  { naam: 'panden', type: 'pand' },
  { naam: 'onderhoud', type: 'onderhoud' },
  { naam: 'documenten', type: 'document' },
  { naam: 'mjop', type: 'mjop' },
  { naam: 'klanten', type: 'klant' },
]

export function useArchief() {
  const [items, setItems] = useState<Record<ArchiefType, ArchiefItem[]>>({
    pand: [],
    onderhoud: [],
    document: [],
    mjop: [],
    klant: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribes = COLLECTIES.map(({ naam, type }) => {
      // Firestore sluit bij een `!=`-query documenten uit die het veld
      // helemaal niet hebben, dus dit geeft precies de gearchiveerde items —
      // geverifieerd tegen de Firestore-documentatie voor inequality-filters.
      const q = query(collection(db, naam), where('gearchiveerdOp', '!=', null))
      return onSnapshot(q, (snapshot) => {
        setItems((prev) => ({
          ...prev,
          [type]: snapshot.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              type,
              naam: data.naam,
              klantId: type === 'klant' ? d.id : data.klantId,
              klantNaam: '', // ingevuld in ArchiefPage.tsx via klanten-lookup
              pandId: type === 'pand' ? undefined : data.pandId,
              pandNaam: undefined, // ingevuld in ArchiefPage.tsx via panden-lookup
              storagePath: type === 'document' ? data.storagePath : undefined,
              gearchiveerdOp: data.gearchiveerdOp,
              gearchiveerdDoor: data.gearchiveerdDoor,
              gearchiveerdReden: data.gearchiveerdReden,
            } as ArchiefItem
          }),
        }))
        setLoading(false)
      })
    })
    return () => unsubscribes.forEach((fn) => fn())
  }, [])

  const alleItems = Object.values(items)
    .flat()
    .sort((a, b) => b.gearchiveerdOp - a.gearchiveerdOp)
  return { items, alleItems, loading }
}
