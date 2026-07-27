import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

vi.mock('../../lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
}))

describe('LoginForm', () => {
  it('logt in met e-mail en wachtwoord', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('E-mailadres'), 'test@example.com')
    await user.type(screen.getByLabelText('Wachtwoord'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'test@example.com',
      'geheim123',
    )
  })

  it('wisselt naar registreren', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(
      screen.getByRole('button', { name: /nog geen account/i }),
    )

    expect(
      screen.getByRole('heading', { name: 'Account aanmaken' }),
    ).toBeInTheDocument()
  })
})
