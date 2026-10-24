import { DIMENSIONS } from '../constants.js'
import { formatStudioValue } from '../geometry.js'

function Slider({ id, field, value, onChange }) {
  const meta = DIMENSIONS[field]
  return (
    <div className="slider">
      <div className="slider__row">
        <label htmlFor={id}>{meta.label}</label>
        <output htmlFor={id}>{formatStudioValue(value, meta.unit)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </div>
  )
}

export default function DimensionControls({ study, onChange }) {
  return (
    <fieldset className="dims">
      <legend>Studio proportions</legend>
      <p className="field-note">
        These are sketching units for the illustration, not throwing specs or kiln
        predictions.
      </p>
      <Slider id="height" field="height" value={study.height} onChange={onChange} />
      <Slider id="width" field="width" value={study.width} onChange={onChange} />
      <Slider id="opening" field="opening" value={study.opening} onChange={onChange} />
    </fieldset>
  )
}
