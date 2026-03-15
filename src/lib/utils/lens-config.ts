import type { LensFilterOption, LensType, PrescriptionData, PrescriptionEyeValues } from '@/types'

type LensConfigShape = {
  id: string
  lensType?: LensType
  lensFilters?: LensFilterOption[]
  prescription?: PrescriptionData | null
}

type SerializedLensNotes = {
  version: 1
  lensFilters: LensFilterOption[]
  prescription: PrescriptionData | null
}

export const LENS_TYPE_LABELS: Record<LensType, string> = {
  'sin-lente': 'Solo montura',
  monofocal: 'Lente monofocal',
  bifocal: 'Lente bifocal',
  progresivo: 'Lente progresivo',
  solar: 'Lente solar',
}

export const LENS_FILTER_LABELS: Record<LensFilterOption, string> = {
  'blue-light': 'Filtro luz azul',
  photochromic: 'Fotocromatico',
  'anti-reflective': 'Antirreflejo',
  'uv-protection': 'Proteccion UV',
  polarized: 'Polarizado',
}

function normalizeValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeEyeValues(values?: PrescriptionEyeValues): PrescriptionEyeValues {
  return {
    sphere: normalizeValue(values?.sphere),
    cylinder: normalizeValue(values?.cylinder),
    axis: normalizeValue(values?.axis),
  }
}

export function normalizePrescriptionData(
  prescription?: PrescriptionData | null
): PrescriptionData | null {
  if (!prescription) {
    return null
  }

  return {
    mode: prescription.mode,
    rightEye: normalizeEyeValues(prescription.rightEye),
    leftEye: normalizeEyeValues(prescription.leftEye),
    pd: normalizeValue(prescription.pd),
    addPower: normalizeValue(prescription.addPower),
    notes: normalizeValue(prescription.notes),
    imagePath: normalizeValue(prescription.imagePath),
    imageFileName: normalizeValue(prescription.imageFileName),
    legalConsent: prescription.legalConsent,
    legalAcceptedAt: prescription.legalAcceptedAt ?? null,
  }
}

export function hasPrescriptionDetails(prescription?: PrescriptionData | null) {
  const normalized = normalizePrescriptionData(prescription)

  if (!normalized) {
    return false
  }

  return Boolean(
    normalized.rightEye.sphere ||
    normalized.rightEye.cylinder ||
    normalized.rightEye.axis ||
    normalized.leftEye.sphere ||
    normalized.leftEye.cylinder ||
    normalized.leftEye.axis ||
    normalized.pd ||
    normalized.addPower ||
    normalized.notes ||
    normalized.imagePath ||
    normalized.imageFileName
  )
}

export function buildCartItemSignature(item: LensConfigShape) {
  return JSON.stringify({
    id: item.id,
    lensType: item.lensType ?? 'sin-lente',
    lensFilters: [...(item.lensFilters ?? [])].sort(),
    prescription: normalizePrescriptionData(item.prescription),
  })
}

export function serializeLensNotes(item: LensConfigShape) {
  const payload: SerializedLensNotes = {
    version: 1,
    lensFilters: [...(item.lensFilters ?? [])].sort(),
    prescription: normalizePrescriptionData(item.prescription),
  }

  if (payload.lensFilters.length === 0 && !payload.prescription) {
    return undefined
  }

  return JSON.stringify(payload)
}

export function parseLensNotes(lensNotes?: string | null): SerializedLensNotes | null {
  if (!lensNotes) {
    return null
  }

  try {
    const parsed = JSON.parse(lensNotes) as Partial<SerializedLensNotes>

    if (parsed.version !== 1) {
      return null
    }

    return {
      version: 1,
      lensFilters: Array.isArray(parsed.lensFilters)
        ? parsed.lensFilters.filter((value): value is LensFilterOption => typeof value === 'string')
        : [],
      prescription: normalizePrescriptionData(parsed.prescription ?? null),
    }
  } catch {
    return null
  }
}
