'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { toast } from 'sonner'

import { uploadPrescriptionImageAction } from '@/actions/orders.actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  LENS_FILTER_LABELS,
  LENS_TYPE_LABELS,
  hasPrescriptionDetails,
} from '@/lib/utils/lens-config'
import { cn, formatCOP } from '@/lib/utils'
import useCartStore from '@/stores/cart.store'
import type {
  LensFilterOption,
  LensType,
  PrescriptionData,
  Product,
  ProductWithCategory,
} from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const LENS_TYPES: LensType[] = ['sin-lente', 'monofocal', 'bifocal', 'progresivo', 'solar']
const LENS_FILTERS: LensFilterOption[] = [
  'blue-light',
  'photochromic',
  'anti-reflective',
  'uv-protection',
  'polarized',
]

type ProductConfiguratorDialogProps = {
  product: Product | ProductWithCategory
  trigger: React.ReactElement
  initialImage?: string
}

function createEmptyPrescription(): PrescriptionData {
  return {
    mode: 'pending',
    rightEye: {},
    leftEye: {},
    legalConsent: false,
    legalAcceptedAt: null,
  }
}

export function ProductConfiguratorDialog({
  product,
  trigger,
  initialImage,
}: ProductConfiguratorDialogProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const images = product.images?.length ? product.images : ['/placeholder.svg']

  const [open, setOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(initialImage ?? images[0])
  const [lensType, setLensType] = useState<LensType>('sin-lente')
  const [lensFilters, setLensFilters] = useState<LensFilterOption[]>([])
  const [prescription, setPrescription] = useState<PrescriptionData>(createEmptyPrescription())
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false)

  const shouldCapturePrescription = lensType !== 'sin-lente'
  const selectedLensLabel = LENS_TYPE_LABELS[lensType]
  const selectedFilterLabels = lensFilters.map((filter) => LENS_FILTER_LABELS[filter])
  const prescriptionStateLabel =
    prescription.mode === 'manual'
      ? 'Formula diligenciada'
      : prescription.mode === 'upload'
        ? prescription.imagePath
          ? 'Formula adjunta'
          : 'Carga pendiente'
        : 'Se enviara despues'
  const prescriptionStateTone =
    prescription.mode === 'manual'
      ? 'bg-[#F2E8D6] text-[#7B5A20]'
      : prescription.mode === 'upload'
        ? 'bg-[#E7F1E8] text-[#31573A]'
        : 'bg-[#EFE9DD] text-[#5C5549]'
  const summaryMessage = shouldCapturePrescription
    ? `${selectedLensLabel}${lensFilters.length ? ` · ${lensFilters.length} filtro(s)` : ''}`
    : 'Comprar solo montura'

  function toggleFilter(filter: LensFilterOption, checked: boolean) {
    setLensFilters((current) =>
      checked ? [...current, filter] : current.filter((value) => value !== filter)
    )
  }

  function updatePrescription(
    section: 'rightEye' | 'leftEye',
    field: 'sphere' | 'cylinder' | 'axis',
    value: string
  ) {
    setPrescription((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  function handleAddToCart() {
    if (shouldCapturePrescription && prescription.mode === 'manual') {
      if (!hasPrescriptionDetails(prescription)) {
        toast.error('Completa la formula o selecciona que la enviaras despues')
        return
      }

      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la formula')
        return
      }
    }

    if (shouldCapturePrescription && prescription.mode === 'upload') {
      if (!prescription.imagePath) {
        toast.error('Adjunta la imagen de la formula o selecciona otra opcion')
        return
      }

      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la formula')
        return
      }
    }

    const nextPrescription: PrescriptionData | null = !shouldCapturePrescription
      ? null
      : prescription.mode === 'manual' || prescription.mode === 'upload'
        ? {
            ...prescription,
            legalAcceptedAt: prescription.legalConsent ? new Date().toISOString() : null,
          }
        : {
            ...createEmptyPrescription(),
            mode: 'pending',
            notes: prescription.notes?.trim() || undefined,
          }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: selectedImage,
      lensType,
      lensFilters: shouldCapturePrescription ? lensFilters : [],
      prescription: nextPrescription,
    })

    toast.success('Producto agregado con configuracion personalizada')
    setOpen(false)
    openCart()
  }

  async function handlePrescriptionUpload(file: File | null) {
    if (!file) {
      return
    }

    setIsUploadingPrescription(true)
    const result = await uploadPrescriptionImageAction(file, product.slug)

    if (result.success && result.data) {
      setPrescription((current) => ({
        ...current,
        mode: 'upload',
        imagePath: result.data?.path,
        imageFileName: result.data?.fileName,
      }))
      toast.success('Formula cargada correctamente')
    } else {
      toast.error(result.error ?? 'No se pudo cargar la formula')
    }

    setIsUploadingPrescription(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[96vh] max-w-[1660px] overflow-hidden rounded-[36px] border border-[#D9D1C2] bg-[#F7F3EC] p-0 shadow-[0_42px_130px_-40px_rgba(15,15,13,0.48)]">
        <div className="relative overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,_rgba(212,168,83,0.22),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(15,15,13,0.08),_transparent_35%)]" />

          <div className="grid gap-0 xl:grid-cols-[minmax(540px,0.92fr)_minmax(780px,1.08fr)]">
            <section className="border-b border-[#E3DCCD] bg-[linear-gradient(180deg,#F3EBDD_0%,#EFE5D5_100%)] p-6 lg:p-8 xl:sticky xl:top-0 xl:h-[96vh] xl:border-r xl:border-b-0 xl:p-10">
              <div className="flex h-full flex-col gap-6 xl:gap-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        dmSans.className,
                        'rounded-full border border-[#D8C39A] bg-white/75 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#8A6A2F] uppercase'
                      )}
                    >
                      Configurador premium
                    </span>
                    <span
                      className={cn(
                        dmSans.className,
                        'rounded-full px-4 py-1.5 text-xs font-medium',
                        prescriptionStateTone
                      )}
                    >
                      {prescriptionStateLabel}
                    </span>
                  </div>

                  <DialogTitle
                    className={
                      playfairDisplay.className +
                      ' max-w-[18ch] text-4xl font-semibold text-[#0F0F0D] md:text-5xl'
                    }
                  >
                    {product.name}
                  </DialogTitle>

                  <p
                    className={dmSans.className + ' max-w-[34rem] text-sm leading-7 text-[#5F5A51]'}
                  >
                    Personaliza tu montura con una experiencia mas clara: elige lentes, tratamientos
                    y define como quieres compartir la formula antes de agregarla al carrito.
                  </p>
                </div>

                <div className="relative aspect-[5/5.8] overflow-hidden rounded-[2rem] border border-white/70 bg-[#F8F5EF] shadow-[0_30px_80px_-42px_rgba(15,15,13,0.5)]">
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 38vw, (min-width: 1024px) 46vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0D]/28 via-transparent to-transparent" />
                  <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-3">
                    <div className="rounded-[1.5rem] bg-white/88 px-4 py-3 backdrop-blur">
                      <p
                        className={
                          dmSans.className +
                          ' text-[11px] font-medium tracking-[0.14em] text-[#7A6D55] uppercase'
                        }
                      >
                        Seleccion actual
                      </p>
                      <p
                        className={
                          playfairDisplay.className +
                          ' mt-1 text-2xl font-semibold text-[#0F0F0D] italic'
                        }
                      >
                        {formatCOP(product.price)}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/70 bg-[#0F0F0D]/72 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                      {selectedLensLabel}
                    </div>
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="space-y-3">
                    <p
                      className={
                        dmSans.className +
                        ' text-xs font-medium tracking-[0.14em] text-[#756A58] uppercase'
                      }
                    >
                      Vista de montura
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {images.map((image) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setSelectedImage(image)}
                          className={cn(
                            'relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_18px_40px_-32px_rgba(15,15,13,0.6)] transition-transform hover:-translate-y-0.5',
                            selectedImage === image ? 'border-[#D4A853]' : 'border-[#DCCFB9]'
                          )}
                        >
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                          <span
                            className={cn(
                              'absolute inset-0 border-2 transition-colors',
                              selectedImage === image ? 'border-[#D4A853]' : 'border-transparent'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p
                      className={
                        dmSans.className +
                        ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                      }
                    >
                      Lente
                    </p>
                    <p className={dmSans.className + ' mt-2 text-sm font-semibold text-[#0F0F0D]'}>
                      {selectedLensLabel}
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p
                      className={
                        dmSans.className +
                        ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                      }
                    >
                      Tratamientos
                    </p>
                    <p className={dmSans.className + ' mt-2 text-sm font-semibold text-[#0F0F0D]'}>
                      {lensFilters.length ? `${lensFilters.length} seleccionados` : 'Sin filtros'}
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p
                      className={
                        dmSans.className +
                        ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                      }
                    >
                      Formula
                    </p>
                    <p className={dmSans.className + ' mt-2 text-sm font-semibold text-[#0F0F0D]'}>
                      {prescriptionStateLabel}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative flex min-h-[96vh] flex-col bg-[#FCFAF6]">
              <div className="flex-1 px-6 py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
                <DialogHeader className="space-y-5 border-b border-[#E8E0D2] pb-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                      <p
                        className={
                          dmSans.className +
                          ' text-[11px] font-medium tracking-[0.18em] text-[#8A6A2F] uppercase'
                        }
                      >
                        Configurador de compra
                      </p>
                      <DialogDescription
                        className={
                          dmSans.className + ' max-w-[44rem] text-sm leading-7 text-[#66665F]'
                        }
                      >
                        Organiza el pedido en tres decisiones claras: tipo de lente, tratamientos y
                        forma de enviar la formula. Todo queda asociado al carrito para el cierre
                        del pedido.
                      </DialogDescription>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                      <div className="rounded-[1.5rem] border border-[#E8E0D2] bg-white px-4 py-3">
                        <p
                          className={
                            dmSans.className +
                            ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                          }
                        >
                          Base
                        </p>
                        <p
                          className={
                            playfairDisplay.className +
                            ' mt-1 text-2xl font-semibold text-[#0F0F0D] italic'
                          }
                        >
                          {formatCOP(product.price)}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-[#E8E0D2] bg-white px-4 py-3">
                        <p
                          className={
                            dmSans.className +
                            ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                          }
                        >
                          Lente
                        </p>
                        <p
                          className={
                            dmSans.className + ' mt-2 text-sm font-semibold text-[#0F0F0D]'
                          }
                        >
                          {selectedLensLabel}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-[#E8E0D2] bg-white px-4 py-3">
                        <p
                          className={
                            dmSans.className +
                            ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                          }
                        >
                          Estado
                        </p>
                        <p
                          className={
                            dmSans.className + ' mt-2 text-sm font-semibold text-[#0F0F0D]'
                          }
                        >
                          {prescriptionStateLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-8 space-y-8 pb-36">
                  <section className="rounded-[2rem] border border-[#E6DECF] bg-white p-6 shadow-[0_24px_60px_-50px_rgba(15,15,13,0.6)] lg:p-7">
                    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                          1. Tipo de lente
                        </h3>
                        <p className={dmSans.className + ' mt-1 text-sm text-[#6A665D]'}>
                          Define primero la intencion del pedido para mostrar las opciones
                          correctas.
                        </p>
                      </div>
                      <span
                        className={
                          dmSans.className +
                          ' text-xs font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                        }
                      >
                        Paso principal
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {LENS_TYPES.map((option) => {
                        const active = lensType === option

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setLensType(option)}
                            className={cn(
                              dmSans.className,
                              'group rounded-[1.7rem] border px-5 py-5 text-left transition duration-200',
                              active
                                ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8] shadow-[0_28px_50px_-38px_rgba(15,15,13,0.9)]'
                                : 'border-[#E6DECF] bg-[#FCFAF6] text-[#3E3E38] hover:border-[#B8A98B] hover:bg-[#F8F3EA]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold">
                                  {LENS_TYPE_LABELS[option]}
                                </p>
                                <p
                                  className={cn(
                                    'mt-2 text-sm leading-6',
                                    active ? 'text-[#E9E1D3]' : 'text-[#676259]'
                                  )}
                                >
                                  {option === 'sin-lente'
                                    ? 'Solo montura, lista para compra inmediata.'
                                    : 'Incluye personalizacion del pedido y captura de formula.'}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  'mt-0.5 h-3.5 w-3.5 rounded-full border',
                                  active ? 'border-[#D4A853] bg-[#D4A853]' : 'border-[#CDBEA4]'
                                )}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {shouldCapturePrescription && (
                    <>
                      <section className="rounded-[2rem] border border-[#E6DECF] bg-white p-6 shadow-[0_24px_60px_-50px_rgba(15,15,13,0.6)] lg:p-7">
                        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                          <div>
                            <h3
                              className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}
                            >
                              2. Filtros y tratamientos
                            </h3>
                            <p className={dmSans.className + ' mt-1 text-sm text-[#6A665D]'}>
                              Agrega acabados para mejorar proteccion, confort y experiencia de uso.
                            </p>
                          </div>
                          <span
                            className={
                              dmSans.className +
                              ' text-xs font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                            }
                          >
                            Opcional
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {LENS_FILTERS.map((filter) => {
                            const checked = lensFilters.includes(filter)

                            return (
                              <label
                                key={filter}
                                className={cn(
                                  'flex items-start gap-4 rounded-[1.6rem] border px-4 py-4 transition',
                                  checked
                                    ? 'border-[#D4A853] bg-[#FFF8EA]'
                                    : 'border-[#E6DECF] bg-[#FCFAF6] hover:border-[#D8C7A7]'
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(nextChecked) =>
                                    toggleFilter(filter, Boolean(nextChecked))
                                  }
                                  className="mt-0.5"
                                />
                                <div className="space-y-1">
                                  <span
                                    className={
                                      dmSans.className +
                                      ' block text-sm font-semibold text-[#0F0F0D]'
                                    }
                                  >
                                    {LENS_FILTER_LABELS[filter]}
                                  </span>
                                  <span
                                    className={
                                      dmSans.className + ' block text-sm leading-6 text-[#6A665D]'
                                    }
                                  >
                                    Mejora el rendimiento del lente para distintos entornos de uso.
                                  </span>
                                </div>
                              </label>
                            )
                          })}
                        </div>

                        {selectedFilterLabels.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {selectedFilterLabels.map((label) => (
                              <span
                                key={label}
                                className={cn(
                                  dmSans.className,
                                  'rounded-full border border-[#E4D0A5] bg-[#FFF8EA] px-3 py-1.5 text-xs font-medium text-[#7B5A20]'
                                )}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="rounded-[2rem] border border-[#E6DECF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCF8F1_100%)] p-6 shadow-[0_24px_60px_-50px_rgba(15,15,13,0.6)] lg:p-7">
                        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <h3
                              className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}
                            >
                              3. Formula oftalmica
                            </h3>
                            <p
                              className={
                                dmSans.className + ' mt-1 text-sm leading-7 text-[#6A665D]'
                              }
                            >
                              Elige si quieres diligenciarla ahora, subir una imagen o dejarla para
                              confirmacion posterior.
                            </p>
                          </div>
                          <span
                            className={cn(
                              dmSans.className,
                              'rounded-full px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase',
                              prescriptionStateTone
                            )}
                          >
                            {prescriptionStateLabel}
                          </span>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-3">
                          {[
                            {
                              key: 'manual' as const,
                              title: 'Ingresar formula ahora',
                              copy: 'Ideal si ya tienes todos los valores a la mano.',
                            },
                            {
                              key: 'upload' as const,
                              title: 'Subir formula',
                              copy: 'Carga una foto clara de la formula emitida por tu optometra.',
                            },
                            {
                              key: 'pending' as const,
                              title: 'La envio despues',
                              copy: 'Continua con la compra y completa la formula en el seguimiento.',
                            },
                          ].map((modeOption) => {
                            const active = prescription.mode === modeOption.key

                            return (
                              <button
                                key={modeOption.key}
                                type="button"
                                onClick={() =>
                                  setPrescription((current) => ({
                                    ...current,
                                    mode: modeOption.key,
                                    ...(modeOption.key === 'pending'
                                      ? { legalConsent: false, legalAcceptedAt: null }
                                      : {}),
                                  }))
                                }
                                className={cn(
                                  dmSans.className,
                                  'rounded-[1.5rem] border px-4 py-4 text-left transition',
                                  active
                                    ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                                    : 'border-[#E6DECF] bg-white text-[#3E3E38] hover:border-[#B8A98B]'
                                )}
                              >
                                <span className="block text-sm font-semibold">
                                  {modeOption.title}
                                </span>
                                <span
                                  className={cn(
                                    'mt-2 block text-sm leading-6',
                                    active ? 'text-[#E9E1D3]' : 'text-[#6A665D]'
                                  )}
                                >
                                  {modeOption.copy}
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-6 rounded-[1.8rem] border border-[#E8DFD0] bg-white p-5 lg:p-6">
                          {prescription.mode === 'manual' ? (
                            <div className="space-y-6">
                              <div className="grid gap-5 xl:grid-cols-2">
                                <div className="space-y-4 rounded-[1.5rem] border border-[#ECE5D8] bg-[#FCFBF8] p-5">
                                  <p
                                    className={
                                      dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'
                                    }
                                  >
                                    Ojo derecho (OD)
                                  </p>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <Label htmlFor="od-sphere" className={dmSans.className}>
                                        Esfera
                                      </Label>
                                      <Input
                                        id="od-sphere"
                                        value={prescription.rightEye.sphere ?? ''}
                                        onChange={(event) =>
                                          updatePrescription(
                                            'rightEye',
                                            'sphere',
                                            event.target.value
                                          )
                                        }
                                        placeholder="-1.25"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor="od-cylinder" className={dmSans.className}>
                                        Cilindro
                                      </Label>
                                      <Input
                                        id="od-cylinder"
                                        value={prescription.rightEye.cylinder ?? ''}
                                        onChange={(event) =>
                                          updatePrescription(
                                            'rightEye',
                                            'cylinder',
                                            event.target.value
                                          )
                                        }
                                        placeholder="-0.50"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor="od-axis" className={dmSans.className}>
                                        Eje
                                      </Label>
                                      <Input
                                        id="od-axis"
                                        value={prescription.rightEye.axis ?? ''}
                                        onChange={(event) =>
                                          updatePrescription('rightEye', 'axis', event.target.value)
                                        }
                                        placeholder="90"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4 rounded-[1.5rem] border border-[#ECE5D8] bg-[#FCFBF8] p-5">
                                  <p
                                    className={
                                      dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'
                                    }
                                  >
                                    Ojo izquierdo (OI)
                                  </p>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <Label htmlFor="oi-sphere" className={dmSans.className}>
                                        Esfera
                                      </Label>
                                      <Input
                                        id="oi-sphere"
                                        value={prescription.leftEye.sphere ?? ''}
                                        onChange={(event) =>
                                          updatePrescription(
                                            'leftEye',
                                            'sphere',
                                            event.target.value
                                          )
                                        }
                                        placeholder="-1.00"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor="oi-cylinder" className={dmSans.className}>
                                        Cilindro
                                      </Label>
                                      <Input
                                        id="oi-cylinder"
                                        value={prescription.leftEye.cylinder ?? ''}
                                        onChange={(event) =>
                                          updatePrescription(
                                            'leftEye',
                                            'cylinder',
                                            event.target.value
                                          )
                                        }
                                        placeholder="-0.25"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor="oi-axis" className={dmSans.className}>
                                        Eje
                                      </Label>
                                      <Input
                                        id="oi-axis"
                                        value={prescription.leftEye.axis ?? ''}
                                        onChange={(event) =>
                                          updatePrescription('leftEye', 'axis', event.target.value)
                                        }
                                        placeholder="80"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr]">
                                <div className="space-y-1.5">
                                  <Label htmlFor="pd" className={dmSans.className}>
                                    Distancia pupilar (PD)
                                  </Label>
                                  <Input
                                    id="pd"
                                    value={prescription.pd ?? ''}
                                    onChange={(event) =>
                                      setPrescription((current) => ({
                                        ...current,
                                        pd: event.target.value,
                                      }))
                                    }
                                    placeholder="62"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="add-power" className={dmSans.className}>
                                    Adicion
                                  </Label>
                                  <Input
                                    id="add-power"
                                    value={prescription.addPower ?? ''}
                                    onChange={(event) =>
                                      setPrescription((current) => ({
                                        ...current,
                                        addPower: event.target.value,
                                      }))
                                    }
                                    placeholder="+1.50"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="prescription-notes" className={dmSans.className}>
                                    Notas adicionales
                                  </Label>
                                  <Textarea
                                    id="prescription-notes"
                                    rows={3}
                                    value={prescription.notes ?? ''}
                                    onChange={(event) =>
                                      setPrescription((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                      }))
                                    }
                                    placeholder="Ej. uso permanente, trabajar frente a pantallas, preferencia de delgadez, etc."
                                  />
                                </div>
                              </div>

                              <label className="flex items-start gap-3 rounded-[1.5rem] border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-4 text-sm text-[#51483A]">
                                <Checkbox
                                  checked={prescription.legalConsent}
                                  onCheckedChange={(checked) =>
                                    setPrescription((current) => ({
                                      ...current,
                                      legalConsent: Boolean(checked),
                                    }))
                                  }
                                />
                                <span className={dmSans.className + ' leading-6'}>
                                  Autorizo a OpticaAI a almacenar y tratar mi formula oftalmica para
                                  la gestion de este pedido y soporte posterior.
                                </span>
                              </label>
                            </div>
                          ) : prescription.mode === 'upload' ? (
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                              <div className="space-y-5">
                                <div className="space-y-1.5">
                                  <Label htmlFor="prescription-upload" className={dmSans.className}>
                                    Imagen de la formula
                                  </Label>
                                  <Input
                                    id="prescription-upload"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null
                                      void handlePrescriptionUpload(file)
                                    }}
                                    disabled={isUploadingPrescription}
                                    className="h-auto py-3"
                                  />
                                  <p
                                    className={
                                      dmSans.className + ' text-xs leading-6 text-[#7C776F]'
                                    }
                                  >
                                    Sube una foto clara de tu formula. Formatos permitidos: JPG, PNG
                                    o WEBP.
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <Label
                                    htmlFor="upload-prescription-notes"
                                    className={dmSans.className}
                                  >
                                    Observaciones
                                  </Label>
                                  <Textarea
                                    id="upload-prescription-notes"
                                    rows={4}
                                    value={prescription.notes ?? ''}
                                    onChange={(event) =>
                                      setPrescription((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                      }))
                                    }
                                    placeholder="Ej. formula vigente, uso permanente, observaciones del optometra, etc."
                                  />
                                </div>

                                <label className="flex items-start gap-3 rounded-[1.5rem] border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-4 text-sm text-[#51483A]">
                                  <Checkbox
                                    checked={prescription.legalConsent}
                                    onCheckedChange={(checked) =>
                                      setPrescription((current) => ({
                                        ...current,
                                        legalConsent: Boolean(checked),
                                      }))
                                    }
                                  />
                                  <span className={dmSans.className + ' leading-6'}>
                                    Autorizo a OpticaAI a almacenar la imagen de mi formula y usarla
                                    para la gestion del pedido y verificaciones futuras.
                                  </span>
                                </label>
                              </div>

                              <div className="rounded-[1.6rem] border border-[#ECE5D8] bg-[#FCFBF8] p-5 text-sm text-[#5B554C]">
                                {isUploadingPrescription ? (
                                  <div className="space-y-2">
                                    <p
                                      className={dmSans.className + ' font-semibold text-[#0F0F0D]'}
                                    >
                                      Cargando formula...
                                    </p>
                                    <p className={dmSans.className + ' leading-6 text-[#6A665D]'}>
                                      Estamos procesando la imagen para asociarla al pedido.
                                    </p>
                                  </div>
                                ) : prescription.imagePath ? (
                                  <div className="space-y-3">
                                    <p
                                      className={dmSans.className + ' font-semibold text-[#0F0F0D]'}
                                    >
                                      Formula adjunta
                                    </p>
                                    <p className={dmSans.className + ' leading-6'}>
                                      {prescription.imageFileName ?? 'Archivo cargado'}
                                    </p>
                                    <div className="rounded-[1.2rem] border border-[#E6DECF] bg-white px-4 py-3 text-xs text-[#6A665D]">
                                      Revisa que la foto sea legible y muestre todos los valores.
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <p
                                      className={dmSans.className + ' font-semibold text-[#0F0F0D]'}
                                    >
                                      Aun no has adjuntado una formula
                                    </p>
                                    <p className={dmSans.className + ' leading-6 text-[#6A665D]'}>
                                      Usa este espacio para subir la imagen antes de agregar el
                                      producto.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-[1.6rem] border border-dashed border-[#D5CAB7] bg-[#FCFAF6] px-5 py-6">
                              <p className={dmSans.className + ' text-sm leading-7 text-[#66665F]'}>
                                Puedes agregar la montura con el tipo de lente y enviarnos la
                                formula mas adelante por WhatsApp o durante la confirmacion del
                                pedido.
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    </>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-[#E8E0D2] bg-[#FCFAF6]/95 px-6 py-4 backdrop-blur lg:px-8 xl:px-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p
                      className={
                        dmSans.className +
                        ' text-[11px] font-medium tracking-[0.14em] text-[#8A6A2F] uppercase'
                      }
                    >
                      Resumen actual
                    </p>
                    <p className={dmSans.className + ' text-sm text-[#4F4A42]'}>{summaryMessage}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-full border border-[#E8E0D2] bg-white px-5 py-2.5 text-center">
                      <span
                        className={
                          playfairDisplay.className +
                          ' text-2xl font-semibold text-[#0F0F0D] italic'
                        }
                      >
                        {formatCOP(product.price)}
                      </span>
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      className={
                        dmSans.className +
                        ' h-12 min-w-[280px] rounded-full bg-[#D4A853] px-7 text-sm font-semibold text-[#0F0F0D] shadow-[0_24px_44px_-28px_rgba(212,168,83,0.95)] hover:bg-[#C79D4C]'
                      }
                    >
                      Guardar y agregar al carrito
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
