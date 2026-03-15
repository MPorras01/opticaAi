import type { Metadata } from 'next'

import { siteConfig } from '@/config/site.config'
import { findProductBySlug, getProducts, getRelatedProducts } from '@/lib/repositories'
import { getLensOptions } from '@/lib/repositories/lens-options.repo'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/modules/public/product-detail'
import ProductNotFound from './not-found'

type Params = Promise<{ slug: string }>

const UNSPLASH_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop&q=80'

function normalizeProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [UNSPLASH_FALLBACK_IMAGE]
  }

  const sanitized = images.filter(
    (image): image is string => typeof image === 'string' && image.trim().length > 0
  )

  return sanitized.length > 0 ? sanitized : [UNSPLASH_FALLBACK_IMAGE]
}

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
    const product = await findProductBySlug(slug)

    if (!product) {
      return {
        title: 'Producto no encontrado · OpticaAI',
      }
    }

    const image = normalizeProductImages(product.images)[0]

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

type PageData = {
  product: Awaited<ReturnType<typeof findProductBySlug>> & { images: string[] }
  relatedProducts: Awaited<ReturnType<typeof getRelatedProducts>>
  whatsappHref: string
  lensOptions: Awaited<ReturnType<typeof getLensOptions>>
  isLoggedIn: boolean
}

async function fetchPageData(slug: string): Promise<PageData | null> {
  const productResult = await findProductBySlug(slug).catch(() => null)

  if (!productResult) return null

  const product = {
    ...productResult,
    images: normalizeProductImages(productResult.images),
  }

  const relatedProducts = product.category_id
    ? await getRelatedProducts(product.id, product.category_id).catch(() => [])
    : []

  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
  const whatsappMessage = `${siteConfig.whatsapp.message} Me interesa: ${product.name}`
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  let lensOptions: Awaited<ReturnType<typeof getLensOptions>> = []
  let isLoggedIn = false
  try {
    const [fetchedOptions, supabase] = await Promise.all([
      getLensOptions().catch(() => []),
      createClient(),
    ])
    lensOptions = fetchedOptions
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    isLoggedIn = Boolean(data.user)
  } catch {
    // Non-critical: proceed without lens options or user session
  }

  return { product, relatedProducts, whatsappHref, lensOptions, isLoggedIn }
}

export default async function ProductDetailRoute({ params }: { params: Params }) {
  const { slug } = await params

  const data = await fetchPageData(slug).catch(() => null)

  if (!data) return <ProductNotFound />

  return (
    <ProductDetail
      product={data.product}
      relatedProducts={data.relatedProducts}
      whatsappHref={data.whatsappHref}
      lensOptions={data.lensOptions}
      isLoggedIn={data.isLoggedIn}
    />
  )
}
