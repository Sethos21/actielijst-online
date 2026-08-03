import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Sommige (vaak zakelijke) netwerken/proxy's laten Firestore's standaard
// streaming-verbinding niet goed door: de verbinding wordt telkens
// opgestart en na korte tijd weer afgebroken (te zien in de browser als
// herhaalde "channel"-verzoeken met wisselende gsessionid, deels
// "canceled"), waardoor schrijfacties nooit resolven of afwijzen. De
// auto-detect variant concludeerde hier ten onrechte dat een normale
// verbinding werkte; force long polling slaat die (foutieve) detectie
// over en gebruikt altijd long-polling, wat door zulke netwerken wél
// heen komt.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})
