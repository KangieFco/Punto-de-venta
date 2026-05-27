import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

interface Props {
  onCheckout: () => void
}

export default function Cart({ onCheckout }: Props) {
  const { items, removeItem, updateQty, clearCart, total } = useCartStore()

  return (
    <div className="w-96 bg-white border-l flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <ShoppingCart size={20} />
          Carrito
          {items.length > 0 && (
            <span className="bg-primary-600 text-white text-xs
                             rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            El carrito está vacío
          </p>
        ) : items.map(item => (
          <div key={item.product.id}
               className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ${item.product.salePrice.toFixed(2)} c/u
                </p>
              </div>
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 hover:bg-red-100 rounded-lg text-red-500 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 bg-white border border-gray-200 rounded-lg
                             flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 1)}
                  className="w-12 text-center border border-gray-200 rounded-lg
                             py-1 text-sm font-medium"
                  min={1}
                />
                <button
                  onClick={() => updateQty(item.product.id, item.quantity + 1)}
                  className="w-7 h-7 bg-white border border-gray-200 rounded-lg
                             flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="font-semibold text-gray-900">
                ${item.subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total y cobrar */}
      <div className="border-t px-6 py-5 space-y-4">
        <div className="flex items-center justify-between text-xl font-bold">
          <span className="text-gray-700">TOTAL</span>
          <span className="text-primary-600">${total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="btn-primary w-full text-base py-3"
        >
          Cobrar
        </button>
      </div>
    </div>
  )
}