import { teamlidKleurKlasse, initialen } from '../features/team/teamlidKleur'

interface Props {
  naam: string
  alleNamen: readonly string[]
  actief: boolean
  onToggle: () => void
}

export function AvatarChip({ naam, alleNamen, actief, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`avatar-chip ${teamlidKleurKlasse(naam, alleNamen)} ${actief ? 'actief' : 'inactief'}`}
      onClick={onToggle}
      title={naam}
      aria-pressed={actief}
      aria-label={naam}
    >
      {initialen(naam)}
    </button>
  )
}
