import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}))

vi.mock('./lib/firebase', () => ({
  auth: {},
}))

vi.mock('./features/auth/useAuthUser', () => ({
  useAuthUser: () => ({ user: { email: 'test@bvc.nl' }, loading: false }),
}))

vi.mock('./components/Sidebar', () => ({
  Sidebar: (props: {
    onUitloggen: () => void
    onPandenOverzicht: () => void
    onMijnActies: () => void
    onDashboard: () => void
    onRapportage: () => void
    onArchief: () => void
  }) => (
    <div>
      Sidebar-stub
      <button type="button" onClick={props.onUitloggen}>
        Stub-uitloggen
      </button>
      <button type="button" onClick={props.onPandenOverzicht}>
        Stub-panden
      </button>
      <button type="button" onClick={props.onMijnActies}>
        Stub-mijn-acties
      </button>
      <button type="button" onClick={props.onDashboard}>
        Stub-dashboard
      </button>
      <button type="button" onClick={props.onRapportage}>
        Stub-rapportage
      </button>
      <button type="button" onClick={props.onArchief}>
        Stub-archief
      </button>
    </div>
  ),
}))

vi.mock('./features/klanten/KlantoverzichtPage', () => ({
  KlantoverzichtPage: () => <div>Klantoverzicht-stub</div>,
}))

vi.mock('./features/acties/ActielijstPage', () => ({
  ActielijstPage: () => <div>Actielijst-stub</div>,
}))

vi.mock('./features/acties/MijnActiesPage', () => ({
  MijnActiesPage: (props: { voorgeselecteerdTeamlid?: string }) => (
    <div>Mijn-acties-stub{props.voorgeselecteerdTeamlid ? `: ${props.voorgeselecteerdTeamlid}` : ''}</div>
  ),
}))

vi.mock('./features/dashboard/DashboardPage', () => ({
  DashboardPage: (props: { onSelectTeamlid: (teamlid: string) => void }) => (
    <div>
      Dashboard-stub
      <button type="button" onClick={() => props.onSelectTeamlid('Ton')}>
        Stub-selecteer-teamlid
      </button>
    </div>
  ),
}))

vi.mock('./features/rapportage/RapportagePage', () => ({
  RapportagePage: () => <div>Rapportage-stub</div>,
}))

vi.mock('./features/archief/ArchiefPage', () => ({
  ArchiefPage: () => <div>Archief-stub</div>,
}))

vi.mock('./features/huurdersmutaties/Huurdersmutaties', () => ({
  Huurdersmutaties: (props: { onTerug: () => void }) => (
    <div>
      Huurdersmutaties-stub
      <button type="button" onClick={props.onTerug}>
        ← Terug naar start
      </button>
    </div>
  ),
}))

vi.mock('./features/panden/PandDetailPage', () => ({
  PandDetailPage: (props: {
    pand: { naam: string }
    klantNaam: string
    onTerug: () => void
  }) => (
    <div>
      PandDetail-stub: {props.klantNaam} / {props.pand.naam}
      <button type="button" onClick={props.onTerug}>
        ← Terug naar panden
      </button>
    </div>
  ),
}))

type StubPand = { id: string; klantId: string; naam: string; aangemaaktOp: number }
type StubKlant = { id: string; naam: string; aangemaaktOp: number }

vi.mock('./features/panden/PandenOverzichtPage', () => ({
  PandenOverzichtPage: (props: {
    onTerug: () => void
    onSelectPand: (pand: StubPand, klant: StubKlant) => void
  }) => (
    <div>
      PandenOverzicht-stub
      <button type="button" onClick={props.onTerug}>
        ← Terug naar start
      </button>
      <button
        type="button"
        onClick={() =>
          props.onSelectPand(
            { id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 },
            { id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 },
          )
        }
      >
        Stub-selecteer-pand
      </button>
    </div>
  ),
}))

