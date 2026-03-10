import useCartStore from '@/stores/cart.store'
import { formatCOP } from '@/lib/utils'

export function useCart() {
  const store = useCartStore()

  const total = store.getTotal()

  return {
    ...store,
    formattedTotal: formatCOP(total),
    isEmpty: store.items.length === 0,
    hasItem: (id: string) => Boolean(store.getItemById(id)),
  }
}
