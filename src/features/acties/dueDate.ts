import type { ActieItem } from './types'

/** Telt een aantal weken of maanden op bij een datum, ISO (YYYY-MM-DD) in en uit. */
export function voegPeriodeToe(
  isoDatum: string,
  eenheid: 'w' | 'm',
  aantal: number,
): string {
  const datum = new Date(isoDatum + 'T00:00:00')
  if (eenheid === 'w') {
    datum.setDate(datum.getDate() + aantal * 7)
  } else {
    datum.setMonth(datum.getMonth() + aantal)
  }
  return datum.toISOString().slice(0, 10)
}

/**
 * Due date berekening, prioriteit: postponedTot (uitstel-knop) wint van
 * dueDateOverride (handmatige due date), die op zijn beurt wint van de
 * automatische berekening uit aangemaaktOp + doorlooptijd.
 */
export function berekenDueDate(
  actie: Pick<
    ActieItem,
    'aangemaaktOp' | 'doorlooptijd' | 'dueDateOverride' | 'postponedTot'
  >,
): string {
  if (actie.postponedTot) return actie.postponedTot
  if (actie.dueDateOverride) return actie.dueDateOverride

  const eenheid = actie.doorlooptijd.endsWith('w') ? 'w' : 'm'
  const aantal = parseInt(actie.doorlooptijd, 10)
  return voegPeriodeToe(actie.aangemaaktOp, eenheid, aantal)
}

/**
 * Een actie is "Due" als hij nog open staat én de due date verstreken is.
 * On hold-acties zijn nooit Due, ongeacht de due date — dat is een expliciete
 * bedrijfsregel, niet een uitzondering die per ongeluk vergeten mag worden.
 */
export function isDue(
  actie: Pick<
    ActieItem,
    'status' | 'aangemaaktOp' | 'doorlooptijd' | 'dueDateOverride' | 'postponedTot'
  >,
): boolean {
  if (actie.status !== 'open') return false
  const due = berekenDueDate(actie)
  const vandaag = new Date().toISOString().slice(0, 10)
  return due < vandaag
}
