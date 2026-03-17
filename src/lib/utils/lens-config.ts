import type { LensFilterOption, LensType, PrescriptionData, PrescriptionEyeValues } from '@/types'

export type AdvancedLensSelection = {
  type?: string
  typeId?: string
  material?: string
  materialId?: string
  filters: string[]
  filterIds: string[]
  tint?: string
  tintId?: string
  thickness?: string
  thicknessId?: string
  totalAddition: number
}

type LensConfigShape = {
  id: string
  lensType?: LensType
  lensFilters?: LensFilterOption[]
  prescription?: PrescriptionData | null
  lensSelection?: AdvancedLensSelection
}

type SerializedLensNotes = {
  version: 1
  lensFilters: LensFilterOption[]
  prescription: PrescriptionData | null
  lensSelection?: AdvancedLensSelection
}

export const LENS_TYPE_LABELS: Record<LensType, string> = {
  'sin-lente': 'Solo montura',
  monofocal: 'Monofocal',
  bifocal: 'Bifocal',
  progresivo: 'Progresivo',
  solar: 'Solar',
}

export const LENS_FILTER_LABELS: Record<LensFilterOption, string> = {
  'blue-light': 'Filtro luz azul',
  photochromic: 'Fotocromático',
  'anti-reflective': 'Antirreflejo',
  'uv-protection': 'Protección UV',
  polarized: 'Polarizado',
}

export const LENS_MATERIAL_LABELS: Record<string, string> = {
  'cr-39': 'CR-39',
  polycarbonate: 'Policarbonato',
  trivex: 'Trivex',
}

export const LENS_TINT_LABELS: Record<string, string> = {
  clear: 'Sin tinte',
  gray: 'Gris',
  brown: 'Café',
  green: 'Verde',
}

export const LENS_THICKNESS_LABELS: Record<string, string> = {
  '1.50': 'Estándar 1.50',
  '1.60': 'Delgado 1.60',
  '1.67': 'Ultra delgado 1.67',
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
    lensSelection: item.lensSelection
      ? {
          typeId: item.lensSelection.typeId,
          materialId: item.lensSelection.materialId,
          filterIds: [...(item.lensSelection.filterIds ?? [])].sort(),
          tintId: item.lensSelection.tintId,
          thicknessId: item.lensSelection.thicknessId,
        }
      : null,
    prescription: normalizePrescriptionData(item.prescription),
  })
}

export function serializeLensNotes(item: LensConfigShape) {
  const payload: SerializedLensNotes = {
    version: 1,
    lensFilters: [...(item.lensFilters ?? [])].sort(),
    prescription: normalizePrescriptionData(item.prescription),
    lensSelection: item.lensSelection,
  }

  if (payload.lensFilters.length === 0 && !payload.prescription && !payload.lensSelection) {
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
      lensSelection:
        parsed.lensSelection && typeof parsed.lensSelection === 'object'
          ? {
              type:
                typeof parsed.lensSelection.type === 'string'
                  ? parsed.lensSelection.type
                  : undefined,
              typeId:
                typeof parsed.lensSelection.typeId === 'string'
                  ? parsed.lensSelection.typeId
                  : undefined,
              material:
                typeof parsed.lensSelection.material === 'string'
                  ? parsed.lensSelection.material
                  : undefined,
              materialId:
                typeof parsed.lensSelection.materialId === 'string'
                  ? parsed.lensSelection.materialId
                  : undefined,
              filters: Array.isArray(parsed.lensSelection.filters)
                ? parsed.lensSelection.filters.filter(
                    (value): value is string => typeof value === 'string'
                  )
                : [],
              filterIds: Array.isArray(parsed.lensSelection.filterIds)
                ? parsed.lensSelection.filterIds.filter(
                    (value): value is string => typeof value === 'string'
                  )
                : [],
              tint:
                typeof parsed.lensSelection.tint === 'string'
                  ? parsed.lensSelection.tint
                  : undefined,
              tintId:
                typeof parsed.lensSelection.tintId === 'string'
                  ? parsed.lensSelection.tintId
                  : undefined,
              thickness:
                typeof parsed.lensSelection.thickness === 'string'
                  ? parsed.lensSelection.thickness
                  : undefined,
              thicknessId:
                typeof parsed.lensSelection.thicknessId === 'string'
                  ? parsed.lensSelection.thicknessId
                  : undefined,
              totalAddition:
                typeof parsed.lensSelection.totalAddition === 'number'
                  ? parsed.lensSelection.totalAddition
                  : 0,
            }
          : undefined,
    }
  } catch {
    return null
  }
}
