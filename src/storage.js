import { constrainStudy } from './geometry.js'

export const STORAGE_KEY = 'form-study.v1'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `study-${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeStudy(entry) {
  if (!isRecord(entry)) return null
  const study = constrainStudy(entry)
  const id = typeof entry.id === 'string' && entry.id ? entry.id : makeId()
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString()
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : createdAt
  return { ...study, id, createdAt, updatedAt }
}

export function loadStudies() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { studies: [], error: null }
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return { studies: [], error: 'The archive could not be read. Starting a fresh studio.' }
    }
    return {
      studies: parsed.map(normalizeStudy).filter(Boolean),
      error: null,
    }
  } catch {
    return {
      studies: [],
      error: 'This browser could not open the local archive.',
    }
  }
}

export function persistStudies(studies) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studies))
    return { error: null }
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      return { error: 'The archive is full. Delete a study before saving another.' }
    }
    return { error: 'The study could not be saved on this device.' }
  }
}

export function createSavedStudy(draft) {
  const now = new Date().toISOString()
  return {
    ...constrainStudy(draft),
    id: makeId(),
    createdAt: now,
    updatedAt: now,
  }
}

export function untitledName(studies) {
  const used = new Set(studies.map((item) => item.name))
  let next = studies.length + 1
  let name = `Untitled study ${String(next).padStart(2, '0')}`
  while (used.has(name)) {
    next += 1
    name = `Untitled study ${String(next).padStart(2, '0')}`
  }
  return name
}
