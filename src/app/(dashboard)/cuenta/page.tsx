import { redirect } from 'next/navigation'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { getOrdersByCustomer } from '@/lib/repositories/orders.repo'
import type { OrderWithItems } from '@/types'
import { AccountPage } from '@dashboard/account-page'

export const metadata = { title: 'Mi cuenta · OpticaAI' }

export default async function CuentaRoute() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/cuenta')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const orders: OrderWithItems[] = await getOrdersByCustomer(user.id).catch(() => [])

  return (
    <AccountPage
      fullName={profile?.full_name ?? null}
      email={user.email ?? ''}
      phone={profile?.phone ?? null}
      orders={orders}
    />
  )
}
