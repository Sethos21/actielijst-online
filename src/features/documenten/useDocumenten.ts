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
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { db, storage } from '../../lib/firebase'
import type { Document, DocumentTag } from './types'

const COLLECTION = 'documenten'

export async function updateOpmerking(documentId: string, opmerking: string) {
  await updateDoc(doc(db, COLLECTION, documentId), { opmerking })
}

export async function updateTag(documentId: string, tag: DocumentTag) {
  await updateDoc(doc(db, COLLECTION, documentId), { tag })
}

export async function archiveerDocument(
  documentId: string,
  gearchiveerdDoor?: string,
  reden?: string,
) {
  await updateDoc(doc(db, COLLECTION, documentId), {
    gearchiveerdOp: Date.now(),
    ...(gearchiveerdDoor?.trim() ? { gearchiveerdDoor: gearchiveerdDoor.trim() } : {}),
    ...(reden?.trim() ? { gearchiveerdReden: reden.trim() } : {}),
  })
}

export async function herstelDocument(documentId: string) {
  await updateDoc(doc(db, COLLECTION, documentId), {
    gearchiveerdOp: null,
    gearchiveerdDoor: null,
    gearchiveerdReden: null,
  })
}

/** Ruimt ook het Storage-bestand op — zonder dit blijft het bestand voor
 * altijd in Firebase Storage staan, ook al is het Firestore-record weg. */
export async function verwijderDocumentDefinitief(documentId: string, storagePath: string) {
  await deleteObject(ref(storage, storagePath))
  await deleteDoc(doc(db, COLLECTION, documentId))
}

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

  return {
    documenten,
    loading,
    uploadDocument,
    updateOpmerking,
    updateTag,
    archiveer: archiveerDocument,
    herstel: herstelDocument,
    verwijderDefinitief: verwijderDocumentDefinitief,
  }
}
