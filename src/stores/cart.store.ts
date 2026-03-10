import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  slug: string
  price: number
  image: string
  quantity: number
  lensType?: 'sin-lente' | 'monofocal' | 'bifocal' | 'progresivo' | 'solar'
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateLensType: (id: string, lensType: CartItem['lensType']) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getItemById: (id: string) => CartItem | undefined
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((cartItem) => cartItem.id === item.id)

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + 1,
                    }
                  : cartItem
              ),
            }
          }

          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.id !== id),
            }
          }

          return {
            items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
          }
        }),
      updateLensType: (id, lensType) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, lensType } : item)),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      getTotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getItemById: (id) => get().items.find((item) => item.id === id),
    }),
    {
      name: 'opticaai-cart',
      partialize: (state) => ({ items: state.items }),
      skipHydration: false,
    }
  )
)

export default useCartStore
