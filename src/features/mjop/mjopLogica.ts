import type { MjopPost } from './types'

export interface MjopSamenvatting {
  totaalGepland: number
  ditJaarBedrag: number
  aantalPosten: number
}

export function berekenMjopSamenvatting(
  posten: MjopPost[],
  huidigJaar: number,
): MjopSamenvatting {
  return {
    totaalGepland: posten.reduce((som, post) => som + post.geschatBedrag, 0),
    ditJaarBedrag: posten
      .filter((post) => post.jaar === huidigJaar)
      .reduce((som, post) => som + post.geschatBedrag, 0),
    aantalPosten: posten.length,
  }
}

/** Groepeert posten per jaar, oplopend gesorteerd op jaar. */
export function groepeerPerJaar(posten: MjopPost[]): [number, MjopPost[]][] {
  const groepen = new Map<number, MjopPost[]>()
  for (const post of posten) {
    const lijst = groepen.get(post.jaar) ?? []
    lijst.push(post)
    groepen.set(post.jaar, lijst)
  }
  return Array.from(groepen.entries()).sort(([a], [b]) => a - b)
}
