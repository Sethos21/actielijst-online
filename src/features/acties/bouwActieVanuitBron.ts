import type { ActieHerkomstType, ActieItem } from './types'

interface BronVoorActie {
  type: ActieHerkomstType
  bronId: string
  label: string
  klantId: string
  pandId: string
  pandNaam: string
}

/** Bouwt een nieuwe, lege actie op basis van een onderhoud/mjop/document-item —
 * onderwerp en vestiging vooringevuld, met een herkomst-verwijzing terug naar de bron. */
export function bouwActieVanuitBron(bron: BronVoorActie): Omit<ActieItem, 'id'> {
  return {
    klantId: bron.klantId,
    ref: '',
    onderwerp: bron.label,
    bedrijf: '',
    vestiging: bron.pandNaam,
    pandId: bron.pandId,
    actie: '',
    verantw: [],
    aangemaaktOp: new Date().toISOString().slice(0, 10),
    doorlooptijd: '2w',
    status: 'open',
    opmerking: '',
    herkomst: { type: bron.type, bronId: bron.bronId, label: bron.label },
  }
}
