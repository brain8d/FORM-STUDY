import { FORMS } from '../constants.js'

export default function FormPicker({ value, onChange }) {
  return (
    <fieldset className="chooser">
      <legend>Ceramic form</legend>
      <div className="chooser__grid">
        {FORMS.map((form) => {
          const selected = form.id === value
          return (
            <label key={form.id} className={selected ? 'choice choice--on' : 'choice'}>
              <input
                type="radio"
                name="ceramic-form"
                value={form.id}
                checked={selected}
                onChange={() => onChange(form.id)}
              />
              <span className="choice__kicker">{form.kicker}</span>
              <span className="choice__label">{form.label}</span>
              <span className="choice__copy">{form.description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
