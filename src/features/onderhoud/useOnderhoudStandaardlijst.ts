import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

const COLLECTION = 'onderhoudStandaardlijst'

export interface StandaardType {
  id: string
  naam: string
  icoon: string
  herhaling: 'jaarlijks'
  aangemaaktOp: number
}

/** Veelvoorkomende onderhoudscategorieën bij vastgoedbeheer — gebruikt als
 * startpunt voor teams die de standaardlijst nog leeg aantreffen. Geen
 * verplichte set: het team kan ze na het toevoegen alsnog verwijderen. */
export const VOORBEELD_STANDAARD_TYPES: { naam: string; icoon: string }[] = [
  { naam: 'CV-ketel onderhoud', icoon: '🔧' },
  { naam: 'Dakinspectie', icoon: '🏠' },
  { naam: 'Brandblusser controle', icoon: '🧯' },
  { naam: 'Rookmelders controle', icoon: '🔔' },
  { naam: 'Deurautomaat onderhoud', icoon: '🚪' },
  { naam: 'Liftonderhoud', icoon: '🛗' },
  { naam: 'Elektrische installatie', icoon: '⚡' },
  { naam: 'Luchtbehandeling (incl. filters)', icoon: '🌬️' },
  { naam: 'Airco onderhoud', icoon: '❄️' },
  { naam: 'Brandmeldinstallatie (BMI)', icoon: '🚨' },
  { naam: 'Alarminstallatie', icoon: '🔒' },
]

/** Systeembrede, door het hele team beheerbare lijst van onderhoudstypen —
 * los van een specifiek pand (zie VOORSTEL rapportage/onderhoud/mjop §3). */
export function useOnderhoudStandaardlijst() {
  const [types, setTypes] = useState<StandaardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('naam'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTypes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as StandaardType))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function voegTypeToe(naam: string, icoon: string) {
    if (!naam.trim()) return
    await addDoc(collection(db, COLLECTION), {
      naam: naam.trim(),
      icoon: icoon || '🔧',
      herhaling: 'jaarlijks',
      aangemaaktOp: Date.now(),
    })
  }

  async function verwijderType(typeId: string) {
    await deleteDoc(doc(db, COLLECTION, typeId))
  }

  async function vulMetVoorbeelden() {
    await Promise.all(
      VOORBEELD_STANDAARD_TYPES.map((type) => voegTypeToe(type.naam, type.icoon)),
    )
  }

  return { types, loading, voegTypeToe, verwijderType, vulMetVoorbeelden }
}
