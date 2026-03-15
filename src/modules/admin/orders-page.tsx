'use client'

import { useState } from 'react'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { toast } from 'sonner'

import { updateOrderStatusAction } from '@/actions/orders.actions'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready',
  'delivered',
  'cancelled',
]

const STATUS_FILTERS = ['todos', ...ALL_STATUSES] as const

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

type AdminOrdersPageProps = {
  orders: Order[]
}

export function AdminOrdersPage({ orders: initialOrders }: AdminOrdersPageProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered =
    statusFilter === 'todos' ? orders : orders.filter((o) => o.status === statusFilter)

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId)
    const result = await updateOrderStatusAction(orderId, newStatus)
    if (result.success && result.data) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
      toast.success('Estado actualizado')
    } else {
      toast.error(result.error ?? 'Error al actualizar estado')
    }
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
          Pedidos
        </h1>
        <p className={cn(dmSans.className, 'text-sm text-[#6E6E67]')}>{filtered.length} pedidos</p>
      </header>

      {/* Filter tabs */}
      <div className={cn(dmSans.className, 'flex flex-wrap gap-2')}>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
              statusFilter === status
                ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                : 'border-[#E2DDD6] bg-white text-[#6E6E67] hover:border-[#0F0F0D]'
            )}
          >
            {status === 'todos' ? 'Todos' : (STATUS_LABELS[status] ?? status)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E8E2D8] bg-white">
        <table className={cn(dmSans.className, 'min-w-full text-sm')}>
          <thead>
            <tr className="border-b border-[#ECE7DE] text-left text-[#6F6F67]">
              <th className="px-4 py-3"># Orden</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[#6E6E67]">
                  No hay pedidos en esta categoría.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-[#F3EFE7] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#151510]">{order.order_number}</td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 text-[#6E6E67]">{order.customer_phone}</td>
                  <td className="px-4 py-3">{formatCOP(Number(order.total ?? 0))}</td>
                  <td className="px-4 py-3 capitalize text-[#6E6E67]">{order.channel}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        'border',
                        STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#66665F]">
                    {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                      disabled={updating === order.id}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
