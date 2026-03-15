'use client'

import { useState } from 'react'
import { DM_Sans, Playfair_Display } from 'next/font/google'

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
  created_at: string
  order_count: number
}

type AdminCustomersPageProps = {
  customers: CustomerRow[]
}

export function AdminCustomersPage({ customers }: AdminCustomersPageProps) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          (c.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').includes(search)
      )
    : customers

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
          Clientes
        </h1>
        <p className={cn(dmSans.className, 'text-sm text-[#6E6E67]')}>
          {filtered.length} clientes
        </p>
      </header>

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
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6E6E67]">
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-[#F3EFE7] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#151510]">
                    {customer.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6E6E67]">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-3">{customer.order_count}</td>
                  <td className="px-4 py-3 text-[#66665F]">
                    {new Date(customer.created_at).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
