import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { APP_NAME, DEFAULT_STUDY, FORM_PRESETS, getFinish, getForm } from './constants.js'
import { curvePhrase, formatStudioValue, presentStudy } from './geometry.js'
import {
  STORAGE_KEY,
  createSavedStudy,
  loadStudies,
  persistStudies,
  untitledName,
} from './storage.js'
import DesignSheet, { SheetPage } from './components/DesignSheet.jsx'
import DimensionControls from './components/DimensionControls.jsx'
import FinishPicker from './components/FinishPicker.jsx'
import FormPicker from './components/FormPicker.jsx'
import Gallery from './components/Gallery.jsx'
import PalettePicker from './components/PalettePicker.jsx'
import StudyMeta from './components/StudyMeta.jsx'
import VesselIllustration from './components/VesselIllustration.jsx'
import './App.css'

const CHAPTERS = [
  { id: 'form', label: 'Form' },
  { id: 'wall', label: 'Wall' },
  { id: 'surface', label: 'Surface' },
  { id: 'note', label: 'Note' },
]

export default function App() {
  const titleId = useId()
  const [study, setStudy] = useState(() => presentStudy(DEFAULT_STUDY))
  const [studies, setStudies] = useState(() => loadStudies().studies)
  const [storageError, setStorageError] = useState(() => loadStudies().error)
  const [status, setStatus] = useState('')
  const [sheetStudy, setSheetStudy] = useState(null)
  const [presets, setPresets] = useState(FORM_PRESETS)
  const [chapter, setChapter] = useState('wall')
  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STORAGE_KEY) return
      const loaded = loadStudies()
      setStudies(loaded.studies)
      setStorageError(loaded.error)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const current = useMemo(() => presentStudy(study), [study])
  const printable = sheetStudy ? presentStudy(sheetStudy) : current

  function update(field, value) {
    setStatus('')
    if (field === 'form' && value !== current.form) {
      const nextPresets = {
        ...presets,
        [current.form]: {
          height: current.height,
          width: current.width,
          opening: current.opening,
          curve: current.curve,
        },
      }
      setPresets(nextPresets)
      setStudy(
        presentStudy({
          ...current,
          form: value,
          ...nextPresets[value],
          updatedAt: null,
        }),
      )
      return
    }
    setStudy((prev) => presentStudy({ ...prev, [field]: value, updatedAt: null }))
  }

  function saveArchive(next) {
    const result = persistStudies(next)
    if (result.error) {
      setStorageError(result.error)
      setStatus(result.error)
      return false
    }
    setStorageError(null)
    setStudies(next)
    return true
  }

  function handleSave(copy = false) {
    const name = current.name.trim() || untitledName(studies)
    const updating = !copy && current.id && studies.some((item) => item.id === current.id)
    const now = new Date().toISOString()
    const entry = updating
      ? presentStudy({
          ...current,
          name,
          createdAt: current.createdAt || now,
          updatedAt: now,
        })
      : createSavedStudy({ ...current, name })

    const next = updating
      ? [entry, ...studies.filter((item) => item.id !== entry.id)]
      : [entry, ...studies]
    if (!saveArchive(next)) return
    setStudy(presentStudy(entry))
    setStatus(updating ? `Updated “${entry.name}”.` : `Saved “${entry.name}”.`)
  }

  function handleOpen(entry) {
    const next = presentStudy(entry)
    setStudy(next)
    setPresets((prev) => ({
      ...prev,
      [next.form]: {
        height: next.height,
        width: next.width,
        opening: next.opening,
        curve: next.curve,
      },
    }))
    setStatus(`Reopened “${next.name}”.`)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('studio')?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const closeSheet = useCallback(() => setSheetStudy(null), [])

  function onChapterKey(event) {
    const order = CHAPTERS.map((item) => item.id)
    const index = order.indexOf(chapter)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % order.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + order.length) % order.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = order.length - 1
    else return
    event.preventDefault()
    const id = order[next]
    setChapter(id)
    document.getElementById(`chapter-${id}`)?.focus()
  }

  function handleDelete(id) {
    const next = studies.filter((item) => item.id !== id)
    if (!saveArchive(next)) return
    setStatus('Study removed from the archive.')
    if (sheetStudy?.id === id) setSheetStudy(null)
    setStudy((prev) => (prev.id === id ? presentStudy({ ...prev, id: null, createdAt: null, updatedAt: null }) : prev))
  }

  return (
    <div className="page">
      <a className="skip" href="#studio">
        Skip to studio
      </a>

      <header className="masthead no-print">
        <p className="wordmark">{APP_NAME}</p>
        <details className="dedication">
          <summary>For your birthday</summary>
          <p>
            You already think in clay before you think in words. This is a quiet
            desk for a vessel, a cylinder or a bowl — height against opening, glaze
            against clay — and a place to keep the studies that feel inevitable.
          </p>
        </details>
      </header>

      {storageError ? (
        <p className="banner no-print" role="alert">
          {storageError}
        </p>
      ) : null}

      <section className="folio no-print" id="studio" aria-labelledby={titleId}>
        <div className="folio__instrument">
        <div className="folio__chapters" role="tablist" aria-label="Studio controls" onKeyDown={onChapterKey}>
          {CHAPTERS.map((item) => {
            const selected = chapter === item.id
            return (
              <button
                key={item.id}
                id={`chapter-${item.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="studio-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setChapter(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="folio__band">
        <form
          id="studio-panel"
          className="folio__panel"
          role="tabpanel"
          aria-labelledby={`chapter-${chapter}`}
          hidden={archiveOpen}
          onSubmit={(event) => event.preventDefault()}
        >
          {chapter === 'form' ? (
            <FormPicker value={current.form} onChange={(value) => update('form', value)} />
          ) : null}
          {chapter === 'wall' ? <DimensionControls study={current} onChange={update} /> : null}
          {chapter === 'surface' ? (
            <>
              <PalettePicker value={current.paletteId} onChange={(value) => update('paletteId', value)} />
              <FinishPicker value={current.finish} onChange={(value) => update('finish', value)} />
            </>
          ) : null}
          {chapter === 'note' ? (
            <StudyMeta
              study={current}
              onChange={update}
              onSave={() => handleSave(false)}
              onSaveCopy={() => handleSave(true)}
              onSheet={() => setSheetStudy(current)}
            />
          ) : null}
        </form>

        <div id="archive" className="folio__panel folio__drawer" hidden={!archiveOpen}>
          <Gallery
            embedded
            studies={studies}
            onOpen={handleOpen}
            onDelete={handleDelete}
            onSheet={(entry) => setSheetStudy(presentStudy(entry))}
          />
        </div>
        </div>

        <div className="folio__foot">
          <p className="status" role="status" aria-live="polite">
            {status}
          </p>
          <button
            type="button"
            className="archive-toggle"
            aria-expanded={archiveOpen}
            aria-controls="archive"
            onClick={() => setArchiveOpen((open) => !open)}
          >
            Saved studies
            <span>{studies.length}</span>
          </button>
          <p className="folio__sign">Keep the ones that sit quietly in the mind. Happy birthday.</p>
        </div>
        </div>

        <div className="folio__stage">
          <div className="stage__rule" aria-hidden="true" />
          <h1 id={titleId}>{current.name.trim() || 'Untitled form'}</h1>
          <VesselIllustration study={current} labelledBy={titleId} />
          <dl className="measures">
            <div>
              <dt>Height</dt>
              <dd>{formatStudioValue(current.height, 'cm')}</dd>
            </div>
            <div>
              <dt>Width</dt>
              <dd>{formatStudioValue(current.width, 'cm')}</dd>
            </div>
            <div>
              <dt>Opening</dt>
              <dd>{formatStudioValue(current.opening, 'cm')}</dd>
            </div>
            <div>
              <dt>Curve</dt>
              <dd>{current.curve.toFixed(1)}</dd>
            </div>
          </dl>
          <p className="stage__caption">
            Flat vector study · {getForm(current.form).label} · {curvePhrase(current.form, current.curve)} ·{' '}
            {getFinish(current.finish).label}
          </p>
        </div>
      </section>

      <div className="print-root" hidden>
        <SheetPage study={printable} />
      </div>

      {sheetStudy ? (
        <DesignSheet study={presentStudy(sheetStudy)} onClose={closeSheet} />
      ) : null}
    </div>
  )
}
