import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Glasses, PackageOpen, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { ProductActionsMenu } from '@/modules/admin/product-actions-menu'
import { ProductsFilters } from '@/modules/admin/products-filters'
import { ProductStatusSwitch } from '@/modules/admin/product-status-switch'
import type { Category, ProductWithCategory } from '@/types'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ProductsRow = ProductWithCategory

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

function buildRange(page: number, pageSize: number, total: number) {
  if (total === 0) {
    return { start: 0, end: 0 }
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return { start, end }
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(firstParam(params.page) || '1', 10) || 1)
  const query = firstParam(params.q).trim()
  const category = firstParam(params.category)
  const status = firstParam(params.status)
  const ar = firstParam(params.ar)
  const pageSize = 20

  const supabase = await createServerClient()

  let productsQuery = supabase
    .from('products')
    .select('*, categories(*)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (query) {
    productsQuery = productsQuery.ilike('name', `%${query}%`)
  }

  if (category) {
    productsQuery = productsQuery.eq('category_id', category)
  }

  if (status === 'active') {
    productsQuery = productsQuery.eq('is_active', true)
  }

  if (status === 'inactive') {
    productsQuery = productsQuery.eq('is_active', false)
  }

  if (ar === 'with') {
    productsQuery = productsQuery.eq('has_ar_overlay', true)
  }

  if (ar === 'without') {
    productsQuery = productsQuery.eq('has_ar_overlay', false)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [productsRes, categoriesRes, activeCountRes, inactiveCountRes] = await Promise.all([
    productsQuery.range(from, to),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
  ])

  const products = (productsRes.data ?? []) as ProductsRow[]
  const categories = (categoriesRes.data ?? []) as Category[]
  const totalProducts = productsRes.count ?? 0
  const totalActive = activeCountRes.count ?? 0
  const totalInactive = inactiveCountRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))
  const range = buildRange(page, pageSize, totalProducts)

  const prevParams = new URLSearchParams()
  const nextParams = new URLSearchParams()

  for (const key of ['q', 'category', 'status', 'ar']) {
    const value = firstParam(params[key])
    if (value) {
      prevParams.set(key, value)
      nextParams.set(key, value)
    }
  }

  if (page > 1) {
    prevParams.set('page', String(page - 1))
  }

  if (page < totalPages) {
    nextParams.set('page', String(page + 1))
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D]')}>
            Productos
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className={cn(dmSans.className, 'border-[#D8D2C8]')}>
              {totalProducts} en total
            </Badge>
            <Badge
              variant="outline"
              className={cn(dmSans.className, 'border-green-200 text-green-700')}
            >
              {totalActive} activos
            </Badge>
            <Badge
              variant="outline"
              className={cn(dmSans.className, 'border-gray-300 text-gray-700')}
            >
              {totalInactive} inactivos
            </Badge>
          </div>
        </div>

        <Link href="/admin/productos/nuevo">
          <Button
            className={cn(
              dmSans.className,
              'bg-[#D4A853] font-semibold text-black hover:bg-[#C79D4C]'
            )}
          >
            <Plus className="mr-2 size-4" />
            Nuevo producto
          </Button>
        </Link>
      </header>

      <ProductsFilters
        categories={categories}
        initialQuery={query}
        initialCategory={category}
        initialStatus={status}
        initialAr={ar}
      />

      {products.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[#D8D2C8] bg-[#FBF9F5] p-12 text-center">
          <PackageOpen className="mx-auto size-12 text-[#B7AEA1]" />
          <h2
            className={cn(playfairDisplay.className, 'mt-3 text-2xl font-semibold text-[#0F0F0D]')}
          >
            No hay productos
          </h2>
          <p className={cn(dmSans.className, 'mt-2 text-sm text-[#706A61]')}>
            No hay productos. Crea el primero.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#E8E2D8] bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FBF8F1]">
                <TableHead>Imagen</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>AR</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const imageUrl = product.images?.[0]
                const lowStock = Number(product.stock ?? 0) < 5

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-[50px] w-[50px] rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-[#F2EEE6] text-xs text-[#8A8378]">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className={cn(dmSans.className, 'font-semibold text-[#12120F]')}>
                        {product.name}
                      </p>
                      <p className={cn(dmSans.className, 'text-xs text-[#7B756B]')}>
                        {product.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.categories?.name ?? 'Sin categoria'}</Badge>
                    </TableCell>
                    <TableCell>{formatCOP(Number(product.price ?? 0))}</TableCell>
                    <TableCell className={lowStock ? 'font-semibold text-red-600' : ''}>
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      {product.has_ar_overlay ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#D4A853]">
                          <Glasses className="size-4" />
                          AR
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductStatusSwitch productId={product.id} isActive={product.is_active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <ProductActionsMenu
                          id={product.id}
                          slug={product.slug}
                          hasArOverlay={product.has_ar_overlay}
                          productName={product.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EEE7DB] px-4 py-3">
            <p className={cn(dmSans.className, 'text-sm text-[#706A61]')}>
              Mostrando {range.start}-{range.end} de {totalProducts} productos
            </p>
            <div className="flex gap-2">
              <Link
                href={page > 1 ? `/admin/productos?${prevParams.toString()}` : '#'}
                aria-disabled={page <= 1}
              >
                <Button variant="outline" disabled={page <= 1}>
                  Anterior
                </Button>
              </Link>
              <Link
                href={page < totalPages ? `/admin/productos?${nextParams.toString()}` : '#'}
                aria-disabled={page >= totalPages}
              >
                <Button variant="outline" disabled={page >= totalPages}>
                  Siguiente
                </Button>
              </Link>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}
