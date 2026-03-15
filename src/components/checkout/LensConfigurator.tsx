'use client'

import { DM_Sans, Playfair_Display } from 'next/font/google'
import { useEffect, useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { formatCOP } from '@/lib/utils/formatters'
import type { LensOption } from '@/lib/repositories/lens-options.repo'

type LensConfiguratorProps = {
  lensOptions: LensOption[]
  basePrice: number
  onChange: (selected: SelectedLensOptions) => void
}

export type SelectedLensOptions = {
  type?: string
  typeId?: string
  material?: string
  materialId?: string
  filters: string[]
  filterIds: string[]
  tint?: string
  tintId?: string
  thickness?: string
  thicknessId?: string
  totalAddition: number
}

type GroupedLensOptions = {
  type: LensOption[]
  material: LensOption[]
  filter: LensOption[]
  tint: LensOption[]
  thickness: LensOption[]
}

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

function priceLabel(value: number): string {
  return value <= 0 ? 'Incluido' : `+ ${formatCOP(value)}`
}

function tintColorClass(name: string): string | null {
  const normalized = name.toLowerCase()

  if (normalized.includes('gris')) return 'bg-gray-500'
  if (normalized.includes('cafe')) return 'bg-amber-700'
  if (normalized.includes('café')) return 'bg-amber-700'
  if (normalized.includes('verde')) return 'bg-emerald-600'

  return null
}

function OptionCard({
  option,
  selected,
  onClick,
  showTintColor = false,
}: {
  option: LensOption
  selected: boolean
  onClick: () => void
  showTintColor?: boolean
}) {
  const colorClass = showTintColor ? tintColorClass(option.name) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl border p-3 text-left transition-colors',
        selected
          ? 'border-[#D4A853] bg-[#FBF5E8]'
          : 'border-[#E5E2DC] bg-white hover:border-[#D7C79A] hover:bg-[#FDFBF5]',
      ].join(' ')}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F0F0D]">
            {colorClass ? <span className={`size-2.5 rounded-full ${colorClass}`} /> : null}
            {option.name}
          </p>
          {option.description ? (
            <p className="mt-1 text-xs text-[#5E5A54]">{option.description}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-xs font-medium text-[#2C3E6B]">
          {priceLabel(option.price_addition)}
        </p>
      </div>
    </button>
  )
}

export function LensConfigurator({ lensOptions, basePrice, onChange }: LensConfiguratorProps) {
  const grouped = useMemo<GroupedLensOptions>(
    () =>
      lensOptions.reduce<GroupedLensOptions>(
        (acc, option) => {
          acc[option.category].push(option)
          return acc
        },
        { type: [], material: [], filter: [], tint: [], thickness: [] }
      ),
    [lensOptions]
  )

  const [typeId, setTypeId] = useState<string | undefined>(undefined)
  const [materialId, setMaterialId] = useState<string | undefined>(undefined)
  const [filterIds, setFilterIds] = useState<string[]>([])
  const [tintId, setTintId] = useState<string | undefined>(undefined)
  const [thicknessId, setThicknessId] = useState<string | undefined>(undefined)

  const optionsById = useMemo(() => {
    const map = new Map<string, LensOption>()
    for (const option of lensOptions) {
      map.set(option.id, option)
    }
    return map
  }, [lensOptions])

  const totalAddition = useMemo(() => {
    const selectedIds = [typeId, materialId, tintId, thicknessId, ...filterIds].filter(
      Boolean
    ) as string[]

    return selectedIds.reduce((sum, id) => {
      const option = optionsById.get(id)
      return sum + Number(option?.price_addition ?? 0)
    }, 0)
  }, [filterIds, materialId, optionsById, thicknessId, tintId, typeId])

  useEffect(() => {
    const type = typeId ? optionsById.get(typeId)?.name : undefined
    const material = materialId ? optionsById.get(materialId)?.name : undefined
    const tint = tintId ? optionsById.get(tintId)?.name : undefined
    const thickness = thicknessId ? optionsById.get(thicknessId)?.name : undefined

    const selected: SelectedLensOptions = {
      type,
      typeId,
      material,
      materialId,
      filters: filterIds.map((id) => optionsById.get(id)?.name).filter(Boolean) as string[],
      filterIds,
      tint,
      tintId,
      thickness,
      thicknessId,
      totalAddition,
    }

    onChange(selected)
  }, [filterIds, materialId, onChange, optionsById, thicknessId, tintId, totalAddition, typeId])

  return (
    <section
      className={`${dmSans.className} space-y-6 rounded-2xl border border-[#E9E6DF] bg-[#FAFAF8] p-6 text-[#0F0F0D]`}
    >
      <header>
        <h2 className={`${playfairDisplay.className} text-3xl font-semibold text-[#0F0F0D]`}>
          Configura tus lentes
        </h2>
      </header>

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2C3E6B]">Tipo de lente</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.type.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={typeId === option.id}
                onClick={() => setTypeId(option.id)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2C3E6B]">Material</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.material.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={materialId === option.id}
                onClick={() => setMaterialId(option.id)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2C3E6B]">Filtros</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.filter.map((option) => {
              const checked = filterIds.includes(option.id)
              return (
                <label
                  key={option.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    checked
                      ? 'border-[#D4A853] bg-[#FBF5E8]'
                      : 'border-[#E5E2DC] bg-white hover:border-[#D7C79A] hover:bg-[#FDFBF5]',
                  ].join(' ')}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      if (next === true) {
                        setFilterIds((prev) =>
                          prev.includes(option.id) ? prev : [...prev, option.id]
                        )
                      } else {
                        setFilterIds((prev) => prev.filter((id) => id !== option.id))
                      }
                    }}
                    className="mt-0.5 data-checked:border-[#D4A853] data-checked:bg-[#D4A853]"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F0F0D]">{option.name}</p>
                    {option.description ? (
                      <p className="mt-1 text-xs text-[#5E5A54]">{option.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs font-medium text-[#2C3E6B]">
                      {priceLabel(option.price_addition)}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2C3E6B]">Tinte</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.tint.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={tintId === option.id}
                onClick={() => setTintId(option.id)}
                showTintColor
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2C3E6B]">Grosor</h3>
          <div className="grid gap-3">
            {grouped.thickness.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={thicknessId === option.id}
                onClick={() => setThicknessId(option.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 rounded-xl border border-[#E2DED5] bg-[#FAFAF8]/95 p-4 backdrop-blur">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#5D5953]">Montura base</span>
            <span className="font-medium text-[#0F0F0D]">{formatCOP(basePrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5D5953]">Opciones</span>
            <span className="font-medium text-[#0F0F0D]">{formatCOP(totalAddition)}</span>
          </div>
        </div>

        <div className="my-3 h-px bg-[#E2DED5]" />

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-[#0F0F0D]">Total estimado</span>
          <span className="text-lg font-bold text-[#D4A853]">
            {formatCOP(basePrice + totalAddition)}
          </span>
        </div>

        <p className="mt-2 text-xs text-[#7A766F]">
          El precio final se confirma al procesar tu pedido
        </p>
      </footer>
    </section>
  )
}
