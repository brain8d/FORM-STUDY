import { useEffect, useId, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DIMENSIONS, getFinish, getForm, getPalette } from '../constants.js'
import { formatStudioValue } from '../geometry.js'
import { buildVesselSolid } from '../vesselSolid.js'

function uploadSolid(solid) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(solid.positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(solid.normals, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(solid.colors, 3))
  geometry.setIndex(new THREE.BufferAttribute(solid.indices, 1))
  for (const group of solid.groups) {
    geometry.addGroup(group.start, group.count, group.materialIndex)
  }
  return geometry
}

function frameCamera(camera, controls, solid, keepAngle) {
  const fov = (camera.fov * Math.PI) / 180
  const aspect = Math.max(camera.aspect || 1, 0.35)
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
  const bound = Math.hypot(solid.radius, solid.height * 0.5) * 1.28
  const dist = bound / Math.sin(Math.min(fov, hFov) / 2)
  const target = new THREE.Vector3(0, solid.height * 0.46, 0)
  let theta = -0.48
  let phi = 1.08
  if (keepAngle) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
    theta = spherical.theta
    phi = spherical.phi
  }
  camera.position.setFromSpherical(new THREE.Spherical(dist, phi, theta)).add(target)
  camera.near = Math.max(0.05, dist / 80)
  camera.far = dist * 16
  camera.updateProjectionMatrix()
  controls.target.copy(target)
  controls.minDistance = dist * 0.55
  controls.maxDistance = dist * 2.4
  controls.update()
}

export default function VesselView({ study, labelledBy }) {
  const canvasRef = useRef(null)
  const apiRef = useRef(null)
  const studyRef = useRef(study)
  const descId = useId()

  const palette = getPalette(study.paletteId)
  const description = [
    `Turned study of a ${getForm(study.form).label.toLowerCase()}, revolved from the same profile as the drawing.`,
    `Height ${formatStudioValue(study.height, DIMENSIONS.height.unit)},`,
    `width ${formatStudioValue(study.width, DIMENSIONS.width.unit)},`,
    `opening ${formatStudioValue(study.opening, DIMENSIONS.opening.unit)}.`,
    `${palette.name} palette, ${getFinish(study.finish).label.toLowerCase()} surface.`,
    'Drag to turn. Arrow keys nudge the view. Sketch proportions only, not a throwing plan.',
  ].join(' ')

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 800)
    const controls = new OrbitControls(camera, canvas)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.72
    controls.zoomSpeed = 0.7
    controls.minPolarAngle = 0.22
    controls.maxPolarAngle = Math.PI * 0.49

    scene.add(new THREE.HemisphereLight(0xfff8ef, 0xc8bba8, 0.85))
    scene.add(new THREE.AmbientLight(0xfff6ec, 0.28))

    const key = new THREE.DirectionalLight(0xfff3e4, 1.85)
    key.position.set(-46, 82, 52)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.bias = -0.001
    key.shadow.normalBias = 0.18
    scene.add(key)
    scene.add(key.target)

    const fill = new THREE.DirectionalLight(0xd5deef, 0.4)
    fill.position.set(58, 26, -24)
    scene.add(fill)

    const back = new THREE.DirectionalLight(0xfffaf4, 0.5)
    back.position.set(12, 36, -72)
    scene.add(back)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.ShadowMaterial({ opacity: 0.2 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.04
    ground.receiveShadow = true
    scene.add(ground)

    const outerMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0,
    })
    const innerMat = new THREE.MeshStandardMaterial({
      roughness: 0.92,
      metalness: 0,
    })

    let mesh = null
    let solid = null
    let alive = true
    let frameId = 0

    function resize() {
      const el = canvas.parentElement
      if (!el) return false
      const width = el.clientWidth
      const height = el.clientHeight
      if (width < 2 || height < 2) return false
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      return true
    }

    function apply(keepAngle) {
      if (!alive) return
      const current = studyRef.current
      const colors = getPalette(current.paletteId)
      solid = buildVesselSolid(current, colors)
      const geometry = uploadSolid(solid)
      if (!mesh) {
        mesh = new THREE.Mesh(geometry, [outerMat, innerMat])
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
      } else {
        const previous = mesh.geometry
        mesh.geometry = geometry
        previous.dispose()
      }
      innerMat.color.set(colors.interior)
      outerMat.roughness = current.finish === 'matte' ? 0.96 : current.finish === 'ribbed' ? 0.8 : 0.58
      key.target.position.set(0, solid.height * 0.42, 0)
      const reach = Math.max(solid.radius, solid.height) * 1.7
      const shadow = key.shadow.camera
      shadow.left = -reach
      shadow.right = reach
      shadow.top = reach
      shadow.bottom = -reach
      shadow.near = 1
      shadow.far = 300
      shadow.updateProjectionMatrix()
      resize()
      frameCamera(camera, controls, solid, keepAngle)
    }

    function reset() {
      if (solid) frameCamera(camera, controls, solid, false)
    }

    apply(false)
    apiRef.current = { camera, controls, reset, rebuild: () => apply(true) }

    const observer = new ResizeObserver(() => {
      if (!resize() || !solid) return
      frameCamera(camera, controls, solid, true)
    })
    observer.observe(canvas.parentElement)

    function tick() {
      if (!alive) return
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      alive = false
      cancelAnimationFrame(frameId)
      observer.disconnect()
      controls.dispose()
      mesh?.geometry.dispose()
      outerMat.dispose()
      innerMat.dispose()
      ground.geometry.dispose()
      ground.material.dispose()
      renderer.dispose()
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    studyRef.current = study
    apiRef.current?.rebuild()
  }, [study])

  function onKeyDown(event) {
    const api = apiRef.current
    if (!api) return
    const step = event.shiftKey ? 0.06 : 0.16
    const offset = api.camera.position.clone().sub(api.controls.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    if (event.key === 'ArrowLeft') spherical.theta += step
    else if (event.key === 'ArrowRight') spherical.theta -= step
    else if (event.key === 'ArrowUp') spherical.phi = Math.max(0.22, spherical.phi - step)
    else if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI * 0.49, spherical.phi + step)
    else return
    event.preventDefault()
    offset.setFromSpherical(spherical)
    api.camera.position.copy(api.controls.target).add(offset)
    api.controls.update()
  }

  return (
    <div
      className="plate turntable"
      role="img"
      aria-labelledby={labelledBy}
      aria-describedby={descId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (event.button === 0) event.currentTarget.focus()
      }}
      onDoubleClick={() => apiRef.current?.reset()}
    >
      <p id={descId} className="visually-hidden">
        {description}
      </p>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
