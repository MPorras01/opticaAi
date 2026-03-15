'use client'

import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LensConfiguratorModal } from '@/components/checkout/LensConfiguratorModal'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LensOption } from '@/lib/repositories/lens-options.repo'
import { formatCOP } from '@/lib/utils'
import type { Product, ProductWithCategory } from '@/types'
import useCartStore from '@/stores/cart.store'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

type ProductDetailProps = {
  product: ProductWithCategory
  relatedProducts: Product[]
  whatsappHref: string
  lensOptions: LensOption[]
  isLoggedIn?: boolean
}

export function ProductDetail({
  product,
  relatedProducts,
  whatsappHref,
  lensOptions,
  isLoggedIn = false,
}: ProductDetailProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const images = useMemo(() => {
    if (!Array.isArray(product.images)) {
      return ['/placeholder.svg']
    }

    const validImages = product.images.filter(
      (image): image is string => typeof image === 'string' && image.trim().length > 0
    )

    if (validImages.length > 0) {
      return validImages
    }

    return ['/placeholder.svg']
  }, [product.images])

  const [selectedImage, setSelectedImage] = useState(images[0])
  const [isLensModalOpen, setIsLensModalOpen] = useState(false)

  const attributes = [
    { label: 'Material', value: product.material },
    { label: 'Forma', value: product.frame_shape },
    { label: 'Genero', value: product.gender },
    { label: 'Color', value: product.color },
  ].filter((attribute) => Boolean(attribute.value))

  return (
    <div className="bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-10">
          <section>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-[#E2DDD6] bg-[#F0EDE6]">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 60vw, 100vw"
                priority
              />
              {product.has_ar_overlay && (
                <span className="absolute top-4 left-4 inline-flex rounded-full bg-[#D4A853] px-3 py-1 text-[11px] font-semibold text-[#0F0F0D]">
                  AR Disponible
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E2DDD6] bg-[#F0EDE6]"
                    aria-label={`Ver imagen de ${product.name}`}
                  >
                    <Image src={image} alt={product.name} fill className="object-cover" sizes="80px" />
                    <span
                      className={`absolute inset-0 border-2 ${selectedImage === image ? 'border-[#D4A853]' : 'border-transparent'}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 self-start md:sticky md:top-[96px]">
            <p className={dmSans.className + ' text-[11px] uppercase tracking-[0.16em] text-[#9A9A90]'}>
              {product.brand || 'OpticaAI'}
            </p>

            <h1 className={playfairDisplay.className + ' text-3xl leading-tight font-semibold text-[#0F0F0D] md:text-4xl'}>
              {product.name}
            </h1>

            <div className="flex items-end gap-2">
              <p className={playfairDisplay.className + ' text-2xl leading-none font-semibold italic text-[#0F0F0D]'}>
                {formatCOP(product.price)}
              </p>
              {typeof product.compare_at_price === 'number' && product.compare_at_price > product.price && (
                <span className={dmSans.className + ' text-sm text-[#9A9A90] line-through'}>
                  {formatCOP(product.compare_at_price)}
                </span>
              )}
            </div>

            {product.description && (
              <p className={dmSans.className + ' text-[0.96rem] leading-relaxed text-[#6E6E67]'}>{product.description}</p>
            )}

            {attributes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attributes.map((attribute) => (
                  <span
                    key={attribute.label}
                    className={dmSans.className + ' inline-flex rounded-full bg-[#F0EDE6] px-3 py-1 text-xs font-medium text-[#4B4B44]'}
                  >
                    {attribute.label}: {attribute.value}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLensModalOpen(true)}
                className={
                  dmSans.className +
                  ' inline-flex h-11 w-full items-center justify-center rounded-full bg-[#D4A853] text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
                }
              >
                Personalizar y agregar
              </button>

              <LensConfiguratorModal
                product={product}
                lensOptions={lensOptions}
                open={isLensModalOpen}
                onClose={() => setIsLensModalOpen(false)}
                isLoggedIn={isLoggedIn}
                onConfirm={(config) => {
                  addItem({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: config.totalPrice,
                    image: selectedImage,
                    lensType: undefined,
                    lensFilters: [],
                    prescription: config.prescription,
                    lensSelection: config.lensOptions,
                  })

                  toast.success('Producto agregado con configuración personalizada')
                  setIsLensModalOpen(false)
                  openCart()
                }}
              />

              {product.has_ar_overlay && (
                <Link
                  href={`/probador-virtual?productId=${product.id}`}
                  className={
                    dmSans.className +
                    ' inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#D4A853] text-sm font-semibold text-[#D4A853] transition duration-300 hover:scale-[1.02] hover:bg-[#D4A853] hover:text-[#0F0F0D]'
                  }
                >
                  <span aria-hidden="true">👓</span>
                  Probarme estas gafas
                </Link>
              )}

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className={
                  dmSans.className +
                  ' inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1FA351] bg-[#25D366] text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#1EB85A]'
                }
              >
                Pedir por WhatsApp
              </a>
            </div>
          </section>
        </div>

        <section className="mt-12 md:mt-16">
          <Tabs defaultValue="descripcion" className="gap-5">
            <TabsList variant="line" className="border-b border-[#E2DDD6] p-0">
              <TabsTrigger value="descripcion" className={dmSans.className + ' rounded-none px-4 py-2.5 text-sm'}>
                Descripcion
              </TabsTrigger>
              <TabsTrigger value="cuidados" className={dmSans.className + ' rounded-none px-4 py-2.5 text-sm'}>
                Cuidados
              </TabsTrigger>
              <TabsTrigger value="garantia" className={dmSans.className + ' rounded-none px-4 py-2.5 text-sm'}>
                Garantia
              </TabsTrigger>
            </TabsList>
            <TabsContent value="descripcion" className={dmSans.className + ' text-[#595952]'}>
              {product.description ||
                'Montura de alta calidad disenada para uso diario y excelente adaptacion con formula medica.'}
            </TabsContent>
            <TabsContent value="cuidados" className={dmSans.className + ' text-[#595952]'}>
              Limpia tus gafas con pano de microfibra, evita quimicos abrasivos y guardalas en estuche rigido.
            </TabsContent>
            <TabsContent value="garantia" className={dmSans.className + ' text-[#595952]'}>
              Este producto cuenta con garantia por defectos de fabrica. Aplica terminos y condiciones.
            </TabsContent>
          </Tabs>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h2 className={playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'}>
              Productos relacionados
            </h2>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
              {relatedProducts.map((related) => (
                <div key={related.id} className="w-[72%] shrink-0 md:w-auto">
                  <ProductCard product={{ ...related, categories: null }} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
