import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteConfig } from '@/config/site.config'
import { getProductBySlug, getProducts, getRelatedProducts } from '@/lib/repositories'
import { getLensOptions } from '@/lib/repositories/lens-options.repo'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/modules/public/product-detail'

type Params = Promise<{ slug: string }>

const UNSPLASH_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop&q=80'

function buildProductDescription(description: string | null) {
  if (!description) {
    return 'Descubre monturas premium en OpticaAI y elige tu mejor estilo con asesoria personalizada.'
  }

  return description
}

export async function generateStaticParams() {
  try {
    const products = await getProducts()

    return products.map((product) => ({ slug: product.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params

  try {
    const product = await getProductBySlug(slug)
    const image = product.images?.[0] ?? UNSPLASH_FALLBACK_IMAGE

    return {
      title: `${product.name} · OpticaAI`,
      description: buildProductDescription(product.description),
      openGraph: {
        title: `${product.name} · OpticaAI`,
        description: buildProductDescription(product.description),
        images: [image],
      },
    }
  } catch {
    return {
      title: 'Producto no encontrado · OpticaAI',
    }
  }
}

export default async function ProductDetailRoute({ params }: { params: Params }) {
  const { slug } = await params

  let product
  let relatedProducts

  try {
    product = await getProductBySlug(slug)
    if (!product.images?.length) {
      product = {
        ...product,
        images: [UNSPLASH_FALLBACK_IMAGE],
      }
    }
    relatedProducts = product.category_id
      ? await getRelatedProducts(product.id, product.category_id)
      : []
  } catch {
    notFound()
  }

  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
  const whatsappMessage = `${siteConfig.whatsapp.message} Me interesa: ${product.name}`
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  const [lensOptions, supabase] = await Promise.all([getLensOptions(), createClient()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
      whatsappHref={whatsappHref}
      lensOptions={lensOptions}
      isLoggedIn={Boolean(user)}
    />
  )
}
