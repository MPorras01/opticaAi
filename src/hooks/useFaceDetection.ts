import { useCallback, useEffect, useRef, useState } from 'react'

export type FaceLandmark = {
  x: number
  y: number
  z?: number
  visibility?: number
}

export type NormalizedLandmarkList = FaceLandmark[]

type FaceMeshInstance = {
  setOptions: (options: {
    maxNumFaces: number
    refineLandmarks: boolean
    minDetectionConfidence: number
    minTrackingConfidence: number
  }) => void
  onResults: (
    callback: (results: { multiFaceLandmarks?: NormalizedLandmarkList[] }) => void
  ) => void
  send: (input: { image: HTMLVideoElement }) => Promise<void>
  close?: () => Promise<void> | void
}

type CameraInstance = {
  start: () => Promise<void>
  stop?: () => void
}

type UseFaceDetectionParams = {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

type UseFaceDetectionResult = {
  landmarks: NormalizedLandmarkList | null
  isLoading: boolean
  isDetecting: boolean
  error: string | null
  startDetection: () => Promise<void>
  stopDetection: () => void
}

export function useFaceDetection({ videoRef }: UseFaceDetectionParams): UseFaceDetectionResult {
  const [landmarks, setLandmarks] = useState<NormalizedLandmarkList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const faceMeshRef = useRef<FaceMeshInstance | null>(null)
  const cameraRef = useRef<CameraInstance | null>(null)

  const stopDetection = useCallback(() => {
    const camera = cameraRef.current
    camera?.stop?.()
    cameraRef.current = null

    const faceMesh = faceMeshRef.current
    if (faceMesh?.close) {
      Promise.resolve(faceMesh.close()).catch(() => {
        // No-op: cleanup should not throw on unmount.
      })
    }
    faceMeshRef.current = null

    const video = videoRef.current
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }

    setLandmarks(null)
    setIsDetecting(false)
    setIsLoading(false)
    setError(null)
  }, [videoRef])

  const startDetection = useCallback(async () => {
    setError(null)

    if (typeof window === 'undefined') {
      setError('La deteccion facial solo esta disponible en el navegador.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no soporta acceso a la camara (getUserMedia).')
      return
    }

    const video = videoRef.current
    if (!video) {
      setError('No se encontro el elemento de video para iniciar la deteccion.')
      return
    }

    // Ensure previous sessions are fully stopped before creating a new one.
    stopDetection()
    setIsLoading(true)

    try {
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import('@mediapipe/face_mesh'),
        import('@mediapipe/camera_utils'),
      ])

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      }) as FaceMeshInstance

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      })

      faceMesh.onResults((results) => {
        const detectedLandmarks = results.multiFaceLandmarks?.[0]
        setLandmarks(detectedLandmarks ?? null)
      })

      const camera = new Camera(video, {
        width: 640,
        height: 480,
        onFrame: async () => {
          if (!videoRef.current || !faceMeshRef.current) {
            return
          }

          await faceMeshRef.current.send({ image: videoRef.current })
        },
      }) as CameraInstance

      faceMeshRef.current = faceMesh
      cameraRef.current = camera

      await camera.start()

      setIsLoading(false)
      setIsDetecting(true)
    } catch (detectionError) {
      stopDetection()
      setError(
        detectionError instanceof Error
          ? `No se pudo iniciar la deteccion facial: ${detectionError.message}`
          : 'No se pudo iniciar la deteccion facial por un error desconocido.'
      )
    } finally {
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
    startDetection,
    stopDetection,
  }
}
