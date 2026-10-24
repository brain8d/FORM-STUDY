import { FINISHES } from '../constants.js'

export default function FinishPicker({ value, onChange }) {
  return (
    <fieldset className="chooser">
      <legend>Surface</legend>
      <div className="chooser__row" role="radiogroup" aria-label="Surface finish">
        {FINISHES.map((finish) => {
          const selected = finish.id === value
          return (
            <button
              key={finish.id}
              type="button"
              className={selected ? 'choice choice--slim choice--on' : 'choice choice--slim'}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(finish.id)}
            >
              <span className="choice__label">{finish.label}</span>
              <span className="choice__copy">{finish.description}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
