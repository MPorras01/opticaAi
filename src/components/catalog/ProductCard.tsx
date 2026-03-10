'use client'

import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatCOP } from '@/lib/utils'
import useCartStore from '@/stores/cart.store'
import type { ProductWithCategory } from '@/types'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

type ProductCardProps = {
  product: ProductWithCategory
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)
  const [isAdded, setIsAdded] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const imageSrc = product.images[0] ?? '/placeholder.svg'
  const categoryName = product.categories?.name ?? 'Sin categoria'

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: imageSrc,
    })
    openCart()

    setIsAdded(true)

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = setTimeout(() => {
      setIsAdded(false)
    }, 1000)
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] transition-all duration-300 ease-in hover:-translate-y-1 hover:shadow-[0_18px_36px_-24px_rgba(15,15,13,0.35)]">
      <div className="relative aspect-square overflow-hidden bg-[#F0EDE6]">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />

        {product.has_ar_overlay && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#D4A853] px-2 py-1 text-[10px] leading-none font-bold tracking-[0.08em] text-[#0F0F0D]">
            AR
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <p className={dmSans.className + ' text-[11px] tracking-[0.16em] text-[#9A9A90] uppercase'}>
          {product.brand?.trim() ? product.brand : 'OpticaAI'}
        </p>

        <h3
          className={
            dmSans.className +
            ' line-clamp-2 min-h-[2.85rem] text-[15px] leading-[1.4] font-medium text-[#0F0F0D]'
          }
        >
          {product.name}
        </h3>

        <div className="flex items-end gap-2">
          <p
            className={
              playfairDisplay.className +
              ' text-[20px] leading-none font-semibold text-[#0F0F0D] italic'
            }
          >
            {formatCOP(product.price)}
          </p>
          {typeof product.compare_at_price === 'number' &&
            product.compare_at_price > product.price && (
              <span className={dmSans.className + ' text-xs text-[#9A9A90] line-through'}>
                {formatCOP(product.compare_at_price)}
              </span>
            )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span
            className={
              dmSans.className +
              ' inline-flex rounded-full border border-[#E2DDD6] bg-[#F0EDE6] px-2.5 py-1 text-xs font-medium text-[#6D6D65]'
            }
          >
            {categoryName}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex size-8 items-center justify-center rounded-full bg-[#D4A853] text-[#0F0F0D] transition-all duration-300 ease-in hover:scale-[1.02] hover:bg-[#C79D4C] focus-visible:ring-2 focus-visible:ring-[#0F0F0D]/35 focus-visible:outline-none"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <span className="inline-flex items-center justify-center transition-transform duration-200">
              {isAdded ? <Check className="size-4" /> : <Plus className="size-4" />}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
