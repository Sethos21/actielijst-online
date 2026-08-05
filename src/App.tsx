import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { ActielijstPage } from './features/acties/ActielijstPage'
import { ImportActiesModal } from './features/acties/ImportActiesModal'
import { MijnActiesPage } from './features/acties/MijnActiesPage'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthUser } from './features/auth/useAuthUser'
import { Huurdersmutaties } from './features/huurdersmutaties/Huurdersmutaties'
import { KlantoverzichtPage } from './features/klanten/KlantoverzichtPage'
import type { Klant } from './features/klanten/types'
import { Sidebar } from './components/Sidebar'
import { StartScreen } from './components/StartScreen'
import { auth } from './lib/firebase'

type Scherm = 'start' | 'actielijsten' | 'huurdersmutaties'
type Weergave = 'klantoverzicht' | 'mijn-acties'

function App() {
  const { user, loading } = useAuthUser()
  const [scherm, setScherm] = useState<Scherm>('start')
  const [weergave, setWeergave] = useState<Weergave>('klantoverzicht')
  const [geselecteerdeKlant, setGeselecteerdeKlant] = useState<Klant | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  if (loading) {
    return <p>Laden...</p>
  }

  if (!user) {
    return <LoginForm />
  }

  function handleUitloggen() {
    signOut(auth)
    setScherm('start')
    setGeselecteerdeKlant(null)
    setWeergave('klantoverzicht')
  }

  function handleKlantoverzicht() {
    setGeselecteerdeKlant(null)
    setWeergave('klantoverzicht')
  }

  function handleMijnActies() {
    setGeselecteerdeKlant(null)
    setWeergave('mijn-acties')
  }

  if (scherm === 'start') {
    return (
      <StartScreen
        onKiesActielijsten={() => setScherm('actielijsten')}
        onKiesHuurdersmutaties={() => setScherm('huurdersmutaties')}
      />
    )
  }

  if (scherm === 'huurdersmutaties') {
    return <Huurdersmutaties onTerug={() => setScherm('start')} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        geselecteerdeKlantId={geselecteerdeKlant?.id ?? null}
        weergave={weergave}
        onSelectKlant={setGeselecteerdeKlant}
        onKlantoverzicht={handleKlantoverzicht}
        onMijnActies={handleMijnActies}
        gebruikerEmail={user.email ?? ''}
        onUitloggen={handleUitloggen}
      />

      <main className="app-inhoud">
        {geselecteerdeKlant ? (
          <ActielijstPage
            klantId={geselecteerdeKlant.id}
            klantNaam={geselecteerdeKlant.naam}
            onTerug={() => setGeselecteerdeKlant(null)}
          />
        ) : weergave === 'mijn-acties' ? (
          <MijnActiesPage />
        ) : (
          <KlantoverzichtPage
            onSelectKlant={setGeselecteerdeKlant}
            onImporteren={() => setImportOpen(true)}
            onTerugNaarStart={() => setScherm('start')}
          />
        )}

        {importOpen && (
          <ImportActiesModal onSluiten={() => setImportOpen(false)} />
        )}
      </main>
    </div>
  )
}

export default App
