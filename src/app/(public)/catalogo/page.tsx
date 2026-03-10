import type { Metadata } from 'next'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { ProductCard } from '@/components/catalog/ProductCard'
import { ProductFilters } from '@/components/catalog/ProductFilters'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { getCategories, getProducts } from '@/lib/repositories'
import { cn } from '@/lib/utils'
import type { Category, ProductWithCategory } from '@/types'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

async function getFilters(searchParams: SearchParams) {
  const params = await searchParams

  return {
    categorySlug: firstParam(params.category),
    gender: firstParam(params.gender),
    minPrice: toNumber(firstParam(params.minPrice)),
    maxPrice: toNumber(firstParam(params.maxPrice)),
    frameShape: firstParam(params.frameShape),
    hasArOverlay: firstParam(params.hasArOverlay) === 'true' ? true : undefined,
    searchQuery: firstParam(params.q),
  }
}

function buildTitle(filters: Awaited<ReturnType<typeof getFilters>>) {
  const titleParts = ['Catalogo']

  if (filters.searchQuery) {
    titleParts.push(`Busqueda: ${filters.searchQuery}`)
  }

  if (filters.categorySlug) {
    titleParts.push(`Categoria: ${filters.categorySlug}`)
  }

  if (filters.gender) {
    titleParts.push(`Genero: ${filters.gender}`)
  }

  if (filters.hasArOverlay) {
    titleParts.push('Con AR')
  }

  return `${titleParts.join(' | ')} · OpticaAI`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const filters = await getFilters(searchParams)

  return {
    title: buildTitle(filters),
  }
}

export default async function CatalogRoute({ searchParams }: { searchParams: SearchParams }) {
  const filters = await getFilters(searchParams)
  let products: ProductWithCategory[] = []
  let categories: Category[] = []

  try {
    ;[products, categories] = await Promise.all([getProducts(filters), getCategories()])
  } catch {
    products = []
    categories = []
  }

  return (
    <div className="bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
        <nav className={cn(dmSans.className, 'text-sm text-[#7B7B74]')} aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition-colors duration-300 hover:text-[#0F0F0D]">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">&gt;</li>
            <li className="text-[#0F0F0D]">Catalogo</li>
          </ol>
        </nav>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className={cn(
                playfairDisplay.className,
                'text-4xl leading-none font-semibold text-[#0F0F0D] md:text-5xl'
              )}
            >
              Catalogo
            </h1>
            <p className={cn(dmSans.className, 'mt-2 text-sm text-[#8B8B84]')}>
              {products.length} productos encontrados
            </p>
          </div>

          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="md:hidden" />}>
              Filtros
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] bg-[#FAFAF8] p-0 sm:max-w-[390px]">
              <div className="p-4">
                <ProductFilters categories={categories} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-8">
          <div className="sticky top-[88px] hidden self-start md:block">
            <ProductFilters categories={categories} />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E2DDD6] bg-[#F6F3EE] p-8 text-center">
              <h2
                className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}
              >
                No encontramos resultados
              </h2>
              <p className={cn(dmSans.className, 'mx-auto mt-2 max-w-lg text-[#6E6E67]')}>
                Prueba ajustando filtros o vuelve a ver todo el catalogo para descubrir nuevas
                monturas.
              </p>
              <Link
                href="/catalogo"
                className={cn(
                  dmSans.className,
                  'mt-5 inline-flex rounded-full border border-[#0F0F0D] px-5 py-2.5 text-sm font-medium text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#ECE7DD]'
                )}
              >
                Ver catalogo completo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
