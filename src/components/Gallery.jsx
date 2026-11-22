import { useState } from 'react'
import { getForm, getPalette } from '../constants.js'
import VesselIllustration from './VesselIllustration.jsx'

function formatDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function Gallery({ studies, notice, onOpen, onDelete, onSheet, embedded = false }) {
  const [pendingId, setPendingId] = useState(null)

  return (
    <section
      className={embedded ? 'gallery gallery--embedded no-print' : 'gallery no-print'}
      aria-labelledby="gallery-title"
    >
      {embedded ? (
        <h2 id="gallery-title" className="visually-hidden">
          Saved studies
        </h2>
      ) : (
        <div className="section-head">
          <p className="kicker">Archive</p>
          <h2 id="gallery-title">Saved studies</h2>
        </div>
      )}
      {notice ? <p className="gallery__status">{notice}</p> : null}
      {studies.length === 0 ? (
        <p className="empty">
          The archive is empty. Name a form and it will stay on this device, ready
          to reopen.
        </p>
      ) : (
        <ul className="gallery__list">
          {studies.map((study) => {
            const form = getForm(study.form)
            const palette = getPalette(study.paletteId)
            const titleId = `study-${study.id}`
            const confirming = pendingId === study.id
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
                  {confirming ? (
                    <div className="confirm" role="group" aria-label={`Remove ${study.name}`}>
                      <p>Remove “{study.name}” from this device?</p>
                      <div className="card__actions">
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => {
                            setPendingId(null)
                            onDelete(study.id)
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          className="btn btn--small"
                          autoFocus
                          onClick={() => setPendingId(null)}
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  ) : (
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
                        onClick={() => setPendingId(study.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
