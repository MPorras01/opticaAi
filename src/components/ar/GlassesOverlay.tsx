'use client'

import { useEffect, useRef } from 'react'

import { AR_CONFIG } from '@/config/ar.config'
import type { NormalizedLandmarkList } from '@/hooks/useFaceDetection'

type GlassesOverlayProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: NormalizedLandmarkList | null
  glassesImageUrl: string
  isFlipped: boolean
}

type PixelPoint = {
  x: number
  y: number
}

export function GlassesOverlay({
  canvasRef,
  videoRef,
  landmarks,
  glassesImageUrl,
  isFlipped,
}: GlassesOverlayProps) {
  const imageCacheRef = useRef<{ url: string; image: HTMLImageElement } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const W = video.videoWidth || 640
    const H = video.videoHeight || 480
    canvas.width = W
    canvas.height = H

    context.clearRect(0, 0, W, H)

    if (!landmarks || !landmarks.length) {
      context.fillStyle = 'rgba(15, 15, 13, 0.55)'
      context.fillRect(W / 2 - 170, H / 2 - 24, 340, 48)
      context.fillStyle = '#FAFAF8'
      context.font = '500 16px "DM Sans", sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('Coloca tu cara frente a la camara', W / 2, H / 2)
      return
    }

    const leftEye = landmarks[AR_CONFIG.landmarks.leftEyeOuter]
    const rightEye = landmarks[AR_CONFIG.landmarks.rightEyeOuter]
    const noseBridge = landmarks[AR_CONFIG.landmarks.noseBridge]

    if (!leftEye || !rightEye || !noseBridge) {
      return
    }

    const toPixel = (landmark: { x: number; y: number }): PixelPoint => ({
      x: landmark.x * W,
      y: landmark.y * H,
    })

    const leftEyePx = toPixel(leftEye)
    const rightEyePx = toPixel(rightEye)

    const eyeDistance = Math.hypot(rightEyePx.x - leftEyePx.x, rightEyePx.y - leftEyePx.y)
    const glassesWidth = eyeDistance * AR_CONFIG.glassesWidthFactor
    const glassesHeight = glassesWidth * AR_CONFIG.glassesAspectRatio

    const centerX = (leftEyePx.x + rightEyePx.x) / 2
    const centerY = noseBridge.y * H + AR_CONFIG.verticalOffset * H
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (W / H)

    const drawOverlay = (image: HTMLImageElement) => {
      context.clearRect(0, 0, W, H)
      context.save()
      context.translate(centerX, centerY)
      context.rotate(angle)
      if (isFlipped) {
        context.scale(-1, 1)
      }
      context.drawImage(image, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight)
      context.restore()
    }

    const cached = imageCacheRef.current
    if (cached && cached.url === glassesImageUrl) {
      drawOverlay(cached.image)
      return
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      imageCacheRef.current = {
        url: glassesImageUrl,
        image,
      }
      drawOverlay(image)
    }
    image.src = glassesImageUrl
  }, [canvasRef, glassesImageUrl, isFlipped, landmarks, videoRef])

  return null
}
