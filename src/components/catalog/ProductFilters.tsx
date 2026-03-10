'use client'

import { DM_Sans, Playfair_Display } from 'next/font/google'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const genderOptions = [
  { label: 'Todos', value: '' },
  { label: 'Hombre', value: 'hombre' },
  { label: 'Mujer', value: 'mujer' },
  { label: 'Unisex', value: 'unisex' },
  { label: 'Ninos', value: 'niños' },
]

const frameShapeOptions = [
  { label: 'Redonda', value: 'redonda' },
  { label: 'Cuadrada', value: 'cuadrada' },
  { label: 'Rectangular', value: 'rectangular' },
  { label: 'Aviador', value: 'aviador' },
  { label: 'Cat-Eye', value: 'cat-eye' },
]

type ProductFiltersProps = {
  categories: Category[]
  className?: string
}

function toNumberOrEmpty(value: string): string {
  if (!value.trim()) {
    return ''
  }

  const normalized = Number(value)

  if (Number.isNaN(normalized)) {
    return ''
  }

  return String(Math.max(0, normalized))
}

export function ProductFilters({ categories, className }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const activeFilters = useMemo(
    () => ({
      category: searchParams.get('category') ?? '',
      gender: searchParams.get('gender') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      frameShape: searchParams.get('frameShape') ?? '',
      hasArOverlay: searchParams.get('hasArOverlay') === 'true',
    }),
    [searchParams]
  )

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '')
  }, [searchParams])

  const pushWithParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      pushWithParams((params) => {
        const nextValue = searchInput.trim()

        if (!nextValue) {
          params.delete('q')
          return
        }

        params.set('q', nextValue)
      })
    }, 400)

    return () => {
      clearTimeout(handler)
    }
    // Controlled debounce for q only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  return (
    <aside
      className={cn(
        'rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-5 md:p-6',
        dmSans.className,
        className
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
          Filtros
        </h2>
        <button
          type="button"
          onClick={() => router.push('/catalogo')}
          className="text-xs font-medium text-[#6A6A61] underline-offset-4 transition hover:text-[#0F0F0D] hover:underline"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="space-y-6">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A9A90] uppercase">
            Busqueda
          </p>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Busca por nombre"
            className="h-10 border-[#E2DDD6] bg-[#FDFDFB] text-[#0F0F0D]"
          />
        </section>

        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A9A90] uppercase">
            Categoria
          </p>
          <div className="space-y-2">
            {categories.map((category) => {
              const checked = activeFilters.category === category.slug

              return (
                <label
                  key={category.id}
                  className="flex items-center gap-2.5 text-sm text-[#2B2B27]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      pushWithParams((params) => {
                        if (nextChecked === true) {
                          params.set('category', category.slug)
                        } else {
                          params.delete('category')
                        }
                      })
                    }}
                    className="border-[#CFC9C0] data-checked:border-[#D4A853] data-checked:bg-[#D4A853]"
                  />
                  <span>{category.name}</span>
                </label>
              )
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A9A90] uppercase">
            Genero
          </p>
          <div className="space-y-2">
            {genderOptions.map((option) => (
              <label
                key={option.label}
                className="flex items-center gap-2.5 text-sm text-[#2B2B27]"
              >
                <input
                  type="radio"
                  name="gender"
                  checked={activeFilters.gender === option.value}
                  onChange={() => {
                    pushWithParams((params) => {
                      if (!option.value) {
                        params.delete('gender')
                        return
                      }

                      params.set('gender', option.value)
                    })
                  }}
                  className="size-4 border-[#CFC9C0] accent-[#D4A853]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A9A90] uppercase">
            Precio (COP)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              value={activeFilters.minPrice}
              onChange={(event) => {
                const nextValue = toNumberOrEmpty(event.target.value)
                pushWithParams((params) => {
                  if (!nextValue) {
                    params.delete('minPrice')
                    return
                  }

                  params.set('minPrice', nextValue)
                })
              }}
              placeholder="Min"
              className="h-10 border-[#E2DDD6] bg-[#FDFDFB]"
            />
            <Input
              type="number"
              min={0}
              value={activeFilters.maxPrice}
              onChange={(event) => {
                const nextValue = toNumberOrEmpty(event.target.value)
                pushWithParams((params) => {
                  if (!nextValue) {
                    params.delete('maxPrice')
                    return
                  }

                  params.set('maxPrice', nextValue)
                })
              }}
              placeholder="Max"
              className="h-10 border-[#E2DDD6] bg-[#FDFDFB]"
            />
          </div>
        </section>

        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A9A90] uppercase">
            Forma
          </p>
          <div className="space-y-2">
            {frameShapeOptions.map((shape) => {
              const checked = activeFilters.frameShape === shape.value

              return (
                <label
                  key={shape.value}
                  className="flex items-center gap-2.5 text-sm text-[#2B2B27]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      pushWithParams((params) => {
                        if (nextChecked === true) {
                          params.set('frameShape', shape.value)
                        } else {
                          params.delete('frameShape')
                        }
                      })
                    }}
                    className="border-[#CFC9C0] data-checked:border-[#D4A853] data-checked:bg-[#D4A853]"
                  />
                  <span>{shape.label}</span>
                </label>
              )
            })}
          </div>
        </section>

        <section className="flex items-center justify-between rounded-xl border border-[#E2DDD6] bg-[#F6F3EE] px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-[#2B2B27]">Solo con AR</p>
            <p className="text-xs text-[#8A8A82]">Modelos listos para probador virtual</p>
          </div>
          <Switch
            checked={activeFilters.hasArOverlay}
            onCheckedChange={(checked) => {
              pushWithParams((params) => {
                if (checked) {
                  params.set('hasArOverlay', 'true')
                } else {
                  params.delete('hasArOverlay')
                }
              })
            }}
            className="data-checked:bg-[#D4A853]"
          />
        </section>
      </div>
    </aside>
  )
}
