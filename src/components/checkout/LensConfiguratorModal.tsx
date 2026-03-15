'use client'

import { DM_Sans, Playfair_Display } from 'next/font/google'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { LensOption } from '@/lib/repositories/lens-options.repo'
import { formatCOP } from '@/lib/utils/formatters'
import type { PrescriptionData, ProductWithCategory } from '@/types'

import { LensConfigurator, type SelectedLensOptions } from './LensConfigurator'
import { PrescriptionForm } from './PrescriptionForm'

export type LensConfig = {
  lensOptions: SelectedLensOptions
  prescription: PrescriptionData
  totalPrice: number
}

type LensConfiguratorModalProps = {
  product: ProductWithCategory
  lensOptions: LensOption[]
  open: boolean
  onClose: () => void
  onConfirm: (config: LensConfig) => void
  isLoggedIn?: boolean
}

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

function getStepState(current: 1 | 2 | 3, step: 1 | 2 | 3) {
  if (step < current) {
    return {
      circle: 'bg-[#2C3E6B] text-white',
      text: 'text-[#2C3E6B]',
    }
  }

  if (step === current) {
    return {
      circle: 'bg-[#D4A853] text-[#0F0F0D]',
      text: 'text-[#0F0F0D]',
    }
  }

  return {
    circle: 'bg-[#E5E2DC] text-[#9E9A94]',
    text: 'text-[#9E9A94]',
  }
}

function optionPriceMap(options: LensOption[]): Map<string, LensOption> {
  const map = new Map<string, LensOption>()
  for (const option of options) {
    map.set(option.id, option)
  }
  return map
}

function formatOptionPrice(id: string | undefined, map: Map<string, LensOption>): string {
  if (!id) return formatCOP(0)
  return formatCOP(Number(map.get(id)?.price_addition ?? 0))
}

