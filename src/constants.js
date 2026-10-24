export const APP_NAME = 'FORM / STUDY'

export const DIMENSIONS = {
  height: { min: 8, max: 42, step: 0.1, unit: 'cm', label: 'Height' },
  width: { min: 7, max: 34, step: 0.1, unit: 'cm', label: 'Width' },
  opening: { min: 3, max: 34, step: 0.1, unit: 'cm', label: 'Opening' },
}

export const FORMS = [
  {
    id: 'vessel',
    label: 'Vessel',
    kicker: 'Shouldered',
    description: 'A gathered neck over a fuller body.',
    openingNote: 'The neck stays inside the belly, so the drawing can show a shoulder.',
  },
  {
    id: 'cylinder',
    label: 'Cylinder',
    kicker: 'Upright',
    description: 'Quiet walls and a steady volume.',
    openingNote: 'The lip stays near the wall.',
  },
  {
    id: 'bowl',
    label: 'Bowl',
    kicker: 'Open',
    description: 'A wide rim and a low, generous well.',
    openingNote: 'The rim stays open, close to the widest point.',
  },
]

export const FINISHES = [
  {
    id: 'matte',
    label: 'Matte',
    description: 'A still, even surface.',
  },
  {
    id: 'ribbed',
    label: 'Ribbed',
    description: 'Thrown rings held in the wall.',
  },
  {
    id: 'speckled',
    label: 'Speckled',
    description: 'Iron flecks in the glaze.',
  },
]

export const PALETTES = [
  {
    id: 'kaolin',
    name: 'Kaolin',
    note: 'Bare porcelain',
    clay: '#e4d5bc',
    glaze: '#f3ece0',
    interior: '#e7dccb',
    rim: '#d7c6ac',
    speck: '#8a7358',
  },
  {
    id: 'ash',
    name: 'Ash',
    note: 'Wood-fired grey',
    clay: '#c8bfb2',
    glaze: '#8d8880',
    interior: '#7a756e',
    rim: '#6a6660',
    speck: '#3f3c38',
  },
  {
    id: 'iron',
    name: 'Iron',
    note: 'Reduced dark body',
    clay: '#5a4a3e',
    glaze: '#2c2622',
    interior: '#1f1b18',
    rim: '#171412',
    speck: '#c9b39a',
  },
  {
    id: 'celadon',
    name: 'Celadon',
    note: 'Quiet green glaze',
    clay: '#d8ccb6',
    glaze: '#7fa392',
    interior: '#678c7b',
    rim: '#56786a',
    speck: '#3d4f46',
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    note: 'Studio blue',
    clay: '#d2c6b0',
    glaze: '#2c4a8c',
    interior: '#243c74',
    rim: '#1c2f5c',
    speck: '#d8c6a4',
  },
  {
    id: 'terra',
    name: 'Terra',
    note: 'Earthen red',
    clay: '#c9845c',
    glaze: '#b85a36',
    interior: '#9c4628',
    rim: '#82381e',
    speck: '#f0d2b0',
  },
  {
    id: 'ochre',
    name: 'Ochre',
    note: 'Warm mineral',
    clay: '#d9ae6a',
    glaze: '#c4923c',
    interior: '#a8782c',
    rim: '#8c6424',
    speck: '#5a3e18',
  },
  {
    id: 'ink',
    name: 'Ink wash',
    note: 'Grey-blue slip',
    clay: '#d6cfc2',
    glaze: '#3d4a5c',
    interior: '#303a4a',
    rim: '#242c38',
    speck: '#c5b89f',
  },
]

export const FORM_PRESETS = {
  vessel: { height: 22, width: 14, opening: 7.5 },
  cylinder: { height: 28, width: 11, opening: 9.5 },
  bowl: { height: 10, width: 26, opening: 24 },
}

export const DEFAULT_STUDY = {
  name: '',
  note: '',
  form: 'vessel',
  height: 22,
  width: 14,
  opening: 7.5,
  paletteId: 'celadon',
  finish: 'matte',
}

export function getForm(id) {
  return FORMS.find((item) => item.id === id) ?? FORMS[0]
}

export function getPalette(id) {
  return PALETTES.find((item) => item.id === id) ?? PALETTES[3]
}

export function getFinish(id) {
  return FINISHES.find((item) => item.id === id) ?? FINISHES[0]
}
