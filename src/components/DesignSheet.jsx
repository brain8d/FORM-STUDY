import { useEffect, useId, useRef } from 'react'
import { APP_NAME, DIMENSIONS, getFinish, getForm, getPalette } from '../constants.js'
import { formatStudioValue } from '../geometry.js'
import VesselIllustration from './VesselIllustration.jsx'

function formatDate(iso) {
  if (!iso) return 'Working study'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Working study'
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)
}

export function SheetPage({ study, titleId }) {
  const form = getForm(study.form)
  const palette = getPalette(study.paletteId)
  const finish = getFinish(study.finish)
  const headingId = titleId || 'design-sheet-title'

  return (
    <div className="sheet__page">
      <p className="kicker">Design brief</p>
      <h2 id={headingId}>{study.name || 'Untitled study'}</h2>
      <p className="sheet__date">{formatDate(study.updatedAt)}</p>

      <div className="sheet__grid">
        <figure className="sheet__figure">
          <VesselIllustration study={study} labelledBy={headingId} />
        </figure>
        <dl className="sheet__facts">
          <div>
            <dt>Form</dt>
            <dd>
              {form.label}
              <span>{form.description}</span>
            </dd>
          </div>
          <div>
            <dt>{DIMENSIONS.height.label}</dt>
            <dd>{formatStudioValue(study.height, DIMENSIONS.height.unit)}</dd>
          </div>
          <div>
            <dt>{DIMENSIONS.width.label}</dt>
            <dd>{formatStudioValue(study.width, DIMENSIONS.width.unit)}</dd>
          </div>
          <div>
            <dt>{DIMENSIONS.opening.label}</dt>
            <dd>{formatStudioValue(study.opening, DIMENSIONS.opening.unit)}</dd>
          </div>
          <div>
            <dt>Palette</dt>
            <dd>
              {palette.name}
              <span>{palette.note}</span>
            </dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>
              {finish.label}
              <span>{finish.description}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="sheet__swatches" aria-hidden="true">
        <span style={{ background: palette.clay }} />
        <span style={{ background: palette.glaze }} />
        <span style={{ background: palette.interior }} />
        <span style={{ background: palette.rim }} />
      </div>

      <section className="sheet__note">
        <h3>Studio note</h3>
        <p>{study.note || 'No note recorded.'}</p>
      </section>

      <p className="sheet__disclaimer">
        A flat study drawing for the studio desk. The centimetres are sketch units
        for this page. They are not a throwing specification, and the picture does
        not predict glaze, shrinkage or firing.
      </p>
      <p className="sheet__sign">{APP_NAME}</p>
    </div>
  )
}

function focusable(root) {
  return [...root.querySelectorAll('button, [href], input, textarea, select')].filter(
    (node) => !node.disabled && node.getAttribute('tabindex') !== '-1',
  )
}

export default function DesignSheet({ study, onClose }) {
  const titleId = useId()
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previously = document.activeElement
    dialog?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const items = focusable(dialog)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previously instanceof HTMLElement) previously.focus()
    }
  }, [onClose])

  return (
    <div className="sheet-layer no-print" onClick={onClose}>
      <div
        ref={dialogRef}
        className="design-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet__top">
          <p className="kicker">{APP_NAME}</p>
          <div className="sheet__tools">
            <button type="button" className="btn btn--primary" onClick={() => window.print()}>
              Print sheet
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <SheetPage study={study} titleId={titleId} />
      </div>
    </div>
  )
}
