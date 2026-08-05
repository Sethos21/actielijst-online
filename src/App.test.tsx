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
  Sidebar: (props: { onUitloggen: () => void }) => (
    <div>
      Sidebar-stub
      <button type="button" onClick={props.onUitloggen}>
        Stub-uitloggen
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

  it('navigeert naar de Huurdersmutaties-placeholder na kiezen van "Huurdersmutaties"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))

    expect(
      screen.getByText('Deze module wordt binnenkort gebouwd.'),
    ).toBeInTheDocument()
  })

  it('gaat terug naar het Startscherm vanuit de Huurdersmutaties-placeholder', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))
    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))

    expect(
      screen.getByRole('button', { name: /Actielijsten/ }),
    ).toBeInTheDocument()
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
