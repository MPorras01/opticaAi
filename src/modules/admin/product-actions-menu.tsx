'use client'

import Link from 'next/link'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteProductAction } from '@/actions/products.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ProductActionsMenuProps = {
  id: string
  slug: string
  hasArOverlay: boolean
  productName: string
}

export function ProductActionsMenu({
  id,
  slug,
  hasArOverlay,
  productName,
}: ProductActionsMenuProps) {
  const router = useRouter()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <Link href={`/admin/productos/${id}/editar`} className="w-full">
              Editar
            </Link>
          </DropdownMenuItem>

          {hasArOverlay ? (
            <DropdownMenuItem>
              <Link href={`/admin/productos/${id}/ar-studio`} className="w-full">
                Calibrar AR
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem>
            <a href={`/catalogo/${slug}`} target="_blank" rel="noreferrer" className="w-full">
              Ver en tienda
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              setIsDeleteOpen(true)
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              Se desactivara el producto <strong>{productName}</strong> y se limpiaran imagenes en
              storage cuando aplique.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteProductAction(id)

                  if (!result.success) {
                    toast.error(result.error ?? 'No se pudo eliminar el producto')
                    return
                  }

                  toast.success('Producto desactivado')
                  setIsDeleteOpen(false)
                  router.refresh()
                })
              }}
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
