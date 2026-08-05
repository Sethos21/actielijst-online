import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { ActielijstPage } from './features/acties/ActielijstPage'
import { ImportActiesModal } from './features/acties/ImportActiesModal'
import { MijnActiesPage } from './features/acties/MijnActiesPage'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthUser } from './features/auth/useAuthUser'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { Huurdersmutaties } from './features/huurdersmutaties/Huurdersmutaties'
import { KlantoverzichtPage } from './features/klanten/KlantoverzichtPage'
import type { Klant } from './features/klanten/types'
import { Sidebar } from './components/Sidebar'
import { StartScreen } from './components/StartScreen'
import { auth } from './lib/firebase'

type Scherm = 'start' | 'actielijsten' | 'huurdersmutaties'
type Weergave = 'klantoverzicht' | 'mijn-acties' | 'dashboard'

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
    setWeergave('klantoverzicht')
    setGeselecteerdeKlant(null)
  }

  function handleKlantoverzicht() {
    setWeergave('klantoverzicht')
    setGeselecteerdeKlant(null)
  }

  function handleMijnActies() {
    setWeergave('mijn-acties')
    setGeselecteerdeKlant(null)
  }

  function handleDashboard() {
    setWeergave('dashboard')
    setGeselecteerdeKlant(null)
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
        onDashboard={handleDashboard}
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
        ) : weergave === 'dashboard' ? (
          <DashboardPage onSelectKlant={setGeselecteerdeKlant} />
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
