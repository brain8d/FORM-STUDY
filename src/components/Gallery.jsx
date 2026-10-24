import { getForm, getPalette } from '../constants.js'
import VesselIllustration from './VesselIllustration.jsx'

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export default function Gallery({ studies, onOpen, onDelete, onSheet }) {
  return (
    <section className="gallery no-print" aria-labelledby="gallery-title">
      <div className="section-head">
        <p className="kicker">Archive</p>
        <h2 id="gallery-title">Saved studies</h2>
      </div>
      {studies.length === 0 ? (
        <p className="empty">
          No studies saved yet. Name a form and keep it here — the archive stays
          on this device.
        </p>
      ) : (
        <ul className="gallery__list">
          {studies.map((study) => {
            const form = getForm(study.form)
            const palette = getPalette(study.paletteId)
            const titleId = `study-${study.id}`
            return (
              <li key={study.id} className="card">
                <div className="card__art" aria-hidden="true">
                  <VesselIllustration study={study} compact labelledBy={titleId} />
                </div>
                <div className="card__body">
                  <p className="card__date">{formatDate(study.updatedAt)}</p>
                  <h3 id={titleId}>{study.name}</h3>
                  <p className="card__meta">
                    {form.label} · {palette.name} · {study.finish}
                  </p>
                  {study.note ? <p className="card__note">{study.note}</p> : null}
                  <div className="card__actions">
                    <button type="button" className="btn btn--small" onClick={() => onOpen(study)}>
                      Reopen
                    </button>
                    <button type="button" className="btn btn--small" onClick={() => onSheet(study)}>
                      Sheet
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--danger"
                      onClick={() => onDelete(study.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
