import { useCallback, useEffect, useRef, useState } from 'react'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-backend-webgl'

import { AR_SETTINGS, lerp } from '@/config/ar.config'

export type FaceLandmark = {
  x: number
  y: number
  z?: number
  visibility?: number
}

export type NormalizedLandmarkList = FaceLandmark[]

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

type DetectorLike = {
  estimateFaces: (...args: unknown[]) => Promise<unknown[]>
  dispose?: () => void
  reset?: () => void
}

type FaceLike = {
  keypoints?: Array<{ x: number; y: number; z?: number; score?: number }>
  faceInViewConfidence?: number
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function normalizeLandmarks(keypoints: FaceLike['keypoints'], width: number, height: number): NormalizedLandmarkList {
  if (!keypoints || keypoints.length === 0 || width <= 0 || height <= 0) {
    return []
  }

  return keypoints.map((point) => ({
    x: point.x / width,
    y: point.y / height,
    // Keep z in a compact range for stable 3D overlay consumption.
    z: typeof point.z === 'number' ? Math.max(-1, Math.min(1, point.z / width)) : undefined,
    visibility: typeof point.score === 'number' ? clamp01(point.score) : undefined,
  }))
}

function estimateConfidence(face: FaceLike, normalized: NormalizedLandmarkList): number {
  if (typeof face.faceInViewConfidence === 'number') {
    return clamp01(face.faceInViewConfidence)
  }

  const pointScores = normalized
    .map((point) => point.visibility)
    .filter((score): score is number => typeof score === 'number')

  if (pointScores.length > 0) {
    const average = pointScores.reduce((acc, value) => acc + value, 0) / pointScores.length
    return clamp01(average)
  }

  // Fallback confidence by detected landmark coverage.
  return clamp01(normalized.length / 478)
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

  const detectorRef = useRef<DetectorLike | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const fpsIntervalRef = useRef<number | null>(null)
  const isPausedRef = useRef(false)
  const isProcessingFrameRef = useRef(false)
  const smoothedLandmarksRef = useRef<NormalizedLandmarkList | null>(null)
  const warmupFrameCountRef = useRef(0)
  const framesInSecondRef = useRef(0)
  const frameCountRef = useRef(0)
  const isMobileRef = useRef(false)

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

    const detector = detectorRef.current
    if (detector?.dispose) {
      detector.dispose()
    } else if (detector?.reset) {
      detector.reset()
    }

    detectorRef.current = null
    isPausedRef.current = false
    isProcessingFrameRef.current = false
    smoothedLandmarksRef.current = null
    warmupFrameCountRef.current = 0
    framesInSecondRef.current = 0
    frameCountRef.current = 0
    isMobileRef.current = false

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
      const tf = await import('@tensorflow/tfjs')

      try {
        await tf.setBackend('webgl')
      } catch {
        // Fallback for devices where WebGL is unavailable.
        try {
          await tf.setBackend('wasm')
        } catch {
          await tf.setBackend('cpu')
        }
      }

      await tf.ready()

      isMobileRef.current = /Android|iPhone|iPad/i.test(navigator.userAgent)

      const fldDynamic = await import('@tensorflow-models/face-landmarks-detection')
      const fld = fldDynamic ?? faceLandmarksDetection

      const detector = (await fld.createDetector(fld.SupportedModels.MediaPipeFaceMesh, {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      })) as unknown as DetectorLike

      detectorRef.current = detector

      fpsIntervalRef.current = window.setInterval(() => {
        setFps(framesInSecondRef.current)
        framesInSecondRef.current = 0
      }, 1000)

      const processFrame = async () => {
        const activeVideo = videoRef.current
        const activeDetector = detectorRef.current

        if (!activeVideo || !activeDetector) {
          return
        }

        if (
          !isPausedRef.current &&
          activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          !isProcessingFrameRef.current
        ) {
          frameCountRef.current += 1

          // Skip every other frame on mobile to keep UI responsive.
          if (isMobileRef.current && frameCountRef.current % 2 !== 0) {
            rafIdRef.current = requestAnimationFrame(processFrame)
            return
          }

          isProcessingFrameRef.current = true

          try {
            const faces = (await activeDetector.estimateFaces(activeVideo, {
              flipHorizontal: false,
            })) as FaceLike[]

            setFaceCount(faces.length)

            const firstFace = faces[0]
            if (!firstFace?.keypoints || firstFace.keypoints.length === 0) {
              setLandmarks(null)
              setFaceDetected(false)
              setConfidenceScore(0)
            } else {
              const width = activeVideo.videoWidth || AR_SETTINGS.videoWidth
              const height = activeVideo.videoHeight || AR_SETTINGS.videoHeight

              const normalized = normalizeLandmarks(firstFace.keypoints, width, height)
              const confidence = estimateConfidence(firstFace, normalized)
              setConfidenceScore(confidence)

              if (confidence < AR_SETTINGS.minConfidenceToRender) {
                setLandmarks(null)
                setFaceDetected(false)
              } else {
                warmupFrameCountRef.current += 1

                if (warmupFrameCountRef.current <= 10) {
                  setLandmarks(null)
                  setFaceDetected(false)
                } else {
                  const previous = smoothedLandmarksRef.current
                  const smoothed: NormalizedLandmarkList = previous
                    ? normalized.map((raw, index) => {
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
                    : normalized.map((point) => ({ ...point }))

                  smoothedLandmarksRef.current = smoothed
                  setLandmarks(smoothed)
                  setFaceDetected(true)
                }
              }
            }

            framesInSecondRef.current += 1
          } catch {
            // Ignore transient frame-level failures and keep loop alive.
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
