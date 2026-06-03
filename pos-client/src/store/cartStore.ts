import { create } from 'zustand'
import type { Product } from '../api/products'

export interface CartItem {
  product: Product
  quantity: number
  discount: number
  subtotal: number
}

interface CartState {
  items: CartItem[]
  globalDiscount: number
  subtotal: number
  totalDiscount: number 
  total: number
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  updateDiscount: (productId: number, disc: number) => void
  setGlobalDiscount: (disc: number) => void
  clearCart: () => void
}

const itemSub = (price: number, disc: number, qty: number) =>
  Math.max(0, (price - disc) * qty)

const totals = (items: CartItem[], globalDiscount: number) => {
  const sub = items.reduce((acc, i) => acc + i.subtotal, 0)
  return {
    subtotal:      sub,
    totalDiscount: items.reduce((acc, i) => acc + i.discount * i.quantity, 0) + globalDiscount,
    total: Math.max(0, sub - globalDiscount),
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  globalDiscount: 0,
  subtotal:       0,
  totalDiscount:  0,
  total:          0,
  addItem: (product) => {
    const { items, globalDiscount } = get()
    const idx = items.findIndex(i => i.product.id === product.id)

    let next: CartItem[]

    if (idx >= 0) {
      next = items.map((i, n) => {
        if (n !== idx) return i
        const qty = i.quantity + 1
        return { ...i, quantity: qty, subtotal: itemSub(i.product.salePrice, i.discount, qty) }
      })
    } else {
      next = [ ...items, {
          product,
          quantity: 1,
          discount: 0,
          subtotal: product.salePrice,
      }]
    }

    set({ items: next, ...totals(next, globalDiscount) })
  },

  removeItem: (productId) => {
    const { globalDiscount } = get()
    const next = get().items.filter(i => i.product.id !== productId)
    set({ items: next, ...totals(next, globalDiscount) })
  },

  updateQty: (productId, qty) => {
    if (qty < 1) return
    const { globalDiscount } = get()
    const next = get().items.map(i =>
      i.product.id !== productId
        ? i
        : { ...i, quantity: qty, subtotal: itemSub(i.product.salePrice, i.discount, qty) }
    )
    set({ items: next, ...totals(next, globalDiscount) })
  },

  updateDiscount: (productId, disc) => {
    const { globalDiscount } = get()
    const d    = Math.max(0, disc)
    const next = get().items.map(i =>
      i.product.id !== productId
        ? i
        : { ...i, discount: d, subtotal: itemSub(i.product.salePrice, d, i.quantity) }
    )
    set({ items: next, ...totals(next, globalDiscount) })
  },

  setGlobalDiscount: (disc) => {
    const { items } = get()
    const d = Math.max(0, disc)
    set({ globalDiscount: d, ...totals(items, d) })
  },


clearCart: () =>
    set({
      items:          [],
      globalDiscount: 0,
      subtotal:       0,
      totalDiscount:  0,
      total:          0,
    }),
}))