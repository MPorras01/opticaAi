import { redirect } from 'next/navigation'

import { ProductForm } from '@/modules/admin/product-form'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/repositories/categories.repo'
import { getProductById } from '@/lib/repositories/products.repo'

async function ensureAdmin() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await ensureAdmin()

  const { id } = await params

  let product
  try {
    product = await getProductById(id)
  } catch {
    redirect('/admin/productos')
  }

  const categories = await getCategories()

  return <ProductForm product={product} categories={categories} />
}
