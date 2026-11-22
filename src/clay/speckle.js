import * as THREE from 'three'

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED = { bowl: 19, cylinder: 37, vase: 53 }

export function makeSpeckleTexture(palette, form) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const wash = ctx.createLinearGradient(0, canvas.height, 0, 0)
  wash.addColorStop(0, palette.clay)
  wash.addColorStop(0.14, palette.glaze)
  wash.addColorStop(0.88, palette.glaze)
  wash.addColorStop(1, palette.rim)
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const lightBody = palette.id === 'chalk' || palette.id === 'ivory'
  const speck = lightBody ? '#8a7358' : '#efe4d0'
  const rand = mulberry32(SEED[form] ?? 53)
  for (let i = 0; i < 240; i += 1) {
    const v = 0.1 + rand() * 0.76
    const x = rand() * canvas.width
    const y = (1 - v) * canvas.height
    const radius = 1.1 + rand() * 2.2
    ctx.fillStyle = speck
    ctx.globalAlpha = 0.28 + rand() * 0.62
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius * (0.65 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = 8
  return texture
}
