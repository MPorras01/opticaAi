'use client'

import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/config/site.config'
import type { OrderWithItems } from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  ready: 'Listo para entrega',
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

type OrderConfirmationPageProps = {
  order: OrderWithItems
}

export function OrderConfirmationPage({ order }: OrderConfirmationPageProps) {
  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')

  const itemLines = order.order_items
    .map(
      (item) =>
        `• ${item.product_name}${item.lens_type ? ` (${item.lens_type})` : ''} × ${item.quantity} — ${formatCOP(Number(item.unit_price) * item.quantity)}`
    )
    .join('\n')

  const whatsappMessage = [
    `Hola OpticaAI! Acabo de hacer el pedido *#${order.order_number}* 🎉`,
    '',
    '🛍️ *Productos:*',
    itemLines,
    '',
    `💰 *Total: ${formatCOP(Number(order.total ?? 0))}*`,
    '',
    '¿Me pueden confirmar la disponibilidad?',
  ].join('\n')

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-[#F0F8F0] text-3xl">
          ✅
        </div>
        <h1
          className={cn(
            playfairDisplay.className,
            'mt-4 text-4xl font-semibold text-[#0F0F0D]'
          )}
        >
          Pedido recibido
        </h1>
        <p className={cn(dmSans.className, 'mt-2 text-[#6E6E67]')}>
          Pedido <strong className="text-[#0F0F0D]">#{order.order_number}</strong>
        </p>
        <div className="mt-3">
          <Badge className={cn(STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800')}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      {/* Order items */}
      <div className="mt-8 space-y-4 rounded-xl border border-[#E2DDD6] bg-white p-6">
        <h2
          className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}
        >
          Detalle del pedido
        </h2>

        <ul className={cn(dmSans.className, 'space-y-3')}>
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-[#0F0F0D]">
                {item.product_name}
                {item.lens_type ? ` (${item.lens_type})` : ''} × {item.quantity}
              </span>
              <span className="font-medium text-[#0F0F0D]">
                {formatCOP(Number(item.unit_price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            dmSans.className,
            'flex justify-between border-t border-[#E2DDD6] pt-4 text-base font-semibold text-[#0F0F0D]'
          )}
        >
          <span>Total</span>
          <span>{formatCOP(Number(order.total ?? 0))}</span>
        </div>
      </div>

      {/* Customer info */}
      <div
        className={cn(
          dmSans.className,
          'mt-4 space-y-1 rounded-xl border border-[#E2DDD6] bg-[#FAFAF8] p-5 text-sm text-[#6E6E67]'
        )}
      >
        <p>
          <strong className="text-[#0F0F0D]">Cliente:</strong> {order.customer_name}
        </p>
        <p>
          <strong className="text-[#0F0F0D]">Teléfono:</strong> {order.customer_phone}
        </p>
        {order.customer_email && (
          <p>
            <strong className="text-[#0F0F0D]">Email:</strong> {order.customer_email}
          </p>
        )}
        {order.delivery_address && (
          <p>
            <strong className="text-[#0F0F0D]">Dirección:</strong> {order.delivery_address}
          </p>
        )}
        {order.notes && (
          <p>
            <strong className="text-[#0F0F0D]">Notas:</strong> {order.notes}
          </p>
        )}
      </div>

      {/* CTAs */}
      <div
        className={cn(
          dmSans.className,
          'mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'
        )}
      >
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1EB958] sm:w-auto"
        >
          <span>💬</span>
          Confirmar por WhatsApp
        </a>
        <Link
          href="/catalogo"
          className="inline-flex w-full items-center justify-center rounded-full border border-[#E2DDD6] px-6 py-3 text-sm font-medium text-[#0F0F0D] transition hover:bg-[#ECE7DD] sm:w-auto"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
