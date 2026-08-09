import { describe, expect, it } from 'vitest'
import type { ActieItem } from '../acties/types'
import type { Mutatie } from '../huurdersmutaties/types'
import type { Onderhoud } from '../onderhoud/types'
import {
  bepaalHuidigKwartaal,
  bepaalKwartaalGrenzen,
  berekenOnderhoudUitgevoerdInPeriode,
  bouwKwartaalRapport,
  formatKwartaalLabel,
  formatPeriodeLabel,
  genereerKwartaalOpties,
  mutatieHoortBijKlant,
} from './kwartaalLogica'

function actie(overrides: Partial<ActieItem>): ActieItem {
  return {
    id: 'a1',
    klantId: 'klant-1',
    ref: '',
    onderwerp: 'Onderwerp',
    bedrijf: '',
    vestiging: '',
    actie: '',
    verantw: [],
    aangemaaktOp: '2026-04-01',
    doorlooptijd: '2w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
}

function mutatie(overrides: Partial<Mutatie>): Mutatie {
  return {
    id: 'm1',
    richting: 'in',
    jaar: 2026,
    maand: 5,
    datum: '2026-05-10',
    naam: 'Huurder',
    locatie: '',
    administratie: '',
    opmerking: '',
    ...overrides,
  }
}

describe('bepaalKwartaalGrenzen', () => {
  it('berekent de grenzen van Q2 2026', () => {
    expect(bepaalKwartaalGrenzen(2026, 2)).toEqual({
      start: '2026-04-01',
      eind: '2026-07-01',
    })
  })

  it('berekent de grenzen van Q1 en Q4', () => {
    expect(bepaalKwartaalGrenzen(2026, 1)).toEqual({
      start: '2026-01-01',
      eind: '2026-04-01',
    })
    expect(bepaalKwartaalGrenzen(2026, 4)).toEqual({
      start: '2026-10-01',
      eind: '2027-01-01',
    })
  })
})

describe('mutatieHoortBijKlant', () => {
  it('matcht op klantnaam in de locatie', () => {
    expect(mutatieHoortBijKlant(mutatie({ locatie: 'Malcon B.V. - Hoofdstraat' }), 'Malcon B.V.', [])).toBe(true)
  })

  it('matcht op een pandnaam in de locatie', () => {
    expect(
      mutatieHoortBijKlant(mutatie({ locatie: 'Kerkstraat 4b, Tilburg' }), 'Malcon B.V.', [
        'Kerkstraat 4b',
      ]),
    ).toBe(true)
  })

  it('matcht niet als niets overeenkomt', () => {
    expect(mutatieHoortBijKlant(mutatie({ locatie: 'Andere straat 1' }), 'Malcon B.V.', ['Kerkstraat 4b'])).toBe(
      false,
    )
  })
})

describe('bouwKwartaalRapport', () => {
  const periodeStart = '2026-04-01'
  const periodeEind = '2026-07-01'

  it('telt afgeronde acties op tijd en te laat, en berekent de gemiddelde doorlooptijd', () => {
    const acties = [
      actie({
        id: 'op-tijd',
        aangemaaktOp: '2026-04-01',
        doorlooptijd: '2w', // due 2026-04-15
        afgerondOp: '2026-04-10',
        status: 'done',
      }),
      actie({
        id: 'te-laat',
        aangemaaktOp: '2026-04-01',
        doorlooptijd: '1w', // due 2026-04-08
        afgerondOp: '2026-04-20',
        status: 'done',
      }),
      actie({
        id: 'buiten-periode',
        aangemaaktOp: '2026-01-01',
        doorlooptijd: '2w',
        afgerondOp: '2026-03-01',
        status: 'done',
      }),
    ]

    const rapport = bouwKwartaalRapport('klant-1', 'Malcon B.V.', [], acties, [], periodeStart, periodeEind)

    expect(rapport.actiesAfgerond).toBe(2)
    expect(rapport.actiesAfgerondOpTijd).toBe(1)
    expect(rapport.actiesAfgerondTeLaat).toBe(1)
    expect(rapport.gemiddeldeDoorlooptijdDagen).toBe(14) // (9 + 19) / 2
  })

  it('geeft null voor gemiddelde doorlooptijd als niets is afgerond in de periode', () => {
    const rapport = bouwKwartaalRapport('klant-1', 'Malcon B.V.', [], [], [], periodeStart, periodeEind)
    expect(rapport.gemiddeldeDoorlooptijdDagen).toBeNull()
  })

  it('telt nog openstaande acties en due acties', () => {
    const acties = [
      actie({ id: 'open-1', status: 'open', aangemaaktOp: '2026-01-01', doorlooptijd: '1w' }), // due, lang verleden
      actie({ id: 'open-2', status: 'open', aangemaaktOp: '2099-01-01', doorlooptijd: '4w' }), // niet due
      actie({ id: 'hold-1', status: 'hold', aangemaaktOp: '2026-01-01', doorlooptijd: '1w' }), // nooit due
      actie({ id: 'done-1', status: 'done', afgerondOp: '2026-05-01' }),
    ]

    const rapport = bouwKwartaalRapport('klant-1', 'Malcon B.V.', [], acties, [], periodeStart, periodeEind)

    expect(rapport.nogOpenstaand).toBe(2)
    expect(rapport.nogOpenstaandDue).toBe(1)
  })

  it('koppelt en telt mutaties in/uit binnen de periode via tekstuele match', () => {
    const mutaties = [
      mutatie({ id: 'in-1', richting: 'in', locatie: 'Malcon B.V.', datum: '2026-05-01' }),
      mutatie({ id: 'uit-1', richting: 'uit', locatie: 'Malcon B.V.', datum: '2026-06-01' }),
      mutatie({ id: 'buiten-periode', richting: 'in', locatie: 'Malcon B.V.', datum: '2026-01-01' }),
      mutatie({ id: 'andere-klant', richting: 'in', locatie: 'Onbekend pand', datum: '2026-05-01' }),
    ]

    const rapport = bouwKwartaalRapport('klant-1', 'Malcon B.V.', [], [], mutaties, periodeStart, periodeEind)

    expect(rapport.mutatiesIn).toBe(1)
    expect(rapport.mutatiesUit).toBe(1)
  })

  it('negeert acties van andere klanten', () => {
    const acties = [actie({ id: 'ander', klantId: 'klant-2', status: 'open' })]
    const rapport = bouwKwartaalRapport('klant-1', 'Malcon B.V.', [], acties, [], periodeStart, periodeEind)
    expect(rapport.nogOpenstaand).toBe(0)
  })
})

describe('berekenOnderhoudUitgevoerdInPeriode', () => {
  function onderhoud(overrides: Partial<Onderhoud>): Onderhoud {
    return {
      id: 'o1',
      pandId: 'p1',
      klantId: 'klant-1',
      naam: 'CV-ketel',
      verantw: 'Ton',
      herhaling: 'jaarlijks',
      volgendeDatum: Date.now(),
      aangemaaktOp: Date.now(),
      ...overrides,
    }
  }

  it('telt alleen items uitgevoerd binnen de periode', () => {
    const items = [
      onderhoud({ laatstUitgevoerdOp: new Date('2026-05-01').getTime() }),
      onderhoud({ laatstUitgevoerdOp: new Date('2026-01-01').getTime() }),
      onderhoud({ laatstUitgevoerdOp: undefined }),
    ]
    expect(berekenOnderhoudUitgevoerdInPeriode(items, '2026-04-01', '2026-07-01')).toBe(1)
  })
})

describe('bepaalHuidigKwartaal', () => {
  it('bepaalt het juiste kwartaal per maand', () => {
    expect(bepaalHuidigKwartaal(new Date(2026, 7, 8))).toEqual({ jaar: 2026, kwartaal: 3 })
    expect(bepaalHuidigKwartaal(new Date(2026, 0, 15))).toEqual({ jaar: 2026, kwartaal: 1 })
    expect(bepaalHuidigKwartaal(new Date(2026, 11, 31))).toEqual({ jaar: 2026, kwartaal: 4 })
  })
})

describe('genereerKwartaalOpties', () => {
  it('genereert 8 kwartalen: huidig en vorig jaar, meest recent eerst', () => {
    const opties = genereerKwartaalOpties(2026)
    expect(opties).toHaveLength(8)
    expect(opties[0]).toEqual({ jaar: 2026, kwartaal: 4 })
    expect(opties[7]).toEqual({ jaar: 2025, kwartaal: 1 })
  })
})

describe('formatKwartaalLabel / formatPeriodeLabel', () => {
  it('formatteert het kwartaal-label', () => {
    expect(formatKwartaalLabel({ jaar: 2026, kwartaal: 2 })).toBe('Q2 2026')
  })

  it('formatteert de periode in het Nederlands, met exclusief-einde één dag terug', () => {
    expect(formatPeriodeLabel('2026-04-01', '2026-07-01')).toBe('1 april 2026 — 30 juni 2026')
  })
})
