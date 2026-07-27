import { signOut } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '../../lib/firebase'
import { LoginForm } from '../auth/LoginForm'
import { useAuthUser } from '../auth/useAuthUser'
import { useActieItems } from './useActieItems'

export function ActielijstPage() {
  const { user, loading: authLoading } = useAuthUser()
  const { items, loading, addItem, toggleItem, deleteItem } = useActieItems(
    user?.uid,
  )
  const [nieuweActie, setNieuweActie] = useState('')

  if (authLoading) {
    return <p>Laden...</p>
  }

  if (!user) {
    return <LoginForm />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await addItem(nieuweActie)
    setNieuweActie('')
  }

  return (
    <div>
      <header>
        <h1>Mijn actielijst</h1>
        <p>{user.email}</p>
        <button onClick={() => signOut(auth)}>Uitloggen</button>
      </header>

      <form onSubmit={handleSubmit}>
        <label htmlFor="nieuwe-actie">Nieuwe actie</label>
        <input
          id="nieuwe-actie"
          value={nieuweActie}
          onChange={(e) => setNieuweActie(e.target.value)}
          placeholder="Bijv. Contract opsturen naar klant"
        />
        <button type="submit">Toevoegen</button>
      </form>

      {loading ? (
        <p>Acties laden...</p>
      ) : items.length === 0 ? (
        <p>Nog geen acties. Voeg er hierboven eentje toe.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={item.klaar}
                  onChange={() => toggleItem(item)}
                />
                <span
                  style={{
                    textDecoration: item.klaar ? 'line-through' : 'none',
                  }}
                >
                  {item.tekst}
                </span>
              </label>
              <button onClick={() => deleteItem(item.id)}>Verwijderen</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
