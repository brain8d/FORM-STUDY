import { DIMENSIONS, DEFAULT_STUDY, getForm, getPalette, getFinish } from './constants.js'

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
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

export function constrainOpening(form, width, opening) {
  if (form === 'bowl') {
    return clamp(opening, width * 0.78, width * 0.99)
  }
  if (form === 'cylinder') {
    return clamp(opening, width * 0.62, width * 0.98)
  }
  return clamp(opening, Math.max(3, width * 0.28), width * 0.82)
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
  const opening = constrainOpening(
    form,
    width,
    toNumber(input.opening, DEFAULT_STUDY.opening),
  )

  return {
    name: String(input.name ?? '').slice(0, 48),
    note: String(input.note ?? '').slice(0, 280),
    form,
    height: Math.round(height * 10) / 10,
    width: Math.round(width * 10) / 10,
    opening: Math.round(opening * 10) / 10,
    paletteId: getPalette(input.paletteId).id,
    finish: getFinish(input.finish).id,
  }
}

const CX = 120
const DRAW_H = 252
const DRAW_W = 168
const PAD_TOP = 30
const PAD_BOTTOM = 22

export function getMetrics(study) {
  const heightPx = (study.height / DIMENSIONS.height.max) * DRAW_H
  const halfW = (study.width / DIMENSIONS.width.max) * (DRAW_W / 2)
  const halfO = (study.opening / DIMENSIONS.width.max) * (DRAW_W / 2)
  const top = PAD_TOP
  const base = top + heightPx
  return { cx: CX, base, top, heightPx, halfW, halfO, viewH: base + PAD_BOTTOM }
}

function radiusFn(form, halfW, halfO) {
  if (form === 'bowl') {
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.42 },
          { t: 0.12, r: halfW * 0.78 },
          { t: 0.38, r: halfW * 0.97 },
          { t: 0.7, r: halfW },
          { t: 0.9, r: lerp(halfW, halfO, 0.55) },
          { t: 1, r: halfO },
        ],
        t,
      )
  }

  if (form === 'cylinder') {
    return (t) =>
      mixFrames(
        [
          { t: 0, r: halfW * 0.82 },
          { t: 0.05, r: halfW * 0.9 },
          { t: 0.12, r: halfW * 0.98 },
          { t: 0.82, r: lerp(halfW, halfO, 0.35) },
          { t: 0.94, r: halfO },
          { t: 1, r: halfO * 1.03 },
        ],
        t,
      )
  }

  return (t) =>
    mixFrames(
      [
        { t: 0, r: halfW * 0.58 },
        { t: 0.06, r: halfW * 0.7 },
        { t: 0.34, r: halfW },
        { t: 0.58, r: halfW * 0.92 },
        { t: 0.78, r: lerp(halfW * 0.72, halfO, 0.45) },
        { t: 0.9, r: halfO * 0.96 },
        { t: 1, r: halfO * 1.05 },
      ],
      t,
    )
}

function sampleProfile(fn, top, base, steps = 64) {
  const right = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const y = base - t * (base - top)
    right.push([CX + fn(t), y])
  }
  return right
}

function toPath(right) {
  const left = right.map(([x, y]) => [CX - (x - CX), y])
  const rimLeft = left[left.length - 1]
  const rimRight = right[right.length - 1]
  const footLeft = left[0]
  const footRight = right[0]
  const down = left.slice().reverse()

  let d = `M ${rimLeft[0].toFixed(2)} ${rimLeft[1].toFixed(2)}`
  down.forEach(([x, y]) => {
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  })
  d += ` L ${footRight[0].toFixed(2)} ${footRight[1].toFixed(2)}`
  right.forEach(([x, y]) => {
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  })
  d += ` L ${rimRight[0].toFixed(2)} ${rimRight[1].toFixed(2)} Z`

  return {
    d,
    rimLeft,
    rimRight,
    footLeft,
    footRight,
    widest: right.reduce((max, point) => (point[0] > max[0] ? point : max), right[0]),
  }
}

export function getIllustration(study) {
  const { top, base, heightPx, halfW, halfO, viewH } = getMetrics(study)
  const fn = radiusFn(study.form, halfW, halfO)
  const right = sampleProfile(fn, top, base)
  const path = toPath(right)
  const rimRy = clamp(halfO * 0.22, 4, 16)
  const innerRx = Math.max(2, halfO * 0.78)
  const innerRy = rimRy * 0.72
  const footHeight = study.form === 'bowl' ? 4 : 6
  const footWidth = halfW * (study.form === 'bowl' ? 0.32 : 0.55)

  return {
    viewBox: `0 0 240 ${viewH.toFixed(1)}`,
    bodyPath: path.d,
    top,
    base,
    heightPx,
    halfW,
    halfO,
    cx: CX,
    rim: {
      cx: CX,
      cy: top,
      rx: halfO,
      ry: rimRy,
    },
    opening: {
      cx: CX,
      cy: top,
      rx: innerRx,
      ry: innerRy,
    },
    foot: {
      x: CX - footWidth,
      y: base - 1,
      width: footWidth * 2,
      height: footHeight,
    },
    highlightPath: buildHighlight(fn, top, base),
    ribs: buildRibs(fn, top, base, study.form),
  }
}

function buildHighlight(fn, top, base) {
  const points = []
  const steps = 28
  for (let i = 0; i <= steps; i += 1) {
    const t = 0.08 + (i / steps) * 0.84
    const y = base - t * (base - top)
    const r = fn(t)
    points.push([CX - r * 0.55, y])
  }
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  points.slice(1).forEach(([x, y]) => {
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  })
  return d
}

function buildRibs(fn, top, base, form) {
  const count = form === 'bowl' ? 7 : 11
  const ribs = []
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1)
    const y = base - t * (base - top) * 0.92
    const r = fn(t)
    ribs.push({
      cx: CX,
      cy: y,
      rx: r * 0.98,
      ry: clamp(r * 0.08, 2.2, 7),
    })
  }
  return ribs
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

export function getSpeckles(study, illustration, count = 70) {
  const seed =
    Math.round(study.height * 10) +
    Math.round(study.width * 20) +
    Math.round(study.opening * 30) +
    study.form.length * 17
  const rand = mulberry32(seed)
  const dots = []
  const { top, base, halfW } = illustration

  for (let i = 0; i < count; i += 1) {
    const t = 0.08 + rand() * 0.82
    const y = base - t * (base - top)
    const spread = halfW * (0.15 + rand() * 0.7) * (rand() > 0.5 ? 1 : -1)
    dots.push({
      cx: CX + spread * 0.85,
      cy: y + (rand() - 0.5) * 6,
      r: 0.6 + rand() * 1.5,
      opacity: 0.18 + rand() * 0.45,
    })
  }
  return dots
}

export function formatStudioValue(value, unit) {
  return `${value.toFixed(1)} ${unit}`
}