describe('App', () => {
  it('toont het Startscherm als eerste scherm na inloggen', () => {
    render(<App />)

    expect(
      screen.getByRole('button', { name: /Actielijsten/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Huurdersmutaties/ }),
    ).toBeInTheDocument()
  })

  it('navigeert naar de sidebar-shell na kiezen van "Actielijsten"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))

    expect(screen.getByText('Sidebar-stub')).toBeInTheDocument()
    expect(screen.getByText('Klantoverzicht-stub')).toBeInTheDocument()
  })

  it('navigeert naar Huurdersmutaties na kiezen van "Huurdersmutaties"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))

    expect(await screen.findByText('Huurdersmutaties-stub')).toBeInTheDocument()
  })

  it('gaat terug naar het Startscherm vanuit Huurdersmutaties', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))
    await screen.findByText('Huurdersmutaties-stub')
    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))

    expect(
      screen.getByRole('button', { name: /Actielijsten/ }),
    ).toBeInTheDocument()
  })

  it('navigeert naar Mijn acties via de sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-mijn-acties' }))

    expect(screen.getByText('Mijn-acties-stub')).toBeInTheDocument()
  })

  it('navigeert naar Dashboard via de sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-dashboard' }))

    expect(screen.getByText('Dashboard-stub')).toBeInTheDocument()
  })

  it('navigeert naar Mijn acties met het gekozen teamlid vanuit het Dashboard', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-dashboard' }))
    await user.click(screen.getByRole('button', { name: 'Stub-selecteer-teamlid' }))

    expect(screen.getByText('Mijn-acties-stub: Ton')).toBeInTheDocument()
  })

  it('navigeert naar Rapportage via de sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-rapportage' }))

    expect(screen.getByText('Rapportage-stub')).toBeInTheDocument()
  })

  it('navigeert naar Archief via de sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-archief' }))

    expect(screen.getByText('Archief-stub')).toBeInTheDocument()
  })

  it('navigeert direct naar het klantoverzicht na kiezen van "Klanten"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Klanten/ }))

    expect(screen.getByText('Sidebar-stub')).toBeInTheDocument()
    expect(screen.getByText('Klantoverzicht-stub')).toBeInTheDocument()
  })

  it('navigeert naar het Panden-overzicht na kiezen van "Panden"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Panden/ }))

    expect(await screen.findByText('PandenOverzicht-stub')).toBeInTheDocument()
  })

  it('gaat terug naar het Startscherm vanuit het Panden-overzicht', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Panden/ }))
    await screen.findByText('PandenOverzicht-stub')
    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))

    expect(
      screen.getByRole('button', { name: /Actielijsten/ }),
    ).toBeInTheDocument()
  })

  it('toont de juiste klant bij het selecteren van een pand vanuit het Panden-overzicht', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Panden/ }))
    await screen.findByText('PandenOverzicht-stub')
    await user.click(screen.getByRole('button', { name: 'Stub-selecteer-pand' }))

    expect(
      screen.getByText('PandDetail-stub: Malcon / Hoofdstraat 12'),
    ).toBeInTheDocument()
  })

  it('gaat terug naar het Panden-overzicht (niet naar de actielijst) als het pand van daaruit geopend werd', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Panden/ }))
    await screen.findByText('PandenOverzicht-stub')
    await user.click(screen.getByRole('button', { name: 'Stub-selecteer-pand' }))
    await screen.findByText('PandDetail-stub: Malcon / Hoofdstraat 12')

    await user.click(screen.getByRole('button', { name: '← Terug naar panden' }))

    expect(await screen.findByText('PandenOverzicht-stub')).toBeInTheDocument()
  })

  it('navigeert naar het Panden-overzicht via de sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    await user.click(screen.getByRole('button', { name: 'Stub-panden' }))

    expect(await screen.findByText('PandenOverzicht-stub')).toBeInTheDocument()
  })

  it('reset naar het Startscherm bij uitloggen', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    expect(screen.getByText('Sidebar-stub')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stub-uitloggen' }))

    expect(
      screen.getByRole('button', { name: /Actielijsten/ }),
    ).toBeInTheDocument()
  })
})
