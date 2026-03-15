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
        const leftEyebrowInner = toPixels(
          currentLandmarks[LANDMARK_INDICES.LEFT_EYEBROW_INNER],
          W,
          H
        )
        const rightEyebrowInner = toPixels(
          currentLandmarks[LANDMARK_INDICES.RIGHT_EYEBROW_INNER],
          W,
          H
        )
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

        const irisDistance = distance(leftIris, rightIris)
        const templeDistance = Math.max(distance(leftTemple, rightTemple), 1)
        const templeCenterX = (leftTemple.x + rightTemple.x) / 2
        const templeCenterY = (leftTemple.y + rightTemple.y) / 2

        // Head orientation from temples + nose bridge.
        const roll = angleBetween(leftTemple, rightTemple)
        const yaw = clamp((noseBridgeTop.x - templeCenterX) / templeDistance, -1, 1)
        const pitch = clamp((noseBridgeTop.y - templeCenterY) / (templeDistance * 0.6), -1, 1)

        const depthZ = (noseBridgeZ + leftTempleZ + rightTempleZ) / 3
        const depthScale = 1 + depthZ * -0.35
        const clampedDepthScale = clamp(depthScale, 0.72, 1.35)

        const glassesWidth = irisDistance * 2.8 * props.fitProfile.widthFactor
        const yawScale = 1 - Math.abs(yaw) * 0.08
        const finalWidth = glassesWidth * clampedDepthScale * yawScale

        const centerX = (leftIris.x + rightIris.x) / 2 + yaw * (irisDistance * 0.22)

        const eyeCenterY = (leftIris.y + rightIris.y) / 2
        const browCenterY = (leftEyebrowInner.y + rightEyebrowInner.y) / 2
        const centerY =
          browCenterY +
          (eyeCenterY - browCenterY) * (0.3 + props.fitProfile.bridgeOffset) +
          pitch * (irisDistance * 0.12) +
          H * props.fitProfile.verticalOffset

        const finalHeight = finalWidth * props.fitProfile.heightFactor
        const angle = roll

        const processedPng = loadedImageRef.current

        if (processedPng) {
          ctx.save()
          if (props.isFlipped) {
            ctx.translate(W, 0)
            ctx.scale(-1, 1)
            ctx.translate(centerX, centerY)
          } else {
            ctx.translate(centerX, centerY)
          }
          ctx.rotate(angle)

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
          ctx.fillText(`yaw: ${yaw.toFixed(3)}`, 14, 26)
          ctx.fillText(`pitch: ${pitch.toFixed(3)}`, 14, 40)
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
