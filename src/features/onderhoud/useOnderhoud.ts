import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { bepaalEffectieveStatus } from './dueDate'
import type { Onderhoud, OnderhoudHerhaling } from './types'

const COLLECTION = 'onderhoud'

// Items van vóór de status-uitbreiding hebben dit veld nog niet in Firestore
// staan — val terug op 'open' i.p.v. een migratie.
function naarOnderhoud(d: QueryDocumentSnapshot<DocumentData>): Onderhoud {
  const data = d.data()
  return { id: d.id, ...data, status: data.status ?? 'open' } as Onderhoud
}

export async function updateOnderhoud(onderhoudId: string, patch: Partial<Onderhoud>) {
  await updateDoc(doc(db, COLLECTION, onderhoudId), patch)
}

/** Vervangt de oude eenrichtings-vinkAf. Zet een expliciete, handmatig
 * ingevulde uitvoerdatum en status 'voltooid' — kan altijd weer worden
 * teruggedraaid door de status handmatig te wijzigen. */
export async function markeerUitgevoerd(onderhoudId: string, uitgevoerdOp: string) {
  await updateDoc(doc(db, COLLECTION, onderhoudId), {
    laatstUitgevoerdOp: uitgevoerdOp,
    status: 'voltooid',
  })
}

export async function archiveerOnderhoud(
  onderhoudId: string,
  gearchiveerdDoor?: string,
  reden?: string,
) {
  await updateDoc(doc(db, COLLECTION, onderhoudId), {
    gearchiveerdOp: Date.now(),
    ...(gearchiveerdDoor?.trim() ? { gearchiveerdDoor: gearchiveerdDoor.trim() } : {}),
    ...(reden?.trim() ? { gearchiveerdReden: reden.trim() } : {}),
  })
}

export async function herstelOnderhoud(onderhoudId: string) {
  await updateDoc(doc(db, COLLECTION, onderhoudId), {
    gearchiveerdOp: null,
    gearchiveerdDoor: null,
    gearchiveerdReden: null,
  })
}

export async function verwijderOnderhoudDefinitief(onderhoudId: string) {
  await deleteDoc(doc(db, COLLECTION, onderhoudId))
}

export function useOnderhoud(pandId: string) {
  const [onderhoud, setOnderhoud] = useState<Onderhoud[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('pandId', '==', pandId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnderhoud(snapshot.docs.map(naarOnderhoud))
      setLoading(false)
    })
    return unsubscribe
  }, [pandId])

  async function addOnderhoud(nieuw: {
    naam: string
    verantw: string
    klantId: string
    leverancier?: string
    herhaling?: OnderhoudHerhaling
  }) {
    if (!nieuw.naam.trim()) return
    const nu = Date.now()
    await addDoc(collection(db, COLLECTION), {
      pandId,
      klantId: nieuw.klantId,
      naam: nieuw.naam.trim(),
      verantw: nieuw.verantw,
      herhaling: nieuw.herhaling ?? 'jaarlijks',
      status: 'open',
      volgendeDatum: nu,
      aangemaaktOp: nu,
      ...(nieuw.leverancier?.trim() ? { leverancier: nieuw.leverancier.trim() } : {}),
    })
  }

  /** Telt items waarvan de effectieve status 'due' is — zelfde patroon als
   * het open-acties-badge op het dashboard. */
  const onderhoudDueCount = onderhoud.filter(
    (item) => bepaalEffectieveStatus(item) === 'due',
  ).length

  return {
    onderhoud,
    loading,
    addOnderhoud,
    markeerUitgevoerd,
    updateOnderhoud,
    archiveer: archiveerOnderhoud,
    herstel: herstelOnderhoud,
    verwijderDefinitief: verwijderOnderhoudDefinitief,
    onderhoudDueCount,
  }
}

/** Alle onderhoudsitems van één klant, over al haar panden heen — gebruikt
 * door Rapportage, die geen los pand kiest maar per klant rapporteert. */
export function useOnderhoudVoorKlant(klantId: string) {
  const [onderhoud, setOnderhoud] = useState<Onderhoud[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('klantId', '==', klantId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnderhoud(snapshot.docs.map(naarOnderhoud))
      setLoading(false)
    })
    return unsubscribe
  }, [klantId])

  return { onderhoud, loading }
}

/** Alle onderhoudsitems over alle klanten en panden heen — gebruikt door het
 * Panden-overzicht om per pand een due-telling te tonen zonder per pand een
 * eigen listener op te zetten. */
export function useAlleOnderhoud() {
  const [onderhoud, setOnderhoud] = useState<Onderhoud[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION), (snapshot) => {
      setOnderhoud(snapshot.docs.map(naarOnderhoud))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { onderhoud, loading }
}
