'use client'

import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Camera, ChevronLeft, Copy, Loader2, Save, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { validateArPng } from '@/actions/products.actions'
import { GlassesOverlay } from '@/components/ar/GlassesOverlay'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCamera } from '@/hooks/useCamera'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { cn } from '@/lib/utils'
import type { ProductWithCategory } from '@/types'
import {
  GLASSES_FIT_PROFILES,
  resolveArOverlayUrl,
  type FitProfileKey,
  type GlassesFitProfile,
} from '@/config/ar.config'

type ArCalibrationInput = {
  ar_fit_profile: FitProfileKey
  ar_width_adjustment: number
  ar_vertical_adjustment: number
}

type ReferenceProduct = {
  id: string
  name: string
  ar_fit_profile: string | null
  ar_width_adjustment: number | null
  ar_vertical_adjustment: number | null
}

type ArStudioProps = {
  product: ProductWithCategory
  referenceProducts: ReferenceProduct[]
  updateArCalibration: (
    productId: string,
    data: ArCalibrationInput
  ) => Promise<{ success: boolean; error?: string }>
}

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

const profileDescriptions: Record<FitProfileKey, string> = {
  FULL_FRAME: 'Marco completo para monturas con aro completo.',
  SEMI_RIMLESS: 'Semi sin aro con marco superior marcado.',
  RIMLESS: 'Sin aro, ideal para lentes con puente liviano.',
  OVERSIZED: 'Monturas grandes con look fashion.',
  SPORTS: 'Wraparound para gafas deportivas.',
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number(value.toFixed(3))))
}

function getQualityFlags(score: number) {
  return {
    transparency: score >= 45,
    ratio: score >= 60,
    centered: score >= 70,
  }
}

function GuideLines() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-[34%] border-t border-dashed border-cyan-300/80">
        <span className="absolute -top-5 left-3 rounded bg-black/50 px-2 py-0.5 text-[10px] text-cyan-100">
          Cejas
        </span>
      </div>
      <div className="absolute inset-x-0 top-[43%] border-t border-dashed border-green-300/80">
        <span className="absolute -top-5 left-3 rounded bg-black/50 px-2 py-0.5 text-[10px] text-green-100">
          Ojos
        </span>
      </div>
      <div className="absolute inset-x-0 top-[54%] border-t border-dashed border-amber-300/80">
        <span className="absolute -top-5 left-3 rounded bg-black/50 px-2 py-0.5 text-[10px] text-amber-100">
          Puente/Nariz
        </span>
      </div>
    </div>
  )
}

function ReferenceFaceDiagram() {
  return (
    <svg
      viewBox="0 0 220 250"
      className="w-full max-w-[220px]"
      role="img"
      aria-label="Referencia de posicion"
    >
      <ellipse cx="110" cy="125" rx="72" ry="95" fill="#F8F4EC" stroke="#D9CFBE" strokeWidth="2" />
      <line x1="65" y1="95" x2="95" y2="95" stroke="#69B0FF" strokeDasharray="4 3" />
      <line x1="125" y1="95" x2="155" y2="95" stroke="#69B0FF" strokeDasharray="4 3" />
      <line x1="70" y1="112" x2="150" y2="112" stroke="#6FCF97" strokeDasharray="4 3" />
      <line x1="90" y1="130" x2="130" y2="130" stroke="#F2C94C" strokeDasharray="4 3" />
      <circle cx="70" cy="112" r="4" fill="#6FCF97" />
      <circle cx="150" cy="112" r="4" fill="#6FCF97" />
      <circle cx="110" cy="130" r="4" fill="#F2C94C" />
      <text x="60" y="84" fontSize="10" fill="#3D3A33">
        Cejas
      </text>
      <text x="76" y="106" fontSize="10" fill="#3D3A33">
        Ojos
      </text>
      <text x="84" y="145" fontSize="10" fill="#3D3A33">
        Puente
      </text>
    </svg>
  )
}

