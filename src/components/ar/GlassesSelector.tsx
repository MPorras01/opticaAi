'use client'

import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { cn } from '@/lib/utils'
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

type GlassesSelectorProps = {
  products: ProductWithCategory[]
  selectedId: string | null
  onSelect: (product: ProductWithCategory) => void
}

const UNSPLASH_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop&q=80'

export function GlassesSelector({ products, selectedId, onSelect }: GlassesSelectorProps) {
  if (!products.length) {
    return (
      <section className="rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-5">
        <h2 className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}>
          Elige unas gafas
        </h2>
        <p className={cn(dmSans.className, 'mt-3 text-sm text-[#7A7A72]')}>
          Proximamente mas modelos disponibles
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-5">
      <h2 className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}>
        Elige unas gafas
      </h2>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0">
        {products.map((product) => {
          const imageSrc = product.ar_overlay_url || product.images?.[0] || UNSPLASH_FALLBACK_IMAGE
          const isSelected = selectedId === product.id

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className={cn(
                'group w-[92px] shrink-0 transition duration-300 hover:scale-[1.03] md:w-auto',
                isSelected && 'scale-[1.05]'
              )}
            >
              <div
                className={cn(
                  'relative h-20 w-20 overflow-hidden rounded-xl border bg-[#F0EDE6] md:h-[84px] md:w-[84px]',
                  isSelected ? 'border-2 border-[#D4A853]' : 'border-[#E2DDD6]'
                )}
              >
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="84px"
                />
              </div>
              <p
                className={cn(
                  dmSans.className,
                  'mt-1 line-clamp-1 text-xs font-medium text-[#44443E]'
                )}
              >
                {product.name}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
