import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActielijstPage } from './ActielijstPage'

const addItem = vi.fn()

vi.mock('../../lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('../auth/useAuthUser', () => ({
  useAuthUser: () => ({
    user: { uid: 'user-1', email: 'klant@bvc.nl' },
    loading: false,
  }),
}))
vi.mock('./useActieItems', () => ({
  useActieItems: () => ({
    items: [
      { id: '1', ownerId: 'user-1', tekst: 'Bel klant terug', klaar: false, aangemaakt: 1 },
    ],
    loading: false,
    addItem,
    toggleItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}))

describe('ActielijstPage', () => {
  it('toont bestaande acties en voegt een nieuwe toe', async () => {
    const user = userEvent.setup()
    render(<ActielijstPage />)

    expect(screen.getByText('Bel klant terug')).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('Nieuwe actie'),
      'Factuur versturen',
    )
    await user.click(screen.getByRole('button', { name: 'Toevoegen' }))

    expect(addItem).toHaveBeenCalledWith('Factuur versturen')
  })
})
