import { signOut } from 'firebase/auth'
import { lazy, Suspense, useState } from 'react'
import { ActielijstPage } from './features/acties/ActielijstPage'
import { MijnActiesPage } from './features/acties/MijnActiesPage'
import { ArchiefPage } from './features/archief/ArchiefPage'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthUser } from './features/auth/useAuthUser'
import { DashboardPage } from './features/dashboard/DashboardPage'
import type { ActieHerkomst } from './features/acties/types'
import { KlantoverzichtPage } from './features/klanten/KlantoverzichtPage'
import type { Klant } from './features/klanten/types'
import { PandDetailPage } from './features/panden/PandDetailPage'
import { PandenPaneel } from './features/panden/PandenPaneel'
import type { Pand } from './features/panden/types'
import { RapportagePage } from './features/rapportage/RapportagePage'
import type { Teamlid } from './features/team/teamleden'
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
const PandenOverzichtPage = lazy(() =>
  import('./features/panden/PandenOverzichtPage').then((m) => ({
    default: m.PandenOverzichtPage,
  })),
)

type Scherm = 'start' | 'actielijsten' | 'huurdersmutaties' | 'panden-overzicht'
type Weergave = 'klantoverzicht' | 'mijn-acties' | 'dashboard' | 'rapportage' | 'archief'

function App() {
  const { user, loading } = useAuthUser()
  const [scherm, setScherm] = useState<Scherm>('start')
  const [weergave, setWeergave] = useState<Weergave>('klantoverzicht')
  const [geselecteerdeKlant, setGeselecteerdeKlant] = useState<Klant | null>(null)
  const [geselecteerdPand, setGeselecteerdPand] = useState<Pand | null>(null)
  const [pandGeopendVia, setPandGeopendVia] = useState<'klant' | 'overzicht' | null>(null)
  const [pandDetailTab, setPandDetailTab] = useState<
    'overzicht' | 'documenten' | 'onderhoud' | 'mjop'
  >('overzicht')
  const [pandenPaneelOpen, setPandenPaneelOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [voorgeselecteerdTeamlid, setVoorgeselecteerdTeamlid] = useState<Teamlid | null>(null)
  const [scrollNaarActieId, setScrollNaarActieId] = useState<string | null>(null)

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
    setVoorgeselecteerdTeamlid(null)
  }

  function handleSelectTeamlid(teamlid: Teamlid) {
    setVoorgeselecteerdTeamlid(teamlid)
    setWeergave('mijn-acties')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleDashboard() {
    setWeergave('dashboard')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleRapportage() {
    setWeergave('rapportage')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleArchief() {
    setWeergave('archief')
    setGeselecteerdeKlant(null)
    setGeselecteerdPand(null)
  }

  function handleSelectKlant(klant: Klant) {
    setGeselecteerdeKlant(klant)
    setGeselecteerdPand(null)
  }

  function handleNavigeerNaarBron(pand: Pand, herkomst: ActieHerkomst) {
    setGeselecteerdPand(pand)
    setPandGeopendVia('klant')
    setPandDetailTab(
      herkomst.type === 'document'
        ? 'documenten'
        : herkomst.type === 'mjop'
          ? 'mjop'
          : 'onderhoud',
    )
  }

  function handleNavigeerNaarBronVanuitMijnActies(
    klant: Klant,
    pand: Pand,
    herkomst: ActieHerkomst,
  ) {
    setGeselecteerdeKlant(klant)
    handleNavigeerNaarBron(pand, herkomst)
  }

  /** Na "+ Actie aanmaken" vanuit Onderhoud/Documenten/MJOP: terug naar de
   * actielijst van deze klant, gescrold naar de nieuwe rij. */
  function handleNavigeerNaarActie(actieId: string) {
    setGeselecteerdPand(null)
    setPandGeopendVia(null)
    setScrollNaarActieId(actieId)
  }

  if (scherm === 'start') {
    return (
      <StartScreen
        onKiesActielijsten={() => setScherm('actielijsten')}
        onKiesHuurdersmutaties={() => setScherm('huurdersmutaties')}
        onKiesKlanten={() => {
          setWeergave('klantoverzicht')
          setGeselecteerdeKlant(null)
          setGeselecteerdPand(null)
          setScherm('actielijsten')
        }}
        onKiesPanden={() => setScherm('panden-overzicht')}
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

  if (scherm === 'panden-overzicht') {
    return (
      <Suspense fallback={<p>Laden...</p>}>
        <PandenOverzichtPage
          onTerug={() => setScherm('start')}
          onSelectPand={(pand, klant) => {
            setGeselecteerdeKlant(klant)
            setGeselecteerdPand(pand)
            setPandGeopendVia('overzicht')
            setPandDetailTab('overzicht')
            setScherm('actielijsten')
          }}
        />
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
        onPandenOverzicht={() => setScherm('panden-overzicht')}
        onMijnActies={handleMijnActies}
        onDashboard={handleDashboard}
        onRapportage={handleRapportage}
        onArchief={handleArchief}
        gebruikerEmail={user.email ?? ''}
        onUitloggen={handleUitloggen}
      />

      <main className="app-inhoud">
        {geselecteerdPand && geselecteerdeKlant ? (
          <PandDetailPage
            key={geselecteerdPand.id}
            pand={geselecteerdPand}
            klantNaam={geselecteerdeKlant.naam}
            onTerug={() => {
              if (pandGeopendVia === 'overzicht') {
                setGeselecteerdPand(null)
                setGeselecteerdeKlant(null)
                setScherm('panden-overzicht')
              } else {
                setGeselecteerdPand(null)
              }
              setPandGeopendVia(null)
            }}
            initieelTab={pandDetailTab}
            onNavigeerNaarActie={handleNavigeerNaarActie}
          />
        ) : geselecteerdeKlant ? (
          <ActielijstPage
            klantId={geselecteerdeKlant.id}
            klantNaam={geselecteerdeKlant.naam}
            onTerug={() => setGeselecteerdeKlant(null)}
            onPandenOpen={() => setPandenPaneelOpen(true)}
            onNavigeerNaarBron={handleNavigeerNaarBron}
            scrollNaarActieId={scrollNaarActieId}
            onGescroldNaarActie={() => setScrollNaarActieId(null)}
          />
        ) : weergave === 'mijn-acties' ? (
          <MijnActiesPage
            voorgeselecteerdTeamlid={voorgeselecteerdTeamlid ?? undefined}
            onSelectKlant={handleSelectKlant}
            onNavigeerNaarBron={handleNavigeerNaarBronVanuitMijnActies}
          />
        ) : weergave === 'dashboard' ? (
          <DashboardPage
            onSelectKlant={setGeselecteerdeKlant}
            onSelectTeamlid={handleSelectTeamlid}
          />
        ) : weergave === 'rapportage' ? (
          <RapportagePage />
        ) : weergave === 'archief' ? (
          <ArchiefPage />
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
              setPandGeopendVia('klant')
              setPandDetailTab('overzicht')
              setPandenPaneelOpen(false)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
