import { APP_NAME, DIMENSIONS, getFinish, getForm, getPalette } from '../constants.js'
import { formatStudioValue } from '../geometry.js'
import VesselIllustration from './VesselIllustration.jsx'

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'long',
    }).format(iso ? new Date(iso) : new Date())
  } catch {
    return ''
  }
}

export default function DesignSheet({ study, onClose }) {
  const form = getForm(study.form)
  const palette = getPalette(study.paletteId)
  const finish = getFinish(study.finish)
  const titleId = 'sheet-title'

  return (
    <div className="sheet-layer" role="presentation" onClick={onClose}>
      <div
        className="design-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet__top no-print">
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

        <div className="sheet__page">
          <p className="kicker">Design brief</p>
          <h2 id={titleId}>{study.name || 'Untitled study'}</h2>
          <p className="sheet__date">{formatDate(study.updatedAt)}</p>

          <div className="sheet__grid">
            <figure className="sheet__figure">
              <VesselIllustration study={study} labelledBy={titleId} />
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
            This sheet is a two-dimensional study drawing. Proportions are studio
            units for sketching. They are not measured throwing specifications,
            and the illustration does not predict glaze, shrinkage or firing.
          </p>
        </div>
      </div>
    </div>
  )
}
