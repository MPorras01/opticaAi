'use server'

import { revalidatePath } from 'next/cache'

import {
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  toggleProductActive,
  updateProductArCalibration,
} from '@/lib/repositories/products.repo'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Product, ProductFilters, ProductWithCategory } from '@/types'
import type { FitProfileKey } from '@/config/ar.config'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ArCalibrationInput = {
  ar_fit_profile: FitProfileKey
  ar_width_adjustment: number
  ar_vertical_adjustment: number
}

type ProductMutationResult = {
  success: boolean
  productId?: string
  slug?: string
  error?: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getFileExtension(file: File): string {
  const explicit = file.name.split('.').pop()?.toLowerCase()
  if (explicit) {
    return explicit
  }

  if (file.type === 'image/png') {
    return 'png'
  }
  if (file.type === 'image/webp') {
    return 'webp'
  }
  return 'jpg'
}

function parseNumeric(value: FormDataEntryValue | null, fallback = 0): number {
  if (typeof value !== 'string') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBoolean(value: FormDataEntryValue | null, fallback = false): boolean {
  if (typeof value !== 'string') {
    return fallback
  }
  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === '1' || normalized === 'on'
}

function storagePathFromPublicUrl(imageUrl: string): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/'
  const markerIndex = imageUrl.indexOf(marker)
  if (markerIndex === -1) {
    return null
  }

  const relative = imageUrl.slice(markerIndex + marker.length)
  const [bucket, ...segments] = relative.split('/')
  const path = segments.join('/')

  if (!bucket || !path) {
    return null
  }

  return { bucket, path }
}

async function ensureAdminUser() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw profileError
  }

  if (profile.role !== 'admin') {
    throw new Error('No autorizado')
  }

  return user
}

