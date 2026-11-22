// A thrown pot is a profile revolved around its axis.
// The strip runs up the outside, across the lip, down the inside, and over the floor,
// so the vessel stays hollow and the opening reads as clay rather than a solid.

const SEGMENTS = 96
const SAMPLES = 64

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
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

function radiusAt(study, t) {
  const foot = study.base / 2
  const belly = study.width / 2
  const neck = study.neck / 2
  const lip = study.opening / 2
  const k = clamp(study.curve, -10, 10) / 10
  const single = mixFrames(
    [
      { t: 0, r: foot },
      { t: 0.1, r: lerp(foot, belly, 0.32) },
      { t: 0.42, r: belly },
      { t: 0.66, r: lerp(belly, neck, 0.62) },
      { t: 0.84, r: neck },
      { t: 1, r: lip },
    ],
    t,
  )
  const gathered = mixFrames(
    [
      { t: 0, r: foot },
      { t: 0.12, r: lerp(foot, belly, 0.62) },
      { t: 0.32, r: belly },
      { t: 0.5, r: lerp(belly, neck, 0.22) },
      { t: 0.72, r: lerp(neck, lip, 0.35) },
      { t: 1, r: lip },
    ],
    t,
  )
  const reverse = mixFrames(
    [
      { t: 0, r: foot },
      { t: 0.28, r: lerp(foot, belly, 0.22) },
      { t: 0.62, r: lerp(foot, belly, 0.78) },
      { t: 0.86, r: Math.max(belly, neck) },
      { t: 1, r: lip },
    ],
    t,
  )
  const other = k >= 0 ? gathered : reverse
  return Math.max(0.2, lerp(single, other, Math.abs(k)))
}

function profileNormal(points, index) {
  const prev = points[Math.max(0, index - 1)]
  const next = points[Math.min(points.length - 1, index + 1)]
  const dr = next.r - prev.r
  const dy = next.y - prev.y
  const length = Math.hypot(dr, dy)
  if (length < 1e-5) return [1, 0]
  return [dy / length, -dr / length]
}

export function buildClaySolid(study, palette) {
  const height = study.height
  const footH = clamp(height * 0.055, 0.25, 1.15)
  const bodyH = Math.max(height - footH, 0.4)
  let minR = Infinity
  for (let i = 0; i <= SAMPLES; i += 1) minR = Math.min(minR, radiusAt(study, i / SAMPLES))
  const wall = Math.min(clamp(minR * 0.16, 0.28, 0.58), minR * 0.36)
  const ribbed = study.finish === 'ribbed'
  const ribCount = study.form === 'bowl' ? 7 : 14

  function outerR(t) {
    let radius = radiusAt(study, t)
    if (ribbed) {
      const fade = Math.sin(Math.PI * t)
      radius += Math.sin(t * ribCount * Math.PI * 2) * 0.055 * fade
    }
    return Math.max(radius, 0.15)
  }

  function innerR(t) {
    return Math.max(radiusAt(study, t) - wall, 0.2)
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
    pts.push({ r: lipOuter + (lipInner - lipOuter) * u, y: height, tone: 'rim', v: 1 })
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
  const interior = hexToLinear(palette.interior)
  const rows = pts.length
  const positions = []
  const normals = []
  const colors = []
  const uvs = []

  function colorAt(point) {
    if (point.tone === 'interior') return interior
    if (point.tone === 'clay') return clay
    if (point.tone === 'rim') return mix(glaze, rim, 0.7)
    let color = mix(clay, glaze, smoothstep(0, 0.14, point.v))
    color = mix(color, rim, smoothstep(0.9, 1, point.v) * 0.5)
    return color
  }

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = (i / SEGMENTS) * Math.PI * 2
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    for (let j = 0; j < rows; j += 1) {
      const point = pts[j]
      positions.push(point.r * cos, point.y, point.r * sin)
      normals.push(point.nr * cos, point.ny, point.nr * sin)
      const rgb = colorAt(point)
      colors.push(rgb[0], rgb[1], rgb[2])
      uvs.push(i / SEGMENTS, point.v)
    }
  }

  const center = rows * (SEGMENTS + 1)
  const floorPoint = pts[rows - 1]
  positions.push(0, floorPoint.y, 0)
  normals.push(0, 1, 0)
  colors.push(interior[0], interior[1], interior[2])
  uvs.push(0.5, 0)

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
    inner.push(center, vid(i + 1, rows - 1), vid(i, rows - 1))
  }

  let radius = 0
  for (let j = 0; j < rows; j += 1) radius = Math.max(radius, pts[j].r)

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(outer.concat(inner)),
    groups: [
      { start: 0, count: outer.length, materialIndex: 0 },
      { start: outer.length, count: inner.length, materialIndex: 1 },
    ],
    radius,
    height,
    profile: pts.map((point) => ({ nr: point.nr, ny: point.ny, tone: point.tone, y: point.y })),
    rows,
    segments: SEGMENTS,
  }
}
