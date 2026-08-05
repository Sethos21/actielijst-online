import { useState } from 'react'

interface Props {
  waarde: string
  suggesties: string[]
  placeholder: string
  ariaLabel: string
  onChange: (waarde: string) => void
}

/** Vrij te typen veld met suggesties op basis van eerder ingevoerde waarden. */
export function AutocompleteInput({ waarde, suggesties, placeholder, ariaLabel, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const term = waarde.trim().toLowerCase()
  const matches = term
    ? suggesties.filter((s) => s.toLowerCase().includes(term)).slice(0, 6)
    : []

  return (
    <div className="hm-autocomplete">
      <input
        className="hm-field"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={waarde}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="hm-suggesties" role="listbox">
          {matches.map((match) => (
            <div
              key={match}
              className="hm-suggestie"
              role="option"
              aria-selected="false"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(match)
                setOpen(false)
              }}
            >
              {match}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
