import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { db, storage } from '../../lib/firebase'
import type { Document, DocumentTag } from './types'

const COLLECTION = 'documenten'

export function useDocumenten(pandId: string) {
  const [documenten, setDocumenten] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('pandId', '==', pandId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocumenten(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Document),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [pandId])

  async function uploadDocument(
    klantId: string,
    bestand: File,
    tag: DocumentTag,
    geuploadDoor: string,
    opmerking?: string,
  ) {
    const storagePath = `panden/${pandId}/${Date.now()}_${bestand.name}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, bestand)
    const storageUrl = await getDownloadURL(storageRef)

    await addDoc(collection(db, COLLECTION), {
      pandId,
      klantId,
      tag,
      naam: bestand.name,
      storageUrl,
      storagePath,
      geuploadDoor,
      geuploadOp: Date.now(),
      ...(opmerking?.trim() ? { opmerking: opmerking.trim() } : {}),
    })
  }

  async function updateOpmerking(documentId: string, opmerking: string) {
    await updateDoc(doc(db, COLLECTION, documentId), { opmerking })
  }

  return { documenten, loading, uploadDocument, updateOpmerking }
}
