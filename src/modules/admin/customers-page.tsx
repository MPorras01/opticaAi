'use client'

import { useState, useTransition } from 'react'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { updateUserByAdminAction } from '@/actions/auth.actions'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

export type CustomerRow = {
  id: string
  full_name: string | null
  phone: string | null
  city: string | null
  address: string | null
  created_at: string
  order_count: number
}

type AdminCustomersPageProps = {
  customers: CustomerRow[]
}

export function AdminCustomersPage({ customers }: AdminCustomersPageProps) {
  const [rows, setRows] = useState(customers)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', address: '' })
  const [isSaving, startSavingTransition] = useTransition()

  const filtered = search.trim()
    ? rows.filter(
        (c) =>
          (c.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').includes(search)
      )
    : rows

  const startEdit = (customer: CustomerRow) => {
    setMessage(null)
    setError(null)
    setEditingId(customer.id)
    setForm({
      full_name: customer.full_name ?? '',
      phone: customer.phone ?? '',
      city: customer.city ?? '',
      address: customer.address ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ full_name: '', phone: '', city: '', address: '' })
  }

  const saveEdit = () => {
    if (!editingId) return

    setMessage(null)
    setError(null)

    startSavingTransition(async () => {
      const result = await updateUserByAdminAction({
        userId: editingId,
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
        address: form.address,
      })

      if (!result.success) {
        setError(result.error ?? 'No se pudo actualizar el cliente')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                full_name: form.full_name,
                phone: form.phone,
                city: form.city,
                address: form.address,
              }
            : row
        )
      )

      setMessage('Cliente actualizado correctamente')
      cancelEdit()
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
          Clientes
        </h1>
        <p className={cn(dmSans.className, 'text-sm text-[#6E6E67]')}>{filtered.length} clientes</p>
      </header>

      {message ? <p className={cn(dmSans.className, 'text-sm text-green-700')}>{message}</p> : null}
      {error ? <p className={cn(dmSans.className, 'text-sm text-red-600')}>{error}</p> : null}

      <input
        type="search"
        placeholder="Buscar por nombre o teléfono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          dmSans.className,
          'w-full max-w-sm rounded-lg border border-[#E2DDD6] bg-white px-4 py-2 text-sm text-[#0F0F0D] placeholder-[#A8A8A0] outline-none focus:border-[#0F0F0D]'
        )}
      />

      <div className="overflow-x-auto rounded-xl border border-[#E8E2D8] bg-white">
        <table className={cn(dmSans.className, 'min-w-full text-sm')}>
          <thead>
            <tr className="border-b border-[#ECE7DE] text-left text-[#6F6F67]">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Registrado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#6E6E67]">
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => {
                const isEditing = editingId === customer.id

                return (
                  <tr key={customer.id} className="border-b border-[#F3EFE7] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#151510]">
                      {isEditing ? (
                        <input
                          value={form.full_name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, full_name: e.target.value }))
                          }
                          className="w-44 rounded-md border border-[#DAD4CA] px-2 py-1"
                        />
                      ) : (
                        (customer.full_name ?? '—')
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6E6E67]">
                      {isEditing ? (
                        <input
                          value={form.phone}
                          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-32 rounded-md border border-[#DAD4CA] px-2 py-1"
                        />
                      ) : (
                        (customer.phone ?? '—')
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6E6E67]">
                      {isEditing ? (
                        <input
                          value={form.city}
                          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                          className="w-32 rounded-md border border-[#DAD4CA] px-2 py-1"
                        />
                      ) : (
                        (customer.city ?? '—')
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6E6E67]">
                      {isEditing ? (
                        <input
                          value={form.address}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, address: e.target.value }))
                          }
                          className="w-52 rounded-md border border-[#DAD4CA] px-2 py-1"
                        />
                      ) : (
                        (customer.address ?? '—')
                      )}
                    </td>
                    <td className="px-4 py-3">{customer.order_count}</td>
                    <td className="px-4 py-3 text-[#66665F]">
                      {new Date(customer.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="rounded-full bg-[#0F0F0D] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-full border border-[#D8D2C8] bg-white px-3 py-1 text-xs font-semibold text-[#0F0F0D]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(customer)}
                          className="rounded-full border border-[#D8D2C8] bg-white px-3 py-1 text-xs font-semibold text-[#0F0F0D]"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
