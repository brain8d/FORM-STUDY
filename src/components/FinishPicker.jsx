import { FINISHES } from '../constants.js'

export default function FinishPicker({ value, onChange }) {
  return (
    <fieldset className="chooser">
      <legend>Surface</legend>
      <div className="chooser__row">
        {FINISHES.map((finish) => {
          const selected = finish.id === value
          return (
            <label
              key={finish.id}
              className={selected ? 'choice choice--slim choice--on' : 'choice choice--slim'}
            >
              <input
                type="radio"
                name="surface-finish"
                value={finish.id}
                checked={selected}
                onChange={() => onChange(finish.id)}
              />
              <span className="choice__label">{finish.label}</span>
              <span className="choice__copy">{finish.description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
