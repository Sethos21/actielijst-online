import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { ActielijstPage } from './features/acties/ActielijstPage'
import { ImportActiesModal } from './features/acties/ImportActiesModal'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthUser } from './features/auth/useAuthUser'
import { KlantoverzichtPage } from './features/klanten/KlantoverzichtPage'
import type { Klant } from './features/klanten/types'
import { auth } from './lib/firebase'

function App() {
  const { user, loading } = useAuthUser()
  const [geselecteerdeKlant, setGeselecteerdeKlant] = useState<Klant | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  if (loading) {
    return <p>Laden...</p>
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div>
      <header>
        <span>{user.email}</span>
        <button onClick={() => signOut(auth)}>Uitloggen</button>
      </header>

      {geselecteerdeKlant ? (
        <ActielijstPage
          klantId={geselecteerdeKlant.id}
          klantNaam={geselecteerdeKlant.naam}
          onTerug={() => setGeselecteerdeKlant(null)}
        />
      ) : (
        <KlantoverzichtPage
          onSelectKlant={setGeselecteerdeKlant}
          onImporteren={() => setImportOpen(true)}
        />
      )}

      {importOpen && (
        <ImportActiesModal onSluiten={() => setImportOpen(false)} />
      )}
    </div>
  )
}

export default App
