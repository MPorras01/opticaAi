import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { buildCartItemSignature } from '@/lib/utils/lens-config'
import type { LensFilterOption, LensType, PrescriptionData } from '@/types'

export type CartItem = {
  cartItemId?: string
  configurationSignature?: string
  id: string
  name: string
  slug: string
  price: number
  image: string
  quantity: number
  lensType?: LensType
  lensFilters?: LensFilterOption[]
  prescription?: PrescriptionData | null
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

function createCartItemId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function resolveCartItemKey(item: CartItem) {
  return item.cartItemId ?? item.id
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const configurationSignature = buildCartItemSignature(item)
          const existing = state.items.find(
            (cartItem) =>
              (cartItem.configurationSignature ?? buildCartItemSignature(cartItem)) ===
              configurationSignature
          )

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                resolveCartItemKey(cartItem) === resolveCartItemKey(existing)
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + 1,
                      configurationSignature,
                    }
                  : cartItem
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                cartItemId: createCartItemId(),
                configurationSignature,
                quantity: 1,
              },
            ],
          }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => resolveCartItemKey(item) !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => resolveCartItemKey(item) !== id),
            }
          }

          return {
            items: state.items.map((item) =>
              resolveCartItemKey(item) === id ? { ...item, quantity } : item
            ),
          }
        }),
      updateLensType: (id, lensType) =>
        set((state) => ({
          items: state.items.map((item) =>
            resolveCartItemKey(item) === id
              ? {
                  ...item,
                  lensType,
                  configurationSignature: buildCartItemSignature({ ...item, lensType }),
                }
              : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      getTotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getItemById: (id) =>
        get().items.find((item) => resolveCartItemKey(item) === id || item.id === id),
    }),
    {
      name: 'opticaai-cart',
      partialize: (state) => ({ items: state.items }),
      skipHydration: false,
    }
  )
)

export default useCartStore
