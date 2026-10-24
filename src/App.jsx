import { useEffect, useId, useMemo, useState } from 'react'
import { APP_NAME, DEFAULT_STUDY } from './constants.js'
import { constrainStudy } from './geometry.js'
import { createSavedStudy, loadStudies, persistStudies, untitledName } from './storage.js'
import DesignSheet from './components/DesignSheet.jsx'
import DimensionControls from './components/DimensionControls.jsx'
import FinishPicker from './components/FinishPicker.jsx'
import FormPicker from './components/FormPicker.jsx'
import Gallery from './components/Gallery.jsx'
import PalettePicker from './components/PalettePicker.jsx'
import StudyMeta from './components/StudyMeta.jsx'
import VesselIllustration from './components/VesselIllustration.jsx'
import './App.css'

export default function App() {
  const titleId = useId()
  const [study, setStudy] = useState(() => constrainStudy(DEFAULT_STUDY))
  const [studies, setStudies] = useState(() => loadStudies().studies)
  const [storageError, setStorageError] = useState(() => loadStudies().error)
  const [status, setStatus] = useState('')
  const [sheetStudy, setSheetStudy] = useState(null)

  useEffect(() => {
    if (!sheetStudy) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setSheetStudy(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetStudy])

  const current = useMemo(() => constrainStudy(study), [study])

  function update(field, value) {
    setStatus('')
    setStudy((prev) => constrainStudy({ ...prev, [field]: value }))
  }

  function saveArchive(next) {
    const result = persistStudies(next)
    if (result.error) {
      setStorageError(result.error)
      return false
    }
    setStorageError(null)
    setStudies(next)
    return true
  }

  function handleSave() {
    const draft = {
      ...current,
      name: current.name.trim() || untitledName(studies),
    }
    const saved = createSavedStudy(draft)
    if (!saveArchive([saved, ...studies])) return
    setStudy(draft)
    setStatus(`Saved “${saved.name}”.`)
  }

  function handleOpen(entry) {
    setStudy(constrainStudy(entry))
    setStatus(`Reopened “${entry.name}”.`)
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleDelete(id) {
    const next = studies.filter((item) => item.id !== id)
    if (!saveArchive(next)) return
    setStatus('Study removed from the archive.')
    if (sheetStudy?.id === id) setSheetStudy(null)
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
            You already think in clay before you think in words. This is a small
            place to try a vessel, a cylinder or a bowl — to push height against
            opening, and to keep the studies that feel inevitable. Not a kiln.
            Not a theorem. A birthday desk for the next form.
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
          <h2 id={titleId}>
            {current.name.trim() || 'Untitled form'}
          </h2>
          <VesselIllustration study={current} labelledBy={titleId} />
          <p className="stage__caption">
            Vector study drawing · {current.form} · {current.finish}
          </p>
        </div>

        <form className="studio__controls" onSubmit={(event) => event.preventDefault()}>
          <FormPicker value={current.form} onChange={(value) => update('form', value)} />
          <DimensionControls
            study={current}
            onChange={(field, value) => update(field, value)}
          />
          <PalettePicker
            value={current.paletteId}
            onChange={(value) => update('paletteId', value)}
          />
          <FinishPicker value={current.finish} onChange={(value) => update('finish', value)} />
          <StudyMeta
            study={current}
            onChange={update}
            onSave={handleSave}
            onSheet={() => setSheetStudy(current)}
            status={status}
            error={null}
          />
        </form>
      </section>

      <div className="no-print">
        <Gallery
          studies={studies}
          onOpen={handleOpen}
          onDelete={handleDelete}
          onSheet={(entry) => setSheetStudy(entry)}
        />
      </div>

      <footer className="closing no-print">
        <p className="kicker">After the wheel</p>
        <p className="closing__line">
          Keep the ones that sit quietly in the mind. The kiln will finish the
          sentence — this page only asks the first question. Happy birthday.
          May the next form surprise you.
        </p>
        <p className="closing__sign">{APP_NAME}</p>
      </footer>

      {sheetStudy ? (
        <DesignSheet study={constrainStudy(sheetStudy)} onClose={() => setSheetStudy(null)} />
      ) : null}
    </div>
  )
}
