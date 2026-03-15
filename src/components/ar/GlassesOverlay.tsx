'use client'

import { useEffect, useRef } from 'react'

import {
  AR_SETTINGS,
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
const TEMPORAL_PREVIOUS_WEIGHT = 0.85
const TEMPORAL_CURRENT_WEIGHT = 0.15

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function GlassesOverlay({
  canvasRef,
  videoRef,
  landmarks,
  glassesImageUrl,
  fitProfile,
  isFlipped = true,
  forceDebug = false,
}: GlassesOverlayProps) {
  const renderPending = useRef(false)
  const rafId = useRef<number | null>(null)
  const landmarksRef = useRef(landmarks)
  const latestPropsRef = useRef({
    glassesImageUrl,
    fitProfile,
    isFlipped,
    forceDebug,
  })
  const loadedImageRef = useRef<HTMLCanvasElement | null>(null)
  const smoothedTransformRef = useRef<{
    centerX: number
    centerY: number
    width: number
    height: number
    rotation: number
  } | null>(null)

  useEffect(() => {
    landmarksRef.current = landmarks
    latestPropsRef.current = { glassesImageUrl, fitProfile, isFlipped, forceDebug }
  }, [landmarks, glassesImageUrl, fitProfile, isFlipped, forceDebug])

  useEffect(() => {
    let active = true
    const loadGlassesImage = async () => {
      try {
        const png = await getCachedProcessedPng(glassesImageUrl)
        if (active) {
          loadedImageRef.current = png
        }
      } catch {
        if (active) {
          loadedImageRef.current = null
        }
      }
    }
    loadGlassesImage()
    return () => {
      active = false
      smoothedTransformRef.current = null
    }
  }, [glassesImageUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) {
      return
    }

    const renderLoop = () => {
      rafId.current = window.requestAnimationFrame(renderLoop)

      if (renderPending.current) return
      renderPending.current = true

      try {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const currentLandmarks = landmarksRef.current
        const props = latestPropsRef.current

        const W = video.videoWidth || AR_SETTINGS.videoWidth
        const H = video.videoHeight || AR_SETTINGS.videoHeight
        if (W === 0 || H === 0) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        if (canvas.width !== Math.round(W * dpr)) {
          canvas.width = Math.round(W * dpr)
          canvas.height = Math.round(H * dpr)
          canvas.style.width = `${W}px`
          canvas.style.height = `${H}px`
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)

        if (!currentLandmarks || currentLandmarks.length === 0) {
          ctx.beginPath()
          ctx.strokeStyle = 'rgba(212, 168, 83, 0.4)'
          ctx.lineWidth = 2
          ctx.setLineDash([8, 4])
          ctx.ellipse(W / 2, H / 2, W * 0.22, H * 0.32, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          return
        }

        const needed = [
          LANDMARK_INDICES.LEFT_EYEBROW_INNER,
          LANDMARK_INDICES.RIGHT_EYEBROW_INNER,
          LANDMARK_INDICES.NOSE_BRIDGE_TOP,
        ]

        const hasRequiredPoints = needed.every((idx) => currentLandmarks[idx])
        if (!hasRequiredPoints) return

        const leftEyeOuter = toPixels(currentLandmarks[LANDMARK_INDICES.LEFT_EYE_OUTER], W, H)
        const rightEyeOuter = toPixels(currentLandmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER], W, H)
        const leftTemple = toPixels(currentLandmarks[LANDMARK_INDICES.LEFT_TEMPLE], W, H)
        const rightTemple = toPixels(currentLandmarks[LANDMARK_INDICES.RIGHT_TEMPLE], W, H)
        const noseBridgeTop = toPixels(currentLandmarks[LANDMARK_INDICES.NOSE_BRIDGE_TOP], W, H)
        const leftIrisLm = currentLandmarks[LEFT_IRIS_CENTER_INDEX]
        const rightIrisLm = currentLandmarks[RIGHT_IRIS_CENTER_INDEX]
        const leftIris = leftIrisLm ? toPixels(leftIrisLm, W, H) : leftEyeOuter
        const rightIris = rightIrisLm ? toPixels(rightIrisLm, W, H) : rightEyeOuter

        const noseBridge = currentLandmarks[LANDMARK_INDICES.NOSE_BRIDGE_TOP]
        const noseBridgeZ = typeof noseBridge?.z === 'number' ? noseBridge.z : 0
        const leftTempleZ =
          typeof currentLandmarks[LANDMARK_INDICES.LEFT_TEMPLE]?.z === 'number'
            ? (currentLandmarks[LANDMARK_INDICES.LEFT_TEMPLE]?.z ?? 0)
            : 0
        const rightTempleZ =
          typeof currentLandmarks[LANDMARK_INDICES.RIGHT_TEMPLE]?.z === 'number'
            ? (currentLandmarks[LANDMARK_INDICES.RIGHT_TEMPLE]?.z ?? 0)
            : 0

        const irisDistance = Math.max(distance(leftIris, rightIris), 1)
        const templeDistance = Math.max(distance(leftTemple, rightTemple), 1)
        const roll = angleBetween(leftIris, rightIris)
        const irisMidX = (leftIris.x + rightIris.x) / 2
        const irisMidY = (leftIris.y + rightIris.y) / 2

        const depthZ = (noseBridgeZ + leftTempleZ + rightTempleZ) / 3
        const depthScale = clamp(1 + depthZ * -0.28, 0.86, 1.2)

        // Use iris as primary scale and blend with temples for better face-width realism.
        const irisBasedWidth = irisDistance * 2.2 * props.fitProfile.widthFactor
        const templeBasedWidth = templeDistance * 0.78 * props.fitProfile.widthFactor
        const rawWidth = (irisBasedWidth * 0.75 + templeBasedWidth * 0.25) * depthScale
        const clampedWidth = clamp(rawWidth, irisDistance * 1.9, templeDistance * 0.9)

        // Keep pivot exactly on eye midpoint and lower glasses slightly to sit naturally on eyes/nose.
        const rawCenterX = irisMidX
        const verticalDrop = irisDistance * 0.13
        const noseInfluenceY = (noseBridgeTop.y - irisMidY) * 0.18
        const rawCenterY =
          irisMidY + verticalDrop + noseInfluenceY + H * props.fitProfile.verticalOffset

        const rawHeight = clampedWidth * props.fitProfile.heightFactor

        const previousTransform = smoothedTransformRef.current
        const finalCenterX = previousTransform
          ? previousTransform.centerX * TEMPORAL_PREVIOUS_WEIGHT +
            rawCenterX * TEMPORAL_CURRENT_WEIGHT
          : rawCenterX
        const finalCenterY = previousTransform
          ? previousTransform.centerY * TEMPORAL_PREVIOUS_WEIGHT +
            rawCenterY * TEMPORAL_CURRENT_WEIGHT
          : rawCenterY
        const finalWidth = previousTransform
          ? previousTransform.width * TEMPORAL_PREVIOUS_WEIGHT +
            clampedWidth * TEMPORAL_CURRENT_WEIGHT
          : clampedWidth
        const finalHeight = previousTransform
          ? previousTransform.height * TEMPORAL_PREVIOUS_WEIGHT +
            rawHeight * TEMPORAL_CURRENT_WEIGHT
          : rawHeight
        const finalRotation = previousTransform
          ? previousTransform.rotation * TEMPORAL_PREVIOUS_WEIGHT + roll * TEMPORAL_CURRENT_WEIGHT
          : roll

        smoothedTransformRef.current = {
          centerX: finalCenterX,
          centerY: finalCenterY,
          width: finalWidth,
          height: finalHeight,
          rotation: finalRotation,
        }

        const processedPng = loadedImageRef.current

        if (processedPng) {
          ctx.save()
          if (props.isFlipped) {
            ctx.translate(W, 0)
            ctx.scale(-1, 1)
            ctx.translate(finalCenterX, finalCenterY)
          } else {
            ctx.translate(finalCenterX, finalCenterY)
          }
          ctx.rotate(finalRotation)

          const drawWidth = Math.max(1, Math.round(finalWidth))
          const drawHeight = Math.max(1, Math.round(finalHeight))

          ctx.shadowColor = 'rgba(0,0,0,0.35)'
          ctx.shadowBlur = 8 + Math.abs(noseBridgeZ) * 20
          ctx.shadowOffsetY = 3 + Math.abs(noseBridgeZ) * 8
          ctx.drawImage(processedPng, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

          ctx.restore()
        }

        // Always draw debug points for troubleshooting
        if (true) {
          // Draw all landmarks as small white dots to verify FaceMesh is active
          currentLandmarks.forEach((lm) => {
            if (!lm) return
            const p = toPixels(lm, W, H)
            const px = props.isFlipped ? W - p.x : p.x

            ctx.beginPath()
            ctx.arc(px, p.y, 1, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.fill()
          })

          const debugPoints = [
            { lm: currentLandmarks[234], color: '#ff0000', label: 'L-temple' },
            { lm: currentLandmarks[454], color: '#ff0000', label: 'R-temple' },
            { lm: currentLandmarks[33], color: '#00ff00', label: 'L-eye' },
            { lm: currentLandmarks[263], color: '#00ff00', label: 'R-eye' },
            { lm: currentLandmarks[LEFT_IRIS_CENTER_INDEX], color: '#00ffff', label: 'L-iris' },
            { lm: currentLandmarks[RIGHT_IRIS_CENTER_INDEX], color: '#00ffff', label: 'R-iris' },
            { lm: currentLandmarks[107], color: '#0000ff', label: 'L-brow' },
            { lm: currentLandmarks[336], color: '#0000ff', label: 'R-brow' },
            { lm: currentLandmarks[6], color: '#ffff00', label: 'bridge' },
          ]

          debugPoints.forEach(({ lm, color, label }) => {
            if (!lm) return

            const p = toPixels(lm, W, H)
            const px = props.isFlipped ? W - p.x : p.x
            const py = p.y

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()

            ctx.fillStyle = 'white'
            ctx.font = '10px monospace'
            ctx.fillText(label, px + 7, py + 4)
          })

          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
          ctx.fillRect(8, 8, 200, 62)
          ctx.fillStyle = '#C2FF8A'
          ctx.font = '11px monospace'
          ctx.fillText('yaw: iris-based', 14, 26)
          ctx.fillText('pitch: iris-based', 14, 40)
          ctx.fillText(`roll: ${roll.toFixed(3)}`, 14, 54)
        }
      } finally {
        renderPending.current = false
      }
    }

    rafId.current = window.requestAnimationFrame(renderLoop)

    return () => {
      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      renderPending.current = false
    }
  }, [canvasRef, videoRef])

  return null
}
