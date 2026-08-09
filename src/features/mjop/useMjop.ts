import {
  addDoc,
  collection,
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

export function useMjop(pandId: string) {
  const [posten, setPosten] = useState<MjopPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, COLLECTION),
      where('pandId', '==', pandId),
      orderBy('jaar'),
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosten(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as MjopPost))
      setLoading(false)
    })
    return unsubscribe
  }, [pandId])

  async function addPost(post: Omit<MjopPost, 'id' | 'pandId'>) {
    await addDoc(collection(db, COLLECTION), { ...post, pandId })
  }

  async function updatePost(postId: string, patch: Partial<MjopPost>) {
    await updateDoc(doc(db, COLLECTION, postId), patch)
  }

  return { posten, loading, addPost, updatePost }
}
