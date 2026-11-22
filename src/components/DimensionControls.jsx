import { useRef, useState } from 'react'
import { DIMENSIONS, getForm } from '../constants.js'
import { curveNote, curvePhrase, openingLimits, readStudioNumber } from '../geometry.js'

function Slider({ field, value, min, max, onChange, describedBy, valueText }) {
  const meta = DIMENSIONS[field]
  const numberId = `${field}-number`
  const errorId = `${field}-error`
  const labelId = `${field}-label`
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const skipCommit = useRef(false)
  const shown = draft ?? value.toFixed(1)
  const span = Number(max) - Number(min)
  const ratio = span === 0 ? 0 : (Number(value) - Number(min)) / span

  function commit(raw) {
    const result = readStudioNumber(raw, min, max)
    setDraft(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setError('')
    if (result.value !== value) onChange(field, result.value)
  }

  return (
    <div className="slider">
      <div className="slider__row">
        <label id={labelId} htmlFor={field}>
          {meta.label}
        </label>
        <span className="slider__value">
          <input
            id={numberId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-labelledby={labelId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
            value={shown}
            onFocus={(event) => {
              setDraft(event.target.value)
              event.target.select()
            }}
            onChange={(event) => {
              setDraft(event.target.value)
              setError('')
            }}
            onBlur={(event) => {
              if (skipCommit.current) {
                skipCommit.current = false
                setDraft(null)
                return
              }
              commit(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                skipCommit.current = true
                setDraft(null)
                setError('')
                event.currentTarget.blur()
              }
            }}
          />
          {meta.unit ? <span aria-hidden="true">{meta.unit}</span> : null}
        </span>
      </div>
      <div className="slider__range" style={{ '--ratio': Math.min(1, Math.max(0, ratio)) }}>
        <div className="slider__track" aria-hidden="true">
          <div className="slider__fill" />
        </div>
        <div className="slider__thumb" aria-hidden="true" />
        <input
          id={field}
          type="range"
          min={min}
          max={max}
          step={meta.step}
          value={value}
          aria-valuetext={valueText || `${value.toFixed(1)} centimetres`}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
          onChange={(event) => {
            setDraft(null)
            setError('')
            onChange(field, event.target.value)
          }}
        />
      </div>
      {error ? (
        <p id={errorId} className="field-error" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function DimensionControls({ study, onChange }) {
  const form = getForm(study.form)
  const opening = openingLimits(study.form, study.width)

  return (
    <fieldset className="dims">
      <legend>Studio proportions</legend>
      <p className="field-note">
        These centimetres belong to the drawing. They are sketch proportions, not a
        throwing measure or a kiln prediction.
      </p>
      <Slider
        field="height"
        value={study.height}
        min={DIMENSIONS.height.min}
        max={DIMENSIONS.height.max}
        onChange={onChange}
      />
      <Slider
        field="width"
        value={study.width}
        min={DIMENSIONS.width.min}
        max={DIMENSIONS.width.max}
        onChange={onChange}
      />
      <Slider
        field="opening"
        value={study.opening}
        min={opening.min}
        max={opening.max}
        onChange={onChange}
      />
      <p className="field-note">
        {form.openingNote} On this {form.label.toLowerCase()} the opening runs from{' '}
        {opening.min.toFixed(1)} to {opening.max.toFixed(1)} cm.
      </p>
      <Slider
        field="curve"
        value={study.curve}
        min={DIMENSIONS.curve.min}
        max={DIMENSIONS.curve.max}
        onChange={onChange}
        describedBy="curve-note"
        valueText={`${study.curve.toFixed(1)}, ${curvePhrase(study.form, study.curve)}`}
      />
      <p id="curve-note" className="field-note">
        {curveNote(study.form, study.curve)}
      </p>
    </fieldset>
  )
}
