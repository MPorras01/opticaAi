export type GlassesFitProfile = {
  widthFactor: number
  heightFactor: number
  verticalOffset: number
  bridgeOffset: number
}

export const AR_TEST_GLASSES = [
  {
    id: 'test-1',
    name: 'Clasica Negra',
    overlayUrl: 'https://i.imgur.com/8X4Zs7P.png',
  },
] as const

export const LANDMARK_INDICES = {
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_INNER: 362,
  NOSE_BRIDGE_TOP: 6,
  NOSE_BRIDGE_MID: 197,
  NOSE_TIP: 4,
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  LEFT_EYEBROW_OUTER: 70,
  RIGHT_EYEBROW_OUTER: 300,
  LEFT_EYEBROW_INNER: 107,
  RIGHT_EYEBROW_INNER: 336,
  LEFT_CHEEK: 116,
  RIGHT_CHEEK: 345,
} as const

export const GLASSES_FIT_PROFILES: Record<
  'FULL_FRAME' | 'SEMI_RIMLESS' | 'RIMLESS' | 'OVERSIZED' | 'SPORTS',
  GlassesFitProfile
> = {
  FULL_FRAME: {
    widthFactor: 1.05,
    heightFactor: 0.4,
    verticalOffset: 0.0,
    bridgeOffset: 0.0,
  },
  SEMI_RIMLESS: {
    widthFactor: 1.55,
    heightFactor: 0.38,
    verticalOffset: 0.01,
    bridgeOffset: 0.0,
  },
  RIMLESS: {
    widthFactor: 1.5,
    heightFactor: 0.35,
    verticalOffset: 0.015,
    bridgeOffset: 0.005,
  },
  OVERSIZED: {
    widthFactor: 1.75,
    heightFactor: 0.52,
    verticalOffset: -0.01,
    bridgeOffset: -0.005,
  },
  SPORTS: {
    widthFactor: 1.65,
    heightFactor: 0.45,
    verticalOffset: 0.0,
    bridgeOffset: 0.0,
  },
}

export type FitProfileKey = keyof typeof GLASSES_FIT_PROFILES

export const DEBUG_MODE = false

export const AR_SETTINGS = {
  videoWidth: 640,
  videoHeight: 480,
  smoothingFactor: 0.65,
  minConfidenceToRender: 0.75,
  faceMesh: {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  },
} as const

export type Point2D = { x: number; y: number }
export type NormalizedLandmark = { x: number; y: number; z?: number; visibility?: number }

/**
 * Convierte landmark normalizado (0-1) a pixeles reales.
 */
export function toPixels(
  landmark: NormalizedLandmark,
  videoWidth: number,
  videoHeight: number
): Point2D {
  return {
    x: landmark.x * videoWidth,
    y: landmark.y * videoHeight,
  }
}

/**
 * Distancia euclidiana entre dos puntos en pixeles.
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

/**
 * Punto medio entre dos puntos.
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Angulo en radianes entre dos puntos.
 */
export function angleBetween(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

/**
 * Interpolacion lineal para suavizado.
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

type OverlayCategory = {
  slug?: string | null
}

type ProductOverlayInput = {
  slug?: string | null
  name?: string | null
  frame_shape?: string | null
  ar_overlay_url?: string | null
  ar_fit_profile?: string | null
  ar_width_adjustment?: number | null
  ar_vertical_adjustment?: number | null
  categories?: OverlayCategory | null
}

const PRODUCT_OVERLAY_BY_SLUG: Record<string, string> = {
  'ray-ban-clubmaster-rb3016': AR_TEST_GLASSES[0].overlayUrl,
  'oakley-metalink-ox8153': '/ar-glasses-rectangular.svg',
  'persol-po0714-folding': '/ar-glasses-aviator.svg',
  'polaroid-pld-6067-s': '/ar-glasses-oval.svg',
  'adidas-sp0005-performance': '/ar-glasses-sport.svg',
  'nike-maverick-free-ev1097': '/ar-glasses-sport.svg',
  'tommy-kids-tk1045': '/ar-glasses-kids.svg',
}

const OVERLAY_BY_FRAME_SHAPE: Record<string, string> = {
  rectangular: '/ar-glasses-rectangular.svg',
  'cat-eye': '/ar-glasses-cateye.svg',
  aviador: '/ar-glasses-aviator.svg',
  ovalada: '/ar-glasses-oval.svg',
  cuadrada: '/ar-glasses-rectangular.svg',
  redonda: '/ar-glasses-oval.svg',
  hexagonal: '/ar-glasses-sport.svg',
}

export function resolveArOverlayUrl(product: ProductOverlayInput | null): string {
  if (!product) {
    return AR_TEST_GLASSES[0].overlayUrl
  }

  if (product.ar_overlay_url) {
    return product.ar_overlay_url
  }

  const slug = product.slug?.toLowerCase().trim()
  if (slug && PRODUCT_OVERLAY_BY_SLUG[slug]) {
    return PRODUCT_OVERLAY_BY_SLUG[slug]
  }

  const frameShape = product.frame_shape?.toLowerCase().trim()
  if (frameShape && OVERLAY_BY_FRAME_SHAPE[frameShape]) {
    return OVERLAY_BY_FRAME_SHAPE[frameShape]
  }

  const categorySlug = product.categories?.slug?.toLowerCase().trim()
  if (categorySlug === 'deportivas') {
    return '/ar-glasses-sport.svg'
  }
  if (categorySlug === 'infantiles') {
    return '/ar-glasses-kids.svg'
  }

  return AR_TEST_GLASSES[0].overlayUrl
}

export function resolveFitProfile(product: ProductOverlayInput | null): GlassesFitProfile {
  const explicitProfile = product?.ar_fit_profile as FitProfileKey | null | undefined
  if (explicitProfile && explicitProfile in GLASSES_FIT_PROFILES) {
    return GLASSES_FIT_PROFILES[explicitProfile]
  }

  const shape = product?.frame_shape?.toLowerCase().trim()
  if (shape === 'cat-eye' || shape === 'ovalada') {
    return GLASSES_FIT_PROFILES.OVERSIZED
  }
  if (shape === 'aviador' || shape === 'hexagonal') {
    return GLASSES_FIT_PROFILES.SPORTS
  }
  if (shape === 'rectangular') {
    return GLASSES_FIT_PROFILES.SEMI_RIMLESS
  }
  return GLASSES_FIT_PROFILES.FULL_FRAME
}

export function resolveFitProfileKey(product: ProductOverlayInput | null): FitProfileKey {
  const explicitProfile = product?.ar_fit_profile as FitProfileKey | null | undefined
  if (explicitProfile && explicitProfile in GLASSES_FIT_PROFILES) {
    return explicitProfile
  }

  const shape = product?.frame_shape?.toLowerCase().trim()
  if (shape === 'cat-eye' || shape === 'ovalada') {
    return 'OVERSIZED'
  }
  if (shape === 'aviador' || shape === 'hexagonal') {
    return 'SPORTS'
  }
  if (shape === 'rectangular') {
    return 'SEMI_RIMLESS'
  }
  return 'FULL_FRAME'
}
