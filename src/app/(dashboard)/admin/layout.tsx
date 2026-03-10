import { redirect } from 'next/navigation'

import { AdminShell } from '@/components/admin/admin-shell'
import { createClient as createServerClient } from '@/lib/supabase/server'

type AdminLayoutProps = {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/?error=admin_required')
  }

  const adminName = profile.full_name?.trim() || user.email || 'Admin'

  return <AdminShell adminName={adminName}>{children}</AdminShell>
}
