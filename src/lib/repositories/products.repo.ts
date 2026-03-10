import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type {
  Product,
  ProductFilters,
  ProductInsert,
  ProductUpdate,
  ProductWithCategory,
} from '@/types'

const PRODUCT_WITH_CATEGORY_SELECT = '*, categories(*)'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

/** Retrieves active products with optional catalog filters. */
export async function getProducts(filters?: ProductFilters): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createServerClient()

    const useInnerCategory = Boolean(filters?.categorySlug)
    const selectClause = useInnerCategory ? '*, categories!inner(*)' : PRODUCT_WITH_CATEGORY_SELECT

    let query = supabase
      .from('products')
      .select(selectClause)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filters?.categorySlug) {
      query = query.eq('categories.slug', filters.categorySlug)
    }

    if (filters?.gender) {
      query = query.eq('gender', filters.gender)
    }

    if (typeof filters?.minPrice === 'number') {
      query = query.gte('price', filters.minPrice)
    }

    if (typeof filters?.maxPrice === 'number') {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters?.frameShape) {
      query = query.eq('frame_shape', filters.frameShape)
    }

    if (filters?.hasArOverlay) {
      query = query.eq('has_ar_overlay', true)
    }

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.trim().replace(/,/g, '')
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data ?? []) as ProductWithCategory[]
  } catch (error) {
    throw new Error(`No se pudieron obtener productos: ${getErrorMessage(error)}`)
  }
}

/** Retrieves a single product by slug including its category. */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_WITH_CATEGORY_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Producto no encontrado')
    }

    return data as ProductWithCategory
  } catch (error) {
    if (error instanceof Error && error.message === 'Producto no encontrado') {
      throw error
    }

    throw new Error(`No se pudo obtener el producto por slug: ${getErrorMessage(error)}`)
  }
}

/** Retrieves active products for a category with optional limit. */
export async function getProductsByCategory(
  categorySlug: string,
  limit = 8
): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('products')
      .select('*, categories!inner(*)')
      .eq('categories.slug', categorySlug)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data ?? []) as ProductWithCategory[]
  } catch (error) {
    throw new Error(`No se pudieron obtener productos por categoria: ${getErrorMessage(error)}`)
  }
}

/** Retrieves latest active products as featured items. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data ?? []) as Product[]
  } catch (error) {
    throw new Error(`No se pudieron obtener productos destacados: ${getErrorMessage(error)}`)
  }
}

/** Retrieves related active products by category excluding current product. */
export async function getRelatedProducts(
  productId: string,
  categoryId: string
): Promise<Product[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .neq('id', productId)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      throw error
    }

    return (data ?? []) as Product[]
  } catch (error) {
    throw new Error(`No se pudieron obtener productos relacionados: ${getErrorMessage(error)}`)
  }
}

/** Creates a new product using admin privileges. */
export async function createProduct(data: ProductInsert): Promise<Product> {
  try {
    const supabase = createAdminClient()

    const { data: created, error } = await supabase
      .from('products')
      .insert(data)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return created as Product
  } catch (error) {
    throw new Error(`No se pudo crear el producto: ${getErrorMessage(error)}`)
  }
}

/** Updates a product by id using admin privileges. */
export async function updateProduct(id: string, data: ProductUpdate): Promise<Product> {
  try {
    const supabase = createAdminClient()

    const { data: updated, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return updated as Product
  } catch (error) {
    throw new Error(`No se pudo actualizar el producto: ${getErrorMessage(error)}`)
  }
}

/** Toggles is_active state for a product using admin privileges. */
export async function toggleProductActive(id: string): Promise<Product> {
  try {
    const supabase = createAdminClient()

    const { data: current, error: readError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', id)
      .single()

    if (readError) {
      throw readError
    }

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    return updated as Product
  } catch (error) {
    throw new Error(`No se pudo alternar el estado del producto: ${getErrorMessage(error)}`)
  }
}
