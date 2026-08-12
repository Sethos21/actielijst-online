import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import type { MjopPost } from './types'

const COLLECTION = 'mjop'

export async function updatePost(postId: string, patch: Partial<MjopPost>) {
  await updateDoc(doc(db, COLLECTION, postId), patch)
}

export async function archiveerMjopPost(postId: string, gearchiveerdDoor?: string, reden?: string) {
  await updateDoc(doc(db, COLLECTION, postId), {
    gearchiveerdOp: Date.now(),
    ...(gearchiveerdDoor?.trim() ? { gearchiveerdDoor: gearchiveerdDoor.trim() } : {}),
    ...(reden?.trim() ? { gearchiveerdReden: reden.trim() } : {}),
  })
}

export async function herstelMjopPost(postId: string) {
  await updateDoc(doc(db, COLLECTION, postId), {
    gearchiveerdOp: null,
    gearchiveerdDoor: null,
    gearchiveerdReden: null,
  })
}

export async function verwijderMjopPostDefinitief(postId: string) {
  await deleteDoc(doc(db, COLLECTION, postId))
}

export function useMjop(pandId: string) {
  const [posten, setPosten] = useState<MjopPost[]>([])
  const [loading, setLoading] = useState(true)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, COLLECTION),
      where('pandId', '==', pandId),
      orderBy('jaar'),
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPosten(
          snapshot.docs.map((d) => {
            const data = d.data()
            // Bestaande posten van vóór het categorie-veld hebben dit nog niet
            // in Firestore staan — val terug op 'onderhoud' i.p.v. een migratie.
            return { id: d.id, ...data, categorie: data.categorie ?? 'onderhoud' } as MjopPost
          }),
        )
        setLoading(false)
      },
      (error) => {
        console.error('Fout bij laden MJOP:', error)
        setLoading(false)
        setFoutmelding('MJOP kon niet geladen worden. Probeer de pagina te verversen.')
      },
    )
    return unsubscribe
  }, [pandId])

  async function addPost(post: Omit<MjopPost, 'id' | 'pandId'>) {
    await addDoc(collection(db, COLLECTION), { ...post, pandId })
  }

  return {
    posten,
    loading,
    foutmelding,
    addPost,
    updatePost,
    archiveer: archiveerMjopPost,
    herstel: herstelMjopPost,
    verwijderDefinitief: verwijderMjopPostDefinitief,
  }
}
