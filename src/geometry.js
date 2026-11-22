import { DIMENSIONS, DEFAULT_STUDY, getFinish, getForm, getPalette } from './constants.js'

// Flat study geometry for the drawing board.
// Centimetres here are sketch units. They do not describe shrinkage, wall thickness, or firing.

const PX = 214 / DIMENSIONS.height.max
const MAX_HALF = (DIMENSIONS.opening.max * PX) / 2
const BOARD_PAD_X = 32
const BOARD = {
  w: MAX_HALF * 2 + BOARD_PAD_X * 2,
  h: 304,
  cx: MAX_HALF + BOARD_PAD_X,
  base: 274,
}
// Keeps a normal body the same size on the board. A wider mouth grows the frame.
const COMFORT_HALF = (DIMENSIONS.width.max * PX) / 2 + 28

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
  // The mouth may flare past the body. Only the narrow end is tied to the form.
  if (form === 'bowl') {
    min = safeWidth * 0.62
    max = DIMENSIONS.opening.max
  } else if (form === 'cylinder') {
    min = Math.max(DIMENSIONS.opening.min, safeWidth * 0.35)
    max = DIMENSIONS.opening.max
  } else {
    min = Math.max(DIMENSIONS.opening.min, safeWidth * 0.18)
    max = DIMENSIONS.opening.max
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
  const curve = clamp(
    toNumber(input.curve, defaultCurve(form)),
    DIMENSIONS.curve.min,
    DIMENSIONS.curve.max,
  )

  return {
    name: String(input.name ?? '').slice(0, 48),
    note: String(input.note ?? '').slice(0, 280),
    form,
    height: round1(height),
    width: round1(width),
    opening: round1(opening),
    curve: round1(curve),
    paletteId: getPalette(input.paletteId).id,
    finish: getFinish(input.finish).id,
  }
}

function defaultCurve(form) {
  return form === 'cylinder' ? 0 : 10
}

export function curvePhrase(form, value) {
  const curve = toNumber(value, defaultCurve(form))
  if (form === 'cylinder' && Math.abs(curve) <= 0.5) return 'Straight wall'
  if (curve <= -6) return 'Reverse taper'
  if (curve < -0.5) return 'Slight reverse'
  if (curve <= 0.5) return 'Single curve'
  if (curve < 6) return 'Soft belly'
  return 'Gathered'
}

export function curveNote(form, value) {
  const here = curvePhrase(form, value)
  if (form === 'cylinder') {
    return `${here}. Zero holds a straight wall. Below zero the wall leans outward. Above zero a belly softens into the wall.`
  }
  if (form === 'bowl') {
    return `${here}. Zero is one curve from foot to rim. Below zero the wall straightens into a reverse taper. Above zero the belly gathers.`
  }
  return `${here}. Zero is one continuous curve. Below zero the wall leans outward in a reverse taper. Above zero the shoulder gathers.`
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

function cosineHump(t, foot, belly, lip, peak) {
  if (t <= peak) {
    const eased = (1 - Math.cos((t / peak) * Math.PI)) / 2
    return lerp(foot, belly, eased)
  }
  const eased = (1 - Math.cos(((t - peak) / (1 - peak)) * Math.PI)) / 2
  return lerp(belly, lip, eased)
}

function cylinderStraight(halfW, halfO) {
  const join = 0.9
  return (t) => {
    if (t <= 0.05) return lerp(halfW * 0.9, halfW, t / 0.05)
    if (t <= join) return halfW
    return lerp(halfW, halfO, (t - join) / (1 - join))
  }
}

function singleProfile(form, halfW, halfO) {
  if (form === 'cylinder') return cylinderStraight(halfW, halfO)

  if (form === 'bowl') {
    const foot = Math.min(halfW, halfO) * 0.32
    if (halfO >= halfW * 0.96) {
      return (t) => lerp(foot, halfO, Math.sin((t * Math.PI) / 2))
    }
    return (t) => cosineHump(t, foot, halfW, halfO, 0.62)
  }

  const foot = halfW * 0.55
  const peak = halfO >= halfW ? 0.78 : 0.5
  const belly = Math.max(halfW, halfO)
  return (t) => cosineHump(t, foot, belly, halfO, peak)
}

function gatheredProfile(form, halfW, halfO) {
  if (form === 'cylinder') {
    const belly = halfW * 1.12
    return (t) => {
      if (t <= 0.06) return lerp(halfW * 0.9, halfW, t / 0.06)
      if (t <= 0.86) return halfW + (belly - halfW) * Math.sin(((t - 0.06) / 0.8) * Math.PI)
      return lerp(halfW, halfO, (t - 0.86) / 0.14)
    }
  }

  if (form === 'bowl') {
    const belly = Math.max(halfW, halfO)
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.4 },
          { t: 0.22, r: lerp(halfW * 0.4, belly, 0.45) },
          { t: 0.58, r: lerp(halfW, belly, 0.82) },
          { t: 0.84, r: lerp(halfW, halfO, 0.55) },
          { t: 1, r: halfO },
        ],
        t,
      )
  }

  if (halfO >= halfW) {
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.5 },
          { t: 0.16, r: halfW * 0.78 },
          { t: 0.4, r: halfW },
          { t: 0.78, r: halfW },
          { t: 1, r: halfO },
        ],
        t,
      )
  }

  return (t) =>
    mixFrames(
      [
        { t: 0, r: halfW * 0.5 },
        { t: 0.16, r: halfW * 0.78 },
        { t: 0.4, r: halfW },
        { t: 0.66, r: lerp(halfW, halfO, 0.28) },
        { t: 0.86, r: lerp(halfW * 0.55, halfO, 0.75) },
        { t: 1, r: halfO },
      ],
      t,
    )
}

