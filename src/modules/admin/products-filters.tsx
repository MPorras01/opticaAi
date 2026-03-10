'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/types'

type ProductsFiltersProps = {
  categories: Category[]
  initialQuery: string
  initialCategory: string
  initialStatus: string
  initialAr: string
}

function replaceParam(
  params: URLSearchParams,
  key: string,
  value: string,
  shouldResetPage = true
): URLSearchParams {
  const next = new URLSearchParams(params.toString())

  if (!value || value === 'all') {
    next.delete(key)
  } else {
    next.set(key, value)
  }

  if (shouldResetPage) {
    next.delete('page')
  }

  return next
}

export function ProductsFilters({
  categories,
  initialQuery,
  initialCategory,
  initialStatus,
  initialAr,
}: ProductsFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = replaceParam(searchParams, 'q', query.trim())
      router.replace(`${pathname}?${next.toString()}`)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [pathname, query, router, searchParams])

  const selectedCategory = useMemo(() => initialCategory || 'all', [initialCategory])
  const selectedStatus = useMemo(() => initialStatus || 'all', [initialStatus])
  const selectedAr = useMemo(() => initialAr || 'all', [initialAr])

  return (
    <div className="grid gap-3 rounded-xl border border-[#E8E2D8] bg-white p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8C8C84]" />
        <Input
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={selectedCategory}
        onValueChange={(value) => {
          const next = replaceParam(searchParams, 'category', value ?? '')
          router.replace(`${pathname}?${next.toString()}`)
        }}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedStatus}
        onValueChange={(value) => {
          const next = replaceParam(searchParams, 'status', value ?? '')
          router.replace(`${pathname}?${next.toString()}`)
        }}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedAr}
        onValueChange={(value) => {
          const next = replaceParam(searchParams, 'ar', value ?? '')
          router.replace(`${pathname}?${next.toString()}`)
        }}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="AR" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="with">Con AR</SelectItem>
          <SelectItem value="without">Sin AR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
