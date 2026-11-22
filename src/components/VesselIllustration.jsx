import { useId } from 'react'
import { DIMENSIONS, getFinish, getForm, getPalette } from '../constants.js'
import { curvePhrase, formatStudioValue, getIllustration, getSpeckles } from '../geometry.js'

function channel(hex, index) {
  return Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16)
}

function mixHex(from, to, amount) {
  const mixed = [0, 1, 2].map((index) =>
    Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * amount),
  )
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export default function VesselIllustration({ study, compact = false, labelledBy }) {
  const uid = useId().replace(/:/g, '')
  const descId = useId()
  const palette = getPalette(study.paletteId)
  const art = getIllustration(study, { crop: compact })
  const speckles = study.finish === 'speckled' ? getSpeckles(study, art) : []
  const clipId = `formClip-${uid}`
  const shadeId = `shade-${uid}`
  const matte = study.finish === 'matte'
  const sheen = matte ? 0.12 : study.finish === 'ribbed' ? 0.2 : 0.3
  const edge = matte ? 0.22 : 0.5
  const light = matte ? 0.1 : 0.38

  const stops = matte
    ? [
        ['0%', mixHex(palette.glaze, palette.rim, 0.22)],
        ['50%', palette.glaze],
        ['100%', mixHex(palette.glaze, palette.rim, 0.28)],
      ]
    : [
        ['0%', mixHex(palette.glaze, palette.rim, edge)],
        ['24%', palette.glaze],
        ['42%', mixHex(palette.glaze, '#faf7f1', light)],
        ['70%', palette.glaze],
        ['100%', mixHex(palette.glaze, palette.rim, edge + 0.12)],
      ]

  const description = [
    `Flat vector study of a ${getForm(study.form).label.toLowerCase()}.`,
    `Height ${formatStudioValue(study.height, DIMENSIONS.height.unit)},`,
    `width ${formatStudioValue(study.width, DIMENSIONS.width.unit)},`,
    `opening ${formatStudioValue(study.opening, DIMENSIONS.opening.unit)},`,
    `${curvePhrase(study.form, study.curve).toLowerCase()}.`,
    `${palette.name} palette, ${getFinish(study.finish).label.toLowerCase()} surface.`,
    'Sketch proportions only, not a throwing plan or a firing prediction.',
  ].join(' ')

  return (
    <div className={compact ? 'plate plate--compact' : 'plate'}>
      {compact ? null : (
        <p id={descId} className="visually-hidden">
          {description}
        </p>
      )}
      <svg
        className={compact ? 'illustration illustration--compact' : 'illustration'}
        viewBox={art.viewBox}
        role={compact ? undefined : 'img'}
        aria-hidden={compact ? true : undefined}
        aria-labelledby={compact ? undefined : labelledBy}
        aria-describedby={compact ? undefined : descId}
      >
        <defs>
          <linearGradient id={shadeId} x1="0%" y1="0%" x2="100%" y2="0%">
            {stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
          <clipPath id={clipId}>
            <path d={art.bodyPath} />
          </clipPath>
        </defs>

        <line
          className="illustration__ground"
          x1={art.ground.x1}
          y1={art.ground.y}
          x2={art.ground.x2}
          y2={art.ground.y}
        />

        <ellipse
          cx={art.rim.cx}
          cy={art.rim.cy}
          rx={art.rim.rx}
          ry={art.rim.ry}
          fill={palette.rim}
        />

        <path d={art.foot.d} fill={palette.clay} />
        <path d={art.bodyPath} fill={`url(#${shadeId})`} />

        <g clipPath={`url(#${clipId})`}>
          {study.finish === 'ribbed'
            ? art.ribs.map((rib) => (
                <ellipse
                  key={`${rib.cy.toFixed(2)}-${rib.rx.toFixed(2)}`}
                  cx={rib.cx}
                  cy={rib.cy}
                  rx={rib.rx}
                  ry={rib.ry}
                  fill="none"
                  stroke={palette.rim}
                  strokeOpacity="0.45"
                  strokeWidth="1.15"
                />
              ))
            : null}
          {study.finish === 'speckled'
            ? speckles.map((dot, index) => (
                <circle
                  key={index}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill={palette.speck}
                  opacity={dot.opacity}
                />
              ))
            : null}
          <path
            d={art.highlightPath}
            fill="none"
            stroke="#faf7f1"
            strokeOpacity={sheen}
            strokeWidth={matte ? 2 : 3.2}
            strokeLinecap="round"
          />
        </g>

        <ellipse
          cx={art.opening.cx}
          cy={art.opening.cy}
          rx={art.opening.rx}
          ry={art.opening.ry}
          fill={palette.interior}
        />
        <ellipse
          cx={art.rim.cx}
          cy={art.rim.cy}
          rx={art.rim.rx}
          ry={art.rim.ry}
          fill="none"
          stroke={palette.rim}
          strokeWidth="1.35"
        />
      </svg>
    </div>
  )
}
