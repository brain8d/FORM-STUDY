import { useId } from 'react'
import { getPalette } from '../constants.js'
import { getIllustration, getSpeckles } from '../geometry.js'

export default function VesselIllustration({ study, compact = false, labelledBy }) {
  const uid = useId().replace(/:/g, '')
  const palette = getPalette(study.paletteId)
  const art = getIllustration(study)
  const speckles = study.finish === 'speckled' ? getSpeckles(study, art) : []
  const clipId = `formClip-${uid}`
  const speckleId = `speckleClip-${uid}`

  return (
    <svg
      className={compact ? 'illustration illustration--compact' : 'illustration'}
      viewBox={art.viewBox}
      role="img"
      aria-labelledby={labelledBy}
    >
      <defs>
        <linearGradient id={`${clipId}-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={palette.interior} />
          <stop offset="32%" stopColor={palette.glaze} />
          <stop offset="78%" stopColor={palette.glaze} />
          <stop offset="100%" stopColor={palette.rim} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={art.bodyPath} />
        </clipPath>
        <clipPath id={speckleId}>
          <path d={art.bodyPath} />
        </clipPath>
      </defs>

      <rect
        className="illustration__ground"
        x="28"
        y={art.base + 8}
        width="184"
        height="5"
      />
      <line
        className="illustration__axis"
        x1="120"
        y1="8"
        x2="120"
        y2={art.base + 8}
      />

      <ellipse
        cx={art.rim.cx}
        cy={art.rim.cy}
        rx={art.rim.rx}
        ry={art.rim.ry}
        fill={palette.rim}
      />

      <path d={art.bodyPath} fill={`url(#${clipId}-body)`} />

      <rect
        x={art.foot.x}
        y={art.foot.y}
        width={art.foot.width}
        height={art.foot.height}
        fill={palette.clay}
      />

      {study.finish === 'ribbed' ? (
        <g clipPath={`url(#${clipId})`} className="illustration__ribs">
          {art.ribs.map((rib, index) => (
            <ellipse
              key={index}
              cx={rib.cx}
              cy={rib.cy}
              rx={rib.rx}
              ry={rib.ry}
              fill="none"
              stroke={palette.rim}
              strokeOpacity="0.35"
              strokeWidth="1.1"
            />
          ))}
        </g>
      ) : null}

      {study.finish === 'speckled' ? (
        <g clipPath={`url(#${speckleId})`}>
          {speckles.map((dot, index) => (
            <circle
              key={index}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={palette.speck}
              opacity={dot.opacity}
            />
          ))}
        </g>
      ) : null}

      <path
        d={art.highlightPath}
        fill="none"
        stroke={palette.clay}
        strokeOpacity="0.35"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

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
        strokeWidth="1.4"
      />
    </svg>
  )
}
