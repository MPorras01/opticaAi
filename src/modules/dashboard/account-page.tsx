'use client'

import { useState } from 'react'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { OrderWithItems } from '@/types'

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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-orange-100 text-orange-800',
  ready: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

type AccountPageProps = {
  fullName: string | null
  email: string
  phone: string | null
  orders: OrderWithItems[]
}

export function AccountPage({ fullName, email, phone, orders }: AccountPageProps) {
  const [tab, setTab] = useState<'pedidos' | 'perfil'>('pedidos')

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
        Mi cuenta
      </h1>

      {/* Tab nav */}
      <div className={cn(dmSans.className, 'flex gap-6 border-b border-[#E2DDD6]')}>
        {(['pedidos', 'perfil'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'pb-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-[#0F0F0D] text-[#0F0F0D]'
                : 'text-[#6E6E67] hover:text-[#0F0F0D]'
            )}
          >
            {t === 'pedidos' ? 'Mis pedidos' : 'Mi perfil'}
          </button>
        ))}
      </div>

      {tab === 'pedidos' && (
        <section className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-[#E2DDD6] bg-[#F6F3EE] px-6 py-10 text-center">
              <p className={cn(dmSans.className, 'text-[#6E6E67]')}>
                Aún no has realizado pedidos.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="space-y-3 rounded-xl border border-[#E2DDD6] bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(dmSans.className, 'text-sm font-semibold text-[#0F0F0D]')}
                  >
                    Pedido #{order.order_number}
                  </span>
                  <Badge
                    className={cn(STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800')}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>

                <p className={cn(dmSans.className, 'text-xs text-[#6E6E67]')}>
                  {new Date(order.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                <ul className="space-y-1">
                  {order.order_items.map((item) => (
                    <li
                      key={item.id}
                      className={cn(dmSans.className, 'flex justify-between text-sm')}
                    >
                      <span className="text-[#0F0F0D]">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="text-[#6E6E67]">
                        {formatCOP(Number(item.unit_price) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className={cn(
                    dmSans.className,
                    'flex justify-end border-t border-[#E2DDD6] pt-3 text-sm font-semibold text-[#0F0F0D]'
                  )}
                >
                  Total: {formatCOP(Number(order.total ?? 0))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'perfil' && (
        <section className="space-y-4 rounded-xl border border-[#E2DDD6] bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={dmSans.className}>Nombre completo</Label>
              <Input value={fullName ?? ''} disabled className="bg-[#F6F3EE]" readOnly />
            </div>
            <div className="space-y-1.5">
              <Label className={dmSans.className}>Email</Label>
              <Input value={email} disabled className="bg-[#F6F3EE]" readOnly />
            </div>
            <div className="space-y-1.5">
              <Label className={dmSans.className}>Teléfono</Label>
              <Input value={phone ?? '—'} disabled className="bg-[#F6F3EE]" readOnly />
            </div>
          </div>
          <p className={cn(dmSans.className, 'text-xs text-[#6E6E67]')}>
            Para actualizar tus datos contacta a nuestro equipo.
          </p>
        </section>
      )}
    </div>
  )
}
