import { signOut } from 'firebase/auth'
import { lazy, Suspense, useState } from 'react'
import { ActielijstPage } from './features/acties/ActielijstPage'
import { MijnActiesPage } from './features/acties/MijnActiesPage'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthUser } from './features/auth/useAuthUser'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { KlantoverzichtPage } from './features/klanten/KlantoverzichtPage'
import type { Klant } from './features/klanten/types'
import { PandDetailPage } from './features/panden/PandDetailPage'
import { PandenPaneel } from './features/panden/PandenPaneel'
import type { Pand } from './features/panden/types'
import { Sidebar } from './components/Sidebar'
import { StartScreen } from './components/StartScreen'
import { auth } from './lib/firebase'

// Losstaande schermen/modals, alleen nodig ná een expliciete gebruikersactie
// (kies Huurdersmutaties, klik Importeren) — niet nodig voor de initiële load.
const Huurdersmutaties = lazy(() =>
  import('./features/huurdersmutaties/Huurdersmutaties').then((m) => ({
    default: m.Huurdersmutaties,
  })),
)
const ImportActiesModal = lazy(() =>
  import('./features/acties/ImportActiesModal').then((m) => ({
    default: m.ImportActiesModal,
  })),
)

type Scherm = 'start' | 'actielijsten' | 'huurdersmutaties'
type Weergave = 'klantoverzicht' | 'mijn-acties' | 'dashboard'

function App() {
  const { user, loading } = useAuthUser()
  const [scherm, setScherm] = useState<Scherm>('start')
  const [weergave, setWeergave] = useState<Weergave>('klantoverzicht')
  const [geselecteerdeKlant, setGeselecteerdeKlant] = useState<Klant | null>(null)
  const [geselecteerdPand, setGeselecteerdPand] = useState<Pand | null>(null)
  const [pandenPaneelOpen, setPandenPaneelOpen] = useState(false)
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
    setGeselecteerdPand(null)
  }

  function handleKlantoverzicht() {
    setWeergave('klantoverzicht')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleMijnActies() {
    setWeergave('mijn-acties')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleDashboard() {
    setWeergave('dashboard')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleSelectKlant(klant: Klant) {
    setGeselecteerdeKlant(klant)
    setGeselecteerdPand(null)
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
    return (
      <Suspense fallback={<p>Laden...</p>}>
        <Huurdersmutaties onTerug={() => setScherm('start')} />
      </Suspense>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        geselecteerdeKlantId={geselecteerdeKlant?.id ?? null}
        weergave={weergave}
        onSelectKlant={handleSelectKlant}
        onKlantoverzicht={handleKlantoverzicht}
        onMijnActies={handleMijnActies}
        onDashboard={handleDashboard}
        gebruikerEmail={user.email ?? ''}
        onUitloggen={handleUitloggen}
      />

      <main className="app-inhoud">
        {geselecteerdPand && geselecteerdeKlant ? (
          <PandDetailPage
            pand={geselecteerdPand}
            klantNaam={geselecteerdeKlant.naam}
            onTerug={() => setGeselecteerdPand(null)}
          />
        ) : geselecteerdeKlant ? (
          <ActielijstPage
            klantId={geselecteerdeKlant.id}
            klantNaam={geselecteerdeKlant.naam}
            onTerug={() => setGeselecteerdeKlant(null)}
            onPandenOpen={() => setPandenPaneelOpen(true)}
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
          <Suspense fallback={null}>
            <ImportActiesModal onSluiten={() => setImportOpen(false)} />
          </Suspense>
        )}

        {pandenPaneelOpen && geselecteerdeKlant && (
          <PandenPaneel
            klantId={geselecteerdeKlant.id}
            klantNaam={geselecteerdeKlant.naam}
            onSluiten={() => setPandenPaneelOpen(false)}
            onSelectPand={(pand) => {
              setGeselecteerdPand(pand)
              setPandenPaneelOpen(false)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
