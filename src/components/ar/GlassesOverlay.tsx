'use client'

import { useEffect, useRef } from 'react'

import {
  AR_SETTINGS,
  DEBUG_MODE,
  LANDMARK_INDICES,
  angleBetween,
  distance,
  toPixels,
  type GlassesFitProfile,
} from '@/config/ar.config'
import type { NormalizedLandmarkList } from '@/hooks/useFaceDetection'
import { getCachedProcessedPng } from '@/lib/ar/png-processor'
import type { ProductWithCategory } from '@/types'

type GlassesOverlayProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: NormalizedLandmarkList | null
  glassesImageUrl: string
  fitProfile: GlassesFitProfile
  product?: ProductWithCategory | null
  isFlipped?: boolean
  forceDebug?: boolean
}

const LEFT_IRIS_CENTER_INDEX = 468
const RIGHT_IRIS_CENTER_INDEX = 473

export function GlassesOverlay({
  canvasRef,
  videoRef,
  landmarks,
  glassesImageUrl,
  fitProfile,
  product,
  isFlipped = true,
  forceDebug = false,
}: GlassesOverlayProps) {
  const renderPending = useRef(false)

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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
        LANDMARK_INDICES.LEFT_EYEBROW_INNER,
        LANDMARK_INDICES.RIGHT_EYEBROW_INNER,
        LANDMARK_INDICES.NOSE_BRIDGE_TOP,
      ]

      const hasRequiredPoints = needed.every((idx) => landmarks[idx])
      if (!hasRequiredPoints) {
        return
      }

      const leftEyeOuter = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER], W, H)
      const rightEyeOuter = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER], W, H)
      const leftIrisLm = landmarks[LEFT_IRIS_CENTER_INDEX]
      const rightIrisLm = landmarks[RIGHT_IRIS_CENTER_INDEX]
      const leftIris = leftIrisLm ? toPixels(leftIrisLm, W, H) : leftEyeOuter
      const rightIris = rightIrisLm ? toPixels(rightIrisLm, W, H) : rightEyeOuter
      const leftEyebrowInner = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYEBROW_INNER], W, H)
      const rightEyebrowInner = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_INNER], W, H)
      const noseBridge = landmarks[LANDMARK_INDICES.NOSE_BRIDGE_TOP]
      const noseBridgeZ = typeof noseBridge?.z === 'number' ? noseBridge.z : 0

      const irisDistance = distance(leftIris, rightIris)
      const depthScale = 1 + noseBridgeZ * -0.3
      const clampedDepthScale = Math.max(0.75, Math.min(1.35, depthScale))

      const glassesWidth = irisDistance * 2.8 * fitProfile.widthFactor
      const finalWidth = glassesWidth * clampedDepthScale

      const centerX = (leftIris.x + rightIris.x) / 2

      const eyeCenterY = (leftIris.y + rightIris.y) / 2
      const browCenterY = (leftEyebrowInner.y + rightEyebrowInner.y) / 2
      const centerY =
        browCenterY +
        (eyeCenterY - browCenterY) * (0.3 + fitProfile.bridgeOffset) +
        H * fitProfile.verticalOffset

      const finalHeight = finalWidth * fitProfile.heightFactor
      const angle = angleBetween(leftIris, rightIris)

      let processedPng: HTMLCanvasElement
      try {
        processedPng = await getCachedProcessedPng(glassesImageUrl)
      } catch {
        return
      }

      ctx.save()
      if (isFlipped) {
        ctx.translate(W, 0)
        ctx.scale(-1, 1)
        ctx.translate(centerX, centerY)
      } else {
        ctx.translate(centerX, centerY)
      }
      ctx.rotate(angle)

      const drawWidth = Math.max(1, Math.round(finalWidth))
      const drawHeight = Math.max(1, Math.round(finalHeight))

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 8 + Math.abs(noseBridgeZ) * 20
      ctx.shadowOffsetY = 3 + Math.abs(noseBridgeZ) * 8
      ctx.drawImage(processedPng, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
      ctx.restore()

      ctx.restore()

      if (DEBUG_MODE || forceDebug) {
        const debugPoints = [
          { lm: landmarks[234], color: '#ff0000', label: 'L-temple' },
          { lm: landmarks[454], color: '#ff0000', label: 'R-temple' },
          { lm: landmarks[33], color: '#00ff00', label: 'L-eye' },
          { lm: landmarks[263], color: '#00ff00', label: 'R-eye' },
          { lm: landmarks[LEFT_IRIS_CENTER_INDEX], color: '#00ffff', label: 'L-iris' },
          { lm: landmarks[RIGHT_IRIS_CENTER_INDEX], color: '#00ffff', label: 'R-iris' },
          { lm: landmarks[107], color: '#0000ff', label: 'L-brow' },
          { lm: landmarks[336], color: '#0000ff', label: 'R-brow' },
          { lm: landmarks[6], color: '#ffff00', label: 'bridge' },
        ]

        debugPoints.forEach(({ lm, color, label }) => {
          if (!lm) {
            return
          }

          const p = toPixels(lm, W, H)
          const px = isFlipped ? W - p.x : p.x
          const py = p.y

          ctx.beginPath()
          ctx.arc(px, py, 5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()

          ctx.fillStyle = 'white'
          ctx.font = '10px monospace'
          ctx.fillText(label, px + 7, py + 4)
        })
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
      renderPending.current = false
    }
  }, [canvasRef, fitProfile, forceDebug, glassesImageUrl, isFlipped, landmarks, product, videoRef])

  return null
}