export function ArStudio({ product, referenceProducts, updateArCalibration }: ArStudioProps) {
  const [fitProfileKey, setFitProfileKey] = useState<FitProfileKey>(
    (product.ar_fit_profile as FitProfileKey) || 'FULL_FRAME'
  )
  const [widthAdjustment, setWidthAdjustment] = useState(Number(product.ar_width_adjustment ?? 1))
  const [verticalAdjustment, setVerticalAdjustment] = useState(
    Number(product.ar_vertical_adjustment ?? 0)
  )
  const [qualityScore, setQualityScore] = useState(0)
  const [copyOpen, setCopyOpen] = useState(false)
  const [selectedReference, setSelectedReference] = useState('')
  const [isPending, startTransition] = useTransition()

  const { videoRef, hasPermission, isReady, requestCamera, takeSnapshot } = useCamera()

  const { landmarks, startDetection, fps, isLoading } = useFaceDetection({ videoRef })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const overlayUrl = resolveArOverlayUrl(product)

  const fitProfile: GlassesFitProfile = useMemo(() => {
    const base = GLASSES_FIT_PROFILES[fitProfileKey] || GLASSES_FIT_PROFILES.FULL_FRAME

    return {
      ...base,
      widthFactor: base.widthFactor * widthAdjustment,
      verticalOffset: base.verticalOffset + verticalAdjustment,
    }
  }, [fitProfileKey, verticalAdjustment, widthAdjustment])

  const hasChanges =
    fitProfileKey !== (product.ar_fit_profile as FitProfileKey) ||
    Number(product.ar_width_adjustment ?? 1) !== Number(widthAdjustment) ||
    Number(product.ar_vertical_adjustment ?? 0) !== Number(verticalAdjustment)

  const qualityFlags = getQualityFlags(qualityScore)

  const currentWidthPx = useMemo(() => {
    if (!landmarks || landmarks.length < 264) {
      return 0
    }

    const left = landmarks[33]
    const right = landmarks[263]
    if (!left || !right) {
      return 0
    }

    const eyeDistance = Math.hypot((right.x - left.x) * 640, (right.y - left.y) * 480)
    return Math.round(eyeDistance * 2.4 * widthAdjustment)
  }, [landmarks, widthAdjustment])

  const startCamera = async () => {
    await requestCamera()
    await startDetection()
  }

  const saveCalibration = () => {
    startTransition(async () => {
      const result = await updateArCalibration(product.id, {
        ar_fit_profile: fitProfileKey,
        ar_width_adjustment: widthAdjustment,
        ar_vertical_adjustment: verticalAdjustment,
      })

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo guardar la calibracion')
        return
      }

      toast.success('Calibracion guardada ✓')
    })
  }

  const handleCopyConfig = () => {
    const found = referenceProducts.find((item) => item.id === selectedReference)
    if (!found) {
      return
    }

    const profile = (found.ar_fit_profile as FitProfileKey) || 'FULL_FRAME'
    setFitProfileKey(profile)
    setWidthAdjustment(Number(found.ar_width_adjustment ?? 1))
    setVerticalAdjustment(Number(found.ar_vertical_adjustment ?? 0))
    setCopyOpen(false)
    toast.success('Configuracion copiada')
  }

  const capture = () => {
    const dataUrl = takeSnapshot()
    if (!dataUrl) {
      toast.error('No se pudo tomar captura')
      return
    }

    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = `${product.slug}-ar-test.jpg`
    anchor.click()
  }

  useEffect(() => {
    validateArPng(product.ar_overlay_url ?? '').then((result) => {
      setQualityScore(result.score)
    })
  }, [product.ar_overlay_url])

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={cn(dmSans.className, 'text-xs tracking-[0.12em] text-[#7F796E] uppercase')}>
            Admin &gt; Productos &gt; {product.name} &gt; AR Studio
          </p>
          <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#12120F]')}>
            AR Studio - {product.name}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/productos/${product.id}/editar`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 size-4" />
              Volver al producto
            </Button>
          </Link>
          <Button
            onClick={saveCalibration}
            disabled={!hasChanges || isPending}
            className="bg-[#D4A853] text-black hover:bg-[#C79D4C]"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Guardar calibracion
          </Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-3 rounded-xl border border-[#E8E2D8] bg-[#0F0F0D] p-3">
          <div className="relative overflow-hidden rounded-lg">
            {!hasPermission || !isReady ? (
              <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 text-white">
                <Camera className="size-10 text-[#D4A853]" />
                <p className="text-sm">Activa la camara para iniciar el estudio AR</p>
                <Button
                  onClick={startCamera}
                  className="bg-[#D4A853] text-black hover:bg-[#C79D4C]"
                >
                  Activar camara
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="h-auto w-full -scale-x-100 rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={(node) => {
                    canvasRef.current = node
                  }}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
                <GuideLines />
                <GlassesOverlay
                  canvasRef={canvasRef}
                  videoRef={videoRef}
                  landmarks={landmarks}
                  glassesImageUrl={overlayUrl}
                  fitProfile={fitProfile}
                  product={product}
                  isFlipped
                  forceDebug
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between rounded-md bg-black/40 px-3 py-2 text-xs text-white">
            <span>FPS: {fps || 0}</span>
            <span>Ancho actual: {currentWidthPx}px</span>
            <span>
              {isLoading ? 'Detectando...' : landmarks ? 'Landmarks activos' : 'Sin landmarks'}
            </span>
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="space-y-4 p-4">
            <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold')}>
              Ajuste de posicion
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Ancho: {widthAdjustment.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={widthAdjustment}
                onChange={(event) =>
                  setWidthAdjustment(clampNumber(Number(event.target.value), 0.5, 2))
                }
                className="w-full accent-[#D4A853]"
              />
              <p className="text-xs text-[#6F6A61]">Aumenta si las gafas no llegan a las sienes.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWidthAdjustment((v) => clampNumber(v - 0.1, 0.5, 2))}
                >
                  -0.1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWidthAdjustment(1)}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWidthAdjustment((v) => clampNumber(v + 0.1, 0.5, 2))}
                >
                  +0.1
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>
                  Vertical: {verticalAdjustment >= 0 ? '+' : ''}
                  {verticalAdjustment.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={-0.15}
                max={0.15}
                step={0.005}
                value={verticalAdjustment}
                onChange={(event) =>
                  setVerticalAdjustment(clampNumber(Number(event.target.value), -0.15, 0.15))
                }
                className="w-full accent-[#D4A853]"
              />
              <p className="text-xs text-[#6F6A61]">Negativo = sube · Positivo = baja.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerticalAdjustment((v) => clampNumber(v - 0.02, -0.15, 0.15))}
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerticalAdjustment(0)}
                >
                  Centro
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerticalAdjustment((v) => clampNumber(v + 0.02, -0.15, 0.15))}
                >
                  Bajar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Perfil de montura</p>
              <Select
                value={fitProfileKey}
                onValueChange={(value) => setFitProfileKey(value as FitProfileKey)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(profileDescriptions) as FitProfileKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#6F6A61]">{profileDescriptions[fitProfileKey]}</p>
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">Estado de calidad</h3>
            <p className="text-sm">
              Score PNG: <strong>{qualityScore}/100</strong>
            </p>
            <ul className="space-y-1 text-xs text-[#5D574C]">
              <li>{qualityFlags.transparency ? '✓' : '✗'} Transparencia</li>
              <li>{qualityFlags.ratio ? '✓' : '✗'} Proporciones</li>
              <li>{qualityFlags.centered ? '✓' : '✗'} Centrado</li>
            </ul>
            <Link href={`/admin/productos/${product.id}/editar`}>
              <Button variant="outline" size="sm">
                Reemplazar imagen AR
              </Button>
            </Link>
          </Card>

          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold">Referencia de posicion</h3>
            <div className="flex justify-center">
              <ReferenceFaceDiagram />
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">Acciones rapidas</h3>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFitProfileKey('FULL_FRAME')
                  setWidthAdjustment(1)
                  setVerticalAdjustment(0)
                }}
              >
                <Settings2 className="mr-2 size-4" />
                Resetear a valores por defecto
              </Button>
              <Button type="button" variant="outline" onClick={() => setCopyOpen(true)}>
                <Copy className="mr-2 size-4" />
                Copiar configuracion de otro producto
              </Button>
              <Button type="button" variant="outline" onClick={capture}>
                <Camera className="mr-2 size-4" />
                Tomar captura de prueba
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar configuracion</DialogTitle>
            <DialogDescription>
              Selecciona un producto y aplica su perfil AR al producto actual.
            </DialogDescription>
          </DialogHeader>

          <Select
            value={selectedReference}
            onValueChange={(value) => {
              setSelectedReference(value ?? '')
            }}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {referenceProducts.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCopyConfig}
              disabled={!selectedReference}
              className="bg-[#D4A853] text-black hover:bg-[#C79D4C]"
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
