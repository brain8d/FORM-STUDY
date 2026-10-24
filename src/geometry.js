import { DIMENSIONS, DEFAULT_STUDY, getFinish, getForm, getPalette } from './constants.js'

// Flat study geometry for the drawing board.
// Centimetres here are sketch units. They do not describe shrinkage, wall thickness, or firing.

const BOARD = { w: 240, h: 304, cx: 120, base: 274 }
const PX = 214 / DIMENSIONS.height.max

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function round1(value) {
  return Math.round(value * 10) / 10
}

function toNumber(value, fallback) {
  const next = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(next) ? next : fallback
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mixFrames(frames, t) {
  if (t <= frames[0].t) return frames[0].r
  for (let i = 1; i < frames.length; i += 1) {
    const prev = frames[i - 1]
    const next = frames[i]
    if (t <= next.t) {
      const local = smoothstep(prev.t, next.t, t)
      return lerp(prev.r, next.r, local)
    }
  }
  return frames[frames.length - 1].r
}

export function openingLimits(form, width) {
  const safeWidth = clamp(
    toNumber(width, DEFAULT_STUDY.width),
    DIMENSIONS.width.min,
    DIMENSIONS.width.max,
  )
  let min
  let max
  if (form === 'bowl') {
    min = safeWidth * 0.72
    max = safeWidth * 0.98
  } else if (form === 'cylinder') {
    min = safeWidth * 0.55
    max = safeWidth * 0.96
  } else {
    min = Math.max(DIMENSIONS.opening.min, safeWidth * 0.22)
    max = safeWidth * 0.78
  }

  min = clamp(round1(min), DIMENSIONS.opening.min, DIMENSIONS.opening.max)
  max = clamp(round1(max), DIMENSIONS.opening.min, DIMENSIONS.opening.max)
  if (max < min) max = min
  return { min, max }
}

export function constrainOpening(form, width, opening) {
  const limits = openingLimits(form, width)
  return clamp(toNumber(opening, DEFAULT_STUDY.opening), limits.min, limits.max)
}

export function constrainStudy(input = {}) {
  const form = getForm(input.form).id
  const height = clamp(
    toNumber(input.height, DEFAULT_STUDY.height),
    DIMENSIONS.height.min,
    DIMENSIONS.height.max,
  )
  const width = clamp(
    toNumber(input.width, DEFAULT_STUDY.width),
    DIMENSIONS.width.min,
    DIMENSIONS.width.max,
  )
  const opening = constrainOpening(form, width, input.opening)

  return {
    name: String(input.name ?? '').slice(0, 48),
    note: String(input.note ?? '').slice(0, 280),
    form,
    height: round1(height),
    width: round1(width),
    opening: round1(opening),
    paletteId: getPalette(input.paletteId).id,
    finish: getFinish(input.finish).id,
  }
}

export function presentStudy(input = {}) {
  const study = constrainStudy(input)
  return {
    ...study,
    id: typeof input.id === 'string' && input.id ? input.id : null,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : null,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : null,
  }
}

function radiusFn(form, halfW, halfO) {
  const lip = Math.min(halfO, halfW)

  if (form === 'bowl') {
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.4 },
          { t: 0.22, r: halfW * 0.68 },
          { t: 0.55, r: halfW * 0.9 },
          { t: 0.8, r: lerp(halfW * 0.96, lip, 0.72) },
          { t: 1, r: lip },
        ],
        t,
      )
  }

  if (form === 'cylinder') {
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.84 },
          { t: 0.12, r: halfW * 0.98 },
          { t: 0.82, r: lerp(halfW, lip, 0.18) },
          { t: 1, r: Math.min(halfW, lip * 1.02) },
        ],
        t,
      )
  }

  const neck = Math.min(Math.max(lip, halfW * 0.34), halfW * 0.78)
  return (t) =>
    mixFrames(
      [
        { t: 0, r: halfW * 0.5 },
        { t: 0.18, r: halfW * 0.78 },
        { t: 0.42, r: halfW },
        { t: 0.64, r: halfW * 0.84 },
        { t: 0.84, r: neck },
        { t: 1, r: Math.min(halfW, neck * 1.04) },
      ],
      t,
    )
}

function sampleProfile(fn, top, footTop, steps = 80) {
  const right = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const y = footTop - t * (footTop - top)
    right.push([BOARD.cx + fn(t), y])
  }
  return right
}

