export default function StudyMeta({ study, onChange, onSave, onSaveCopy, onSheet }) {
  const saved = Boolean(study.id)

  return (
    <fieldset className="meta">
      <legend>Name this study</legend>
      <div className="meta__fields">
        <label htmlFor="study-name">Title</label>
        <input
          id="study-name"
          type="text"
          maxLength={48}
          autoComplete="off"
          placeholder="Evening bowl, tall celadon…"
          value={study.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
        <label htmlFor="study-note">Note</label>
        <textarea
          id="study-note"
          rows={2}
          maxLength={280}
          placeholder="A short intention for the wheel."
          value={study.note}
          onChange={(event) => onChange('note', event.target.value)}
        />
      </div>
      <div className="meta__actions">
        <button type="button" className="btn btn--primary" onClick={onSave}>
          {saved ? 'Update study' : 'Save study'}
        </button>
        {saved ? (
          <button type="button" className="btn" onClick={onSaveCopy}>
            Save as new
          </button>
        ) : null}
        <button type="button" className="btn" onClick={onSheet}>
          Design sheet
        </button>
      </div>
    </fieldset>
  )
}
