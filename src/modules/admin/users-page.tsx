'use client'

import { useMemo, useState, useTransition } from 'react'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { createTestUserAction } from '@/actions/auth.actions'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

export type AdminUserRow = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

type AdminUsersPageProps = {
  users: AdminUserRow[]
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO')
}

function statusLabel(user: AdminUserRow) {
  if (!user.email_confirmed_at) return 'Pendiente'
  if (user.last_sign_in_at) return 'Activo'
  return 'Sin ingresar'
}

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) => {
      return [user.email, user.full_name ?? '', user.phone ?? '', user.role]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [search, users])

  const handleCreateTestUser = () => {
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await createTestUserAction()

      if (!result.success || !result.data) {
        setError(result.error ?? 'No se pudo crear el usuario de prueba')
        return
      }

      setMessage(`Usuario de prueba listo: ${result.data.email} / ${result.data.password}`)
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
            Usuarios
          </h1>
          <p className={cn(dmSans.className, 'mt-1 text-sm text-[#6E6E67]')}>
            Gestiona cuentas, visibilidad y accesos administrativos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateTestUser}
          disabled={isPending}
          className="rounded-full bg-[#0F0F0D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? 'Creando...' : 'Crear usuario de prueba'}
        </button>
      </header>

      {message ? <p className={cn(dmSans.className, 'text-sm text-green-700')}>{message}</p> : null}
      {error ? <p className={cn(dmSans.className, 'text-sm text-red-600')}>{error}</p> : null}

      <input
        type="search"
        placeholder="Buscar por correo, nombre, telefono o rol..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          dmSans.className,
          'w-full max-w-md rounded-lg border border-[#E2DDD6] bg-white px-4 py-2 text-sm text-[#0F0F0D] placeholder-[#A8A8A0] outline-none focus:border-[#0F0F0D]'
        )}
      />

      <div className="overflow-x-auto rounded-xl border border-[#E8E2D8] bg-white">
        <table className={cn(dmSans.className, 'min-w-full text-sm')}>
          <thead>
            <tr className="border-b border-[#ECE7DE] text-left text-[#6F6F67]">
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Telefono</th>
              <th className="px-4 py-3">Ultimo acceso</th>
              <th className="px-4 py-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#6E6E67]">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#F3EFE7] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#151510]">{user.email}</td>
                  <td className="px-4 py-3 text-[#151510]">{user.full_name ?? '—'}</td>
                  <td className="px-4 py-3 uppercase">{user.role}</td>
                  <td className="px-4 py-3">{statusLabel(user)}</td>
                  <td className="px-4 py-3 text-[#6E6E67]">{user.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-[#66665F]">{formatDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3 text-[#66665F]">{formatDate(user.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
