'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { toast } from 'sonner'

import { createOrderAction } from '@/actions/orders.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import useCartStore from '@/stores/cart.store'
import type { OrderDeliveryType } from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const LENS_LABELS: Record<string, string> = {
  'sin-lente': 'Solo montura',
  monofocal: 'Lente monofocal',
  bifocal: 'Lente bifocal',
  progresivo: 'Lente progresivo',
  solar: 'Lente solar',
}

const WA_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '57').replace(/\D/g, '')

const DELIVERY_OPTIONS = [
  { value: 'pickup' as const, label: 'Recoger en tienda' },
  { value: 'delivery' as const, label: 'Envío a domicilio' },
]

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()

  const [delivery, setDelivery] = useState<OrderDeliveryType>('pickup')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    notes: '',
  })

  const total = getTotal()

  function handleInput(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateForm(): boolean {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error('Nombre y teléfono son requeridos')
      return false
    }
    if (delivery === 'delivery' && !form.delivery_address.trim()) {
      toast.error('Ingresa tu dirección de entrega')
      return false
    }
    if (items.length === 0) {
      toast.error('Tu carrito está vacío')
      return false
    }
    return true
  }

  function handleWhatsApp() {
    if (!validateForm()) return

    const itemLines = items
      .map(
        (item) =>
          `• ${item.name}${item.lensType ? ` (${LENS_LABELS[item.lensType] ?? item.lensType})` : ''} × ${item.quantity} — ${formatCOP(item.price * item.quantity)}`
      )
      .join('\n')

    const lines = [
      'Hola OpticaAI! Me gustaría hacer el siguiente pedido 🛒',
      '',
      `👤 *${form.customer_name.trim()}*`,
      `📱 ${form.customer_phone.trim()}`,
      '',
      '🛍️ *Productos:*',
      itemLines,
      '',
      `📦 *Entrega:* ${delivery === 'pickup' ? 'Recoger en tienda' : 'Envío a domicilio'}`,
      ...(delivery === 'delivery' && form.delivery_address
        ? [`📍 *Dirección:* ${form.delivery_address.trim()}`]
        : []),
      '',
      `💰 *Total: ${formatCOP(total)}*`,
      ...(form.notes ? ['', `📝 *Notas:* ${form.notes.trim()}`] : []),
    ]

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    const result = await createOrderAction({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim() || undefined,
      delivery_type: delivery,
      delivery_address: delivery === 'delivery' ? form.delivery_address.trim() : undefined,
      notes: form.notes.trim() || undefined,
      items: items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        lens_type: item.lensType,
      })),
    })

    if (result.success && result.data) {
      clearCart()
      toast.success('Pedido creado correctamente')
      router.push(`/pedido/${result.data.id}`)
    } else {
      toast.error(result.error ?? 'Error al crear el pedido')
      setSubmitting(false)
    }
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p
          className={cn(
            playfairDisplay.className,
            'text-3xl font-semibold text-[#0F0F0D]'
          )}
        >
          Tu carrito está vacío
        </p>
        <p className={cn(dmSans.className, 'mt-2 text-sm text-[#6E6E67]')}>
          Agrega algunos productos antes de continuar.
        </p>
        <Link
          href="/catalogo"
          className={cn(
            dmSans.className,
            'mt-6 inline-flex rounded-full bg-[#0F0F0D] px-6 py-2.5 text-sm font-medium text-[#FAFAF8] transition hover:bg-[#282822]'
          )}
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1
        className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}
      >
        Finalizar pedido
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Contact info */}
          <section className="space-y-4 rounded-xl border border-[#E2DDD6] bg-white p-6">
            <h2
              className={cn(
                playfairDisplay.className,
                'text-2xl font-semibold text-[#0F0F0D]'
              )}
            >
              Datos de contacto
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={dmSans.className} htmlFor="name">
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  required
                  value={form.customer_name}
                  onChange={(e) => handleInput('customer_name', e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={dmSans.className} htmlFor="phone">
                  Teléfono / WhatsApp *
                </Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => handleInput('customer_phone', e.target.value)}
                  placeholder="3001234567"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={dmSans.className} htmlFor="email">
                  Email (opcional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => handleInput('customer_email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="space-y-4 rounded-xl border border-[#E2DDD6] bg-white p-6">
            <h2
              className={cn(
                playfairDisplay.className,
                'text-2xl font-semibold text-[#0F0F0D]'
              )}
            >
              Método de entrega
            </h2>
            <div className={cn(dmSans.className, 'flex gap-3')}>
              {DELIVERY_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setDelivery(option.value)}
                  className={cn(
                    'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                    delivery === option.value
                      ? 'border-[#0F0F0D] bg-[#0F0F0D] text-[#FAFAF8]'
                      : 'border-[#E2DDD6] bg-white text-[#6E6E67] hover:border-[#0F0F0D]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {delivery === 'delivery' && (
              <div className="space-y-1.5">
                <Label className={dmSans.className} htmlFor="address">
                  Dirección de entrega *
                </Label>
                <Input
                  id="address"
                  required
                  value={form.delivery_address}
                  onChange={(e) => handleInput('delivery_address', e.target.value)}
                  placeholder="Calle 123 #45-67, Ciudad"
                />
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="space-y-3 rounded-xl border border-[#E2DDD6] bg-white p-6">
            <h2
              className={cn(
                playfairDisplay.className,
                'text-2xl font-semibold text-[#0F0F0D]'
              )}
            >
              Notas del pedido
            </h2>
            <Textarea
              placeholder="Instrucciones especiales, receta médica, talla de montura, etc."
              value={form.notes}
              onChange={(e) => handleInput('notes', e.target.value)}
              rows={3}
            />
          </section>
        </div>

        {/* ── Right column: order summary ── */}
        <aside>
          <div className="sticky top-24 space-y-4 rounded-xl border border-[#E2DDD6] bg-white p-5">
            <h2
              className={cn(
                playfairDisplay.className,
                'text-2xl font-semibold text-[#0F0F0D]'
              )}
            >
              Resumen
            </h2>

            <ul className={cn(dmSans.className, 'space-y-3')}>
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  {item.image && (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#E2DDD6]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0F0F0D]">{item.name}</p>
                    <p className="text-xs text-[#6E6E67]">
                      {item.lensType ? (LENS_LABELS[item.lensType] ?? item.lensType) : 'Sin especificar'}{' '}
                      · ×{item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[#0F0F0D]">
                    {formatCOP(item.price * item.quantity)}
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
              <span>{formatCOP(total)}</span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                dmSans.className,
                'w-full rounded-full bg-[#D4A853] font-semibold text-[#0F0F0D] hover:bg-[#C79D4C] disabled:opacity-60'
              )}
            >
              {submitting ? 'Procesando...' : 'Confirmar pedido'}
            </Button>

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={submitting}
              className={cn(
                dmSans.className,
                'inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] bg-white py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#F0FFF4] disabled:opacity-60'
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 text-[#25D366]"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.524 5.832L.057 23.04a.75.75 0 0 0 .92.92l5.233-1.463A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.96-1.359l-.356-.211-3.684 1.03 1.041-3.573-.232-.369A9.712 9.712 0 0 1 2.25 12c0-5.376 4.374-9.75 9.75-9.75S21.75 6.624 21.75 12 17.376 21.75 12 21.75z" />
              </svg>
              Hablar por WhatsApp
            </button>

            <p className={cn(dmSans.className, 'text-center text-xs text-[#6E6E67]')}>
              Pago al momento de la entrega o en tienda
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
