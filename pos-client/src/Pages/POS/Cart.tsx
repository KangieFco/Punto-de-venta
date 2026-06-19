import { ShoppingCart, Tag, Archive } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useNavigate } from 'react-router-dom'

interface Props {
  onCheckout: () => void
  onDiscount: () => void
}

export default function Cart({ onCheckout, onDiscount }: Props) {
  const {
    items, clearCart,
    subtotal, total, globalDiscount
  } = useCartStore()

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const hasDiscount = globalDiscount > 0
  const navigate = useNavigate()
  return (
    <div className="w-80 bg-white border-l flex flex-col h-screen shadow-lg">
      <div className="px-5 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-base">
            <ShoppingCart size={20} />
            <span>Resumen</span>
            {items.length > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-normal">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm font-semibold text-red-500 hover:text-white hover:bg-red-500 border border-red-300 hover:border-red-500 px-3 py-1 rounded-lg transition-all">
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
            <ShoppingCart size={40} strokeWidth={1.5} className="mb-2" />
            <p className="text-sm">Sin productos</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.product.id}
                 className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black-900 leading-tight">
                  {item.product.name}
                </p>
                <p className="text-xs text-black-400 mt-0.5">
                  {item.quantity} × ${item.product.salePrice.toFixed(2)}
                  {item.discount > 0 && (
                    <span className="text-orange-500 ml-1">
                      (desc. ${item.discount.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-bold text-black-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t bg-white px-5 py-4 space-y-2.5">
        <div className="flex justify-between text-sm text-black-500">
          <span>Artículos</span>
          <span>{itemCount} pza</span>
        </div>

        <div className="flex justify-between text-sm text-black-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {hasDiscount && (
          <div className="flex justify-between text-sm text-orange-600 font-medium">
            <span>Descuento</span>
            <span>-${globalDiscount.toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={onDiscount}
          className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 bg-primary-50 hover:bg-primary-100 py-2 rounded-lg transition-all font-medium"
        >
          <Tag size={15} />
          {hasDiscount
            ? `Descuento: -$${globalDiscount.toFixed(2)}`
            : 'Aplicar descuento'
          }
        </button>

        <div className="border-t border-dashed border-gray-200 pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-bold text-black-800">TOTAL</span>
            <span className="text-3xl font-black text-primary-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/layaways')}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 border-2 border-primary-200 text-primary-600 hover:bg-primary-50 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Archive size={16} />
          Apartar artículos
        </button>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-200"
        >
          Cobrar ${total.toFixed(2)}
        </button>

      </div>
    </div>
  )
}