function reverseProfile(form, halfW, halfO) {
  const foot = halfW * (form === 'bowl' ? 0.48 : form === 'cylinder' ? 0.7 : 0.46)
  const shoulder = Math.max(halfW * (form === 'bowl' ? 1 : 1.12), halfO)
  if (halfO >= shoulder * 0.98) return (t) => lerp(foot, halfO, t)

  // Straight outward wall, then a short turn that keeps the incoming slope.
  const hold = form === 'bowl' ? 0.7 : 0.58
  const atHold = lerp(foot, shoulder, 0.9)
  const slope = ((atHold - foot) / hold) * (1 - hold) * 0.55
  return (t) => {
    if (t <= hold) return lerp(foot, atHold, t / hold)
    const u = (t - hold) / (1 - hold)
    const u2 = u * u
    const u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * atHold + (u3 - 2 * u2 + u) * slope + (-2 * u3 + 3 * u2) * halfO
  }
}

function radiusFn(form, halfW, halfO, curve) {
  const k = clamp(toNumber(curve, defaultCurve(form)), DIMENSIONS.curve.min, DIMENSIONS.curve.max) / 10
  const single = singleProfile(form, halfW, halfO)
  const other = k >= 0 ? gatheredProfile(form, halfW, halfO) : reverseProfile(form, halfW, halfO)
  const amount = Math.abs(k)
  return (t) => lerp(single(t), other(t), amount)
}

// Radius of the wall from foot (t = 0) to lip (t = 1).
// Width and opening are diameters in the same units the caller uses.
export function makeProfile(study) {
  const halfW = toNumber(study.width, DEFAULT_STUDY.width) / 2
  const halfO = toNumber(study.opening, DEFAULT_STUDY.opening) / 2
  return radiusFn(getForm(study.form).id, halfW, halfO, study.curve)
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
  const shaped = makeProfile({
    form: study.form,
    width: study.width * PX,
    opening: study.opening * PX,
    curve: study.curve,
  })
  const fn = (t) => Math.max(1.2, shaped(t))
  const right = sampleProfile(fn, top, footTop)
  const left = right.map(([x, y]) => [BOARD.cx - (x - BOARD.cx), y]).reverse()
  const footR = fn(0)
  const lipR = fn(1)
  let peakR = Math.max(footR, lipR)
  for (let i = 1; i < 40; i += 1) peakR = Math.max(peakR, fn(i / 40))

  let bodyPath = `M ${left[0][0].toFixed(2)} ${left[0][1].toFixed(2)}`
  bodyPath += lineThrough(left)
  bodyPath += ` L ${right[0][0].toFixed(2)} ${right[0][1].toFixed(2)}`
  bodyPath += lineThrough(right)
  bodyPath += ' Z'

  const rimRy = clamp(lipR * (study.form === 'bowl' ? 0.2 : 0.16), 2.4, study.form === 'bowl' ? 14 : 11)
  const seam = footTop - 0.8
  const minY = clamp(top - rimRy - 18, 0, BOARD.h)
  const maxY = clamp(base + 16, 0, BOARD.h)
  const reach = Math.max(halfW, lipR, footR, peakR)
  const halfSpan = options.crop ? reach + 16 : Math.max(COMFORT_HALF, reach + 20)
  const minX = clamp(BOARD.cx - halfSpan, 0, BOARD.w)
  const maxX = clamp(BOARD.cx + halfSpan, 0, BOARD.w)
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
    ground: {
      x1: BOARD.cx - Math.max(reach, halfW) * 0.9 - 10,
      x2: BOARD.cx + Math.max(reach, halfW) * 0.9 + 10,
      y: base,
    },
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
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return {
      error: min < 0 ? 'Use a plain number, such as -2.5.' : 'Use a plain number, such as 18.5.',
    }
  }
  const value = round1(Number(trimmed))
  if (value < min || value > max) {
    return {
      error: `Keep this between ${min.toFixed(1)} and ${max.toFixed(1)}.`,
    }
  }
  return { value }
}