function lineThrough(points) {
  return points
    .slice(1)
    .map(([x, y]) => ` L ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join('')
}

function buildHighlight(fn, top, footTop) {
  const points = []
  for (let i = 0; i <= 28; i += 1) {
    const t = 0.14 + (i / 28) * 0.72
    const y = footTop - t * (footTop - top)
    points.push([BOARD.cx - fn(t) * 0.38, y])
  }
  return `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}${lineThrough(points)}`
}

function buildRibs(fn, top, footTop, form) {
  const count = form === 'bowl' ? 6 : 9
  const ribs = []
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1)
    const y = footTop - t * (footTop - top)
    const r = fn(t)
    ribs.push({
      cx: BOARD.cx,
      cy: y,
      rx: r * 0.97,
      ry: clamp(1.15 + r * 0.018, 1.15, 2.8),
    })
  }
  return ribs
}

export function getIllustration(study, options = {}) {
  const heightPx = study.height * PX
  const halfW = (study.width * PX) / 2
  const halfO = (study.opening * PX) / 2
  const footH = clamp(heightPx * 0.055, 3.2, 8)
  const base = BOARD.base
  const footTop = base - footH
  const top = base - heightPx
  const fn = radiusFn(study.form, halfW, halfO)
  const right = sampleProfile(fn, top, footTop)
  const left = right.map(([x, y]) => [BOARD.cx - (x - BOARD.cx), y]).reverse()
  const footR = fn(0)
  const lipR = fn(1)

  let bodyPath = `M ${left[0][0].toFixed(2)} ${left[0][1].toFixed(2)}`
  bodyPath += lineThrough(left)
  bodyPath += ` L ${right[0][0].toFixed(2)} ${right[0][1].toFixed(2)}`
  bodyPath += lineThrough(right)
  bodyPath += ' Z'

  const rimRy = clamp(lipR * (study.form === 'bowl' ? 0.2 : 0.16), 2.4, study.form === 'bowl' ? 14 : 11)
  const seam = footTop - 0.8
  const minY = clamp(top - rimRy - 18, 0, BOARD.h)
  const maxY = clamp(base + 16, 0, BOARD.h)
  let minX = 0
  let maxX = BOARD.w
  if (options.crop) {
    minX = clamp(BOARD.cx - halfW - 18, 0, BOARD.w)
    maxX = clamp(BOARD.cx + halfW + 18, 0, BOARD.w)
  }
  const viewBox = `${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`

  return {
    viewBox,
    bodyPath,
    top,
    base,
    footTop,
    cx: BOARD.cx,
    halfW,
    halfO,
    foot: {
      d: [
        `M ${(BOARD.cx - footR).toFixed(2)} ${seam.toFixed(2)}`,
        `L ${(BOARD.cx - footR * 0.88).toFixed(2)} ${base.toFixed(2)}`,
        `L ${(BOARD.cx + footR * 0.88).toFixed(2)} ${base.toFixed(2)}`,
        `L ${(BOARD.cx + footR).toFixed(2)} ${seam.toFixed(2)}`,
        'Z',
      ].join(' '),
    },
    rim: {
      cx: BOARD.cx,
      cy: top,
      rx: lipR,
      ry: rimRy,
    },
    opening: {
      cx: BOARD.cx,
      cy: top,
      rx: Math.max(1.8, lipR * 0.8),
      ry: Math.max(1.4, rimRy * 0.62),
    },
    ground: { x1: 36, x2: 204, y: base },
    highlightPath: buildHighlight(fn, top, footTop),
    ribs: buildRibs(fn, top, footTop, study.form),
    profile: fn,
  }
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getSpeckles(study, illustration, count = 46) {
  const seed = study.form === 'bowl' ? 19 : study.form === 'cylinder' ? 37 : 53
  const rand = mulberry32(seed)
  const { top, footTop, profile, cx } = illustration
  const dots = []

  for (let i = 0; i < count; i += 1) {
    const t = 0.08 + rand() * 0.84
    const y = footTop - t * (footTop - top)
    const reach = profile(t) * (0.12 + rand() * 0.74)
    const side = rand() > 0.5 ? 1 : -1
    const large = rand() > 0.86
    dots.push({
      cx: cx + side * reach,
      cy: y + (rand() - 0.5) * 3,
      r: large ? 1.35 + rand() * 1.1 : 0.45 + rand() * 0.85,
      opacity: large ? 0.35 + rand() * 0.4 : 0.16 + rand() * 0.38,
    })
  }
  return dots
}

export function formatStudioValue(value, unit) {
  return `${Number(value).toFixed(1)} ${unit}`
}

export function readStudioNumber(raw, min, max) {
  const trimmed = String(raw ?? '').trim().replace(',', '.')
  if (!trimmed) return { error: 'Enter a number.' }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { error: 'Use a plain number, such as 18.5.' }
  }
  const value = round1(Number(trimmed))
  if (value < min || value > max) {
    return {
      error: `Keep this between ${min.toFixed(1)} and ${max.toFixed(1)}.`,
    }
  }
  return { value }
}
