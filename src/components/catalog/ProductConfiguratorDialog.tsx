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
import { formatCOP } from '@/lib/utils'
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
    const shouldCapturePrescription = lensType !== 'sin-lente'

    if (shouldCapturePrescription && prescription.mode === 'manual') {
      if (!hasPrescriptionDetails(prescription)) {
        toast.error('Completa la fórmula o selecciona que la enviarás después')
        return
      }

      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la fórmula')
        return
      }
    }

    if (shouldCapturePrescription && prescription.mode === 'upload') {
      if (!prescription.imagePath) {
        toast.error('Adjunta la imagen de la fórmula o selecciona otra opción')
        return
      }

      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la fórmula')
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

    toast.success('Producto agregado con configuración personalizada')
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
      toast.success('Fórmula cargada correctamente')
    } else {
      toast.error(result.error ?? 'No se pudo cargar la fórmula')
    }

    setIsUploadingPrescription(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[92vh] max-w-[1180px] overflow-y-auto rounded-[28px] border border-[#E2DDD6] bg-[#FAFAF8] p-0">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-[#E2DDD6] bg-[#F4EFE6] p-5 lg:border-r lg:border-b-0 lg:p-6">
            <div className="relative aspect-square overflow-hidden rounded-[24px] border border-[#E2DDD6] bg-white">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#DCCFB9] bg-white"
                  >
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <span
                      className={`absolute inset-0 border-2 ${selectedImage === image ? 'border-[#D4A853]' : 'border-transparent'}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="p-5 lg:p-6">
            <DialogHeader className="space-y-3">
              <p
                className={
                  dmSans.className +
                  ' text-[11px] font-medium tracking-[0.16em] text-[#8A6A2F] uppercase'
                }
              >
                Configurador de compra
              </p>
              <DialogTitle
                className={playfairDisplay.className + ' text-4xl font-semibold text-[#0F0F0D]'}
              >
                {product.name}
              </DialogTitle>
              <DialogDescription className={dmSans.className + ' text-sm leading-7 text-[#66665F]'}>
                Elige el tipo de lente, agrega filtros y registra la fórmula si ya la tienes. La
                información queda asociada al pedido para soporte posterior.
              </DialogDescription>
              <div
                className={
                  playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D] italic'
                }
              >
                {formatCOP(product.price)}
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <section className="space-y-3">
                <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                  Tipo de lente
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {LENS_TYPES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLensType(option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        lensType === option
                          ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                          : 'border-[#E2DDD6] bg-white text-[#3E3E38] hover:border-[#0F0F0D]'
                      }`}
                    >
                      {LENS_TYPE_LABELS[option]}
                    </button>
                  ))}
                </div>
              </section>

              {lensType !== 'sin-lente' && (
                <>
                  <section className="space-y-3">
                    <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                      Filtros y tratamientos disponibles
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {LENS_FILTERS.map((filter) => (
                        <label
                          key={filter}
                          className="flex items-center gap-3 rounded-2xl border border-[#E2DDD6] bg-white px-4 py-3 text-sm text-[#3E3E38]"
                        >
                          <Checkbox
                            checked={lensFilters.includes(filter)}
                            onCheckedChange={(checked) => toggleFilter(filter, Boolean(checked))}
                          />
                          <span className={dmSans.className}>{LENS_FILTER_LABELS[filter]}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4 rounded-3xl border border-[#E2DDD6] bg-white p-5">
                    <div className="space-y-2">
                      <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                        Fórmula oftálmica
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPrescription((current) => ({ ...current, mode: 'manual' }))
                          }
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            prescription.mode === 'manual'
                              ? 'bg-[#0F0F0D] text-[#FAFAF8]'
                              : 'bg-[#F3EFE7] text-[#3E3E38]'
                          }`}
                        >
                          Ingresar fórmula ahora
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrescription((current) => ({ ...current, mode: 'upload' }))
                          }
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            prescription.mode === 'upload'
                              ? 'bg-[#0F0F0D] text-[#FAFAF8]'
                              : 'bg-[#F3EFE7] text-[#3E3E38]'
                          }`}
                        >
                          Subir fórmula
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrescription((current) => ({
                              ...current,
                              mode: 'pending',
                              legalConsent: false,
                              legalAcceptedAt: null,
                            }))
                          }
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            prescription.mode === 'pending'
                              ? 'bg-[#0F0F0D] text-[#FAFAF8]'
                              : 'bg-[#F3EFE7] text-[#3E3E38]'
                          }`}
                        >
                          La envío después
                        </button>
                      </div>
                    </div>

                    {prescription.mode === 'manual' ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3 rounded-2xl border border-[#ECE5D8] bg-[#FCFBF8] p-4">
                            <p
                              className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}
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
                                    updatePrescription('rightEye', 'cylinder', event.target.value)
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

                          <div className="space-y-3 rounded-2xl border border-[#ECE5D8] bg-[#FCFBF8] p-4">
                            <p
                              className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}
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
                                    updatePrescription('leftEye', 'cylinder', event.target.value)
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

                        <div className="grid gap-3 sm:grid-cols-2">
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
                              Adición
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
                            placeholder="Ej. uso permanente, trabajar frente a pantallas, preferencia de delgadez, etc."
                          />
                        </div>

                        <label className="flex items-start gap-3 rounded-2xl border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-3 text-sm text-[#51483A]">
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
                            Autorizo a OpticaAI a almacenar y tratar mi fórmula oftálmica para la
                            gestión de este pedido y soporte posterior.
                          </span>
                        </label>
                      </div>
                    ) : prescription.mode === 'upload' ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="prescription-upload" className={dmSans.className}>
                            Imagen de la fórmula
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
                            Sube una foto clara de tu fórmula. Formatos permitidos: JPG, PNG o WEBP.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#ECE5D8] bg-[#FCFBF8] p-4 text-sm text-[#5B554C]">
                          {isUploadingPrescription ? (
                            <p className={dmSans.className}>Cargando fórmula...</p>
                          ) : prescription.imagePath ? (
                            <div className="space-y-1">
                              <p className={dmSans.className + ' font-semibold text-[#0F0F0D]'}>
                                Fórmula adjunta
                              </p>
                              <p className={dmSans.className}>
                                {prescription.imageFileName ?? 'Archivo cargado'}
                              </p>
                            </div>
                          ) : (
                            <p className={dmSans.className}>Aún no has adjuntado una fórmula.</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="upload-prescription-notes" className={dmSans.className}>
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
                            placeholder="Ej. fórmula vigente, uso permanente, observaciones del optómetra, etc."
                          />
                        </div>

                        <label className="flex items-start gap-3 rounded-2xl border border-[#E8D8B7] bg-[#FFF9EE] px-4 py-3 text-sm text-[#51483A]">
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
                            Autorizo a OpticaAI a almacenar la imagen de mi fórmula y usarla para la
                            gestión del pedido y verificaciones futuras.
                          </span>
                        </label>
                      </div>
                    ) : (
                      <p className={dmSans.className + ' text-sm leading-7 text-[#66665F]'}>
                        Puedes agregar la montura con el tipo de lente y enviarnos la fórmula más
                        adelante por WhatsApp o durante la confirmación del pedido.
                      </p>
                    )}
                  </section>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2DDD6] pt-2">
                <div className={dmSans.className + ' text-sm text-[#66665F]'}>
                  {lensType === 'sin-lente'
                    ? 'Comprar solo montura'
                    : `${LENS_TYPE_LABELS[lensType]}${lensFilters.length ? ` · ${lensFilters.length} filtro(s)` : ''}`}
                </div>
                <Button
                  onClick={handleAddToCart}
                  className={
                    dmSans.className +
                    ' h-11 rounded-full bg-[#D4A853] px-6 text-sm font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]'
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
