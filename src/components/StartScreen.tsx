interface Props {
  onKiesActielijsten: () => void
  onKiesHuurdersmutaties: () => void
}

function ActielijstenIcoon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="32" height="32" rx="3" stroke="var(--text)" strokeWidth="2.5" />
      <path
        d="M11 20l6 6 12-14"
        stroke="var(--text)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HuurdersmutatiesIcoon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 5 L36 18 H32 V34 H8 V18 H4 Z"
        stroke="var(--text)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="17" y="8" width="10" height="7" fill="var(--red)" opacity="0.8" />
      <rect x="14" y="20" width="6" height="6" fill="var(--navy-light)" />
      <rect x="10" y="30" width="20" height="3" fill="var(--green)" />
    </svg>
  )
}

export function StartScreen({ onKiesActielijsten, onKiesHuurdersmutaties }: Props) {
  return (
    <div className="startscherm">
      <div className="startscherm-merk">
        <span className="startscherm-logo">BVC</span>
        <span className="startscherm-submerk">Vastgoed Consultants</span>
      </div>

      <div className="startscherm-tegels">
        <button
          type="button"
          className="startscherm-tegel"
          onClick={onKiesActielijsten}
        >
          <ActielijstenIcoon />
          <span className="startscherm-tegel-titel">Actielijsten</span>
          <span className="startscherm-tegel-omschrijving">
            Acties per klant bijhouden, dashboard en versiebeheer
          </span>
        </button>

        <button
          type="button"
          className="startscherm-tegel"
          onClick={onKiesHuurdersmutaties}
        >
          <HuurdersmutatiesIcoon />
          <span className="startscherm-tegel-titel">Huurdersmutaties</span>
          <span className="startscherm-tegel-omschrijving">
            Ingaande en vertrekkende huurders per maand
          </span>
        </button>
      </div>
    </div>
  )
}
