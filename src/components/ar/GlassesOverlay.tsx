'use client'

import { useEffect, useRef } from 'react'

import {
  AR_SETTINGS,
  GLASSES_FIT_PROFILES,
  LANDMARK_INDICES,
  angleBetween,
  distance,
  midpoint,
  toPixels,
  type GlassesFitProfile,
} from '@/config/ar.config'
import type { NormalizedLandmarkList } from '@/hooks/useFaceDetection'
import type { ProductWithCategory } from '@/types'

type GlassesOverlayProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: NormalizedLandmarkList | null
  glassesImageUrl: string
  fitProfile: GlassesFitProfile
  product?: ProductWithCategory | null
  isFlipped?: boolean
}

export function GlassesOverlay({
  canvasRef,
  videoRef,
  landmarks,
  glassesImageUrl,
  fitProfile,
  product,
  isFlipped = true,
}: GlassesOverlayProps) {
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const renderPending = useRef(false)

  const getGlassesImage = async (url: string): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(url)
    if (cached) {
      return cached
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageCache.current.set(url, img)
        resolve(img)
      }
      img.onerror = () => {
        reject(new Error(`No se pudo cargar overlay: ${url}`))
      }
      img.src = url
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) {
      return
    }

    if (renderPending.current) {
      return
    }

    renderPending.current = true

    const frame = window.requestAnimationFrame(async () => {
      renderPending.current = false

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const W = video.videoWidth || AR_SETTINGS.videoWidth
      const H = video.videoHeight || AR_SETTINGS.videoHeight
      canvas.width = W
      canvas.height = H
      ctx.clearRect(0, 0, W, H)

      if (!landmarks || landmarks.length === 0) {
        ctx.save()
        ctx.strokeStyle = 'rgba(212, 168, 83, 0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.ellipse(W / 2, H / 2, W * 0.22, H * 0.32, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        return
      }

      const needed = [
        LANDMARK_INDICES.LEFT_EYE_OUTER,
        LANDMARK_INDICES.RIGHT_EYE_OUTER,
        LANDMARK_INDICES.LEFT_TEMPLE,
        LANDMARK_INDICES.RIGHT_TEMPLE,
        LANDMARK_INDICES.NOSE_BRIDGE_TOP,
        LANDMARK_INDICES.NOSE_BRIDGE_MID,
        LANDMARK_INDICES.LEFT_EYEBROW_INNER,
        LANDMARK_INDICES.RIGHT_EYEBROW_INNER,
      ]

      const hasRequiredPoints = needed.every((idx) => landmarks[idx])
      if (!hasRequiredPoints) {
        return
      }

      const leftEyeOuter = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER], W, H)
      const rightEyeOuter = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER], W, H)
      const leftTemple = toPixels(landmarks[LANDMARK_INDICES.LEFT_TEMPLE], W, H)
      const rightTemple = toPixels(landmarks[LANDMARK_INDICES.RIGHT_TEMPLE], W, H)
      const noseBridgeTop = toPixels(landmarks[LANDMARK_INDICES.NOSE_BRIDGE_TOP], W, H)
      const noseBridgeMid = toPixels(landmarks[LANDMARK_INDICES.NOSE_BRIDGE_MID], W, H)
      const leftEyebrow = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYEBROW_INNER], W, H)
      const rightEyebrow = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_INNER], W, H)

      const fitKey =
        product?.ar_fit_profile && product.ar_fit_profile in GLASSES_FIT_PROFILES
          ? (product.ar_fit_profile as keyof typeof GLASSES_FIT_PROFILES)
          : null

      const baseProfile = fitKey ? GLASSES_FIT_PROFILES[fitKey] : fitProfile

      const effectiveProfile: GlassesFitProfile = {
        ...baseProfile,
        widthFactor: baseProfile.widthFactor * (product?.ar_width_adjustment ?? 1.0),
        verticalOffset: baseProfile.verticalOffset + (product?.ar_vertical_adjustment ?? 0.0),
      }

      const templeDistance = distance(leftTemple, rightTemple)
      const glassesWidth = templeDistance * effectiveProfile.widthFactor

      const eyeCenter = midpoint(leftEyeOuter, rightEyeOuter)
      const eyebrowCenter = midpoint(leftEyebrow, rightEyebrow)
      const verticalRef = midpoint(noseBridgeTop, eyebrowCenter)
      const centerX = eyeCenter.x
      const centerY =
        verticalRef.y + effectiveProfile.verticalOffset * H + effectiveProfile.bridgeOffset * H

      const bridgeDeltaY = noseBridgeMid.y - noseBridgeTop.y
      const glassesHeight = glassesWidth * effectiveProfile.heightFactor + bridgeDeltaY * 0.08
      const angle = angleBetween(leftEyeOuter, rightEyeOuter)

      let glassesImg: HTMLImageElement
      try {
        glassesImg = await getGlassesImage(glassesImageUrl)
      } catch {
        return
      }

      ctx.save()
      if (isFlipped) {
        ctx.translate(W, 0)
        ctx.scale(-1, 1)
        const mirroredX = W - centerX
        ctx.translate(mirroredX, centerY)
      } else {
        ctx.translate(centerX, centerY)
      }
      ctx.rotate(angle)
      ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight)
      ctx.restore()
    })

    return () => {
      window.cancelAnimationFrame(frame)
      renderPending.current = false
    }
  }, [canvasRef, fitProfile, glassesImageUrl, isFlipped, landmarks, product, videoRef])

  return null
}
