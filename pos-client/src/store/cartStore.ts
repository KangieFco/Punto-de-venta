import { create } from 'zustand'
import type { Product } from '../api/products'

export interface CartItem {
  product:  Product
  quantity: number
  discount: number
  subtotal: number
}

interface CartState {
  items:       CartItem[]
  addItem:     (product: Product) => void
  removeItem:  (productId: number) => void
  updateQty:   (productId: number, qty: number) => void
  updateDisc:  (productId: number, disc: number) => void
  clearCart:   () => void
  total:       number
  subtotal:    number
}

const calcSubtotal = (item: CartItem) =>
  (item.product.salePrice - item.discount) * item.quantity

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const { items } = get()
    const existing  = items.find(i => i.product.id === product.id)

    if (existing) {
      set({
        items: items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1,
                subtotal: calcSubtotal({ ...i, quantity: i.quantity + 1 }) }
            : i
        )
      })
    } else {
      const item: CartItem = {
        product, quantity: 1, discount: 0,
        subtotal: product.salePrice
      }
      set({ items: [...items, item] })
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter(i => i.product.id !== productId) }),

  updateQty: (productId, qty) => {
    if (qty < 1) return
    set({
      items: get().items.map(i =>
        i.product.id === productId
          ? { ...i, quantity: qty, subtotal: calcSubtotal({ ...i, quantity: qty }) }
          : i
      )
    })
  },

  updateDisc: (productId, disc) => {
    set({
      items: get().items.map(i =>
        i.product.id === productId
          ? { ...i, discount: disc, subtotal: calcSubtotal({ ...i, discount: disc }) }
          : i
      )
    })
  },

  clearCart: () => set({ items: [] }),

  get total()    { return get().items.reduce((s,i) => s + i.subtotal, 0) },
  get subtotal() { return get().items.reduce((s,i) => s + i.subtotal, 0) },
}))