import { createClient } from '@/lib/supabase/server'

export type LensOption = {
  id: string
  category: 'type' | 'material' | 'filter' | 'tint' | 'thickness'
  name: string
  description: string | null
  price_addition: number
  is_active: boolean
  sort_order: number
}

const LENS_CATEGORIES = ['type', 'material', 'filter', 'tint', 'thickness'] as const

function isLensCategory(value: string): value is LensOption['category'] {
  return (LENS_CATEGORIES as readonly string[]).includes(value)
}

function toLensOptions(
  rows: Array<Omit<LensOption, 'category'> & { category: string }>
): LensOption[] {
  return rows
    .filter((row): row is Omit<LensOption, 'category'> & { category: LensOption['category'] } =>
      isLensCategory(row.category)
    )
    .map((row) => ({
      ...row,
      category: row.category,
    }))
}

export async function getLensOptions(): Promise<LensOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lens_options')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('sort_order')
  if (error) throw error
  return toLensOptions(data ?? [])
}

export async function getAllLensOptions(): Promise<LensOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lens_options')
    .select('*')
    .order('category')
    .order('sort_order')
  if (error) throw error
  return toLensOptions(data ?? [])
}

export async function upsertLensOption(
  option: Omit<LensOption, 'id'> & { id?: string }
): Promise<LensOption> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('lens_options').upsert(option).select().single()
  if (error) throw error

  if (!isLensCategory(data.category)) {
    throw new Error('Categoria de lente invalida')
  }

  return {
    ...data,
    category: data.category,
  }
}

export async function deleteLensOption(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('lens_options').delete().eq('id', id)
  if (error) throw error
}
