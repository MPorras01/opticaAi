import { redirect } from 'next/navigation'

import { updateProductArCalibrationAction } from '@/actions/products.actions'
import { ArCalibrationPage } from '@/modules/dashboard/ar-calibration-page'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/repositories/products.repo'
import type { FitProfileKey } from '@/config/ar.config'

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
    redirect('/dashboard')
  }
}

export default async function AdminArCalibrationRoute({ params }: { params: Params }) {
  await ensureAdmin()

  const { id } = await params
  const product = await getProductById(id)

  async function updateProductArCalibration(id: string, data: ArCalibrationInput) {
    'use server'

    const result = await updateProductArCalibrationAction(id, data)
    return {
      success: result.success,
      error: result.error,
    }
  }

  return (
    <ArCalibrationPage product={product} updateProductArCalibration={updateProductArCalibration} />
  )
}
