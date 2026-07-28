import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

vi.mock('../../lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
}))

describe('LoginForm', () => {
  it('logt in met e-mail en wachtwoord van het gedeelde teamaccount', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('E-mailadres'), 'info@bvc.nl')
    await user.type(screen.getByLabelText('Wachtwoord'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'info@bvc.nl',
      'geheim123',
    )
  })

  it('biedt geen registratie-optie (één gedeeld teamaccount, geen zelfregistratie)', () => {
    render(<LoginForm />)

    expect(
      screen.queryByRole('button', { name: /registreren/i }),
    ).not.toBeInTheDocument()
  })
})
