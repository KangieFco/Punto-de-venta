import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore }          from '../../store/cartStore'
import { getImageUrl } from '../../utils/getImageUrl'

interface Props {
  onCheckout: () => void
}

export default function Cart({ onCheckout }: Props) {
  const { items, removeItem, clearCart, total } = useCartStore()

  const subtotal  = items.reduce((s, i) => s + i.subtotal, 0)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="w-80 bg-white border-l flex flex-col h-screen shadow-lg">

      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between
                      bg-gray-50">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <ShoppingCart size={20} />
          <span>Resumen</span>
          {items.length > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full
                             w-5 h-5 flex items-center justify-center font-normal">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Lista compacta */}
      <div className="flex-1 overflow-y-auto py-3 px-4 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-center text-gray-300 text-sm py-8">
            Sin productos
          </p>
        ) : items.map(item => (
          <div key={item.product.id}
               className="flex items-center gap-2 text-sm py-1.5
                          border-b border-gray-50 last:border-0">
            {/* Miniatura */}
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100
                            shrink-0 border">
              {getImageUrl(item.product.imageUrl) ? (
                <img
                  src={getImageUrl(item.product.imageUrl)!}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart size={12} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Nombre y cantidad */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-gray-800 font-medium text-xs">
                {item.product.name}
              </p>
              <p className="text-gray-400 text-xs">
                {item.quantity} × ${item.product.salePrice.toFixed(2)}
              </p>
            </div>

            {/* Subtotal y eliminar */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-gray-900 font-semibold text-xs">
                ${item.subtotal.toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={11} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="border-t bg-gray-50 px-5 py-4 space-y-3">
        {/* Artículos */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>Artículos</span>
          <span>{itemCount} pza</span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {/* Separador */}
        <div className="border-t border-dashed border-gray-200 pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-gray-800">TOTAL</span>
            <span className="text-2xl font-black text-primary-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botón cobrar */}
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="btn-primary w-full py-3.5 text-base font-bold
                     disabled:opacity-40 disabled:cursor-not-allowed
                     rounded-xl mt-1"
        >
          Cobrar ${total.toFixed(2)}
        </button>
      </div>
    </div>
  )
}