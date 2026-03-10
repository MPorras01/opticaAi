import { redirect } from 'next/navigation'

import { ProductForm } from '@/modules/admin/product-form'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/repositories/categories.repo'

async function ensureAdmin() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin/productos/nuevo')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }
}

export default async function NewProductPage() {
  await ensureAdmin()
  const categories = await getCategories()

  return <ProductForm categories={categories} />
}
