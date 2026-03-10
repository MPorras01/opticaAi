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
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const releaseCamera = useCallback(() => {
    const activeVideo = videoRef.current

    if (activeVideo?.srcObject) {
      const attachedStream = activeVideo.srcObject as MediaStream
      attachedStream.getTracks().forEach((track) => track.stop())
      activeVideo.srcObject = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    setStream(null)
    setIsReady(false)
  }, [stream])

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

      const requestedStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
      })

      const video = videoRef.current
      if (!video) {
        requestedStream.getTracks().forEach((track) => track.stop())
        throw new Error('No se encontro el elemento de video para la camara')
      }

      setStream(requestedStream)
      setHasPermission(true)

      await new Promise<void>((resolve) => {
        const handleLoadedData = () => {
          video.removeEventListener('loadeddata', handleLoadedData)
          resolve()
        }

        video.addEventListener('loadeddata', handleLoadedData)
        video.srcObject = requestedStream
      })

      await video.play()
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
