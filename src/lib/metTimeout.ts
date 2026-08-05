export class TimeoutFout extends Error {}

/**
 * Voorkomt dat de UI oneindig op "Bezig..." blijft staan als een
 * Firestore-schrijfactie om wat voor reden dan ook nooit resolvet of
 * afwijst (bv. een netwerkprobleem dat geen directe foutmelding geeft).
 */
export function metTimeout<T>(belofte: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TimeoutFout(`Duurde langer dan ${ms / 1000} seconden`)),
      ms,
    )
    belofte.then(
      (waarde) => {
        clearTimeout(timer)
        resolve(waarde)
      },
      (fout: unknown) => {
        clearTimeout(timer)
        reject(fout)
      },
    )
  })
}

export function foutmelding(fout: unknown, actie: string): string {
  if (fout instanceof TimeoutFout) {
    return 'Dit duurt ongewoon lang — controleer je internetverbinding en probeer het opnieuw.'
  }
  if (fout instanceof Error) {
    return `${actie} is niet gelukt: ${fout.message}`
  }
  return `${actie} is niet gelukt. Probeer het opnieuw.`
}
