'use client'

import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Download, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

import { GlassesSelector } from '@/components/ar/GlassesSelector'
import { VirtualTryOn } from '@/components/ar/VirtualTryOn'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveArOverlayUrl, resolveFitProfile } from '@/config/ar.config'
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
  weight: ['500', '600', '700'],
})

type VirtualTryOnPageProps = {
  products: ProductWithCategory[]
  initialProductId?: string
}

type Tip = {
  title: string
  description: string
}

const tips: Tip[] = [
  {
    title: 'Buena iluminacion frontal',
    description: 'Evita contraluces fuertes para mejorar la deteccion del rostro.',
  },
  {
    title: 'Manten la cabeza recta',
    description: 'Mantente centrado y mira al frente para un overlay mas preciso.',
  },
  {
    title: 'Alejate un poco de la camara',
    description: 'Deja espacio para que se vean ojos, cejas y nariz completos.',
  },
]

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], fileName, { type: 'image/jpeg' })
}

export function VirtualTryOnPage({ products, initialProductId }: VirtualTryOnPageProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const initialSelected = useMemo(() => {
    if (!products.length) {
      return null
    }

    if (!initialProductId) {
      return products[0]
    }

    return products.find((product) => product.id === initialProductId) ?? products[0]
  }, [initialProductId, products])

  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(initialSelected)
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null)
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false)

  const overlayUrl = resolveArOverlayUrl(selectedProduct)
  const fitProfile = resolveFitProfile(selectedProduct)
  const glassesName = selectedProduct?.name || 'Gafas de prueba'

  const handleSnapshot = (dataUrl: string) => {
    setSnapshotDataUrl(dataUrl)
    setIsSnapshotOpen(true)
  }

  const handleDownload = () => {
    if (!snapshotDataUrl) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = snapshotDataUrl
    anchor.download = `opticaai-tryon-${Date.now()}.jpg`
    anchor.click()
  }

  const handleWhatsAppShare = async () => {
    if (!snapshotDataUrl) {
      return
    }

    try {
      if (navigator.share && navigator.canShare) {
        const file = await dataUrlToFile(snapshotDataUrl, 'opticaai-probador.jpg')
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Probador Virtual OpticaAI',
            text: 'Mira como me quedan estas gafas en OpticaAI',
          })
          return
        }
      }
    } catch {
      // Fallback to WhatsApp URL below.
    }

    const message = encodeURIComponent('Mira como me quedan estas gafas en OpticaAI')
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
        <nav className={dmSans.className + ' text-sm text-[#7B7B74]'} aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition-colors duration-300 hover:text-[#0F0F0D]">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">&gt;</li>
            <li className="text-[#0F0F0D]">Probador Virtual</li>
          </ol>
        </nav>

        <header className="mt-4 space-y-2">
          <h1 className={playfairDisplay.className + ' text-4xl leading-tight font-semibold text-[#0F0F0D] md:text-5xl'}>
            Pruebate las gafas
          </h1>
          <p className={dmSans.className + ' text-[0.98rem] text-[#6E6E67]'}>
            Usa la camara de tu dispositivo para ver como te quedan
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-8">
          <section className="space-y-4">
            {selectedProduct ? (
              <VirtualTryOn
                glassesImageUrl={overlayUrl}
                glassesName={glassesName}
                fitProfile={fitProfile}
                product={selectedProduct}
                onSnapshot={handleSnapshot}
              />
            ) : (
              <div className="aspect-[4/3] rounded-2xl border border-[#E2DDD6] bg-[#F0EDE6] p-6 text-center">
                <p className={dmSans.className + ' mt-20 text-[#6E6E67]'}>
                  Selecciona unas gafas de la lista para empezar
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <GlassesSelector
              products={products}
              selectedId={selectedProduct?.id ?? null}
              onSelect={setSelectedProduct}
            />

            {selectedProduct ? (
              <div className="rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-5">
                <h3 className={playfairDisplay.className + ' text-2xl font-semibold text-[#0F0F0D]'}>
                  {selectedProduct.name}
                </h3>
                <p className={playfairDisplay.className + ' mt-1 text-xl font-semibold italic text-[#D4A853]'}>
                  {formatCOP(selectedProduct.price)}
                </p>
                <p className={dmSans.className + ' mt-2 line-clamp-3 text-sm text-[#6E6E67]'}>
                  {selectedProduct.description || 'Montura seleccionada para prueba virtual y compra online.'}
                </p>

                <div className="mt-4 space-y-2">
                  <Link
                    href={`/catalogo/${selectedProduct.slug}`}
                    className={
                      dmSans.className +
                      ' inline-flex h-10 w-full items-center justify-center rounded-full border border-[#0F0F0D] text-sm font-medium text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#F0EDE6]'
                    }
                  >
                    Ver detalles
                  </Link>

                  <Button
                    onClick={() => {
                      addItem({
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        slug: selectedProduct.slug,
                        price: selectedProduct.price,
                        image: selectedProduct.images?.[0] || '/placeholder.svg',
                      })
                      openCart()
                    }}
                    className={
                      dmSans.className +
                      ' h-10 w-full rounded-full bg-[#D4A853] text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
                    }
                  >
                    Agregar al carrito
                  </Button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <section className="mt-10 md:mt-12">
          <h2 className={playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'}>
            Tips para una mejor prueba
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {tips.map((tip) => (
              <article key={tip.title} className="rounded-2xl border border-[#E2DDD6] bg-[#F0EDE6] p-4">
                <h3 className={dmSans.className + ' text-sm font-semibold text-[#0F0F0D]'}>{tip.title}</h3>
                <p className={dmSans.className + ' mt-1 text-sm text-[#66665F]'}>{tip.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={isSnapshotOpen} onOpenChange={setIsSnapshotOpen}>
        <DialogContent className="max-w-lg border border-[#E2DDD6] bg-[#FAFAF8] p-0">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className={playfairDisplay.className + ' text-2xl font-semibold text-[#0F0F0D]'}>
              Foto capturada
            </DialogTitle>
            <DialogDescription className={dmSans.className + ' text-sm text-[#6E6E67]'}>
              Guarda o comparte tu prueba virtual.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4">
            {snapshotDataUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E2DDD6] bg-[#F0EDE6]">
                <Image src={snapshotDataUrl} alt="Snapshot de prueba virtual" fill className="object-cover" />
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-[#E2DDD6] bg-[#FAFAF8] px-5 pb-5">
            <Button
              onClick={handleDownload}
              className={dmSans.className + ' rounded-full bg-[#D4A853] text-[#0F0F0D] hover:bg-[#C79D4C]'}
            >
              <Download className="size-4" />
              Descargar foto
            </Button>

            <Button
              variant="outline"
              onClick={handleWhatsAppShare}
              className={dmSans.className + ' rounded-full border-[#25D366] text-[#1A7E3E] hover:bg-[#EFFFF5]'}
            >
              <MessageCircle className="size-4" />
              Compartir por WhatsApp
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsSnapshotOpen(false)}
              className={dmSans.className + ' rounded-full border-[#0F0F0D] hover:bg-[#F0EDE6]'}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VirtualTryOnPage
