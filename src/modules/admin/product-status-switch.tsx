'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { toggleProductActiveAction } from '@/actions/products.actions'
import { Switch } from '@/components/ui/switch'

type ProductStatusSwitchProps = {
  productId: string
  isActive: boolean
}

export function ProductStatusSwitch({ productId, isActive }: ProductStatusSwitchProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={() => {
        startTransition(async () => {
          const result = await toggleProductActiveAction(productId)

          if (!result.success) {
            toast.error(result.error ?? 'No se pudo actualizar el estado')
            return
          }

          toast.success(result.data?.is_active ? 'Producto activado' : 'Producto desactivado')
          router.refresh()
        })
      }}
    />
  )
}
