import {
  addDoc,
  collection,
  deleteDoc,
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

export async function updateOnderhoud(onderhoudId: string, patch: Partial<Onderhoud>) {
  await updateDoc(doc(db, COLLECTION, onderhoudId), patch)
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
    leverancier?: string
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
      ...(nieuw.leverancier?.trim() ? { leverancier: nieuw.leverancier.trim() } : {}),
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

  return {
    onderhoud,
    loading,
    addOnderhoud,
    vinkAf,
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
      setOnderhoud(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Onderhoud),
      )
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
      setOnderhoud(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Onderhoud),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { onderhoud, loading }
}
