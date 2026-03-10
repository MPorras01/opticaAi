import type { Metadata } from 'next'

import { getProducts } from '@/lib/repositories'
import { VirtualTryOnPage } from '@/modules/public/virtual-tryon-page'
import type { ProductWithCategory } from '@/types'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export const metadata: Metadata = {
  title: 'Probador Virtual de Gafas | OpticaAI',
  description: 'Pruebate monturas virtualmente desde tu casa usando tu camara',
}

export default async function VirtualTryOnRoute({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const selectedId = getFirstParam(params.productId)

  let products: ProductWithCategory[] = []

  try {
    products = await getProducts({ hasArOverlay: true })
  } catch {
    products = []
  }

  return <VirtualTryOnPage products={products} initialProductId={selectedId} />
}
