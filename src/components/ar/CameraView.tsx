'use client'

import React, { forwardRef } from 'react'

type CameraViewProps = {
  className?: string
}

/**
 * A purely presentational component that renders the video element safely
 * and exposes its ref for the MediaPipe logic to consume.
 */
export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({ className }, ref) => {
  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      playsInline
      muted
      // Flip the camera horizontally globally so it behaves like a mirror
      style={{ transform: 'scaleX(-1)' }}
    />
  )
})

CameraView.displayName = 'CameraView'
