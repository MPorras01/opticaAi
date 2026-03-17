import { createClient as createServerClient } from '@/lib/supabase/server'
import { AdminCustomersPage } from '@/modules/admin/customers-page'
import type { CustomerRow } from '@/modules/admin/customers-page'

export const metadata = { title: 'Clientes · Admin · OpticaAI' }

export default async function AdminCustomersRoute() {
  let customers: CustomerRow[] = []

  try {
    const supabase = await createServerClient()

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, city, address, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (profiles && profiles.length > 0) {
      const counts = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', p.id)
          return count ?? 0
        })
      )

      customers = profiles.map((p, i) => ({
        id: p.id,
        full_name: p.full_name ?? null,
        phone: p.phone ?? null,
        city: p.city ?? null,
        address: p.address ?? null,
        created_at: p.created_at,
        order_count: counts[i],
      }))
    }
  } catch {
    customers = []
  }

  return <AdminCustomersPage customers={customers} />
}
