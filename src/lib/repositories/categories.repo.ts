import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Category, CategoryInsert, CategoryUpdate } from '@/types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

async function getReadClient() {
  return createServerClient()
}

/** Retrieves all active categories ordered by name. */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await getReadClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as Category[]
  } catch (error) {
    throw new Error(`No se pudieron obtener categorias: ${getErrorMessage(error)}`)
  }
}

/** Retrieves a category by slug and throws if it does not exist. */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  try {
    const supabase = await getReadClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Categoria no encontrada')
    }

    return data as Category
  } catch (error) {
    if (error instanceof Error && error.message === 'Categoria no encontrada') {
      throw error
    }

    throw new Error(`No se pudo obtener la categoria por slug: ${getErrorMessage(error)}`)
  }
}

/** Creates a category with admin privileges. */
export async function createCategory(data: CategoryInsert): Promise<Category> {
  try {
    const supabase = await createServerClient()

    const { data: created, error } = await supabase
      .from('categories')
      .insert(data)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return created as Category
  } catch (error) {
    throw new Error(`No se pudo crear la categoria: ${getErrorMessage(error)}`)
  }
}

/** Updates a category with admin privileges. */
export async function updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
  try {
    const supabase = await createServerClient()

    const { data: updated, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return updated as Category
  } catch (error) {
    throw new Error(`No se pudo actualizar la categoria: ${getErrorMessage(error)}`)
  }
}