export async function uploadProductImage(file: File, productSlug: string): Promise<string> {
  await ensureAdminUser()

  if (!file || file.size === 0) {
    throw new Error('Archivo de imagen invalido')
  }

  const supabaseAdmin = createAdminClient()
  const extension = getFileExtension(file)
  const safeSlug = toSlug(productSlug || 'producto')
  const fileName = `${safeSlug}-${Date.now()}.${extension}`
  const path = `products/${fileName}`

  const { error } = await supabaseAdmin.storage.from('products').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    throw new Error(`No se pudo subir imagen de producto: ${error.message}`)
  }

  const { data } = supabaseAdmin.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadArOverlay(file: File, productSlug: string): Promise<string> {
  await ensureAdminUser()

  if (!file || file.size === 0) {
    throw new Error('Archivo overlay AR invalido')
  }

  if (file.type !== 'image/png') {
    throw new Error('El overlay AR debe ser PNG con fondo transparente')
  }

  const supabaseAdmin = createAdminClient()
  const safeSlug = toSlug(productSlug || 'producto')
  const path = `${safeSlug}-ar-overlay.png`

  const { error } = await supabaseAdmin.storage.from('ar-overlays').upload(path, file, {
    contentType: 'image/png',
    upsert: true,
  })

  if (error) {
    throw new Error(`No se pudo subir overlay AR: ${error.message}`)
  }

  const { data } = supabaseAdmin.storage.from('ar-overlays').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  await ensureAdminUser()

  const parsed = storagePathFromPublicUrl(imageUrl)
  if (!parsed) {
    return
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.storage.from(parsed.bucket).remove([parsed.path])

  if (error) {
    throw new Error(`No se pudo eliminar imagen del storage: ${error.message}`)
  }
}

export async function validateArPng(
  url: string
): Promise<{ isValid: boolean; issues: string[]; score: number }> {
  const issues: string[] = []
  let score = 100

  try {
    let bytes: Buffer
    let contentType = ''

    if (url.startsWith('data:image/png;base64,')) {
      const base64Payload = url.slice('data:image/png;base64,'.length)
      bytes = Buffer.from(base64Payload, 'base64')
      contentType = 'image/png'
    } else {
      const response = await fetch(url)
      if (!response.ok) {
        issues.push(`URL no accesible (HTTP ${response.status})`)
        return { isValid: false, issues, score: 0 }
      }

      contentType = response.headers.get('content-type') ?? ''
      bytes = Buffer.from(await response.arrayBuffer())
    }

    if (!contentType.includes('png') && !url.toLowerCase().includes('.png')) {
      issues.push('El archivo no parece ser PNG')
      score -= 40
    }

    if (bytes.length < 24) {
      issues.push('Archivo PNG invalido o corrupto')
      return { isValid: false, issues, score: 0 }
    }

    const signature = bytes.subarray(0, 8).toString('hex')
    if (signature !== '89504e470d0a1a0a') {
      issues.push('Firma PNG invalida')
      return { isValid: false, issues, score: 0 }
    }

    const width = bytes.readUInt32BE(16)
    const height = bytes.readUInt32BE(20)
    const colorType = bytes.readUInt8(25)
    const ratio = width / Math.max(1, height)
    const hasAlpha = colorType === 4 || colorType === 6 || bytes.includes(Buffer.from('tRNS'))

    if (width < 400 || height < 160) {
      issues.push(`Dimensiones insuficientes (${width}x${height}), minimo 400x160`)
      score -= 35
    }

    if (ratio < 2 || ratio > 3) {
      issues.push(`Proporcion fuera de rango (${ratio.toFixed(2)}), recomendado entre 2:1 y 3:1`)
      score -= 20
    }

    if (!hasAlpha) {
      issues.push('No se detecta canal alpha/transparencia en el PNG')
      score -= 25
    }

    const isValid = issues.length === 0
    return { isValid, issues, score: Math.max(0, score) }
  } catch (error) {
    return {
      isValid: false,
      issues: [getErrorMessage(error)],
      score: 0,
    }
  }
}

export async function createProductAction(formData: FormData): Promise<ProductMutationResult> {
  try {
    await ensureAdminUser()
    const supabaseAdmin = createAdminClient()

    const name = String(formData.get('name') ?? '').trim()
    if (!name) {
      throw new Error('El nombre del producto es obligatorio')
    }

    const slug = toSlug(name)
    const description = String(formData.get('description') ?? '').trim() || null
    const categoryId = String(formData.get('category_id') ?? '').trim() || null

    const imageFiles = formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    const imageUrls: string[] = []
    for (const image of imageFiles) {
      const publicUrl = await uploadProductImage(image, slug)
      imageUrls.push(publicUrl)
    }

    const arOverlayFile = formData.get('ar_overlay')
    let arOverlayUrl: string | null = null
    if (arOverlayFile instanceof File && arOverlayFile.size > 0) {
      arOverlayUrl = await uploadArOverlay(arOverlayFile, slug)
    }

    const payload = {
      name,
      slug,
      description,
      category_id: categoryId,
      price: parseNumeric(formData.get('price'), 0),
      compare_at_price: parseNumeric(formData.get('compare_at_price'), 0) || null,
      stock: parseNumeric(formData.get('stock'), 0),
      brand: String(formData.get('brand') ?? '').trim() || null,
      color: String(formData.get('color') ?? '').trim() || null,
      material: String(formData.get('material') ?? '').trim() || null,
      frame_shape: String(formData.get('frame_shape') ?? '').trim() || null,
      gender: String(formData.get('gender') ?? '').trim() || null,
      is_active: parseBoolean(formData.get('is_active'), true),
      has_ar_overlay: parseBoolean(formData.get('has_ar_overlay'), Boolean(arOverlayUrl)),
      images: imageUrls,
      ar_overlay_url: arOverlayUrl,
      metadata: {},
      ar_fit_profile: (String(formData.get('ar_fit_profile') ?? '').trim() ||
        'FULL_FRAME') as FitProfileKey,
      ar_width_adjustment: parseNumeric(formData.get('ar_width_adjustment'), 1),
      ar_vertical_adjustment: parseNumeric(formData.get('ar_vertical_adjustment'), 0),
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(payload)
      .select('id, slug')
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')

    return {
      success: true,
      productId: data.id,
      slug: data.slug,
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProductAction(
  id: string,
  formData: FormData
): Promise<ProductMutationResult> {
  try {
    await ensureAdminUser()
    const supabaseAdmin = createAdminClient()

    const currentProduct = await getProductById(id)
    const name = String(formData.get('name') ?? currentProduct.name).trim()
    const slug = toSlug(name)

    const imageFiles = formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    let imageUrls = currentProduct.images ?? []

    if (imageFiles.length > 0) {
      for (const oldUrl of imageUrls) {
        await deleteProductImage(oldUrl)
      }

      const uploaded: string[] = []
      for (const image of imageFiles) {
        uploaded.push(await uploadProductImage(image, slug))
      }
      imageUrls = uploaded
    }

    const arOverlayFile = formData.get('ar_overlay')
    let arOverlayUrl = currentProduct.ar_overlay_url
    if (arOverlayFile instanceof File && arOverlayFile.size > 0) {
      arOverlayUrl = await uploadArOverlay(arOverlayFile, slug)
    }

    const payload = {
      name,
      slug,
      description:
        String(formData.get('description') ?? currentProduct.description ?? '').trim() || null,
      category_id:
        String(formData.get('category_id') ?? currentProduct.category_id ?? '').trim() || null,
      price: parseNumeric(formData.get('price'), Number(currentProduct.price ?? 0)),
      compare_at_price:
        parseNumeric(
          formData.get('compare_at_price'),
          Number(currentProduct.compare_at_price ?? 0)
        ) || null,
      stock: parseNumeric(formData.get('stock'), Number(currentProduct.stock ?? 0)),
      brand: String(formData.get('brand') ?? currentProduct.brand ?? '').trim() || null,
      color: String(formData.get('color') ?? currentProduct.color ?? '').trim() || null,
      material: String(formData.get('material') ?? currentProduct.material ?? '').trim() || null,
      frame_shape:
        String(formData.get('frame_shape') ?? currentProduct.frame_shape ?? '').trim() || null,
      gender: String(formData.get('gender') ?? currentProduct.gender ?? '').trim() || null,
      is_active: parseBoolean(formData.get('is_active'), Boolean(currentProduct.is_active)),
      has_ar_overlay: parseBoolean(
        formData.get('has_ar_overlay'),
        Boolean(currentProduct.has_ar_overlay || arOverlayUrl)
      ),
      images: imageUrls,
      ar_overlay_url: arOverlayUrl,
      ar_fit_profile: (String(
        formData.get('ar_fit_profile') ?? currentProduct.ar_fit_profile ?? ''
      ).trim() || 'FULL_FRAME') as FitProfileKey,
      ar_width_adjustment: parseNumeric(
        formData.get('ar_width_adjustment'),
        Number(currentProduct.ar_width_adjustment ?? 1)
      ),
      ar_vertical_adjustment: parseNumeric(
        formData.get('ar_vertical_adjustment'),
        Number(currentProduct.ar_vertical_adjustment ?? 0)
      ),
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('id, slug')
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')
    revalidatePath(`/catalogo/${data.slug}`)

    return {
      success: true,
      productId: data.id,
      slug: data.slug,
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult<null>> {
  try {
    await ensureAdminUser()
    const supabaseAdmin = createAdminClient()

    const currentProduct = await getProductById(id)

    for (const imageUrl of currentProduct.images ?? []) {
      await deleteProductImage(imageUrl)
    }

    if (currentProduct.ar_overlay_url) {
      const parsed = storagePathFromPublicUrl(currentProduct.ar_overlay_url)
      if (parsed) {
        const { error } = await supabaseAdmin.storage.from(parsed.bucket).remove([parsed.path])
        if (error) {
          throw new Error(`No se pudo eliminar overlay AR: ${error.message}`)
        }
      }
    }

    const { error } = await supabaseAdmin.from('products').update({ is_active: false }).eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')

    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function toggleProductActiveAction(id: string): Promise<ActionResult<Product>> {
  try {
    await ensureAdminUser()
    const data = await toggleProductActive(id)

    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getProductsAction(
  filters: ProductFilters = {}
): Promise<ActionResult<ProductWithCategory[]>> {
  try {
    const data = await getProducts(filters)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getProductBySlugAction(
  slug: string
): Promise<ActionResult<ProductWithCategory>> {
  try {
    const data = await getProductBySlug(slug)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getProductByIdAction(id: string): Promise<ActionResult<ProductWithCategory>> {
  try {
    const data = await getProductById(id)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getProductsByCategoryAction(
  categorySlug: string
): Promise<ActionResult<ProductWithCategory[]>> {
  try {
    const data = await getProductsByCategory(categorySlug)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getFeaturedProductsAction(limit = 8): Promise<ActionResult<Product[]>> {
  try {
    const data = await getFeaturedProducts(limit)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProductArCalibrationAction(
  id: string,
  input: ArCalibrationInput
): Promise<ActionResult<Product>> {
  try {
    await ensureAdminUser()

    const data = await updateProductArCalibration(id, input)

    revalidatePath('/admin/productos')
    revalidatePath(`/admin/productos/${id}/calibrar-ar`)
    revalidatePath(`/admin/productos/${id}/ar-studio`)
    revalidatePath('/probador-virtual')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
