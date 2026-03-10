import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteConfig } from '@/config/site.config'
import { getProductBySlug, getProducts, getRelatedProducts } from '@/lib/repositories'
import { ProductDetail } from '@/modules/public/product-detail'

type Params = Promise<{ slug: string }>

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
    const image = product.images[0] ?? '/placeholder.svg'

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
    relatedProducts = product.category_id
      ? await getRelatedProducts(product.id, product.category_id)
      : []
  } catch {
    notFound()
  }

  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
  const whatsappMessage = `${siteConfig.whatsapp.message} Me interesa: ${product.name}`
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
      whatsappHref={whatsappHref}
    />
  )
}