export function LensConfiguratorModal({
  product,
  lensOptions,
  open,
  onClose,
  onConfirm,
  isLoggedIn = false,
}: LensConfiguratorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedLens, setSelectedLens] = useState<SelectedLensOptions | null>(null)
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null)

  const basePrice = Number(product.price ?? 0)
  const totalAddition = Number(selectedLens?.totalAddition ?? 0)
  const totalPrice = basePrice + totalAddition
  const lensById = useMemo(() => optionPriceMap(lensOptions), [lensOptions])

  const handleClose = () => {
    setStep(1)
    setSelectedLens(null)
    setPrescription(null)
    onClose()
  }

  const stepItems: Array<{ id: 1 | 2 | 3; label: string }> = [
    { id: 1, label: 'Lentes' },
    { id: 2, label: 'Fórmula' },
    { id: 3, label: 'Resumen' },
  ]

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-[#FAFAF8] p-0 sm:max-w-4xl xl:max-w-5xl"
      >
        <div className={`${dmSans.className} min-h-full text-[#0F0F0D]`}>
          <SheetHeader className="border-b border-[#E9E5DE] bg-[#FAFAF8] px-5 pb-5 md:px-7">
            <SheetTitle
              className={`${playfairDisplay.className} text-2xl font-semibold text-[#0F0F0D] md:text-3xl`}
            >
              Configuración de pedido
            </SheetTitle>

            <div className="mt-3 flex items-center gap-2">
              {stepItems.map((item, index) => {
                const styles = getStepState(step, item.id)
                const isLast = index === stepItems.length - 1

                return (
                  <div key={item.id} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid size-7 place-items-center rounded-full text-xs font-bold ${styles.circle}`}
                      >
                        {item.id}
                      </div>
                      <span className={`text-xs font-semibold ${styles.text}`}>{item.label}</span>
                    </div>
                    {!isLast ? <div className="h-px flex-1 bg-[#E5E2DC]" /> : null}
                  </div>
                )
              })}
            </div>
          </SheetHeader>

          <div className="p-5 md:p-7">
            {step === 1 ? (
              <div className="space-y-6">
                <LensConfigurator
                  lensOptions={lensOptions}
                  basePrice={basePrice}
                  onChange={(selection) => setSelectedLens(selection)}
                />

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedLens?.type}
                  className="h-11 w-full rounded-full bg-[#D4A853] font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]"
                >
                  Continuar
                </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-[#D9D4CB] bg-white"
                >
                  Atrás
                </Button>

                <PrescriptionForm
                  onSubmit={(data) => {
                    setPrescription(data)
                    setStep(3)
                  }}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            ) : null}

            {step === 3 && selectedLens && prescription ? (
              <div className="space-y-6">
                <section className="rounded-xl border border-[#E5E2DC] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-16 overflow-hidden rounded-lg border border-[#E6E1D8] bg-[#F3EFE6]">
                      <Image
                        src={product.images?.[0] ?? '/placeholder.svg'}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F0F0D]">
                        {product.name}
                      </p>
                      <p className="text-sm text-[#2C3E6B]">{formatCOP(basePrice)}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-[#E5E2DC] bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#2C3E6B]">Opciones elegidas</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Tipo</span>
                      <span className="text-[#2C3E6B]">
                        {selectedLens.type ?? 'Sin seleccionar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E6A62]">Precio tipo</span>
                      <span className="text-xs text-[#2C3E6B]">
                        {formatOptionPrice(selectedLens.typeId, lensById)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Material</span>
                      <span className="text-[#2C3E6B]">
                        {selectedLens.material ?? 'Sin seleccionar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E6A62]">Precio material</span>
                      <span className="text-xs text-[#2C3E6B]">
                        {formatOptionPrice(selectedLens.materialId, lensById)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span>Filtros</span>
                      <span className="text-right text-[#2C3E6B]">
                        {selectedLens.filters.length ? selectedLens.filters.join(', ') : 'Ninguno'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E6A62]">Precio filtros</span>
                      <span className="text-xs text-[#2C3E6B]">
                        {formatCOP(
                          selectedLens.filterIds.reduce(
                            (sum, id) => sum + Number(lensById.get(id)?.price_addition ?? 0),
                            0
                          )
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Tinte</span>
                      <span className="text-[#2C3E6B]">
                        {selectedLens.tint ?? 'Sin seleccionar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E6A62]">Precio tinte</span>
                      <span className="text-xs text-[#2C3E6B]">
                        {formatOptionPrice(selectedLens.tintId, lensById)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Grosor</span>
                      <span className="text-[#2C3E6B]">
                        {selectedLens.thickness ?? 'Sin seleccionar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E6A62]">Precio grosor</span>
                      <span className="text-xs text-[#2C3E6B]">
                        {formatOptionPrice(selectedLens.thicknessId, lensById)}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-[#E5E2DC] bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#2C3E6B]">Fórmula</h3>

                  <div className="overflow-hidden rounded-lg border border-[#ECE8DF]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F6F2E9] text-[#4A463F]">
                        <tr>
                          <th className="px-2 py-2 text-left font-semibold">Ojo</th>
                          <th className="px-2 py-2 text-left font-semibold">SPH</th>
                          <th className="px-2 py-2 text-left font-semibold">CYL</th>
                          <th className="px-2 py-2 text-left font-semibold">AXIS</th>
                          <th className="px-2 py-2 text-left font-semibold">ADD</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-[#ECE8DF]">
                          <td className="px-2 py-2 font-medium">OD</td>
                          <td className="px-2 py-2">{prescription.rightEye.sphere ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.rightEye.cylinder ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.rightEye.axis ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.addPower ?? '-'}</td>
                        </tr>
                        <tr className="border-t border-[#ECE8DF]">
                          <td className="px-2 py-2 font-medium">OI</td>
                          <td className="px-2 py-2">{prescription.leftEye.sphere ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.leftEye.cylinder ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.leftEye.axis ?? '-'}</td>
                          <td className="px-2 py-2">{prescription.addPower ?? '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-2 text-sm text-[#2C3E6B]">PD: {prescription.pd ?? '-'}</p>
                </section>

                <section className="rounded-xl border border-[#E2DED5] bg-white p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D5953]">Montura base</span>
                      <span className="font-medium text-[#0F0F0D]">{formatCOP(basePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D5953]">Opciones</span>
                      <span className="font-medium text-[#0F0F0D]">{formatCOP(totalAddition)}</span>
                    </div>
                  </div>

                  <div className="my-3 h-px bg-[#E2DED5]" />

                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[#0F0F0D]">Total estimado</span>
                    <span className="text-lg font-bold text-[#D4A853]">
                      {formatCOP(totalPrice)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[#7A766F]">
                    El precio final se confirma al procesar tu pedido
                  </p>
                </section>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="border-[#D9D4CB] bg-white"
                  >
                    Atrás
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      onConfirm({
                        lensOptions: selectedLens,
                        prescription,
                        totalPrice,
                      })
                    }}
                    className="h-11 w-full rounded-full bg-[#D4A853] font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]"
                  >
                    Confirmar y agregar al carrito
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
