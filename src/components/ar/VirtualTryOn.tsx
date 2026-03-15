'use client'

import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Camera, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GlassesOverlay } from '@/components/ar/GlassesOverlay'
import { CameraView } from '@/components/ar/CameraView'
import type { GlassesFitProfile } from '@/config/ar.config'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCamera } from '@/hooks/useCamera'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import type { ProductWithCategory } from '@/types'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

type TryOnPhase = 'idle' | 'requesting' | 'loading-model' | 'running' | 'error'

type VirtualTryOnProps = {
  glassesImageUrl: string
  glassesName: string
  fitProfile: GlassesFitProfile
  product?: ProductWithCategory | null
  onSnapshot?: (dataUrl: string) => void
}

export function VirtualTryOn({
  glassesImageUrl,
  glassesName,
  fitProfile,
  product,
  onSnapshot,
}: VirtualTryOnProps) {
  const [phase, setPhase] = useState<TryOnPhase>('idle')
  const [startupError, setStartupError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { videoRef, isReady, error: cameraError, requestCamera, releaseCamera } = useCamera()

  const {
    landmarks,
    isLoading,
    fps,
    error: detectionError,
    pauseDetection,
    resumeDetection,
    startDetection,
    stopDetection,
    status,
    faceDetected,
    faceCount,
    confidenceScore,
  } = useFaceDetection({ videoRef })

  const error = startupError || cameraError || detectionError
  const uiPhase: TryOnPhase = error ? 'error' : phase

  const handleActivate = useCallback(async () => {
    setStartupError(null)
    setPhase('requesting')
    await requestCamera()
  }, [requestCamera])

  const handleRetry = useCallback(async () => {
    setStartupError(null)
    stopDetection()
    releaseCamera()
    setPhase('idle')
    setPhase('requesting')
    await requestCamera()
  }, [releaseCamera, requestCamera, stopDetection])

  useEffect(() => {
    if (phase !== 'requesting' && phase !== 'loading-model') {
      return
    }

    if (cameraError) return

    if (!isReady) {
      return
    }

    let canceled = false

    const runDetection = async () => {
      try {
        setPhase('loading-model')
        await startDetection()

        if (!detectionError && !canceled) {
          setPhase('running')
        }
      } catch (err) {
        console.error('AR Error completo:', err)
        stopDetection()
        setStartupError(
          err instanceof Error
            ? `No se pudo iniciar rapido el modelo: ${err.message}`
            : 'No se pudo iniciar rapido el modelo de deteccion facial.'
        )
        setPhase('error')
      }
    }

    runDetection()
    return () => {
      canceled = true
    }
  }, [cameraError, detectionError, isReady, phase, startDetection, stopDetection])

  useEffect(() => {
    return () => {
      stopDetection()
      releaseCamera()
    }
  }, [releaseCamera, stopDetection])

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current
    const overlayCanvas = canvasRef.current
    if (!video || !overlayCanvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = video.videoWidth
    resultCanvas.height = video.videoHeight
    const context = resultCanvas.getContext('2d')
    if (!context) return null

    // Draw video horizontally flipped since it's a mirror image
    context.save()
    context.scale(-1, 1)
    context.translate(-resultCanvas.width, 0)
    context.drawImage(video, 0, 0, resultCanvas.width, resultCanvas.height)
    context.restore()

    // Draw the AR overlay
    context.drawImage(overlayCanvas, 0, 0, resultCanvas.width, resultCanvas.height)

    return resultCanvas.toDataURL('image/jpeg', 0.9)
  }, [videoRef])

  if (uiPhase === 'idle') {
    return (
      <div className="aspect-[4/3] w-full rounded-2xl bg-[#0F0F0D] p-6 text-[#FAFAF8]">
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-[#1F1F1B] text-[#D4A853]">
            <Camera className="size-7" />
          </div>
          <h3 className={cn(playfairDisplay.className, 'text-3xl font-semibold')}>
            Activa la camara para probar estas gafas
          </h3>
          <Button
            onClick={handleActivate}
            className={cn(
              dmSans.className,
              'rounded-full bg-[#D4A853] px-5 text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
            )}
          >
            Activar camara
          </Button>
        </div>
      </div>
    )
  }

  if (uiPhase === 'error') {
    return (
      <div className="aspect-[4/3] w-full rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-6">
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <p className="text-4xl" aria-hidden="true">
            ⚠️
          </p>
          <h3 className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}>
            No pudimos iniciar el probador
          </h3>
          <p className={cn(dmSans.className, 'max-w-md text-sm text-[#6E6E67]')}>
            {error || 'Ocurrio un error inesperado con la camara o la deteccion facial.'}
          </p>
          <Button
            onClick={handleRetry}
            className={cn(
              dmSans.className,
              'rounded-full bg-[#D4A853] px-5 text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
            )}
          >
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E2DDD6] bg-[#0F0F0D]">
      <CameraView ref={videoRef} className="h-auto w-full rounded-2xl object-cover" />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
      />

      <GlassesOverlay
        canvasRef={canvasRef}
        videoRef={videoRef}
        landmarks={landmarks}
        glassesImageUrl={glassesImageUrl}
        fitProfile={fitProfile}
        product={product}
        isFlipped
      />

      {uiPhase === 'loading-model' || isLoading ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0F0F0D]/65 text-[#FAFAF8]">
          <Loader2 className="size-7 animate-spin text-[#D4A853]" />
          <p className={cn(dmSans.className, 'text-sm font-medium')}>
            Cargando modelo de deteccion facial e inicializando camara...
          </p>
          <div className="h-1.5 w-52 overflow-hidden rounded-full bg-[#2C2C27]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4A853]" />
          </div>
        </div>
      ) : null}

      {uiPhase === 'running' ? (
        <>
          <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-2 rounded-full bg-[#0F0F0D]/70 px-3 py-1 text-xs text-[#FAFAF8]">
            <span className="inline-flex size-2 animate-pulse rounded-full bg-[#2DD36F]" />
            En vivo
          </div>

          {/* DEBUG HUD: Verifying pipeline data propagation */}
          <div className="pointer-events-none absolute top-16 right-3 z-30 flex flex-col gap-1 rounded bg-black/80 p-3 font-mono text-xs text-lime-400">
            <div>ESTADO: {status}</div>
            <div>FPS: {fps}</div>
            <div>
              ROSTRO: {faceDetected ? 'SI' : 'NO'} | PUNTOS: {landmarks ? landmarks.length : 0}
            </div>
            <div>CONFIANZA: {(confidenceScore * 100).toFixed(0)}%</div>
            <div>ROSTROS: {faceCount}</div>
          </div>

          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <Button
              onClick={() => {
                pauseDetection()
                const dataUrl = takeSnapshot()
                if (dataUrl && onSnapshot) {
                  onSnapshot(dataUrl)
                }
                setTimeout(() => {
                  resumeDetection()
                }, 250)
              }}
              className={cn(
                dmSans.className,
                'rounded-full bg-[#D4A853] px-4 py-2 text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
              )}
            >
              📸 Capturar
            </Button>
            <span
              className={cn(
                dmSans.className,
                'rounded-full bg-[#0F0F0D]/70 px-3 py-1 text-xs text-[#FAFAF8]'
              )}
            >
              {glassesName}
            </span>
          </div>

          {!landmarks ? (
            <div className="absolute right-3 bottom-14 z-20 [animation:fade-in_250ms_ease_2s_forwards] rounded-xl bg-[#0F0F0D]/75 px-3 py-2 text-xs text-[#FAFAF8] opacity-0">
              Ubicando rostro...
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
