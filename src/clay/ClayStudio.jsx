import { useCallback, useId, useRef, useState } from 'react'
import ClayCanvas from './ClayCanvas.jsx'
import ClayPanel from './ClayPanel.jsx'
import {
  DEFAULT_CLAY,
  FORM_BODIES,
  curveLabel,
  getClayColor,
  getClayFinish,
  getClayForm,
} from './model.js'

export default function ClayStudio({ study, onChange }) {
  const titleId = useId()
  const descId = useId()
  const controlsRef = useRef(null)
  const [token, setToken] = useState(0)
  const rememberControls = useCallback((controls) => {
    controlsRef.current = controls
  }, [])
  const form = getClayForm(study.form)
  const color = getClayColor(study.color)
  const finish = getClayFinish(study.finish)

  function change(field, value) {
    onChange({ ...study, [field]: value })
  }

  function pickForm(id) {
    onChange({
      ...FORM_BODIES[id],
      color: study.color,
      finish: study.finish,
    })
    setToken((value) => value + 1)
  }

  function onKeyDown(event) {
    const controls = controlsRef.current
    if (!controls) return
    const step = event.shiftKey ? 0.06 : 0.14
    if (event.key === 'ArrowLeft') controls.rotateLeft(step)
    else if (event.key === 'ArrowRight') controls.rotateLeft(-step)
    else if (event.key === 'ArrowUp') controls.rotateUp(step)
    else if (event.key === 'ArrowDown') controls.rotateUp(-step)
    else return
    event.preventDefault()
  }

  const description = [
    `Hollow ${form.label.toLowerCase()} in ${color.name.toLowerCase()}, ${finish.label.toLowerCase()} surface.`,
    `Height ${study.height.toFixed(1)} cm, width ${study.width.toFixed(1)} cm,`,
    `opening ${study.opening.toFixed(1)} cm, base ${study.base.toFixed(1)} cm,`,
    `neck ${study.neck.toFixed(1)} cm, ${curveLabel(study.curve).toLowerCase()}.`,
    'Drag to turn. Scroll to zoom. Arrow keys nudge the view.',
  ].join(' ')

  return (
    <section className="clay" id="clay" aria-labelledby={titleId}>
      <div
        className="clay__stage"
        role="img"
        tabIndex={0}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button === 0) event.currentTarget.focus()
        }}
        onDoubleClick={() => setToken((value) => value + 1)}
      >
        <div className="stage__rule" aria-hidden="true" />
        <div className="clay__label">
          <p className="kicker">Turned study</p>
          <h2 id={titleId}>{form.label}</h2>
        </div>
        <p id={descId} className="visually-hidden">
          {description}
        </p>
        <ClayCanvas study={study} token={token} onControls={rememberControls} />
      </div>
      <ClayPanel
        study={study}
        onChange={change}
        onForm={pickForm}
        onReset={() => {
          onChange(DEFAULT_CLAY)
          setToken((value) => value + 1)
        }}
        onResetView={() => setToken((value) => value + 1)}
      />
    </section>
  )
}
