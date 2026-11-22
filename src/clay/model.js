export const CLAY_LIMITS = {
  height: { min: 6, max: 42, step: 0.1, label: 'Height', unit: 'cm' },
  width: { min: 6, max: 40, step: 0.1, label: 'Maximum width', unit: 'cm' },
  opening: { min: 2.5, max: 40, step: 0.1, label: 'Opening', unit: 'cm' },
  base: { min: 2.5, max: 36, step: 0.1, label: 'Base', unit: 'cm' },
  neck: { min: 2.5, max: 40, step: 0.1, label: 'Neck', unit: 'cm' },
  curve: { min: -10, max: 10, step: 0.1, label: 'Body curve', unit: '' },
}

export const CLAY_FORMS = [
  {
    id: 'vase',
    label: 'Vase',
    kicker: 'Shouldered',
    description: 'A neck gathered over a fuller body.',
  },
  {
    id: 'bowl',
    label: 'Bowl',
    kicker: 'Open',
    description: 'A wide rim and a low well.',
  },
  {
    id: 'cylinder',
    label: 'Cylinder',
    kicker: 'Upright',
    description: 'Quiet walls and a steady volume.',
  },
]

export const FORM_BODIES = {
  vase: { form: 'vase', height: 24, width: 14, opening: 7, base: 8, neck: 6.2, curve: 6 },
  bowl: { form: 'bowl', height: 9, width: 26, opening: 24, base: 11, neck: 23, curve: 3 },
  cylinder: { form: 'cylinder', height: 28, width: 11, opening: 10.2, base: 10.4, neck: 10.6, curve: 0 },
}

export const CLAY_COLORS = [
  { id: 'chalk', name: 'Chalk', glaze: '#f3f0e8', clay: '#e4d8c4', interior: '#ddd6c8', rim: '#cfc6b6' },
  { id: 'ivory', name: 'Ivory', glaze: '#e6d3b0', clay: '#c9ae7a', interior: '#d2bc90', rim: '#b89a68' },
  { id: 'terra', name: 'Terracotta', glaze: '#c45c3e', clay: '#a84830', interior: '#9a4030', rim: '#8a3424' },
  { id: 'cobalt', name: 'Cobalt', glaze: '#2c4a8c', clay: '#d2c6b0', interior: '#243c74', rim: '#1c2f5c' },
  { id: 'sage', name: 'Sage', glaze: '#7f9a86', clay: '#d8ccb6', interior: '#688576', rim: '#5c7568' },
  { id: 'charcoal', name: 'Charcoal', glaze: '#2c2926', clay: '#4a433c', interior: '#1c1a18', rim: '#141210' },
]

export const CLAY_FINISHES = [
  {
    id: 'matte',
    label: 'Matte',
    description: 'A dry, even ceramic surface.',
    roughness: 0.94,
    clearcoat: 0,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.22,
  },
  {
    id: 'gloss',
    label: 'Gloss',
    description: 'A clear glaze that takes the light.',
    roughness: 0.16,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.05,
  },
  {
    id: 'speckled',
    label: 'Speckled',
    description: 'Iron flecks in the clay body.',
    roughness: 0.62,
    clearcoat: 0.2,
    clearcoatRoughness: 0.38,
    envMapIntensity: 0.4,
  },
  {
    id: 'ribbed',
    label: 'Ribbed',
    description: 'Thrown rings held in the wall.',
    roughness: 0.78,
    clearcoat: 0.1,
    clearcoatRoughness: 0.32,
    envMapIntensity: 0.35,
  },
]

export const DEFAULT_CLAY = {
  ...FORM_BODIES.vase,
  color: 'sage',
  finish: 'matte',
}

export function getClayForm(id) {
  return CLAY_FORMS.find((item) => item.id === id) ?? CLAY_FORMS[0]
}

export function getClayColor(id) {
  return CLAY_COLORS.find((item) => item.id === id) ?? CLAY_COLORS[4]
}

export function getClayFinish(id) {
  return CLAY_FINISHES.find((item) => item.id === id) ?? CLAY_FINISHES[0]
}

export function curveLabel(curve) {
  if (curve <= -6) return 'Reverse taper'
  if (curve < -0.5) return 'Opening outward'
  if (curve <= 0.5) return 'Even wall'
  if (curve < 6) return 'Soft belly'
  return 'Gathered'
}
