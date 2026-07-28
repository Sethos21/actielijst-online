import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '../../lib/firebase'

// BVC werkt met één gedeeld teamaccount (aangemaakt door de beheerder in de
// Firebase Console), niet met individuele accounts — dus geen registratie hier.
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Inloggen is niet gelukt. Controleer je gegevens.')
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="inloggen">
      <h2>Inloggen</h2>
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
      <button type="submit">Inloggen</button>
    </form>
  )
}
