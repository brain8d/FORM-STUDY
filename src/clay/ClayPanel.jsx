import { CLAY_COLORS, CLAY_FINISHES, CLAY_FORMS, CLAY_LIMITS, curveLabel, getClayColor, getClayFinish } from './model.js'

function Slider({ field, value, onChange }) {
  const meta = CLAY_LIMITS[field]
  const shown = Number(value).toFixed(1)
  return (
    <div className="slider">
      <div className="slider__row">
        <label htmlFor={`clay-${field}`}>{meta.label}</label>
        <span className="slider__value">
          {shown}
          {meta.unit ? <span aria-hidden="true"> {meta.unit}</span> : null}
        </span>
      </div>
      <input
        id={`clay-${field}`}
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        aria-valuetext={meta.unit ? `${shown} centimetres` : shown}
        onChange={(event) => onChange(field, Number(event.target.value))}
      />
    </div>
  )
}

export default function ClayPanel({ study, onChange, onForm, onReset, onResetView }) {
  const color = getClayColor(study.color)
  const finish = getClayFinish(study.finish)

  return (
    <form className="clay__panel" onSubmit={(event) => event.preventDefault()}>
      <fieldset className="chooser">
        <legend>Starting form</legend>
        <div className="chooser__row">
          {CLAY_FORMS.map((form) => {
            const selected = form.id === study.form
            return (
              <label key={form.id} className={selected ? 'choice choice--on choice--slim' : 'choice choice--slim'}>
                <input
                  type="radio"
                  name="clay-form"
                  value={form.id}
                  checked={selected}
                  onChange={() => onForm(form.id)}
                />
                <span className="choice__kicker">{form.kicker}</span>
                <span className="choice__label">{form.label}</span>
              </label>
            )
          })}
        </div>
        <p className="field-note">{CLAY_FORMS.find((form) => form.id === study.form)?.description}</p>
      </fieldset>

      <fieldset>
        <legend>Proportion</legend>
        {Object.keys(CLAY_LIMITS).map((field) => (
          <Slider key={field} field={field} value={study[field]} onChange={onChange} />
        ))}
        <p className="field-note">{curveLabel(study.curve)}. The wall stays hollow, with a lip you can look into.</p>
      </fieldset>

      <fieldset>
        <legend>Clay</legend>
        <div className="swatches">
          {CLAY_COLORS.map((item) => {
            const selected = item.id === study.color
            return (
              <label key={item.id} className={selected ? 'swatch swatch--on' : 'swatch'}>
                <input
                  type="radio"
                  name="clay-color"
                  value={item.id}
                  checked={selected}
                  onChange={() => onChange('color', item.id)}
                />
                <span className="swatch__chip" style={{ background: item.glaze }} />
                <span className="swatch__name">{item.name}</span>
              </label>
            )
          })}
        </div>
        <p className="palette-note">
          <span>{color.name}</span>
        </p>
      </fieldset>

      <fieldset className="chooser">
        <legend>Surface</legend>
        <div className="clay__finishes">
          {CLAY_FINISHES.map((item) => {
            const selected = item.id === study.finish
            return (
              <label key={item.id} className={selected ? 'choice choice--on choice--slim' : 'choice choice--slim'}>
                <input
                  type="radio"
                  name="clay-finish"
                  value={item.id}
                  checked={selected}
                  onChange={() => onChange('finish', item.id)}
                />
                <span className="choice__label">{item.label}</span>
                <span className="choice__copy">{item.description}</span>
              </label>
            )
          })}
        </div>
        <p className="field-note">{finish.description}</p>
      </fieldset>

      <div className="meta__actions">
        <button type="button" className="btn" onClick={onResetView}>
          Reset view
        </button>
        <button type="button" className="btn btn--primary" onClick={onReset}>
          Reset form
        </button>
      </div>
      <p className="field-note">Sketch proportions only. Not a throwing plan or a firing prediction.</p>
    </form>
  )
}
