'use client'

import { DM_Sans, Playfair_Display } from 'next/font/google'
import { useMemo, useState, useTransition } from 'react'

import { VirtualTryOn } from '@/components/ar/VirtualTryOn'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProductWithCategory } from '@/types'
import {
  GLASSES_FIT_PROFILES,
  resolveArOverlayUrl,
  type FitProfileKey,
  type GlassesFitProfile,
} from '@/config/ar.config'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

type ArCalibrationInput = {
  ar_fit_profile: FitProfileKey
  ar_width_adjustment: number
  ar_vertical_adjustment: number
}

type ArCalibrationPageProps = {
  product: ProductWithCategory
  updateProductArCalibration: (
    id: string,
    data: ArCalibrationInput
  ) => Promise<{ success: boolean; error?: string }>
}

const fitProfileOptions: FitProfileKey[] = [
  'FULL_FRAME',
  'SEMI_RIMLESS',
  'RIMLESS',
  'OVERSIZED',
  'SPORTS',
]

export function ArCalibrationPage({ product, updateProductArCalibration }: ArCalibrationPageProps) {
  const initialFitProfile =
    product.ar_fit_profile && product.ar_fit_profile in GLASSES_FIT_PROFILES
      ? (product.ar_fit_profile as FitProfileKey)
      : 'FULL_FRAME'

  const [fitProfileKey, setFitProfileKey] = useState<FitProfileKey>(initialFitProfile)
  const [widthAdjustment, setWidthAdjustment] = useState(Number(product.ar_width_adjustment ?? 1.0))
  const [verticalAdjustment, setVerticalAdjustment] = useState(
    Number(product.ar_vertical_adjustment ?? 0.0)
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fitProfile: GlassesFitProfile = useMemo(() => {
    const base = GLASSES_FIT_PROFILES[fitProfileKey]
    return {
      ...base,
      widthFactor: base.widthFactor * widthAdjustment,
      verticalOffset: base.verticalOffset + verticalAdjustment,
    }
  }, [fitProfileKey, verticalAdjustment, widthAdjustment])

  const previewProduct = useMemo(
    () => ({
      ...product,
      ar_fit_profile: fitProfileKey,
      ar_width_adjustment: widthAdjustment,
      ar_vertical_adjustment: verticalAdjustment,
    }),
    [fitProfileKey, product, verticalAdjustment, widthAdjustment]
  )

  const overlayUrl = resolveArOverlayUrl(previewProduct)

  const handleSave = () => {
    setFeedback(null)

    startTransition(async () => {
      const result = await updateProductArCalibration(product.id, {
        ar_fit_profile: fitProfileKey,
        ar_width_adjustment: widthAdjustment,
        ar_vertical_adjustment: verticalAdjustment,
      })

      if (!result.success) {
        setFeedback(result.error ?? 'No se pudo guardar la calibracion.')
        return
      }

      setFeedback('Calibracion guardada correctamente.')
    })
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
      <header className="mb-6 space-y-2">
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
          Calibrar AR: {product.name}
        </h1>
        <p className={cn(dmSans.className, 'text-sm text-[#6E6E67]')}>
          Ajusta la montura en tiempo real y guarda los parametros de este producto.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-8">
        <section className="space-y-4">
          <VirtualTryOn
            glassesImageUrl={overlayUrl}
            glassesName={product.name}
            fitProfile={fitProfile}
            product={previewProduct}
          />
        </section>

        <aside className="rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-5">
          <h2 className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}>
            Controles de calibracion
          </h2>

          <ol className={cn(dmSans.className, 'mt-4 space-y-1 text-sm text-[#6E6E67]')}>
            <li>1. Activa la camara y ponte frente a ella.</li>
            <li>2. Ajusta el ancho hasta que las gafas lleguen a tus sienes.</li>
            <li>3. Ajusta la altura hasta que el puente quede sobre tu nariz.</li>
            <li>4. Guarda cuando estes satisfecho.</li>
          </ol>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className={cn(dmSans.className, 'text-sm font-semibold text-[#0F0F0D]')}>
                Perfil de ajuste
              </label>
              <select
                value={fitProfileKey}
                onChange={(event) => setFitProfileKey(event.target.value as FitProfileKey)}
                className={cn(
                  dmSans.className,
                  'h-10 w-full rounded-lg border border-[#E2DDD6] bg-white px-3 text-sm text-[#0F0F0D]'
                )}
              >
                {fitProfileOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={cn(dmSans.className, 'text-sm font-semibold text-[#0F0F0D]')}>
                  Ancho de las gafas
                </label>
                <span className={cn(dmSans.className, 'text-xs text-[#6E6E67]')}>
                  {widthAdjustment.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.01}
                value={widthAdjustment}
                onChange={(event) => setWidthAdjustment(Number(event.target.value))}
                className="w-full accent-[#D4A853]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={cn(dmSans.className, 'text-sm font-semibold text-[#0F0F0D]')}>
                  Posicion vertical
                </label>
                <span className={cn(dmSans.className, 'text-xs text-[#6E6E67]')}>
                  {verticalAdjustment.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={-0.1}
                max={0.1}
                step={0.005}
                value={verticalAdjustment}
                onChange={(event) => setVerticalAdjustment(Number(event.target.value))}
                className="w-full accent-[#D4A853]"
              />
              <p className={cn(dmSans.className, 'text-xs text-[#7A7A72]')}>
                Negativo = sube, Positivo = baja
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                dmSans.className,
                'w-full rounded-full bg-[#D4A853] text-sm font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]'
              )}
            >
              {isPending ? 'Guardando...' : 'Guardar calibracion'}
            </Button>

            {feedback ? (
              <p
                className={cn(
                  dmSans.className,
                  'text-sm',
                  feedback.toLowerCase().includes('correctamente')
                    ? 'text-[#1E7A38]'
                    : 'text-[#A7332A]'
                )}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
