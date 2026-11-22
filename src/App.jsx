import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { APP_NAME, DEFAULT_STUDY, FORM_PRESETS, getFinish, getForm } from './constants.js'
import { formatStudioValue, presentStudy } from './geometry.js'
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
import VesselView from './components/VesselView.jsx'
import './App.css'

export default function App() {
  const titleId = useId()
  const [study, setStudy] = useState(() => presentStudy(DEFAULT_STUDY))
  const [studies, setStudies] = useState(() => loadStudies().studies)
  const [storageError, setStorageError] = useState(() => loadStudies().error)
  const [status, setStatus] = useState('')
  const [sheetStudy, setSheetStudy] = useState(null)
  const [presets, setPresets] = useState(FORM_PRESETS)
  const [view, setView] = useState('drawing')

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
      [next.form]: { height: next.height, width: next.width, opening: next.opening },
    }))
    setStatus(`Reopened “${next.name}”.`)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('studio')?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const closeSheet = useCallback(() => setSheetStudy(null), [])

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
        <p className="kicker">Birthday edition</p>
        <p className="wordmark">{APP_NAME}</p>
        <p className="masthead__aside">A private studio notebook</p>
      </header>

      <section className="intro no-print" aria-labelledby="intro-title">
        <p className="intro__mark">No. 01</p>
        <div>
          <p className="kicker">For your birthday</p>
          <h1 id="intro-title">A studio of proportion, made for your hands.</h1>
          <p className="lede">
            You already think in clay before you think in words. This is a quiet
            desk for a vessel, a cylinder or a bowl — height against opening, glaze
            against clay — and a place to keep the studies that feel inevitable. A
            birthday page for the next form.
          </p>
        </div>
      </section>

      {storageError ? (
        <p className="banner no-print" role="alert">
          {storageError}
        </p>
      ) : null}

      <section className="studio no-print" id="studio" aria-labelledby={titleId}>
        <div className="studio__stage">
          <div className="stage__rule" aria-hidden="true" />
          <p className="kicker">Live study</p>
          <h2 id={titleId}>{current.name.trim() || 'Untitled form'}</h2>
          {view === 'clay' ? (
            <VesselView study={current} labelledBy={titleId} />
          ) : (
            <VesselIllustration study={current} labelledBy={titleId} />
          )}
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
          </dl>
          <div className="stage__foot">
            <div className="stage__switch" role="group" aria-label="Study view">
              <button type="button" aria-pressed={view === 'drawing'} onClick={() => setView('drawing')}>
                Drawing
              </button>
              <button type="button" aria-pressed={view === 'clay'} onClick={() => setView('clay')}>
                Clay
              </button>
            </div>
            <p className="stage__caption">
              {view === 'clay' ? 'Turned study · drag to turn' : 'Flat vector study'} · {getForm(current.form).label} ·{' '}
              {getFinish(current.finish).label}
            </p>
          </div>
        </div>

        <form className="studio__controls" onSubmit={(event) => event.preventDefault()}>
          <FormPicker value={current.form} onChange={(value) => update('form', value)} />
          <DimensionControls study={current} onChange={update} />
          <PalettePicker value={current.paletteId} onChange={(value) => update('paletteId', value)} />
          <FinishPicker value={current.finish} onChange={(value) => update('finish', value)} />
          <StudyMeta
            study={current}
            onChange={update}
            onSave={() => handleSave(false)}
            onSaveCopy={() => handleSave(true)}
            onSheet={() => setSheetStudy(current)}
            status={status}
          />
        </form>
      </section>

      <Gallery
        studies={studies}
        notice={status}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onSheet={(entry) => setSheetStudy(presentStudy(entry))}
      />

      <footer className="closing no-print">
        <p className="kicker">After the wheel</p>
        <p className="closing__line">
          Keep the ones that sit quietly in the mind. Happy birthday. May the next
          form surprise you.
        </p>
        <p className="closing__sign">{APP_NAME}</p>
      </footer>

      <div className="print-root" hidden>
        <SheetPage study={printable} />
      </div>

      {sheetStudy ? (
        <DesignSheet study={presentStudy(sheetStudy)} onClose={closeSheet} />
      ) : null}
    </div>
  )
}
