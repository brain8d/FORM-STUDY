import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { getClayColor, getClayFinish } from './model.js'
import { buildClaySolid } from './profile.js'
import { makeSpeckleTexture } from './speckle.js'

function toGeometry(solid) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(solid.positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(solid.normals, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(solid.colors, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(solid.uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(solid.indices, 1))
  for (const group of solid.groups) {
    geometry.addGroup(group.start, group.count, group.materialIndex)
  }
  geometry.computeBoundingSphere()
  return geometry
}

export default function Vessel({ study }) {
  const palette = getClayColor(study.color)
  const finish = getClayFinish(study.finish)
  const geometry = useMemo(() => toGeometry(buildClaySolid(study, palette)), [study, palette])

  const speckled = finish.id === 'speckled'
  const speckleMap = useMemo(
    () => (speckled ? makeSpeckleTexture(palette, study.form) : null),
    [speckled, palette, study.form],
  )
  const outer = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: !speckleMap,
        map: speckleMap,
        roughness: finish.roughness,
        metalness: 0,
        clearcoat: finish.clearcoat,
        clearcoatRoughness: finish.clearcoatRoughness,
        envMapIntensity: finish.envMapIntensity,
      }),
    [finish, speckleMap],
  )
  const inner = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: palette.interior,
      roughness: 0.88,
      metalness: 0,
      clearcoat: finish.id === 'gloss' ? 0.25 : 0,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.2,
    })
    return material
  }, [palette, finish])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => outer.dispose(), [outer])
  useEffect(() => () => inner.dispose(), [inner])
  useEffect(() => () => speckleMap?.dispose(), [speckleMap])

  return <mesh geometry={geometry} material={[outer, inner]} castShadow receiveShadow />
}
