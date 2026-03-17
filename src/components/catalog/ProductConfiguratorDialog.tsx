import { useEffect, useState } from 'react'
import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

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
  LENS_MATERIAL_LABELS,
  LENS_THICKNESS_LABELS,
  LENS_TINT_LABELS,
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
import { createClient } from '@/lib/supabase/client'
import { getLensOptions, type LensOption } from '@/lib/repositories/lens-options.repo'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

type ConfigStep = 'lenses' | 'prescription' | 'summary'

type AdvancedSelection = {
  type?: LensOption
  material?: LensOption
  filters: LensOption[]
  tint?: LensOption
  thickness?: LensOption
}

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
  const [step, setStep] = useState<ConfigStep>('lenses')
  const [selectedImage, setSelectedImage] = useState(initialImage ?? images[0])
  const [lensOptions, setLensOptions] = useState<LensOption[]>([])
  const [selection, setSelection] = useState<AdvancedSelection>({
    filters: [],
  })
  const [prescription, setPrescription] = useState<PrescriptionData>(createEmptyPrescription())
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false)

  useEffect(() => {
    if (open) {
      try {
        const supabase = createClient()
        getLensOptions(supabase).then(setLensOptions).catch(console.error)
      } catch (err) {
        console.error(err)
      }
    }
  }, [open])

  const lensTypes = lensOptions.filter((o) => o.category === 'type')
  const materials = lensOptions.filter((o) => o.category === 'material')
  const filters = lensOptions.filter((o) => o.category === 'filter')
  const tints = lensOptions.filter((o) => o.category === 'tint')
  const thicknesses = lensOptions.filter((o) => o.category === 'thickness')

  const totalPriceAddition =
    (selection.type?.price_addition ?? 0) +
    (selection.material?.price_addition ?? 0) +
    selection.filters.reduce((acc, f) => acc + f.price_addition, 0) +
    (selection.tint?.price_addition ?? 0) +
    (selection.thickness?.price_addition ?? 0)

  const finalPrice = product.price + totalPriceAddition

  const isLensRequired = selection.type !== undefined

  const summaryMessage = isLensRequired
    ? `${selection.type?.name ?? ''}${selection.filters.length ? ` · ${selection.filters.length} filtros` : ''}`
    : 'Solo montura'

  function toggleFilter(option: LensOption, checked: boolean) {
    setSelection((prev) => ({
      ...prev,
      filters: checked ? [...prev.filters, option] : prev.filters.filter((f) => f.id !== option.id),
    }))
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
    if (isLensRequired && prescription.mode === 'manual') {
      if (!hasPrescriptionDetails(prescription)) {
        toast.error('Completa la fórmula o selecciona que la enviarás después')
        return
      }
      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la fórmula')
        return
      }
    }

    if (isLensRequired && prescription.mode === 'upload') {
      if (!prescription.imagePath) {
        toast.error('Adjunta la imagen de la fórmula o selecciona otra opción')
        return
      }
      if (!prescription.legalConsent) {
        toast.error('Debes autorizar el tratamiento y almacenamiento de la fórmula')
        return
      }
    }

    const nextPrescription: PrescriptionData | null = !isLensRequired
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
      price: finalPrice,
      image: selectedImage,
      lensType: selection.type?.id ? (selection.type.name.toLowerCase() as LensType) : 'sin-lente',
      lensFilters: selection.filters.map((f) => f.name.toLowerCase() as LensFilterOption),
      lensSelection: isLensRequired
        ? {
            type: selection.type?.name,
            typeId: selection.type?.id,
            material: selection.material?.name,
            materialId: selection.material?.id,
            filters: selection.filters.map((f) => f.name),
            filterIds: selection.filters.map((f) => f.id),
            tint: selection.tint?.name,
            tintId: selection.tint?.id,
            thickness: selection.thickness?.name,
            thicknessId: selection.thickness?.id,
            totalAddition: totalPriceAddition,
          }
        : undefined,
      prescription: nextPrescription,
    })

    toast.success('Producto agregado con configuración personalizada')
    setOpen(false)
    openCart()
  }

  async function handlePrescriptionUpload(file: File | null) {
    if (!file) return
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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) {
          setStep('lenses')
          setSelection({ filters: [] })
          setPrescription(createEmptyPrescription())
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] max-w-[1100px] overflow-hidden rounded-3xl border border-[#E6DECF] bg-[#FAF8F3] p-0">
        <div className="grid h-[85vh] grid-cols-1 lg:grid-cols-[380px_1fr]">
          {/* Sidebar */}
          <section className="hidden flex-col border-r border-[#E6DECF] bg-[#F4EEE1] lg:flex">
            <div className="flex-1 overflow-y-auto p-8">
              <p
                className={
                  dmSans.className +
                  ' text-[11px] font-medium tracking-[0.2em] text-[#8A6A2F] uppercase'
                }
              >
                Configuración de pedido
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      step === 'lenses' ? 'bg-[#0F0F0D] text-white' : 'bg-[#E6DECF] text-[#8A6A2F]'
                    )}
                  >
                    {selection.type ? <Check size={14} /> : '1'}
                  </div>
                  <div>
                    <p className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                      Lentes
                    </p>
                    <p className={dmSans.className + ' text-xs text-[#66665F]'}>
                      {selection.type ? selection.type.name : 'Tipo, material y filtros'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      step === 'prescription'
                        ? 'bg-[#0F0F0D] text-white'
                        : 'bg-[#E6DECF] text-[#8A6A2F]'
                    )}
                  >
                    {hasPrescriptionDetails(prescription) ? <Check size={14} /> : '2'}
                  </div>
                  <div>
                    <p className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                      Fórmula
                    </p>
                    <p className={dmSans.className + ' text-xs text-[#66665F]'}>
                      {prescription.mode === 'manual'
                        ? 'Diligenciada'
                        : 'Adjuntar o enviar después'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      step === 'summary' ? 'bg-[#0F0F0D] text-white' : 'bg-[#E6DECF] text-[#8A6A2F]'
                    )}
                  >
                    3
                  </div>
                  <div>
                    <p className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>
                      Resumen
                    </p>
                    <p className={dmSans.className + ' text-xs text-[#66665F]'}>Confirmar pedido</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#DED5C3] bg-white">
                  <Image src={selectedImage} alt={product.name} fill className="object-cover" />
                </div>
                <div>
                  <h3
                    className={playfairDisplay.className + ' text-xl font-semibold text-[#0F0F0D]'}
                  >
                    {product.name}
                  </h3>
                  <p className={dmSans.className + ' mt-1 text-sm text-[#8A6A2F] italic'}>
                    {formatCOP(finalPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E6DECF] p-8">
              <p
                className={
                  dmSans.className + ' mb-2 text-[10px] tracking-wider text-[#8A6A2F] uppercase'
                }
              >
                Resumen actual
              </p>
              <p className={dmSans.className + ' text-sm font-medium text-[#0F0F0D]'}>
                {summaryMessage}
              </p>
            </div>
          </section>

          {/* Main Content */}
          <section className="flex flex-col overflow-hidden bg-white">
            <div className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-10">
              {step === 'lenses' && (
                <div className="space-y-10">
                  <header>
                    <h2
                      className={
                        playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'
                      }
                    >
                      Configura tus lentes
                    </h2>
                    <p className={dmSans.className + ' mt-2 text-[#66665F]'}>
                      Elige las opciones que mejor se adapten a tus necesidades.
                    </p>
                  </header>

                  {/* Lens Type */}
                  <div className="space-y-4">
                    <h4
                      className={
                        dmSans.className +
                        ' text-xs font-bold tracking-widest text-[#8A6A2F] uppercase'
                      }
                    >
                      Tipo de lente
                    </h4>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      <button
                        onClick={() => setSelection((prev) => ({ ...prev, type: undefined }))}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all',
                          !selection.type
                            ? 'border-[#D4A853] bg-[#FFF9EE]'
                            : 'border-[#E6DECF] hover:border-[#D4A853]'
                        )}
                      >
                        <p className={dmSans.className + ' text-sm font-bold'}>Sin lentes</p>
                        <p className={dmSans.className + ' mt-1 text-xs text-[#66665F]'}>
                          Solo montura
                        </p>
                      </button>
                      {lensTypes.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelection((prev) => ({ ...prev, type: opt }))}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-all',
                            selection.type?.id === opt.id
                              ? 'border-[#D4A853] bg-[#FFF9EE]'
                              : 'border-[#E6DECF] hover:border-[#D4A853]'
                          )}
                        >
                          <p className={dmSans.className + ' text-sm font-bold'}>{opt.name}</p>
                          <p className={dmSans.className + ' mt-1 text-xs text-[#8A6A2F]'}>
                            +{formatCOP(opt.price_addition)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isLensRequired && (
                    <>
                      {/* Material */}
                      <div className="space-y-4">
                        <h4
                          className={
                            dmSans.className +
                            ' text-xs font-bold tracking-widest text-[#8A6A2F] uppercase'
                          }
                        >
                          Material
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {materials.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelection((prev) => ({ ...prev, material: opt }))}
                              className={cn(
                                'rounded-xl border p-4 text-left transition-all',
                                selection.material?.id === opt.id
                                  ? 'border-[#D4A853] bg-[#FFF9EE]'
                                  : 'border-[#E6DECF] hover:border-[#D4A853]'
                              )}
                            >
                              <p className={dmSans.className + ' text-sm font-bold'}>{opt.name}</p>
                              <p className={dmSans.className + ' mt-1 text-xs text-[#8A6A2F]'}>
                                +{formatCOP(opt.price_addition)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="space-y-4">
                        <h4
                          className={
                            dmSans.className +
                            ' text-xs font-bold tracking-widest text-[#8A6A2F] uppercase'
                          }
                        >
                          Filtros adicionales
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {filters.map((opt) => {
                            const active = selection.filters.some((f) => f.id === opt.id)
                            return (
                              <button
                                key={opt.id}
                                onClick={() => toggleFilter(opt, !active)}
                                className={cn(
                                  'rounded-xl border p-4 text-left transition-all',
                                  active
                                    ? 'border-[#D4A853] bg-[#FFF9EE]'
                                    : 'border-[#E6DECF] hover:border-[#D4A853]'
                                )}
                              >
                                <p className={dmSans.className + ' text-sm font-bold'}>
                                  {opt.name}
                                </p>
                                <p className={dmSans.className + ' mt-1 text-xs text-[#8A6A2F]'}>
                                  +{formatCOP(opt.price_addition)}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Tint */}
                      <div className="space-y-4">
                        <h4
                          className={
                            dmSans.className +
                            ' text-xs font-bold tracking-widest text-[#8A6A2F] uppercase'
                          }
                        >
                          Tinte
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {tints.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelection((prev) => ({ ...prev, tint: opt }))}
                              className={cn(
                                'rounded-xl border p-4 text-left transition-all',
                                selection.tint?.id === opt.id
                                  ? 'border-[#D4A853] bg-[#FFF9EE]'
                                  : 'border-[#E6DECF] hover:border-[#D4A853]'
                              )}
                            >
                              <p className={dmSans.className + ' text-sm font-bold'}>{opt.name}</p>
                              <p className={dmSans.className + ' mt-1 text-xs text-[#8A6A2F]'}>
                                +{formatCOP(opt.price_addition)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Thickness */}
                      <div className="space-y-4">
                        <h4
                          className={
                            dmSans.className +
                            ' text-xs font-bold tracking-widest text-[#8A6A2F] uppercase'
                          }
                        >
                          Grosor
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {thicknesses.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelection((prev) => ({ ...prev, thickness: opt }))}
                              className={cn(
                                'rounded-xl border p-4 text-left transition-all',
                                selection.thickness?.id === opt.id
                                  ? 'border-[#D4A853] bg-[#FFF9EE]'
                                  : 'border-[#E6DECF] hover:border-[#D4A853]'
                              )}
                            >
                              <p className={dmSans.className + ' text-sm font-bold'}>{opt.name}</p>
                              <p className={dmSans.className + ' mt-1 text-xs text-[#8A6A2F]'}>
                                +{formatCOP(opt.price_addition)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 'prescription' && (
                <div className="space-y-10">
                  <header>
                    <h2
                      className={
                        playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'
                      }
                    >
                      Tu fórmula oftálmica
                    </h2>
                    <p className={dmSans.className + ' mt-2 text-[#66665F]'}>
                      Ingresa los datos de tu prescripción médica.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        key: 'manual' as const,
                        title: 'Diligenciar ahora',
                        copy: 'Tengo mi fórmula a la mano.',
                      },
                      {
                        key: 'upload' as const,
                        title: 'Subir imagen',
                        copy: 'Adjunto foto de la fórmula.',
                      },
                      {
                        key: 'pending' as const,
                        title: 'Enviar después',
                        copy: 'La comparto luego por WhatsApp.',
                      },
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setPrescription((p) => ({ ...p, mode: m.key }))}
                        className={cn(
                          'rounded-xl border p-5 text-left transition-all',
                          prescription.mode === m.key
                            ? 'border-[#D4A853] bg-[#FFF9EE]'
                            : 'border-[#E6DECF] hover:border-[#D4A853]'
                        )}
                      >
                        <p className={dmSans.className + ' text-sm font-bold'}>{m.title}</p>
                        <p className={dmSans.className + ' mt-1 text-xs text-[#66665F]'}>
                          {m.copy}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[#E6DECF] bg-[#FCFBF8] p-6 lg:p-8">
                    {prescription.mode === 'manual' && (
                      <div className="space-y-8">
                        <div className="grid gap-8 xl:grid-cols-2">
                          {['rightEye', 'leftEye'].map((eye) => (
                            <div key={eye} className="space-y-4">
                              <p className={dmSans.className + ' text-sm font-bold text-[#0F0F0D]'}>
                                {eye === 'rightEye' ? 'Ojo derecho (OD)' : 'Ojo izquierdo (OI)'}
                              </p>
                              <div className="grid grid-cols-3 gap-4">
                                {['sphere', 'cylinder', 'axis'].map((field) => (
                                  <div key={field} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-wider text-[#8A6A2F] uppercase">
                                      {field === 'sphere'
                                        ? 'Esfera'
                                        : field === 'cylinder'
                                          ? 'Cilindro'
                                          : 'Eje'}
                                    </Label>
                                    <Input
                                      value={
                                        (prescription[eye as 'rightEye' | 'leftEye'] as any)[
                                          field
                                        ] ?? ''
                                      }
                                      onChange={(e) =>
                                        updatePrescription(eye as any, field as any, e.target.value)
                                      }
                                      placeholder="0.00"
                                      className="rounded-lg border-[#DCCFB9] bg-white text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold tracking-wider text-[#8A6A2F] uppercase">
                              Distancia Pupilar (PD)
                            </Label>
                            <Input
                              value={prescription.pd ?? ''}
                              onChange={(e) =>
                                setPrescription((p) => ({ ...p, pd: e.target.value }))
                              }
                              placeholder="62"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold tracking-wider text-[#8A6A2F] uppercase">
                              Adición
                            </Label>
                            <Input
                              value={prescription.addPower ?? ''}
                              onChange={(e) =>
                                setPrescription((p) => ({ ...p, addPower: e.target.value }))
                              }
                              placeholder="+1.50"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {prescription.mode === 'upload' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Imagen de la fórmula</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePrescriptionUpload(e.target.files?.[0] ?? null)}
                            disabled={isUploadingPrescription}
                            className="h-auto py-2"
                          />
                        </div>
                        {prescription.imageFileName && (
                          <div className="flex items-center gap-2 text-sm text-[#0F0F0D]">
                            <Check size={16} className="text-green-600" />
                            <span>{prescription.imageFileName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {prescription.mode === 'pending' && (
                      <p className={dmSans.className + ' text-sm leading-relaxed text-[#66665F]'}>
                        No te preocupes, puedes continuar con tu compra y enviarnos una foto de tu
                        fórmula por WhatsApp. Un asesor te contactará para confirmar los detalles.
                      </p>
                    )}

                    {(prescription.mode === 'manual' || prescription.mode === 'upload') && (
                      <div className="mt-8 border-t border-[#E6DECF] pt-8">
                        <label className="flex items-start gap-4">
                          <Checkbox
                            checked={prescription.legalConsent}
                            onCheckedChange={(val) =>
                              setPrescription((p) => ({ ...p, legalConsent: !!val }))
                            }
                            className="mt-1"
                          />
                          <span className={dmSans.className + ' text-xs leading-5 text-[#66665F]'}>
                            Autorizo el tratamiento de mis datos de salud y confirmo que la
                            información proporcionada es correcta según mi prescripción médica.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'summary' && (
                <div className="space-y-10">
                  <header>
                    <h2
                      className={
                        playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'
                      }
                    >
                      Resumen de configuración
                    </h2>
                    <p className={dmSans.className + ' mt-2 text-[#66665F]'}>
                      Verifica los detalles antes de agregar al carrito.
                    </p>
                  </header>

                  <div className="divide-y divide-[#E6DECF] rounded-2xl border border-[#E6DECF] bg-[#F4EEE1]/30">
                    <div className="p-6 lg:p-8">
                      <p
                        className={
                          dmSans.className +
                          ' text-[10px] font-bold tracking-widest text-[#8A6A2F] uppercase'
                        }
                      >
                        Montura
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className={dmSans.className + ' font-semibold text-[#0F0F0D]'}>
                          {product.name}
                        </p>
                        <p className={dmSans.className + ' text-sm text-[#0F0F0D]'}>
                          {formatCOP(product.price)}
                        </p>
                      </div>
                    </div>

                    {isLensRequired && (
                      <div className="space-y-4 p-6 lg:p-8">
                        <p
                          className={
                            dmSans.className +
                            ' text-[10px] font-bold tracking-widest text-[#8A6A2F] uppercase'
                          }
                        >
                          Lentes y Tratamientos
                        </p>
                        <ul className="space-y-2">
                          {[
                            {
                              label: 'Tipo',
                              value: selection.type?.name,
                              price: selection.type?.price_addition,
                            },
                            {
                              label: 'Material',
                              value: selection.material?.name,
                              price: selection.material?.price_addition,
                            },
                            ...selection.filters.map((f) => ({
                              label: 'Filtro',
                              value: f.name,
                              price: f.price_addition,
                            })),
                            {
                              label: 'Tinte',
                              value: selection.tint?.name,
                              price: selection.tint?.price_addition,
                            },
                            {
                              label: 'Grosor',
                              value: selection.thickness?.name,
                              price: selection.thickness?.price_addition,
                            },
                          ]
                            .filter((i) => i.value)
                            .map((item, idx) => (
                              <li key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-[#66665F]">
                                  {item.label}: {item.value}
                                </span>
                                <span className="font-medium text-[#0F0F0D]">
                                  {item.price ? `+ ${formatCOP(item.price)}` : 'Incluido'}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-6 lg:p-8">
                      <p
                        className={
                          dmSans.className +
                          ' text-[10px] font-bold tracking-widest text-[#8A6A2F] uppercase'
                        }
                      >
                        Fórmula
                      </p>
                      <p className={dmSans.className + ' mt-2 text-sm text-[#0F0F0D]'}>
                        {prescription.mode === 'manual'
                          ? 'Ingreso manual'
                          : prescription.mode === 'upload'
                            ? 'Archivo adjunto'
                            : 'Envío posterior'}
                      </p>
                    </div>

                    <div className="bg-[#F4EEE1] p-6 lg:p-8">
                      <div className="flex items-center justify-between">
                        <p
                          className={
                            playfairDisplay.className + ' text-xl font-bold text-[#0F0F0D]'
                          }
                        >
                          Total
                        </p>
                        <p
                          className={
                            playfairDisplay.className + ' text-2xl font-bold text-[#8A6A2F]'
                          }
                        >
                          {formatCOP(finalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-[#E6DECF] bg-white p-6 lg:px-10">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (step === 'prescription') setStep('lenses')
                    if (step === 'summary') setStep('prescription')
                  }}
                  className={cn(
                    'rounded-full px-6 text-[#8A6A2F] hover:bg-[#F4EEE1]',
                    step === 'lenses' && 'invisible'
                  )}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>

                {step !== 'summary' ? (
                  <Button
                    onClick={() => {
                      if (step === 'lenses') setStep('prescription')
                      else if (step === 'prescription') setStep('summary')
                    }}
                    disabled={step === 'lenses' && isLensRequired && !selection.type}
                    className="rounded-full bg-[#0F0F0D] px-10 text-white hover:bg-[#2C2C26]"
                  >
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    className="rounded-full bg-[#D4A853] px-12 font-bold text-[#0F0F0D] hover:bg-[#C79D4C]"
                  >
                    Agregar al carrito
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
