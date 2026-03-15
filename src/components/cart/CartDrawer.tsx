'use client'

import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Minus, Plus, Trash2 } from 'lucide-react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LENS_FILTER_LABELS,
  LENS_TYPE_LABELS,
  hasPrescriptionDetails,
} from '@/lib/utils/lens-config'
import { formatCOP } from '@/lib/utils'
import useCartStore, { type CartItem } from '@/stores/cart.store'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

function CartRow({ item }: { item: CartItem }) {
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const cartItemKey = item.cartItemId ?? item.id

  const configLines = [
    item.lensSelection?.type
      ? `Lente: ${item.lensSelection.type}`
      : item.lensType
        ? `Lente: ${LENS_TYPE_LABELS[item.lensType]}`
        : null,
    item.lensSelection?.filters?.length
      ? `Filtros: ${item.lensSelection.filters.join(', ')}`
      : item.lensFilters?.length
        ? `Filtros: ${item.lensFilters.map((filter) => LENS_FILTER_LABELS[filter]).join(', ')}`
        : null,
    item.lensSelection?.material ? `Material: ${item.lensSelection.material}` : null,
    item.lensSelection?.tint ? `Tinte: ${item.lensSelection.tint}` : null,
    item.lensSelection?.thickness ? `Grosor: ${item.lensSelection.thickness}` : null,
    item.lensSelection?.totalAddition
      ? `Opciones: ${formatCOP(item.lensSelection.totalAddition)}`
      : null,
    item.prescription?.mode === 'manual' && hasPrescriptionDetails(item.prescription)
      ? 'Formula registrada'
      : item.prescription?.mode === 'pending'
        ? 'Formula pendiente por enviar'
        : null,
    item.prescription?.legalConsent ? 'Consentimiento legal registrado' : null,
  ].filter((line): line is string => Boolean(line))

  const decrease = () => {
    updateQuantity(cartItemKey, Math.max(1, item.quantity - 1))
  }

  const increase = () => {
    updateQuantity(cartItemKey, Math.min(10, item.quantity + 1))
  }

  return (
    <article className="flex gap-3 rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F0EDE6]">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={dmSans.className + ' line-clamp-1 text-sm font-semibold text-[#0F0F0D]'}>
              {item.name}
            </h3>
            {configLines.map((line) => (
              <p key={line} className={dmSans.className + ' mt-0.5 text-xs text-[#8C8C84]'}>
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeItem(cartItemKey)}
            className="inline-flex size-7 items-center justify-center rounded-full text-[#A0A099] transition hover:bg-[#F3EEEA] hover:text-[#D64545]"
            aria-label={`Eliminar ${item.name} del carrito`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <p className={playfairDisplay.className + ' mt-2 text-lg text-[#0F0F0D] italic'}>
          {formatCOP(item.price)}
        </p>

        <div className="mt-2 inline-flex items-center rounded-full border border-[#E2DDD6] bg-[#F0EDE6] p-1">
          <button
            type="button"
            onClick={decrease}
            className="inline-flex size-7 items-center justify-center rounded-full text-[#0F0F0D] transition hover:bg-[#E8E2D7]"
            aria-label="Disminuir cantidad"
          >
            <Minus className="size-3.5" />
          </button>
          <span
            className={
              dmSans.className +
              ' inline-flex min-w-7 justify-center text-sm font-semibold text-[#0F0F0D]'
            }
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={increase}
            className="inline-flex size-7 items-center justify-center rounded-full text-[#0F0F0D] transition hover:bg-[#E8E2D7]"
            aria-label="Aumentar cantidad"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.getTotal())
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent
        side="right"
        className="w-[94%] border-l border-[#E2DDD6] bg-[#FAFAF8] p-0 text-[#0F0F0D] sm:max-w-[460px]"
      >
        <SheetHeader className="border-b border-[#E2DDD6] px-5 py-4">
          <SheetTitle
            className={playfairDisplay.className + ' text-2xl font-semibold text-[#0F0F0D]'}
          >
            Tu carrito{' '}
            <span className={dmSans.className + ' text-base text-[#7A7A72]'}>({itemCount})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-6xl" aria-hidden="true">
              🛍️
            </p>
            <h3
              className={playfairDisplay.className + ' mt-4 text-3xl font-semibold text-[#0F0F0D]'}
            >
              Tu carrito esta vacio
            </h3>
            <SheetClose
              render={<Link href="/catalogo" />}
              className={
                dmSans.className +
                ' mt-5 inline-flex rounded-full bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
              }
            >
              Ver catalogo
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((item) => (
                <CartRow key={item.cartItemId ?? item.id} item={item} />
              ))}
            </div>

            <SheetFooter className="sticky bottom-0 mt-auto border-t border-[#E2DDD6] bg-[#FAFAF8] px-4 py-4">
              <div className="w-full space-y-3">
                <div className="flex items-end justify-between">
                  <span className={dmSans.className + ' text-sm text-[#6E6E67]'}>Subtotal</span>
                  <span
                    className={
                      playfairDisplay.className + ' text-2xl font-semibold text-[#D4A853] italic'
                    }
                  >
                    {formatCOP(subtotal)}
                  </span>
                </div>

                <p className={dmSans.className + ' text-xs text-[#8D8D86]'}>
                  Envio y lentes se calculan al finalizar
                </p>

                <SheetClose
                  render={<Link href="/checkout" />}
                  className={
                    dmSans.className +
                    ' inline-flex h-11 w-full items-center justify-center rounded-full bg-[#D4A853] text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
                  }
                >
                  Ir a pagar
                </SheetClose>

                <SheetClose
                  className={
                    dmSans.className +
                    ' inline-flex h-11 w-full items-center justify-center rounded-full border border-[#0F0F0D] text-sm font-medium text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#F0EDE6]'
                  }
                >
                  Seguir comprando
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
