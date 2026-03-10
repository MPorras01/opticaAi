'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createProductAction, updateProductAction, validateArPng } from '@/actions/products.actions'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Category, ProductWithCategory } from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

const materialOptions = ['acetato', 'metal', 'titanio', 'tr90', 'mixto'] as const
const frameShapeOptions = [
  'rectangular',
  'redonda',
  'cuadrada',
  'aviador',
  'cat-eye',
  'ovalada',
  'hexagonal',
] as const
const genderOptions = ['hombre', 'mujer', 'unisex', 'ninos'] as const
const fitProfileOptions = ['FULL_FRAME', 'SEMI_RIMLESS', 'RIMLESS', 'OVERSIZED', 'SPORTS'] as const

const ProductFormSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  price: z.number().min(1000),
  compare_at_price: z.number().optional(),
  stock: z.number().int().min(0),
  brand: z.string().optional(),
  color: z.string().optional(),
  material: z.enum(materialOptions).optional(),
  frame_shape: z.enum(frameShapeOptions).optional(),
  gender: z.enum(genderOptions).optional(),
  category_id: z.string().uuid(),
  is_active: z.boolean(),
  has_ar_overlay: z.boolean(),
  ar_fit_profile: z.enum(fitProfileOptions),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
})

type ProductFormValues = z.input<typeof ProductFormSchema>
type ProductFormOutput = z.output<typeof ProductFormSchema>

type FilePreview = { file: File; preview: string }

type ArChecks = {
  isPng: boolean
  hasTransparency: boolean
  minResolution: boolean
  ratioOk: boolean
  centered: boolean
  width: number
  height: number
  sizeBytes: number
  score: number
  issues: string[]
}

type ProductFormProps = {
  product?: ProductWithCategory
  categories: Category[]
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number.parseInt(digits, 10) : 0
}

function formatCurrencyInput(value: number): string {
  if (!value) return ''
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function emptyArChecks(): ArChecks {
  return {
    isPng: false,
    hasTransparency: false,
    minResolution: false,
    ratioOk: false,
    centered: false,
    width: 0,
    height: 0,
    sizeBytes: 0,
    score: 0,
    issues: [],
  }
}

async function toDataUrl(file: File): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('No se pudo leer archivo'))
    reader.readAsDataURL(file)
  })
}

