import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AdminUsersPage, type AdminUserRow } from '@/modules/admin/users-page'

export const metadata = { title: 'Usuarios · Admin · OpticaAI' }

export default async function AdminUsersRoute() {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  const [{ data: profiles }, authUsersResponse] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, role, city, address, created_at')
      .order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ])

  const authUsersById = new Map(
    (authUsersResponse.data.users ?? []).map((authUser) => [authUser.id, authUser])
  )

  const users: AdminUserRow[] = (profiles ?? []).map((profile) => {
    const authUser = authUsersById.get(profile.id)

    return {
      id: profile.id,
      email: authUser?.email ?? 'sin-correo',
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      city: profile.city,
      address: profile.address,
      created_at: profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
    }
  })

  return <AdminUsersPage users={users} />
}
