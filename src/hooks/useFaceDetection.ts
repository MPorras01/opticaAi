import { useCallback, useEffect, useRef, useState } from 'react'

import { AR_SETTINGS, lerp } from '@/config/ar.config'

export type FaceLandmark = {
  x: number
  y: number
  z?: number
  visibility?: number
}

export type NormalizedLandmarkList = FaceLandmark[]

type FaceMeshResult = {
  multiFaceLandmarks?: NormalizedLandmarkList[]
  multiFaceDetections?: Array<{ score?: number[] }>
}

type FaceMeshInstance = {
  setOptions: (options: {
    maxNumFaces: number
    refineLandmarks: boolean
    minDetectionConfidence: number
    minTrackingConfidence: number
  }) => void
  onResults: (callback: (results: FaceMeshResult) => void) => void
  send: (input: { image: HTMLVideoElement }) => Promise<void>
  close?: () => Promise<void> | void
}

type UseFaceDetectionParams = {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export interface FaceDetection {
  landmarks: NormalizedLandmarkList | null
  isLoading: boolean
  isDetecting: boolean
  error: string | null
  faceDetected: boolean
  faceCount: number
  fps: number
  confidenceScore: number
  pauseDetection: () => void
  resumeDetection: () => void
  startDetection: () => Promise<void>
  stopDetection: () => void
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

function estimateConfidence(results: FaceMeshResult, rawLandmarks: NormalizedLandmarkList): number {
  const directScore = results.multiFaceDetections?.[0]?.score?.[0]
  if (typeof directScore === 'number') {
    return clamp01(directScore)
  }

  const visibilityValues = rawLandmarks
    .map((landmark) => landmark.visibility)
    .filter((v): v is number => typeof v === 'number')

  if (visibilityValues.length > 0) {
    const avgVisibility =
      visibilityValues.reduce((acc, current) => acc + current, 0) / visibilityValues.length
    return clamp01(avgVisibility)
  }

  return 1
}

export function useFaceDetection({ videoRef }: UseFaceDetectionParams): FaceDetection {
  const [landmarks, setLandmarks] = useState<NormalizedLandmarkList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)

  const faceMeshRef = useRef<FaceMeshInstance | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const fpsIntervalRef = useRef<number | null>(null)
  const isProcessingFrameRef = useRef(false)
  const isPausedRef = useRef(false)
  const smoothedLandmarksRef = useRef<NormalizedLandmarkList | null>(null)
  const warmupFrameCountRef = useRef(0)
  const framesInSecondRef = useRef(0)

  const pauseDetection = useCallback(() => {
    isPausedRef.current = true
  }, [])

  const resumeDetection = useCallback(() => {
    isPausedRef.current = false
  }, [])

  const stopDetection = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (fpsIntervalRef.current !== null) {
      window.clearInterval(fpsIntervalRef.current)
      fpsIntervalRef.current = null
    }

    isPausedRef.current = false
    isProcessingFrameRef.current = false
    smoothedLandmarksRef.current = null
    warmupFrameCountRef.current = 0
    framesInSecondRef.current = 0

    const faceMesh = faceMeshRef.current
    if (faceMesh?.close) {
      Promise.resolve(faceMesh.close()).catch(() => {
        // No-op: cleanup should not throw on unmount.
      })
    }
    faceMeshRef.current = null

    setLandmarks(null)
    setFaceDetected(false)
    setFaceCount(0)
    setFps(0)
    setConfidenceScore(0)
    setIsDetecting(false)
    setIsLoading(false)
    setError(null)
  }, [])

  const startDetection = useCallback(async () => {
    setError(null)

    if (typeof window === 'undefined') {
      setError('La deteccion facial solo esta disponible en el navegador.')
      return
    }

    const video = videoRef.current
    if (!video) {
      setError('No se encontro el elemento de video para iniciar la deteccion.')
      return
    }

    stopDetection()
    setIsLoading(true)

    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh')

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      }) as FaceMeshInstance

      faceMesh.setOptions(AR_SETTINGS.faceMesh)

      faceMesh.onResults((results) => {
        const detected = results.multiFaceLandmarks?.[0] ?? null
        const count = results.multiFaceLandmarks?.length ?? 0
        setFaceCount(count)

        if (!detected || detected.length === 0) {
          setLandmarks(null)
          setFaceDetected(false)
          setConfidenceScore(0)
          return
        }

        const confidence = estimateConfidence(results, detected)
        setConfidenceScore(confidence)

        if (confidence < AR_SETTINGS.minConfidenceToRender) {
          setLandmarks(null)
          setFaceDetected(false)
          return
        }

        warmupFrameCountRef.current += 1
        if (warmupFrameCountRef.current <= 10) {
          setLandmarks(null)
          setFaceDetected(false)
          return
        }

        const previous = smoothedLandmarksRef.current
        const smoothed: NormalizedLandmarkList = previous
          ? detected.map((raw, index) => {
              const prev = previous[index] ?? raw
              return {
                x: lerp(prev.x, raw.x, AR_SETTINGS.smoothingFactor),
                y: lerp(prev.y, raw.y, AR_SETTINGS.smoothingFactor),
                z:
                  typeof raw.z === 'number' && typeof prev.z === 'number'
                    ? lerp(prev.z, raw.z, AR_SETTINGS.smoothingFactor)
                    : raw.z,
                visibility: raw.visibility,
              }
            })
          : detected.map((landmark) => ({ ...landmark }))

        smoothedLandmarksRef.current = smoothed
        setLandmarks(smoothed)
        setFaceDetected(true)
      })

      faceMeshRef.current = faceMesh

      fpsIntervalRef.current = window.setInterval(() => {
        setFps(framesInSecondRef.current)
        framesInSecondRef.current = 0
      }, 1000)

      const processFrame = async () => {
        const activeVideo = videoRef.current
        const activeFaceMesh = faceMeshRef.current

        if (!activeVideo || !activeFaceMesh) {
          return
        }

        if (
          !isPausedRef.current &&
          activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          !isProcessingFrameRef.current
        ) {
          isProcessingFrameRef.current = true
          try {
            await activeFaceMesh.send({ image: activeVideo })
            framesInSecondRef.current += 1
          } catch {
            // Ignore transient frame errors to keep detection loop alive.
          } finally {
            isProcessingFrameRef.current = false
          }
        }

        rafIdRef.current = requestAnimationFrame(processFrame)
      }

      rafIdRef.current = requestAnimationFrame(processFrame)

      setIsDetecting(true)
      setIsLoading(false)
    } catch (detectionError) {
      stopDetection()
      setError(
        detectionError instanceof Error
          ? `No se pudo iniciar la deteccion facial: ${detectionError.message}`
          : 'No se pudo iniciar la deteccion facial por un error desconocido.'
      )
      setIsLoading(false)
    }
  }, [stopDetection, videoRef])

  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    landmarks,
    isLoading,
    isDetecting,
    error,
    faceDetected,
    faceCount,
    fps,
    confidenceScore,
    pauseDetection,
    resumeDetection,
    startDetection,
    stopDetection,
  }
}
