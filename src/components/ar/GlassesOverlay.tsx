'use client'

import { useEffect, useRef } from 'react'

import {
  AR_SETTINGS,
  DEBUG_MODE,
  GLASSES_FIT_PROFILES,
  LANDMARK_INDICES,
  angleBetween,
  distance,
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
        LANDMARK_INDICES.LEFT_EYEBROW_INNER,
        LANDMARK_INDICES.RIGHT_EYEBROW_INNER,
      ]

      const hasRequiredPoints = needed.every((idx) => landmarks[idx])
      if (!hasRequiredPoints) {
        return
      }

      const leftEyeOuter = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER], W, H)
      const rightEyeOuter = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER], W, H)
      const leftEyebrowInner = toPixels(landmarks[LANDMARK_INDICES.LEFT_EYEBROW_INNER], W, H)
      const rightEyebrowInner = toPixels(landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_INNER], W, H)

      const eyeDistance = distance(leftEyeOuter, rightEyeOuter)
      const glassesWidth = eyeDistance * 2.4

      const centerX = (leftEyeOuter.x + rightEyeOuter.x) / 2

      const eyeCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2
      const browCenterY = (leftEyebrowInner.y + rightEyebrowInner.y) / 2
      const centerY = browCenterY + (eyeCenterY - browCenterY) * 0.3

      const glassesHeight = glassesWidth * 0.38
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
        ctx.translate(centerX, centerY)
      } else {
        ctx.translate(centerX, centerY)
      }
      ctx.rotate(angle)

      const drawWidth = Math.max(1, Math.round(glassesWidth))
      const drawHeight = Math.max(1, Math.round(glassesHeight))

      const offscreen = document.createElement('canvas')
      offscreen.width = drawWidth
      offscreen.height = drawHeight
      const offCtx = offscreen.getContext('2d')

      if (offCtx) {
        offCtx.drawImage(glassesImg, 0, 0, drawWidth, drawHeight)
        const imageData = offCtx.getImageData(0, 0, drawWidth, drawHeight)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          if (brightness > 230) {
            data[i + 3] = 0
          } else if (brightness > 200) {
            data[i + 3] = Math.round((255 - brightness) * 2.5)
          }
        }

        offCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(offscreen, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight)
      } else {
        ctx.drawImage(
          glassesImg,
          -glassesWidth / 2,
          -glassesHeight / 2,
          glassesWidth,
          glassesHeight
        )
      }
      ctx.restore()

      if (DEBUG_MODE) {
        const debugPoints = [
          { lm: landmarks[234], color: '#ff0000', label: 'L-temple' },
          { lm: landmarks[454], color: '#ff0000', label: 'R-temple' },
          { lm: landmarks[33], color: '#00ff00', label: 'L-eye' },
          { lm: landmarks[263], color: '#00ff00', label: 'R-eye' },
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
  }, [canvasRef, fitProfile, glassesImageUrl, isFlipped, landmarks, product, videoRef])

  return null
}
