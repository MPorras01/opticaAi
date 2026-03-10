'use server'

import { revalidatePath } from 'next/cache'
import {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductsByCategory,
  toggleProductActive,
  updateProduct,
} from '@/lib/repositories/products.repo'
import type {
  Product,
  ProductFilters,
  ProductInsert,
  ProductWithCategory,
  ProductUpdate,
} from '@/types'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
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

export async function createProductAction(input: ProductInsert): Promise<ActionResult<Product>> {
  try {
    const data = await createProduct(input)

    revalidatePath('/')
    revalidatePath('/admin/productos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProductAction(
  id: string,
  input: ProductUpdate
): Promise<ActionResult<Product>> {
  try {
    const data = await updateProduct(id, input)

    revalidatePath('/')
    revalidatePath('/admin/productos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function toggleProductActiveAction(id: string): Promise<ActionResult<Product>> {
  try {
    const data = await toggleProductActive(id)

    revalidatePath('/')
    revalidatePath('/admin/productos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
