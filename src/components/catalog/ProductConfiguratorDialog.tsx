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
  const summaryMessage = shouldCapturePrescription
    ? `${selectedLensLabel}${lensFilters.length ? ` · ${lensFilters.length} filtro(s)` : ''}`
    : 'Comprar solo montura'
  const prescriptionStateLabel =
    prescription.mode === 'manual'
      ? 'Formula diligenciada'
      : prescription.mode === 'upload'
        ? prescription.imagePath
          ? 'Formula adjunta'
          : 'Carga pendiente'
        : 'Se enviara despues'

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
      <DialogContent className="max-h-[95vh] max-w-[1320px] overflow-y-auto rounded-3xl border border-[#E6DECF] bg-[#FAF8F3] p-0">
        <div className="grid gap-0 lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[500px_minmax(0,1fr)]">
          <section className="border-b border-[#E6DECF] bg-[#F4EEE1] p-5 lg:sticky lg:top-0 lg:h-[95vh] lg:border-r lg:border-b-0 lg:p-7">
            <div className="flex h-full flex-col gap-5">
              <div>
                <p
                  className={
                    dmSans.className +
                    ' text-[11px] font-medium tracking-[0.16em] text-[#8A6A2F] uppercase'
                  }
                >
                  Configurador de compra
                </p>
                <h2
                  className={
                    playfairDisplay.className + ' mt-2 text-3xl font-semibold text-[#0F0F0D]'
                  }
                >
                  {product.name}
                </h2>
                <p className={dmSans.className + ' mt-2 text-sm leading-6 text-[#66665F]'}>
                  Elige el lente y define como compartir la formula de forma rapida.
                </p>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[#DED5C3] bg-white">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 500px, (min-width: 1024px) 440px, 100vw"
                />
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={cn(
                        'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white',
                        selectedImage === image ? 'border-[#D4A853]' : 'border-[#DCCFB9]'
                      )}
                    >
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-[#E3DCCD] bg-white px-4 py-3">
                  <p className={dmSans.className + ' text-xs text-[#7B776E]'}>Precio base</p>
                  <p
                    className={
                      playfairDisplay.className + ' text-2xl font-semibold text-[#0F0F0D] italic'
                    }
                  >
                    {formatCOP(product.price)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E3DCCD] bg-white px-4 py-3">
                  <p className={dmSans.className + ' text-xs text-[#7B776E]'}>Resumen</p>
                  <p className={dmSans.className + ' text-sm font-medium text-[#0F0F0D]'}>
                    {summaryMessage}
                  </p>
                  <p className={dmSans.className + ' mt-1 text-xs text-[#7B776E]'}>
                    Estado: {prescriptionStateLabel}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[95vh] flex-col bg-[#FAF8F3]">
            <div className="flex-1 px-5 py-5 lg:px-8 lg:py-7">
              <DialogHeader className="space-y-2 border-b border-[#E6DECF] pb-5">
                <DialogTitle
                  className={playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'}
                >
                  Personaliza tu pedido
                </DialogTitle>
                <DialogDescription
                  className={dmSans.className + ' text-sm leading-6 text-[#66665F]'}
                >
                  Flujo simple en tres pasos: lente, tratamientos y formula.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6 pb-28">
                <section className="rounded-2xl border border-[#E6DECF] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                      1. Tipo de lente
                    </h3>
                    <span className={dmSans.className + ' text-xs text-[#8A6A2F]'}>
                      Obligatorio
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {LENS_TYPES.map((option) => {
                      const active = lensType === option

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setLensType(option)}
                          className={cn(
                            dmSans.className,
                            'rounded-xl border px-4 py-3 text-left text-sm transition',
                            active
                              ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                              : 'border-[#E6DECF] bg-white text-[#3E3E38] hover:border-[#B8A98B]'
                          )}
                        >
                          <p className="font-semibold">{LENS_TYPE_LABELS[option]}</p>
                          <p
                            className={cn(
                              'mt-1 text-xs leading-5',
                              active ? 'text-[#E8E0D2]' : 'text-[#6F6A61]'
                            )}
                          >
                            {option === 'sin-lente'
                              ? 'Solo montura.'
                              : 'Incluye configuracion de formula.'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {shouldCapturePrescription && (
                  <>
                    <section className="rounded-2xl border border-[#E6DECF] bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                          2. Filtros y tratamientos
                        </h3>
                        <span className={dmSans.className + ' text-xs text-[#8A6A2F]'}>
                          Opcional
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {LENS_FILTERS.map((filter) => {
                          const checked = lensFilters.includes(filter)

                          return (
                            <label
                              key={filter}
                              className={cn(
                                'flex items-start gap-3 rounded-xl border px-4 py-3 transition',
                                checked
                                  ? 'border-[#D4A853] bg-[#FFF8EA]'
                                  : 'border-[#E6DECF] bg-white hover:border-[#D8C7A7]'
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  toggleFilter(filter, Boolean(nextChecked))
                                }
                              />
                              <span className={dmSans.className + ' text-sm text-[#3E3E38]'}>
                                {LENS_FILTER_LABELS[filter]}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-[#E6DECF] bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                          3. Formula oftalmica
                        </h3>
                        <span className={dmSans.className + ' text-xs text-[#8A6A2F]'}>
                          Requerido
                        </span>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-3">
                        {[
                          {
                            key: 'manual' as const,
                            title: 'Ingresar ahora',
                            copy: 'Escribe tus datos.',
                          },
                          {
                            key: 'upload' as const,
                            title: 'Subir imagen',
                            copy: 'Adjunta foto de la formula.',
                          },
                          {
                            key: 'pending' as const,
                            title: 'Enviar despues',
                            copy: 'La compartes en seguimiento.',
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
                                'rounded-xl border px-4 py-3 text-left transition',
                                active
                                  ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                                  : 'border-[#E6DECF] bg-white text-[#3E3E38] hover:border-[#B8A98B]'
                              )}
                            >
                              <p className="text-sm font-semibold">{modeOption.title}</p>
                              <p
                                className={cn(
                                  'mt-1 text-xs',
                                  active ? 'text-[#E8E0D2]' : 'text-[#6F6A61]'
                                )}
                              >
                                {modeOption.copy}
                              </p>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mt-5 rounded-xl border border-[#ECE5D8] bg-[#FCFBF8] p-4">
                        {prescription.mode === 'manual' ? (
                          <div className="space-y-5">
                            <div className="grid gap-4 xl:grid-cols-2">
                              <div className="space-y-3">
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
                                        updatePrescription('rightEye', 'sphere', event.target.value)
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

                              <div className="space-y-3">
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
                                        updatePrescription('leftEye', 'sphere', event.target.value)
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

                            <div className="grid gap-4 md:grid-cols-2">
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
                                placeholder="Ej. uso permanente, trabajo en pantalla, etc."
                              />
                            </div>

                            <label className="flex items-start gap-3 rounded-xl border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-3 text-sm text-[#51483A]">
                              <Checkbox
                                checked={prescription.legalConsent}
                                onCheckedChange={(checked) =>
                                  setPrescription((current) => ({
                                    ...current,
                                    legalConsent: Boolean(checked),
                                  }))
                                }
                              />
                              <span className={dmSans.className}>
                                Autorizo a OpticaAI a almacenar y tratar mi formula para este
                                pedido.
                              </span>
                            </label>
                          </div>
                        ) : prescription.mode === 'upload' ? (
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
                                className="h-auto py-2"
                              />
                              <p className={dmSans.className + ' text-xs text-[#7C776F]'}>
                                Formatos permitidos: JPG, PNG o WEBP.
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#ECE5D8] bg-white p-4 text-sm text-[#5B554C]">
                              {isUploadingPrescription ? (
                                <p className={dmSans.className}>Cargando formula...</p>
                              ) : prescription.imagePath ? (
                                <div className="space-y-1">
                                  <p className={dmSans.className + ' font-semibold text-[#0F0F0D]'}>
                                    Formula adjunta
                                  </p>
                                  <p className={dmSans.className}>
                                    {prescription.imageFileName ?? 'Archivo cargado'}
                                  </p>
                                </div>
                              ) : (
                                <p className={dmSans.className}>
                                  Aun no has adjuntado una formula.
                                </p>
                              )}
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
                                rows={3}
                                value={prescription.notes ?? ''}
                                onChange={(event) =>
                                  setPrescription((current) => ({
                                    ...current,
                                    notes: event.target.value,
                                  }))
                                }
                                placeholder="Comentarios sobre tu formula"
                              />
                            </div>

                            <label className="flex items-start gap-3 rounded-xl border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-3 text-sm text-[#51483A]">
                              <Checkbox
                                checked={prescription.legalConsent}
                                onCheckedChange={(checked) =>
                                  setPrescription((current) => ({
                                    ...current,
                                    legalConsent: Boolean(checked),
                                  }))
                                }
                              />
                              <span className={dmSans.className}>
                                Autorizo a OpticaAI a almacenar la imagen de mi formula.
                              </span>
                            </label>
                          </div>
                        ) : (
                          <p className={dmSans.className + ' text-sm leading-7 text-[#66665F]'}>
                            Puedes agregar la montura y enviar la formula mas adelante por WhatsApp
                            o durante la confirmacion del pedido.
                          </p>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-[#E6DECF] bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={dmSans.className + ' text-xs text-[#7B776E]'}>Resumen actual</p>
                  <p className={dmSans.className + ' text-sm font-medium text-[#0F0F0D]'}>
                    {summaryMessage}
                  </p>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className={
                    dmSans.className +
                    ' h-11 min-w-[260px] rounded-full bg-[#D4A853] px-6 text-sm font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]'
                  }
                >
                  Guardar y agregar al carrito
                </Button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
