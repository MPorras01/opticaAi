import { useCallback, useEffect, useRef, useState } from 'react'

type UseCameraResult = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  hasPermission: boolean | null
  isReady: boolean
  error: string | null
  requestCamera: () => Promise<void>
  releaseCamera: () => void
  takeSnapshot: () => string | null
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const releaseCamera = useCallback(() => {
    const activeVideo = videoRef.current
    const activeStream = streamRef.current

    if (activeVideo?.srcObject) {
      const attachedStream = activeVideo.srcObject as MediaStream
      attachedStream.getTracks().forEach((track) => track.stop())
      activeVideo.srcObject = null
    }

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop())
    }

    streamRef.current = null
    setStream(null)
    setIsReady(false)
  }, [])

  const requestCamera = useCallback(async () => {
    setError(null)
    setIsReady(false)

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false)
      setError('Tu browser no soporta camara')
      return
    }

    try {
      releaseCamera()

      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
      const resolution = isMobile ? { width: 480, height: 360 } : { width: 640, height: 480 }

      const tryConstraints: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
          },
        },
        {
          video: {
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
          },
        },
        { video: true },
      ]

      let requestedStream: MediaStream | null = null
      let lastError: unknown = null

      for (const constraints of tryConstraints) {
        try {
          requestedStream = await navigator.mediaDevices.getUserMedia(constraints)
          break
        } catch (errorOnTry) {
          lastError = errorOnTry
        }
      }

      if (!requestedStream) {
        throw lastError instanceof Error ? lastError : new Error('No se pudo abrir la camara')
      }

      const video = videoRef.current
      if (!video) {
        requestedStream.getTracks().forEach((track) => track.stop())
        throw new Error('No se encontro el elemento de video para la camara')
      }

      streamRef.current = requestedStream
      setStream(requestedStream)
      setHasPermission(true)

      video.muted = true
      video.playsInline = true
      video.srcObject = requestedStream
      await video.play()

      // Some browsers resolve play() before dimensions are available.
      // Wait until metadata is ready so downstream logic can read videoWidth/videoHeight.
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve) => {
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            resolve()
          }

          video.addEventListener('loadedmetadata', handleLoadedMetadata)
        })
      }

      setIsReady(true)
    } catch (cameraError) {
      releaseCamera()

      if (cameraError instanceof DOMException && cameraError.name === 'NotAllowedError') {
        setHasPermission(false)
        setError('Necesitas permitir el acceso a la camara')
        return
      }

      setHasPermission(false)
      setError(
        cameraError instanceof Error
          ? `No se pudo acceder a la camara: ${cameraError.message}`
          : 'No se pudo acceder a la camara.'
      )
    }
  }, [releaseCamera])

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  useEffect(() => {
    return () => {
      releaseCamera()
    }
  }, [releaseCamera])

  return {
    videoRef,
    stream,
    hasPermission,
    isReady,
    error,
    requestCamera,
    releaseCamera,
    takeSnapshot,
  }
}
