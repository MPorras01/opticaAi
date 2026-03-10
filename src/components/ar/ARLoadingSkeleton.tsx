import { DM_Sans } from 'next/font/google'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
})

export function ARLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-[#E9E4DA]" />
          <p className={cn(dmSans.className, 'text-sm text-[#6E6E67]')}>
            Cargando probador virtual...
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl bg-[#E9E4DA]" />
          <Skeleton className="h-40 w-full rounded-2xl bg-[#E9E4DA]" />
        </div>
      </div>
    </div>
  )
}
