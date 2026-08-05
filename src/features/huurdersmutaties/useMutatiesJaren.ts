import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { STANDAARD_JAREN } from './types'

const DOC_PAD = ['instellingen', 'mutatiesJaren'] as const

export function useMutatiesJaren() {
  const [jaren, setJaren] = useState<number[]>(STANDAARD_JAREN)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...DOC_PAD)
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data()
        if (data?.jaren) setJaren(data.jaren)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [])

  async function voegJaarToe(): Promise<number | null> {
    const nieuw = Math.max(...jaren) + 1
    if (jaren.includes(nieuw)) return null
    const bijgewerkt = [...jaren, nieuw].sort((a, b) => a - b)
    await setDoc(doc(db, ...DOC_PAD), { jaren: bijgewerkt })
    return nieuw
  }

  return { jaren, loading, voegJaarToe }
}
