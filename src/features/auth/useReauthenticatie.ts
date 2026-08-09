import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '../../lib/firebase'

/** Vraagt het huidige (gedeelde) inlogwachtwoord opnieuw ter bevestiging vóór
 * een destructieve actie. Gooit een fout bij onjuist wachtwoord — de
 * aanroepende component vangt dat af. */
export async function bevestigMetWachtwoord(wachtwoord: string): Promise<void> {
  const user = auth.currentUser
  if (!user?.email) throw new Error('Niet ingelogd')
  const credential = EmailAuthProvider.credential(user.email, wachtwoord)
  await reauthenticateWithCredential(user, credential)
}
