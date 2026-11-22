import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Vessel from './Vessel.jsx'

function placeCamera(camera, controls, study) {
  const radius = Math.max(study.width, study.opening, study.base, study.neck) / 2
  const bound = Math.hypot(radius, study.height * 0.5) * 1.2
  const fov = (camera.fov * Math.PI) / 180
  const aspect = Math.max(camera.aspect || 1, 0.45)
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
  const dist = bound / Math.sin(Math.min(fov, hFov) / 2)
  const target = new THREE.Vector3(0, study.height * 0.46, 0)
  camera.position.setFromSphericalCoords(dist, 1.08, -0.48).add(target)
  camera.near = Math.max(0.05, dist / 90)
  camera.far = dist * 14
  camera.updateProjectionMatrix()
  camera.lookAt(target)
  if (!controls) return
  controls.target.copy(target)
  controls.minDistance = dist * 0.42
  controls.maxDistance = dist * 2.8
  controls.update()
}

function Frame({ study, token }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const tokenRef = useRef(null)
  const fitted = useRef(false)
  useLayoutEffect(() => {
    if (!controls) return
    if (!fitted.current || tokenRef.current !== token) {
      tokenRef.current = token
      fitted.current = true
      placeCamera(camera, controls, study)
      return
    }
    controls.target.y = study.height * 0.46
  }, [token, camera, controls, study])
  return null
}

function TurnKeys({ onReady }) {
  const controls = useThree((state) => state.controls)
  useEffect(() => {
    onReady(controls ?? null)
    return () => onReady(null)
  }, [controls, onReady])
  return null
}

export default function ClayCanvas({ study, token, onControls }) {
  return (
    <Canvas
      className="clay__canvas"
      shadows
      dpr={[1, 2]}
      camera={{ fov: 32, position: [28, 18, 36], near: 0.1, far: 500 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.06
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <color attach="background" args={['#faf7f1']} />
      <hemisphereLight args={['#fff8ef', '#cbbba6', 0.72]} />
      <ambientLight intensity={0.22} color="#fff6ec" />
      <directionalLight position={[-42, 78, 48]} intensity={2.3} />
      <directionalLight position={[36, 18, -28]} intensity={0.45} color="#d5deef" />
      <Suspense fallback={null}>
        <Environment frames={1} resolution={256}>
          <Lightformer intensity={3.2} position={[0, 5, -6]} scale={[10, 5, 1]} color="#fff7ee" />
          <Lightformer intensity={1.4} position={[-6, 2, 3]} scale={[3, 7, 1]} color="#d7e0f2" />
          <Lightformer intensity={1.1} position={[6, 1.5, 4]} scale={[2, 4, 1]} color="#f4ece0" />
        </Environment>
      </Suspense>
      <Vessel study={study} />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.32} scale={80} blur={2.5} far={14} color="#3a342c" />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.72}
        zoomSpeed={0.65}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI * 0.49}
      />
      <Frame study={study} token={token} />
      <TurnKeys onReady={onControls} />
    </Canvas>
  )
}
