import { FORMS } from '../constants.js'

export default function FormPicker({ value, onChange }) {
  return (
    <fieldset className="chooser">
      <legend>Ceramic form</legend>
      <div className="chooser__grid" role="radiogroup" aria-label="Ceramic form">
        {FORMS.map((form) => {
          const selected = form.id === value
          return (
            <button
              key={form.id}
              type="button"
              className={selected ? 'choice choice--on' : 'choice'}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(form.id)}
            >
              <span className="choice__kicker">{form.kicker}</span>
              <span className="choice__label">{form.label}</span>
              <span className="choice__copy">{form.description}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
