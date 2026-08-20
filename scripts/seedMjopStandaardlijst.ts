/**
 * Eenmalig seed-script: vult de MJOP-standaardlijst (Firestore-collectie
 * `mjopStandaardlijst`) met de vijf goedgekeurde standaarditems. De collectie
 * start leeg — de mechaniek zelf (MjopStandaardlijstBeheer.tsx,
 * useMjopStandaardlijst.ts) bestaat al.
 *
 * Gebruik:
 *   VITE_FIREBASE_API_KEY=... VITE_FIREBASE_AUTH_DOMAIN=... VITE_FIREBASE_PROJECT_ID=... \
 *   VITE_FIREBASE_STORAGE_BUCKET=... VITE_FIREBASE_MESSAGING_SENDER_ID=... VITE_FIREBASE_APP_ID=... \
 *   SEED_EMAIL=... SEED_PASSWORD=... \
 *   npx tsx scripts/seedMjopStandaardlijst.ts
 *
 * De Firebase-config is dezelfde als in src/lib/firebase.ts. SEED_EMAIL/
 * SEED_PASSWORD zijn nodig omdat de Firestore rules schrijven alleen
 * toestaan voor ingelogde gebruikers (het gedeelde teamaccount) — dit script
 * draait niet in de browser en heeft dus geen bestaande sessie.
 */
import { initializeApp } from 'firebase/app'
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'
import { addDoc, collection, getDocs, getFirestore } from 'firebase/firestore'

const COLLECTION = 'mjopStandaardlijst'

const STANDAARDITEMS = [
  { naam: 'Daken', categorie: 'onderhoud', icoon: '🏠' },
  { naam: 'Schilderwerk', categorie: 'onderhoud', icoon: '🎨' },
  { naam: 'Gevels', categorie: 'onderhoud', icoon: '🧱' },
  { naam: 'Ramen & Kozijnen', categorie: 'onderhoud', icoon: '🪟' },
  { naam: 'Terrein', categorie: 'onderhoud', icoon: '🌳' },
] as const

function verplichteEnv(naam: string): string {
  const waarde = process.env[naam]
  if (!waarde) {
    throw new Error(`Ontbrekende environment variable: ${naam}`)
  }
  return waarde
}

async function main() {
  const app = initializeApp({
    apiKey: verplichteEnv('VITE_FIREBASE_API_KEY'),
    authDomain: verplichteEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: verplichteEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: verplichteEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: verplichteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: verplichteEnv('VITE_FIREBASE_APP_ID'),
  })
  const auth = getAuth(app)
  const db = getFirestore(app)

  await signInWithEmailAndPassword(auth, verplichteEnv('SEED_EMAIL'), verplichteEnv('SEED_PASSWORD'))

  const bestaand = await getDocs(collection(db, COLLECTION))
  if (!bestaand.empty) {
    console.log(
      `mjopStandaardlijst bevat al ${bestaand.size} item(s) — niets toegevoegd.`,
    )
    return
  }

  for (const item of STANDAARDITEMS) {
    await addDoc(collection(db, COLLECTION), { ...item, aangemaaktOp: Date.now() })
  }

  console.log(`${STANDAARDITEMS.length} items toegevoegd aan mjopStandaardlijst.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
