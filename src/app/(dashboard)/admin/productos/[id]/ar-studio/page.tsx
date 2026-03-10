import { redirect } from 'next/navigation'

import { updateProductArCalibrationAction } from '@/actions/products.actions'
import type { FitProfileKey } from '@/config/ar.config'
import { getProductById } from '@/lib/repositories/products.repo'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ArStudio } from '@/modules/admin/ar-studio'

type Params = Promise<{ id: string }>

type ArCalibrationInput = {
  ar_fit_profile: FitProfileKey
  ar_width_adjustment: number
  ar_vertical_adjustment: number
}

async function ensureAdmin() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin/productos')
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

export default async function ProductArStudioPage({ params }: { params: Params }) {
  await ensureAdmin()

  const { id } = await params
  const product = await getProductById(id)

  if (!product.ar_overlay_url) {
    redirect(`/admin/productos/${id}/editar?error=Primero+sube+la+imagen+AR+del+producto`)
  }

  const supabase = createAdminClient()
  const { data: others } = await supabase
    .from('products')
    .select('id, name, ar_fit_profile, ar_width_adjustment, ar_vertical_adjustment')
    .neq('id', id)
    .eq('is_active', true)
    .limit(50)

  async function updateArCalibration(productId: string, data: ArCalibrationInput) {
    'use server'

    const result = await updateProductArCalibrationAction(productId, data)
    return {
      success: result.success,
      error: result.error,
    }
  }

  return (
    <ArStudio
      product={product}
      referenceProducts={others ?? []}
      updateArCalibration={updateArCalibration}
    />
  )
}