async function analyzeAr(file: File): Promise<ArChecks> {
  const checks = emptyArChecks()
  checks.isPng = file.type === 'image/png'
  checks.sizeBytes = file.size

  const dataUrl = await toDataUrl(file)
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('No se pudo cargar PNG'))
    image.src = dataUrl
  })

  checks.width = image.width
  checks.height = image.height
  checks.minResolution = image.width >= 400 && image.height >= 160
  const ratio = image.width / Math.max(1, image.height)
  checks.ratioOk = ratio >= 2 && ratio <= 3

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return checks

  ctx.drawImage(image, 0, 0)
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data
  let transparent = 0
  let minX = image.width
  let maxX = 0
  let hasOpaque = false

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3]
    if (alpha < 250) transparent += 1
    if (alpha > 20) {
      hasOpaque = true
      const idx = i / 4
      const x = idx % image.width
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
    }
  }

  checks.hasTransparency = transparent / Math.max(1, image.width * image.height) > 0.05
  if (hasOpaque) {
    const center = (minX + maxX) / 2
    checks.centered = Math.abs(center - image.width / 2) / image.width <= 0.12
  }

  const passed = [
    checks.isPng,
    checks.hasTransparency,
    checks.minResolution,
    checks.ratioOk,
    checks.centered,
  ].filter(Boolean).length
  checks.score = Math.round((passed / 5) * 100)

  const remote = await validateArPng(dataUrl)
  checks.score = Math.round(checks.score * 0.7 + remote.score * 0.3)
  checks.issues = remote.issues

  return checks
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'draft' | 'publish'>('publish')
  const [slugLocked, setSlugLocked] = useState(false)
  const [images, setImages] = useState<FilePreview[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [arFile, setArFile] = useState<File | null>(null)
  const [arPreview, setArPreview] = useState(product?.ar_overlay_url ?? '')
  const [arChecks, setArChecks] = useState<ArChecks>(emptyArChecks())
  const [checkingAr, setCheckingAr] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const draftKey = product ? `product-${product.id}` : 'product-new'
  const autosaveRef = useRef<number | null>(null)

  const [priceInput, setPriceInput] = useState(formatCurrencyInput(Number(product?.price ?? 0)))
  const [comparePriceInput, setComparePriceInput] = useState(
    formatCurrencyInput(Number(product?.compare_at_price ?? 0))
  )

  const form = useForm<ProductFormValues, undefined, ProductFormOutput>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      price: Number(product?.price ?? 0),
      compare_at_price: Number(product?.compare_at_price ?? 0) || undefined,
      stock: Number(product?.stock ?? 0),
      brand: product?.brand ?? '',
      color: product?.color ?? '',
      material: (product?.material as ProductFormValues['material']) ?? undefined,
      frame_shape: (product?.frame_shape as ProductFormValues['frame_shape']) ?? undefined,
      gender: (product?.gender as ProductFormValues['gender']) ?? undefined,
      category_id: product?.category_id ?? '',
      is_active: Boolean(product?.is_active ?? true),
      has_ar_overlay: Boolean(product?.has_ar_overlay ?? false),
      ar_fit_profile:
        (product?.ar_fit_profile as ProductFormValues['ar_fit_profile']) ?? 'FULL_FRAME',
      meta_title: String((product?.metadata as { meta_title?: string } | null)?.meta_title ?? ''),
      meta_description: String(
        (product?.metadata as { meta_description?: string } | null)?.meta_description ?? ''
      ),
    },
  })

  const name = form.watch('name')
  const description = form.watch('description')
  const metaTitle = form.watch('meta_title')
  const metaDescription = form.watch('meta_description')
  const hasArEnabled = form.watch('has_ar_overlay')

  useEffect(() => {
    if (!name || slugLocked) return
    form.setValue('slug', slugify(name), { shouldValidate: true })
  }, [form, name, slugLocked])

  useEffect(() => {
    if (product) return
    const raw = window.localStorage.getItem(draftKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as ProductFormValues & {
        priceInput?: string
        comparePriceInput?: string
      }
      form.reset(draft)
      setPriceInput(draft.priceInput ?? '')
      setComparePriceInput(draft.comparePriceInput ?? '')
    } catch {
      // Ignore invalid draft payloads.
    }
  }, [draftKey, form, product])

  useEffect(() => {
    autosaveRef.current = window.setInterval(() => {
      if (product) return
      const payload = {
        ...form.getValues(),
        priceInput,
        comparePriceInput,
      }
      window.localStorage.setItem(draftKey, JSON.stringify(payload))
    }, 30000)

    return () => {
      if (autosaveRef.current) window.clearInterval(autosaveRef.current)
    }
  }, [comparePriceInput, draftKey, form, priceInput, product])

  const addImages = (filesList: FileList | null) => {
    if (!filesList) return
    const files = Array.from(filesList).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    if (!files.length) {
      toast.error('Solo JPG, PNG o WEBP')
      return
    }

    setImages((prev) => {
      const merged = [...prev]
      for (const file of files) {
        if (merged.length >= 5) break
        merged.push({ file, preview: URL.createObjectURL(file) })
      }
      return merged
    })
  }

  const onArUpload = async (file: File) => {
    if (file.type !== 'image/png') {
      toast.error('Solo PNG para AR')
      return
    }

    setCheckingAr(true)
    setArFile(file)
    setArPreview(URL.createObjectURL(file))

    try {
      const result = await analyzeAr(file)
      setArChecks(result)
      form.setValue('has_ar_overlay', result.score > 40)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo validar PNG')
      setArChecks(emptyArChecks())
      form.setValue('has_ar_overlay', false)
    } finally {
      setCheckingAr(false)
    }
  }

  const quality = useMemo(() => {
    if (arChecks.score <= 40) return { text: 'No apto para AR', bar: 'bg-red-500' }
    if (arChecks.score <= 70) return { text: 'Apto pero mejorable', bar: 'bg-amber-500' }
    return { text: 'Excelente para AR', bar: 'bg-green-500' }
  }, [arChecks.score])

  const onSubmit = (values: ProductFormOutput) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', values.name)
      fd.set('slug', values.slug)
      fd.set('description', values.description)
      fd.set('price', String(values.price))
      fd.set('compare_at_price', String(values.compare_at_price ?? ''))
      fd.set('stock', String(values.stock))
      fd.set('brand', values.brand ?? '')
      fd.set('color', values.color ?? '')
      fd.set('material', values.material ?? '')
      fd.set('frame_shape', values.frame_shape ?? '')
      fd.set('gender', values.gender ?? '')
      fd.set('category_id', values.category_id)
      fd.set('is_active', mode === 'publish' ? 'true' : 'false')
      fd.set('has_ar_overlay', values.has_ar_overlay ? 'true' : 'false')
      fd.set('ar_fit_profile', values.ar_fit_profile)
      fd.set('meta_title', values.meta_title ?? '')
      fd.set('meta_description', values.meta_description ?? '')

      for (const image of images) {
        fd.append('images', image.file)
      }
      if (arFile) fd.set('ar_overlay', arFile)

      const result = product
        ? await updateProductAction(product.id, fd)
        : await createProductAction(fd)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo guardar')
        return
      }

      if (!product) window.localStorage.removeItem(draftKey)
      toast.success(mode === 'publish' ? 'Producto publicado' : 'Borrador guardado')
      router.push('/admin/productos')
      router.refresh()
    })
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <Tabs defaultValue="basica">
        <TabsList variant="line" className="border-b border-[#E8E2D8] p-0">
          <TabsTrigger value="basica" className="rounded-none px-4 py-2.5 text-sm">
            Informacion basica
          </TabsTrigger>
          <TabsTrigger value="imagenes" className="rounded-none px-4 py-2.5 text-sm">
            Imagenes del producto
          </TabsTrigger>
          <TabsTrigger value="ar" className="rounded-none px-4 py-2.5 text-sm">
            Probador Virtual AR
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-none px-4 py-2.5 text-sm">
            SEO y Metadata
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="basica"
          className="space-y-4 rounded-xl border border-[#E8E2D8] bg-white p-5"
        >
          <div className="space-y-2">
            <Label>Nombre del producto</Label>
            <Input {...form.register('name')} />
          </div>

          <div className="space-y-2">
            <Label>Slug (editable)</Label>
            <Input
              {...form.register('slug')}
              onChange={(event) => {
                setSlugLocked(true)
                form.setValue('slug', slugify(event.target.value), { shouldValidate: true })
              }}
            />
            <p className="text-xs text-[#6F6A61]">/{form.watch('slug') || 'slug-del-producto'}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Descripcion</Label>
              <span className="text-xs text-[#6F6A61]">{description.length}/1000</span>
            </div>
            <Textarea rows={4} {...form.register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={form.watch('category_id') || ''}
              onValueChange={(value) => {
                if (value) form.setValue('category_id', value, { shouldValidate: true })
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input {...form.register('brand')} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input {...form.register('color')} />
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Select
                value={form.watch('material') ?? 'none'}
                onValueChange={(value) =>
                  form.setValue(
                    'material',
                    value === 'none' ? undefined : (value as ProductFormValues['material'])
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin definir</SelectItem>
                  {materialOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Forma de montura</Label>
              <Select
                value={form.watch('frame_shape') ?? 'none'}
                onValueChange={(value) =>
                  form.setValue(
                    'frame_shape',
                    value === 'none' ? undefined : (value as ProductFormValues['frame_shape'])
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin definir</SelectItem>
                  {frameShapeOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Genero</Label>
              <Select
                value={form.watch('gender') ?? 'none'}
                onValueChange={(value) =>
                  form.setValue(
                    'gender',
                    value === 'none' ? undefined : (value as ProductFormValues['gender'])
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin definir</SelectItem>
                  {genderOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Precio COP</Label>
              <Input
                value={priceInput}
                onChange={(event) => {
                  const num = parseCurrencyInput(event.target.value)
                  form.setValue('price', num, { shouldValidate: true })
                  setPriceInput(formatCurrencyInput(num))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio comparacion COP</Label>
              <Input
                value={comparePriceInput}
                onChange={(event) => {
                  const num = parseCurrencyInput(event.target.value)
                  form.setValue('compare_at_price', num || undefined)
                  setComparePriceInput(formatCurrencyInput(num))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" min={0} {...form.register('stock', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#ECE4D8] bg-[#FBF9F4] p-3">
            <div>
              <p className="text-sm font-medium">Producto activo</p>
              <p className="text-xs text-[#706A61]">Visible en catalogo</p>
            </div>
            <Switch
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="imagenes"
          className="space-y-4 rounded-xl border border-[#E8E2D8] bg-white p-5"
        >
          <Card
            className="cursor-pointer border-dashed border-[#D8D1C7] bg-[#FCFAF6] p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              addImages(e.dataTransfer.files)
            }}
            onClick={() => document.getElementById('images-input')?.click()}
          >
            <input
              id="images-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addImages(e.target.files)}
            />
            <Upload className="mx-auto size-8 text-[#9B958A]" />
            <p className="mt-2 text-sm font-medium">Drag and drop o click para subir</p>
            <p className="text-xs text-[#726C63]">Maximo 5 imagenes</p>
          </Card>

          <p className="text-xs text-[#6F6A61]">
            La primera imagen es la imagen principal del producto.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={`${image.file.name}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-[#E9E2D7]"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return
                  setImages((prev) => {
                    const clone = [...prev]
                    const [moved] = clone.splice(dragIndex, 1)
                    clone.splice(index, 0, moved)
                    return clone
                  })
                  setDragIndex(null)
                }}
              >
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className="h-36 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white"
                >
                  <X className="size-3" />
                </button>
                <button
                  type="button"
                  className="absolute top-2 left-2 rounded-full bg-white/85 p-1 text-[#4F4A42]"
                >
                  <GripVertical className="size-3" />
                </button>
                {index === 0 ? (
                  <Badge className="absolute bottom-2 left-2 bg-[#D4A853] text-black">
                    Principal
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ar" className="rounded-xl border border-[#E8E2D8] bg-white p-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4">
              <Card className="border-[#E9D198] bg-[#FFF8E7] p-4">
                <h3 className={cn(playfairDisplay.className, 'text-2xl font-semibold')}>
                  Imagen para Probador Virtual
                </h3>
                <p className="mt-1 text-sm text-[#6D665B]">
                  Esta imagen se superpondra sobre la cara del cliente.
                </p>

                <div
                  className="mt-4 cursor-pointer rounded-lg border border-dashed border-[#D0B97F] bg-white p-4 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) onArUpload(file)
                  }}
                  onClick={() => document.getElementById('ar-input')?.click()}
                >
                  <input
                    id="ar-input"
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onArUpload(file)
                    }}
                  />
                  <ImagePlus className="mx-auto size-7 text-[#A79059]" />
                  <p className="mt-2 text-sm font-medium">Suelta un PNG o haz click</p>
                  <p className="text-xs text-[#7B735F]">Solo PNG con transparencia</p>
                </div>

                {checkingAr ? <p className="mt-3 text-sm">Validando PNG...</p> : null}

                {(arFile || arChecks.score > 0) && !checkingAr ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-[#EDDDB6] bg-white p-3">
                    <p className="text-sm font-semibold">Validador visual</p>
                    <ul className="space-y-1 text-sm">
                      {[
                        ['Formato PNG correcto', arChecks.isPng],
                        ['Fondo transparente detectado', arChecks.hasTransparency],
                        ['Resolucion minima (400x160px)', arChecks.minResolution],
                        ['Proporciones correctas (2:1 a 3:1)', arChecks.ratioOk],
                        ['Gafas centradas horizontalmente', arChecks.centered],
                      ].map(([label, ok]) => (
                        <li key={String(label)} className="flex items-center gap-2">
                          {ok ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                          ) : (
                            <AlertCircle className="size-4 text-red-600" />
                          )}
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Score de calidad</span>
                        <span>{arChecks.score}/100</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#E8DED0]">
                        <div
                          className={cn('h-full transition-all', quality.bar)}
                          style={{ width: `${arChecks.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-medium">{quality.text}</p>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="border-[#E8E2D8] bg-[#FCFAF6] p-4">
                <p className="text-sm font-semibold">Recomendaciones</p>
                <ol className="mt-2 space-y-1 text-sm text-[#5D564A]">
                  <li>1. Fotografia frontal sobre fondo blanco puro</li>
                  <li>2. Elimina el fondo en Canva.com</li>
                  <li>3. Centra el puente en el medio exacto</li>
                  <li>4. Exporta PNG con transparencia</li>
                  <li>5. Usa minimo 800x320 px</li>
                </ol>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-[#8A6A2B]"
                  onClick={() => setGuideOpen(true)}
                >
                  Ver guia completa -&gt;
                </button>
              </Card>
            </div>

            <div className="space-y-4">
              {arPreview ? (
                <Card className="p-4">
                  <div
                    className="rounded-lg border border-[#DED7CB] p-3"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #ece7de 25%, transparent 25%), linear-gradient(-45deg, #ece7de 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ece7de 75%), linear-gradient(-45deg, transparent 75%, #ece7de 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  >
                    <img
                      src={arPreview}
                      alt="Preview AR"
                      className="mx-auto max-h-[220px] object-contain"
                    />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-[#5B5448]">
                    <p>
                      Dimensiones: {arChecks.width || '-'} x {arChecks.height || '-'}
                    </p>
                    <p>
                      Tamano:{' '}
                      {arChecks.sizeBytes ? `${(arChecks.sizeBytes / 1024).toFixed(1)} KB` : '-'}
                    </p>
                  </div>

                  <a
                    href={product ? `/admin/productos/${product.id}/ar-studio` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold',
                      product
                        ? 'bg-[#D4A853] text-black'
                        : 'pointer-events-none bg-[#E6E1D7] text-[#857F74]'
                    )}
                  >
                    Probar en el probador virtual -&gt;
                  </a>
                </Card>
              ) : (
                <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed p-6 text-center">
                  <Sparkles className="size-10 text-[#B7B0A4]" />
                  <p className="mt-3 text-sm font-medium text-[#4E473B]">
                    Sube un PNG para ver la previsualizacion
                  </p>
                </Card>
              )}

              <div className="space-y-4 rounded-lg border border-[#E8E2D8] bg-[#FAF8F3] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Activar en el probador virtual</p>
                    <p className="text-xs text-[#6F6A61]">Habilitado si score es mayor a 40</p>
                  </div>
                  <Switch
                    checked={hasArEnabled}
                    disabled={arChecks.score <= 40}
                    onCheckedChange={(checked) => form.setValue('has_ar_overlay', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Perfil de ajuste AR</Label>
                  <div className="space-y-2">
                    {[
                      ['FULL_FRAME', 'Marco completo', 'Para monturas con aro completo'],
                      ['SEMI_RIMLESS', 'Semi sin aro', 'Marco solo arriba'],
                      ['RIMLESS', 'Sin aro', 'Solo cristales con puente'],
                      ['OVERSIZED', 'Oversized', 'Gafas grandes, efecto fashion'],
                      ['SPORTS', 'Deportivas', 'Wraparound, ciclismo'],
                    ].map(([value, title, description]) => {
                      const selected = form.watch('ar_fit_profile') === value
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            form.setValue(
                              'ar_fit_profile',
                              value as ProductFormValues['ar_fit_profile']
                            )
                          }
                          className={cn(
                            'w-full rounded-md border px-3 py-2 text-left',
                            selected ? 'border-[#D4A853] bg-[#FFF8E7]' : 'border-[#E4DED2] bg-white'
                          )}
                        >
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="text-xs text-[#6E685D]">{description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="seo"
          className="space-y-4 rounded-xl border border-[#E8E2D8] bg-white p-5"
        >
          <div className="space-y-2">
            <Label>Meta titulo</Label>
            <Input {...form.register('meta_title')} placeholder={name || 'Nombre del producto'} />
          </div>

          <div className="space-y-2">
            <Label>Meta descripcion</Label>
            <Textarea rows={4} {...form.register('meta_description')} />
          </div>

          <Card className="space-y-1 border-[#E9E2D7] bg-[#FCFBF7] p-4">
            <p className="text-xs text-[#6B665E]">Preview Google</p>
            <p className="text-[18px] leading-tight text-[#1A0DAB]">
              {(metaTitle || name || 'Producto OpticaAI').slice(0, 70)}
            </p>
            <p className="text-sm text-[#145A32]">
              https://opticaai.com/catalogo/{form.watch('slug')}
            </p>
            <p className="text-sm text-[#4D4B48]">
              {(metaDescription || description || 'Descripcion del producto').slice(0, 160)}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E2D8] bg-white/95 p-3 backdrop-blur">
        <p className="inline-flex items-center gap-1 text-xs text-[#6D675D]">
          <Info className="size-3" />
          Guardado automatico local cada 30 segundos
        </p>

        <div className="flex flex-wrap gap-2">
          {product ? (
            <Link href={`/catalogo/${product.slug}`} target="_blank">
              <Button type="button" variant="outline">
                Ver en tienda
              </Button>
            </Link>
          ) : null}

          <Button
            type="submit"
            variant="outline"
            disabled={isPending}
            onClick={() => setMode('draft')}
          >
            Guardar borrador
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            onClick={() => setMode('publish')}
            className="bg-[#D4A853] text-black hover:bg-[#C79D4C]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Publicar producto'
            )}
          </Button>
        </div>
      </footer>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guia completa para imagenes AR</DialogTitle>
            <DialogDescription>Checklist recomendado para overlays de calidad.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-[#524C41]">
            <p>1. Fotografia frontal sin inclinacion.</p>
            <p>2. Elimina fondo y limpia bordes.</p>
            <p>3. Centra el puente al medio del lienzo.</p>
            <p>4. Mantiene proporcion entre 2:1 y 3:1.</p>
            <p>5. Exporta PNG en alta resolucion.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGuideOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
