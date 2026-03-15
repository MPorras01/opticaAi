import { useCallback, useEffect, useRef, useState } from 'react'
import type { Results } from '@mediapipe/face_mesh'

import { AR_SETTINGS } from '@/config/ar.config'

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
  status: 'idle' | 'loading' | 'running' | 'error'
  faceDetected: boolean
  faceCount: number
  fps: number
  confidenceScore: number
  pauseDetection: () => void
  resumeDetection: () => void
  startDetection: () => Promise<void>
  stopDetection: () => void
}

const PREVIOUS_WEIGHT = 0.8
const CURRENT_WEIGHT = 0.2

function smoothValue(previous: number, current: number): number {
  return previous * PREVIOUS_WEIGHT + current * CURRENT_WEIGHT
}

function normalizeLandmarks(keypoints: any[]): NormalizedLandmarkList {
  if (!keypoints || keypoints.length === 0) return []
  return keypoints.map((point) => ({
    x: point.x,
    y: point.y,
    z: typeof point.z === 'number' ? point.z : undefined,
    visibility: 1.0, // MediaPipe native returns 1 for visible points array usually
  }))
}

export function useFaceDetection({ videoRef }: UseFaceDetectionParams): FaceDetection {
  const [landmarks, setLandmarks] = useState<NormalizedLandmarkList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'error'>('idle')
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)

  // We use type any here to bypass Turbopack strict exports for the class instance
  const faceMeshRef = useRef<any>(null)
  const isPausedRef = useRef(false)
  const isProcessingFrameRef = useRef(false)

  const rafIdRef = useRef<number | null>(null)
  const framesInSecondRef = useRef(0)
  const processedFrameCountRef = useRef(0)
  const fpsIntervalRef = useRef<number | null>(null)
  const smoothedLandmarksRef = useRef<NormalizedLandmarkList | null>(null)
  const hasLoggedLandmarksRef = useRef(false)

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

    if (faceMeshRef.current) {
      faceMeshRef.current.close()
      faceMeshRef.current = null
    }

    if (fpsIntervalRef.current !== null) {
      window.clearInterval(fpsIntervalRef.current)
      fpsIntervalRef.current = null
    }

    isPausedRef.current = false
    isProcessingFrameRef.current = false
    smoothedLandmarksRef.current = null
    framesInSecondRef.current = 0
    processedFrameCountRef.current = 0
    hasLoggedLandmarksRef.current = false

    setLandmarks(null)
    setFaceDetected(false)
    setFaceCount(0)
    setFps(0)
    setConfidenceScore(0)
    setIsDetecting(false)
    setIsLoading(false)
    setError(null)
    setStatus('idle')
    console.log('[FaceMesh] Stopped.')
  }, [])

  const handleResults = useCallback((results: Results) => {
    if (isPausedRef.current) return

    framesInSecondRef.current += 1

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceCount(results.multiFaceLandmarks.length)
      setConfidenceScore(1.0) // Native mediapipe assumes face is detected if landmarks array is populated securely

      const rawLandmarks = results.multiFaceLandmarks[0]
      const normalized = normalizeLandmarks(rawLandmarks)

      const previous = smoothedLandmarksRef.current
      const smoothed: NormalizedLandmarkList = previous
        ? normalized.map((raw, index) => {
            const prev = previous[index] ?? raw
            return {
              x: smoothValue(prev.x, raw.x),
              y: smoothValue(prev.y, raw.y),
              z:
                typeof raw.z === 'number' && typeof prev.z === 'number'
                  ? smoothValue(prev.z, raw.z)
                  : raw.z,
              visibility: raw.visibility,
            }
          })
        : normalized.map((point) => ({ ...point }))

      smoothedLandmarksRef.current = smoothed
      setLandmarks(smoothed)
      setFaceDetected(true)

      if (!hasLoggedLandmarksRef.current) {
        console.info('[FaceMesh] landmarks detected', { count: smoothed.length })
        hasLoggedLandmarksRef.current = true
      }
    } else {
      setFaceCount(0)
      setConfidenceScore(0)
      setLandmarks(null)
      setFaceDetected(false)
      hasLoggedLandmarksRef.current = false
    }
  }, [])

  const startDetection = useCallback(async () => {
    setError(null)

    if (typeof window === 'undefined') {
      setError('La deteccion facial solo esta disponible en el navegador.')
      return
    }

    const videoElement = videoRef.current
    if (!videoElement) {
      setError('No se encontro el elemento de video para iniciar la deteccion.')
      return
    }

    stopDetection()
    setIsLoading(true)
    setStatus('loading')
    console.log('[FaceMesh] Starting initialization...')

    try {
      // Dynamically import FaceMesh to bypass Turbopack's CJS strict export checking
      const mediapipeFaceMesh = await import('@mediapipe/face_mesh')
      const FaceMeshConstructor =
        mediapipeFaceMesh.FaceMesh ||
        (mediapipeFaceMesh as any).default?.FaceMesh ||
        (mediapipeFaceMesh as any).FaceMesh

      if (!FaceMeshConstructor) {
        throw new Error('Modulos de FaceMesh no se exportaron correctamente del paquete.')
      }

      const faceMesh = new FaceMeshConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        },
      })

      faceMesh.setOptions({
        maxNumFaces: AR_SETTINGS.faceMesh.maxNumFaces,
        refineLandmarks: AR_SETTINGS.faceMesh.refineLandmarks,
        minDetectionConfidence: AR_SETTINGS.faceMesh.minDetectionConfidence,
        minTrackingConfidence: AR_SETTINGS.faceMesh.minTrackingConfidence,
      })

      faceMesh.onResults(handleResults)
      faceMeshRef.current = faceMesh

      console.log('[FaceMesh] Model logic initialized. Linking to Camera loop...')

      const processFrame = async () => {
        if (
          !isPausedRef.current &&
          videoElement &&
          faceMeshRef.current &&
          videoElement.readyState >= 2
        ) {
          if (!isProcessingFrameRef.current) {
            isProcessingFrameRef.current = true
            try {
              processedFrameCountRef.current += 1
              if (processedFrameCountRef.current % 120 === 0) {
                console.debug('[FaceMesh] frames being processed', {
                  frames: processedFrameCountRef.current,
                })
              }
              await faceMeshRef.current.send({ image: videoElement })
            } catch (err) {
              console.error('[FaceMesh] Frame processing error', err)
            } finally {
              isProcessingFrameRef.current = false
            }
          }
        }
        rafIdRef.current = requestAnimationFrame(processFrame)
      }

      rafIdRef.current = requestAnimationFrame(processFrame)
      console.log('[FaceMesh] Camera stream linked and detection running.')

      fpsIntervalRef.current = window.setInterval(() => {
        setFps(framesInSecondRef.current)
        framesInSecondRef.current = 0
      }, 1000)

      setIsDetecting(true)
      setIsLoading(false)
      setStatus('running')
    } catch (detectionError) {
      console.error('[FaceMesh] Error:', detectionError)
      stopDetection()
      setError(
        detectionError instanceof Error
          ? `No se pudo iniciar la deteccion facial: ${detectionError.message}`
          : 'No se pudo iniciar la deteccion facial por un error desconocido.'
      )
      setIsLoading(false)
      setStatus('error')
    }
  }, [stopDetection, videoRef, handleResults])

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
    status,
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
