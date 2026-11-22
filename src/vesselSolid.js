import { clamp, makeProfile, mulberry32 } from './geometry.js'

// The drawing is a radius from foot to lip. A thrown pot is that curve
// revolved, with a wall thickness so the opening stays hollow.
// Points run up the outside, across the lip, down the inside, then across the floor.

const SEGMENTS = 80
const SAMPLES = 56

function srgbToLinear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function hexToLinear(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return [
    srgbToLinear(((value >> 16) & 255) / 255),
    srgbToLinear(((value >> 8) & 255) / 255),
    srgbToLinear((value & 255) / 255),
  ]
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function profileNormal(points, index) {
  const prev = points[Math.max(0, index - 1)]
  const next = points[Math.min(points.length - 1, index + 1)]
  const dr = next.r - prev.r
  const dy = next.y - prev.y
  const length = Math.hypot(dr, dy)
  if (length < 1e-5) return [1, 0]
  // Left of the path: outward while climbing the outside, inward while descending inside.
  return [dy / length, -dr / length]
}

export function buildVesselSolid(study, palette) {
  const radiusAt = makeProfile(study)
  const height = study.height
  const footH = clamp(height * 0.055, 0.28, 1.15)
  const bodyH = Math.max(height - footH, 0.4)

  let minR = Infinity
  for (let i = 0; i <= SAMPLES; i += 1) minR = Math.min(minR, radiusAt(i / SAMPLES))
  const wall = Math.min(clamp(minR * 0.16, 0.32, 0.62), minR * 0.38)

  const ribbed = study.finish === 'ribbed'
  const ribCount = study.form === 'bowl' ? 6 : 9

  function outerR(t) {
    let radius = radiusAt(t)
    if (ribbed) {
      const fade = Math.sin(Math.PI * t)
      radius += Math.sin(t * ribCount * Math.PI * 2) * 0.1 * fade
    }
    return Math.max(radius, 0.12)
  }

  function innerR(t) {
    return Math.max(radiusAt(t) - wall, 0.22)
  }

  const pts = []
  const footR = outerR(0)
  pts.push({ r: footR * 0.86, y: 0, tone: 'clay', v: 0 })
  pts.push({ r: footR * 0.93, y: footH * 0.42, tone: 'clay', v: 0 })
  pts.push({ r: footR, y: footH, tone: 'glaze', v: 0 })

  for (let i = 1; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES
    pts.push({ r: outerR(t), y: footH + t * bodyH, tone: 'glaze', v: t })
  }

  const lipOuter = outerR(1)
  const lipInner = innerR(1)
  for (let i = 1; i <= 4; i += 1) {
    const u = i / 4
    pts.push({
      r: lipOuter + (lipInner - lipOuter) * u,
      y: height,
      tone: 'rim',
      v: 1,
    })
  }

  for (let i = 1; i <= SAMPLES; i += 1) {
    const t = 1 - i / SAMPLES
    pts.push({ r: innerR(t), y: footH + t * bodyH, tone: 'interior', v: t })
  }

  const floorY = footH * 0.58
  const floorR = innerR(0)
  for (let i = 1; i <= 5; i += 1) {
    const u = i / 5
    pts.push({
      r: floorR * (1 - u * 0.92),
      y: footH + (floorY - footH) * u,
      tone: 'interior',
      v: 0,
    })
  }

  for (let j = 0; j < pts.length; j += 1) {
    const [nr, ny] = profileNormal(pts, j)
    pts[j].nr = nr
    pts[j].ny = ny
  }

  const clay = hexToLinear(palette.clay)
  const glaze = hexToLinear(palette.glaze)
  const rim = hexToLinear(palette.rim)
  const speck = hexToLinear(palette.speck)
  const interior = hexToLinear(palette.interior)

  const speckles = []
  if (study.finish === 'speckled') {
    const seed = study.form === 'bowl' ? 19 : study.form === 'cylinder' ? 37 : 53
    const rand = mulberry32(seed)
    for (let i = 0; i < 52; i += 1) {
      speckles.push({
        u: rand(),
        v: 0.08 + rand() * 0.84,
        radius: 0.016 + rand() * 0.026,
        gain: 0.5 + rand() * 0.5,
      })
    }
  }

  function colorAt(point, u) {
    if (point.tone === 'interior') return interior
    if (point.tone === 'clay') return clay
    if (point.tone === 'rim') return mix(glaze, rim, 0.72)
    let color = mix(clay, glaze, smoothstep(0, 0.14, point.v))
    color = mix(color, rim, smoothstep(0.9, 1, point.v) * 0.55)
    if (point.v > 0.08 && point.v < 0.94) {
      for (let i = 0; i < speckles.length; i += 1) {
        const dot = speckles[i]
        let du = Math.abs(u - dot.u)
        du = Math.min(du, 1 - du)
        const d = Math.hypot(du, (point.v - dot.v) * 0.62)
        if (d < dot.radius) color = mix(color, speck, (1 - d / dot.radius) * dot.gain)
      }
    }
    return color
  }

  const rows = pts.length
  const positions = []
  const normals = []
  const colors = []

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = (i / SEGMENTS) * Math.PI * 2
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const u = i / SEGMENTS
    for (let j = 0; j < rows; j += 1) {
      const point = pts[j]
      positions.push(point.r * cos, point.y, point.r * sin)
      normals.push(point.nr * cos, point.ny, point.nr * sin)
      const rgb = colorAt(point, u)
      colors.push(rgb[0], rgb[1], rgb[2])
    }
  }

  const center = rows * (SEGMENTS + 1)
  const floorPoint = pts[rows - 1]
  positions.push(0, floorPoint.y, 0)
  normals.push(0, 1, 0)
  colors.push(interior[0], interior[1], interior[2])

  const outer = []
  const inner = []
  const vid = (ring, row) => ring * rows + row

  for (let i = 0; i < SEGMENTS; i += 1) {
    for (let j = 0; j < rows - 1; j += 1) {
      const a = vid(i, j)
      const b = vid(i, j + 1)
      const c = vid(i + 1, j)
      const d = vid(i + 1, j + 1)
      const bucket = pts[j].tone === 'interior' && pts[j + 1].tone === 'interior' ? inner : outer
      bucket.push(a, b, c, b, d, c)
    }
    const edge = rows - 1
    inner.push(center, vid(i + 1, edge), vid(i, edge))
  }

  let radius = 0
  for (let j = 0; j < rows; j += 1) radius = Math.max(radius, pts[j].r)

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(outer.concat(inner)),
    groups: [
      { start: 0, count: outer.length, materialIndex: 0 },
      { start: outer.length, count: inner.length, materialIndex: 1 },
    ],
    profile: pts.map((point) => ({
      r: point.r,
      y: point.y,
      nr: point.nr,
      ny: point.ny,
      tone: point.tone,
    })),
    radius,
    height,
    segments: SEGMENTS,
    rows,
  }
}
