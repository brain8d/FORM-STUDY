import { PALETTES, getPalette } from '../constants.js'

export default function PalettePicker({ value, onChange }) {
  const selected = getPalette(value)

  return (
    <fieldset className="chooser">
      <legend>Clay / glaze</legend>
      <div className="swatches">
        {PALETTES.map((palette) => {
          const on = palette.id === value
          return (
            <label key={palette.id} className={on ? 'swatch swatch--on' : 'swatch'}>
              <input
                type="radio"
                name="clay-glaze"
                value={palette.id}
                checked={on}
                onChange={() => onChange(palette.id)}
              />
              <span className="swatch__chip" style={{ background: palette.glaze }} />
              <span className="swatch__clay" style={{ background: palette.clay }} />
              <span className="swatch__name">{palette.name}</span>
            </label>
          )
        })}
      </div>
      <p className="palette-note">
        <span>{selected.name}</span>
        {selected.note}
      </p>
    </fieldset>
  )
}
