'use client'

import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'

export default function PublicHomeRoute() {
  const { addItem, getItemCount, formattedTotal } = useCart()

  const handleAddTestProduct = () => {
    addItem({
      id: 'test-product-1',
      name: 'Producto de prueba',
      slug: 'producto-de-prueba',
      price: 159000,
      image: '/placeholder.svg',
      lensType: 'sin-lente',
    })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">OpticaAI - Prueba</h1>

      <Button onClick={handleAddTestProduct}>Agregar producto de prueba</Button>

      <div className="space-y-1">
        <p className="text-lg">Items en carrito: {getItemCount()}</p>
        <p className="text-lg">Total: {formattedTotal}</p>
      </div>
    </main>
  )
}
