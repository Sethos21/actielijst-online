import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '../../lib/firebase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'inloggen' | 'registreren'>('inloggen')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (mode === 'inloggen') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch {
      setError('Inloggen is niet gelukt. Controleer je gegevens.')
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label={mode}>
      <h2>{mode === 'inloggen' ? 'Inloggen' : 'Account aanmaken'}</h2>
      <label>
        E-mailadres
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Wachtwoord
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">
        {mode === 'inloggen' ? 'Inloggen' : 'Registreren'}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === 'inloggen' ? 'registreren' : 'inloggen')}
      >
        {mode === 'inloggen'
          ? 'Nog geen account? Registreer'
          : 'Al een account? Log in'}
      </button>
    </form>
  )
}
