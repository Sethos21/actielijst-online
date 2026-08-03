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
// streaming-verbinding niet goed door, waardoor schrijfacties nooit
// resolven of afwijzen — ze blijven simpelweg hangen. auto-detect long
// polling laat de SDK zelf herkennen wanneer dat het geval is en
// schakelt dan over op long-polling, wat door zulke netwerken wél heen komt.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
})
