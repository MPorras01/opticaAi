import { DM_Sans, Playfair_Display } from 'next/font/google'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

export default function CatalogLoading() {
  return (
    <div className="bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
        <div className={cn(dmSans.className, 'text-sm text-[#7B7B74]')}>Inicio &gt; Catalogo</div>

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
              Cargando productos...
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-8">
          <aside className="hidden rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-6 md:block">
            <Skeleton className="h-5 w-28 bg-[#EEE9E1]" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-10 w-full bg-[#EEE9E1]" />
              <Skeleton className="h-10 w-full bg-[#EEE9E1]" />
              <Skeleton className="h-10 w-full bg-[#EEE9E1]" />
              <Skeleton className="h-10 w-full bg-[#EEE9E1]" />
            </div>
          </aside>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-2"
              >
                <Skeleton className="aspect-square w-full rounded-xl bg-[#EEE9E1]" />
                <div className="space-y-2 p-2.5">
                  <Skeleton className="h-3 w-16 bg-[#EEE9E1]" />
                  <Skeleton className="h-4 w-full bg-[#EEE9E1]" />
                  <Skeleton className="h-4 w-2/3 bg-[#EEE9E1]" />
                  <Skeleton className="h-4 w-24 bg-[#EEE9E1]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
