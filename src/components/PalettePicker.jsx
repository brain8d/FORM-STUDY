import { PALETTES } from '../constants.js'

export default function PalettePicker({ value, onChange }) {
  return (
    <fieldset className="chooser">
      <legend>Clay / glaze</legend>
      <div className="swatches" role="radiogroup" aria-label="Clay and glaze palette">
        {PALETTES.map((palette) => {
          const selected = palette.id === value
          return (
            <button
              key={palette.id}
              type="button"
              className={selected ? 'swatch swatch--on' : 'swatch'}
              role="radio"
              aria-checked={selected}
              aria-label={`${palette.name}, ${palette.note}`}
              onClick={() => onChange(palette.id)}
            >
              <span className="swatch__chip" style={{ background: palette.glaze }} />
              <span className="swatch__clay" style={{ background: palette.clay }} />
              <span className="swatch__name">{palette.name}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
