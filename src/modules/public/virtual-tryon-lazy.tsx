'use client'

import dynamic from 'next/dynamic'

import { ARLoadingSkeleton } from '@/components/ar/ARLoadingSkeleton'
import type { ProductWithCategory } from '@/types'

const VirtualTryOnPage = dynamic(() => import('@/modules/public/virtual-tryon-page'), {
  ssr: false,
  loading: () => <ARLoadingSkeleton />,
})

type VirtualTryOnLazyProps = {
  products: ProductWithCategory[]
  initialProductId?: string
}

export function VirtualTryOnLazy(props: VirtualTryOnLazyProps) {
  return <VirtualTryOnPage {...props} />
}
